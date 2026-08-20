import asyncio
import re
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx

from app.config import settings
from app.core.logging import logger
from app.services.providers.base import SearchProvider


def get_shared_client() -> httpx.AsyncClient:
    """Returns a pooled HTTP client attached to the currently active asyncio event loop."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop is not None:
        client = getattr(loop, "_nexus_httpx_client", None)
        if client is None or client.is_closed:
            limits = httpx.Limits(max_keepalive_connections=30, max_connections=80, keepalive_expiry=60.0)
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(8.0, connect=4.0),
                limits=limits,
                follow_redirects=True
            )
            setattr(loop, "_nexus_httpx_client", client)
        return client

    return httpx.AsyncClient(timeout=httpx.Timeout(8.0, connect=4.0), follow_redirects=True)


class OpenAlexSearchProvider(SearchProvider):
    """Real scientific literature search using the OpenAlex Scholarly Graph (250M+ works)."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://api.openalex.org/works?search={encoded_query}&per_page={max_results}"
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0 (mailto:researcher@nexusai.com)"}

            client = get_shared_client()
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                for work in resp.json().get("results", []):
                    title = work.get("title")
                    if not title:
                        continue

                    authors = [
                        a.get("author", {}).get("display_name", "")
                        for a in work.get("authorships", [])
                        if a.get("author", {}).get("display_name")
                    ][:4]

                    doi = work.get("doi") or work.get("id") or "https://openalex.org"
                    year = str(work.get("publication_year") or "")

                    # Reconstruct abstract from inverted index if present
                    abstract = ""
                    inv = work.get("abstract_inverted_index")
                    if inv:
                        words = sorted([(pos, word) for word, positions in inv.items() for pos in positions])
                        abstract = " ".join([word for _, word in words])[:700]

                    venue = work.get("primary_location", {}).get("source", {}).get("display_name", "Academic Publication")
                    snippet = abstract or f"Published in {venue} ({year}) by {', '.join(authors) if authors else 'Scholarly Authors'}."

                    results.append({
                        "title": title.strip(),
                        "url": doi,
                        "snippet": snippet,
                        "content": snippet,
                        "source_type": "academic_openalex",
                        "authors": authors,
                        "publication_date": year if year else None,
                        "reliability": 0.96,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })
        except Exception as e:
            logger.warning(f"OpenAlex search error for query '{query}': {e}")
        return results


class ArxivSearchProvider(SearchProvider):
    """Real arXiv scientific repository search via arXiv API (Computer Science, Physics, Math, Quantitative Biology)."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            # Clean search terms for arXiv query format
            clean_q = re.sub(r'[^a-zA-Z0-9\s]', ' ', query).strip()
            words = [w for w in clean_q.split() if len(w) > 2 and w.lower() not in ["with", "from", "about", "into", "onto", "using", "make", "paper"]]
            if words:
                arxiv_query = "+AND+".join([f"all:{urllib.parse.quote(w)}" for w in words[:4]])
            else:
                arxiv_query = f"all:{urllib.parse.quote(clean_q)}"
            url = f"https://export.arxiv.org/api/query?search_query={arxiv_query}&start=0&max_results={max_results}&sortBy=relevance&sortOrder=descending"

            client = get_shared_client()
            resp = await client.get(url)
            if resp.status_code == 200:
                root = ET.fromstring(resp.text)
                atom_ns = {"atom": "http://www.w3.org/2005/Atom"}

                for entry in root.findall("atom:entry", atom_ns):
                    title_elem = entry.find("atom:title", atom_ns)
                    summary_elem = entry.find("atom:summary", atom_ns)
                    published_elem = entry.find("atom:published", atom_ns)
                    id_elem = entry.find("atom:id", atom_ns)

                    title = title_elem.text.strip().replace("\n", " ") if title_elem is not None and title_elem.text else ""
                    if not title or title.lower() == "error":
                        continue

                    summary = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None and summary_elem.text else ""
                    paper_url = id_elem.text.strip() if id_elem is not None and id_elem.text else "https://arxiv.org"
                    pub_date = published_elem.text[:4] if published_elem is not None and published_elem.text else None

                    authors = []
                    for author_elem in entry.findall("atom:author", atom_ns):
                        name_elem = author_elem.find("atom:name", atom_ns)
                        if name_elem is not None and name_elem.text:
                            authors.append(name_elem.text.strip())

                    results.append({
                        "title": title,
                        "url": paper_url,
                        "snippet": summary[:700],
                        "content": summary,
                        "source_type": "academic_arxiv",
                        "authors": authors[:4],
                        "publication_date": pub_date,
                        "reliability": 0.95,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })
        except Exception as e:
            logger.warning(f"ArXiv search error for query '{query}': {e}")
        return results


class WikipediaSearchProvider(SearchProvider):
    """Real encyclopedic and historical fact search via Wikipedia REST API."""

    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        results = []
        try:
            client = get_shared_client()
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0 (mailto:researcher@nexusai.com)"}

            # 1. Search Wikipedia titles
            clean_q = re.sub(r'[^a-zA-Z0-9\s]', ' ', query).strip()
            encoded_query = urllib.parse.quote(clean_q)
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded_query}&format=json&srlimit={max_results}"
            
            resp = await client.get(search_url, headers=headers)
            if resp.status_code == 200:
                items = resp.json().get("query", {}).get("search", [])
                for item in items:
                    title = item.get("title")
                    if not title:
                        continue

                    # Fetch summary extract
                    encoded_title = urllib.parse.quote(title)
                    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded_title}"
                    try:
                        sum_resp = await client.get(summary_url, headers=headers)
                        if sum_resp.status_code == 200:
                            sum_data = sum_resp.json()
                            extract = sum_data.get("extract", "")
                            page_url = sum_data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{encoded_title}")
                            
                            if extract:
                                results.append({
                                    "title": f"Wikipedia: {title}",
                                    "url": page_url,
                                    "snippet": extract[:700],
                                    "content": extract,
                                    "source_type": "encyclopedia_wikipedia",
                                    "authors": ["Wikimedia Foundation / Wikipedia Contributors"],
                                    "publication_date": datetime.utcnow().strftime("%Y"),
                                    "reliability": 0.92,
                                    "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                                })
                                continue
                    except Exception:
                        pass

                    # Fallback to search snippet
                    clean_snippet = re.sub(r'<[^>]+>', '', item.get("snippet", "")).strip()
                    if clean_snippet:
                        results.append({
                            "title": f"Wikipedia: {title}",
                            "url": f"https://en.wikipedia.org/wiki/{encoded_title}",
                            "snippet": clean_snippet,
                            "content": clean_snippet,
                            "source_type": "encyclopedia_wikipedia",
                            "authors": ["Wikimedia Foundation / Wikipedia Contributors"],
                            "publication_date": datetime.utcnow().strftime("%Y"),
                            "reliability": 0.92,
                            "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                        })
        except Exception as e:
            logger.warning(f"Wikipedia search error for query '{query}': {e}")
        return results


class DuckDuckGoSearchProvider(SearchProvider):
    """Real-time web information and instant answer lookup via DuckDuckGo API."""

    async def search(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        results = []
        try:
            client = get_shared_client()
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_html=1&skip_disambig=1"
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0"}

            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                
                # Abstract Text
                abstract = data.get("AbstractText", "")
                abstract_url = data.get("AbstractURL", "")
                heading = data.get("Heading", query)
                
                if abstract and abstract_url:
                    results.append({
                        "title": f"Official Reference: {heading}",
                        "url": abstract_url,
                        "snippet": abstract[:700],
                        "content": abstract,
                        "source_type": "web_reference",
                        "authors": ["Authoritative Web Registry"],
                        "publication_date": datetime.utcnow().strftime("%Y"),
                        "reliability": 0.90,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })

                # Related Topics
                for topic in data.get("RelatedTopics", [])[:max_results]:
                    text = topic.get("Text", "")
                    first_url = topic.get("FirstURL", "")
                    if text and first_url:
                        results.append({
                            "title": text.split(" - ")[0] if " - " in text else text[:50],
                            "url": first_url,
                            "snippet": text[:500],
                            "content": text,
                            "source_type": "web_live",
                            "authors": ["Web Documentation"],
                            "publication_date": datetime.utcnow().strftime("%Y"),
                            "reliability": 0.88,
                            "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                        })
        except Exception as e:
            logger.warning(f"DuckDuckGo search error for query '{query}': {e}")
        return results


class EuropePMCSearchProvider(SearchProvider):
    """Real life sciences and biomedical literature search via Europe PMC / EMBL-EBI."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={encoded_query}&format=json&pageSize={max_results}"
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0 (mailto:researcher@nexusai.com)"}

            client = get_shared_client()
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                for item in resp.json().get("resultList", {}).get("result", []):
                    title = item.get("title", "").rstrip(".")
                    if not title:
                        continue

                    authors_str = item.get("authorString", "")
                    authors = [a.strip() for a in authors_str.split(",") if a.strip()][:4]
                    
                    doi_val = item.get("doi")
                    url_val = f"https://doi.org/{doi_val}" if doi_val else f"https://europepmc.org/article/MED/{item.get('id', '')}"
                    
                    abstract = item.get("abstractText", "")[:700]
                    journal = item.get("journalTitle", "Biomedical Journal")
                    pub_year = str(item.get("pubYear", ""))

                    snippet = abstract or f"Published in {journal} ({pub_year}) by {authors_str}."

                    results.append({
                        "title": title.strip(),
                        "url": url_val,
                        "snippet": snippet,
                        "content": snippet,
                        "source_type": "academic_europepmc",
                        "authors": authors,
                        "publication_date": pub_year if pub_year else None,
                        "reliability": 0.95,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })
        except Exception as e:
            logger.warning(f"Europe PMC search error for query '{query}': {e}")
        return results


class PubmedSearchProvider(SearchProvider):
    """Real PubMed search using NCBI Entrez E-Utilities."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            esearch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={encoded_query}&retmode=json&retmax={max_results}"
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0 (mailto:researcher@nexusai.com)"}

            client = get_shared_client()
            res = await client.get(esearch_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                id_list = data.get("esearchresult", {}).get("idlist", [])
                if id_list:
                    ids_str = ",".join(id_list)
                    summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids_str}&retmode=json"
                    sum_res = await client.get(summary_url, headers=headers)
                    if sum_res.status_code == 200:
                        sum_data = sum_res.json().get("result", {})
                        for pmid in id_list:
                            item = sum_data.get(pmid, {})
                            title = item.get("title", "").rstrip(".")
                            if not title:
                                continue
                            pubdate = str(item.get("pubdate", ""))[:4]
                            authors = [a.get("name", "") for a in item.get("authors", []) if a.get("name")][:4]
                            journal = item.get("source", "Peer-Reviewed Medical Journal")

                            results.append({
                                "title": title.strip(),
                                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                                "snippet": f"Published in {journal} ({pubdate}) by {', '.join(authors) if authors else 'Clinical Investigators'}.",
                                "content": f"Title: {title}. Journal: {journal}. Authors: {', '.join(authors)}.",
                                "source_type": "academic_pubmed",
                                "authors": authors,
                                "publication_date": pubdate if pubdate else None,
                                "reliability": 0.98,
                                "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                            })
        except Exception as e:
            logger.warning(f"PubMed search error for query '{query}': {e}")
        return results


class CrossrefSearchProvider(SearchProvider):
    """Real Crossref DOI registry search across 150M+ scholarly works."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://api.crossref.org/works?query={encoded_query}&rows={max_results}"
            headers = {"User-Agent": "NexusAI-Research-Assistant/2.0 (mailto:researcher@nexusai.com)"}

            client = get_shared_client()
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                for item in resp.json().get("message", {}).get("items", []):
                    titles = item.get("title", [])
                    if not titles or not titles[0]:
                        continue
                    title = titles[0].strip()

                    authors = []
                    for a in item.get("author", []):
                        name = f"{a.get('given', '')} {a.get('family', '')}".strip()
                        if name:
                            authors.append(name)
                    authors = authors[:4]

                    doi = item.get("DOI")
                    url_val = f"https://doi.org/{doi}" if doi else item.get("URL", "https://crossref.org")
                    
                    year = ""
                    date_parts = item.get("published-print", {}).get("date-parts", []) or item.get("published-online", {}).get("date-parts", [])
                    if date_parts and date_parts[0]:
                        year = str(date_parts[0][0])

                    container = item.get("container-title", [""])[0] if item.get("container-title") else "Scholarly Publication"
                    snippet = f"Published in {container} ({year}) by {', '.join(authors) if authors else 'Authors'}."

                    results.append({
                        "title": title,
                        "url": url_val,
                        "snippet": snippet,
                        "content": snippet,
                        "source_type": "academic_crossref",
                        "authors": authors,
                        "publication_date": year if year else None,
                        "reliability": 0.94,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })
        except Exception as e:
            logger.warning(f"Crossref search error for query '{query}': {e}")
        return results


class TavilySearchProvider(SearchProvider):
    """Real web and academic search using Tavily API (if configured)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TAVILY_API_KEY

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []
        results = []
        try:
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": self.api_key,
                "query": query,
                "search_depth": "advanced",
                "max_results": max_results,
                "include_answer": False,
            }
            client = get_shared_client()
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                for r in resp.json().get("results", []):
                    results.append({
                        "title": r.get("title", "Web Source"),
                        "url": r.get("url", ""),
                        "snippet": r.get("content", ""),
                        "content": r.get("content", ""),
                        "source_type": "web",
                        "authors": [],
                        "publication_date": None,
                        "reliability": 0.90 if any(dom in r.get("url", "") for dom in [".edu", ".gov", ".org", "nature.com", "ieee.org", "science.org"]) else 0.82,
                        "retrieved_at": datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
                    })
        except Exception as e:
            logger.warning(f"Tavily search error for query '{query}': {e}")
        return results


class MultiSearchAggregator:
    """
    Intelligent multi-source aggregator combining:
    - OpenAlex, ArXiv, Europe PMC, PubMed, Crossref (Peer-reviewed academic research)
    - Wikipedia (Authoritative facts, definitions, biographical and historical data)
    - DuckDuckGo & Tavily (Current real-time web news and live registry lookups)
    """

    def __init__(self):
        self.openalex_provider = OpenAlexSearchProvider()
        self.arxiv_provider = ArxivSearchProvider()
        self.wikipedia_provider = WikipediaSearchProvider()
        self.duckduckgo_provider = DuckDuckGoSearchProvider()
        self.europepmc_provider = EuropePMCSearchProvider()
        self.pubmed_provider = PubmedSearchProvider()
        self.crossref_provider = CrossrefSearchProvider()
        self.tavily_provider = TavilySearchProvider()

    async def search_all(
        self,
        queries: List[str],
        include_academic: bool = True,
        query_intent: str = "academic_scientific",
        max_per_query: int = 4
    ) -> List[Dict[str, Any]]:
        tasks = []
        primary_query = queries[0] if queries else ""

        if primary_query:
            # 1. Encyclopedic & Definitional lookup
            tasks.append(self.wikipedia_provider.search(primary_query, max_results=2))

            # 2. Live Web & Instant Answers
            tasks.append(self.duckduckgo_provider.search(primary_query, max_results=3))

            # 3. Academic Registries
            if include_academic or query_intent == "academic_scientific":
                tasks.append(self.openalex_provider.search(primary_query, max_results=max_per_query))
                tasks.append(self.arxiv_provider.search(primary_query, max_results=max_per_query))
                tasks.append(self.europepmc_provider.search(primary_query, max_results=max_per_query))
                tasks.append(self.pubmed_provider.search(primary_query, max_results=max_per_query))
                tasks.append(self.crossref_provider.search(primary_query, max_results=max_per_query))

            # 4. Tavily API if configured
            if settings.TAVILY_API_KEY:
                tasks.append(self.tavily_provider.search(primary_query, max_results=max_per_query))

        # Secondary subqueries searched in parallel
        for q in queries[1:3]:
            if include_academic:
                tasks.append(self.openalex_provider.search(q, max_results=2))
                tasks.append(self.arxiv_provider.search(q, max_results=2))

        nested_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_sources: List[Dict[str, Any]] = []
        for r in nested_results:
            if isinstance(r, list):
                all_sources.extend(r)

        return self.deduplicate_and_rank(all_sources)

    def deduplicate_and_rank(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen_urls = set()
        seen_titles = set()
        unique_sources = []

        for s in sources:
            url = s.get("url", "").strip().lower()
            raw_title = s.get("title", "").strip()
            norm_title = re.sub(r'[^a-zA-Z0-9]', '', raw_title.lower())[:50]

            if not url or url in seen_urls or (norm_title and norm_title in seen_titles):
                continue

            seen_urls.add(url)
            if norm_title:
                seen_titles.add(norm_title)
            unique_sources.append(s)

        # Sort by reliability score descending
        unique_sources.sort(key=lambda x: x.get("reliability", 0.8), reverse=True)
        return unique_sources[:20]

    async def search(
        self,
        query: str,
        sub_queries: Optional[List[str]] = None,
        include_academic: bool = True,
        include_web: bool = True,
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        all_q = [query]
        if sub_queries:
            for sq in sub_queries:
                if sq and sq != query and sq not in all_q:
                    all_q.append(sq)
        return await self.search_all(all_q, include_academic=include_academic, max_per_query=limit)


UnifiedSearchProvider = MultiSearchAggregator


import asyncio
import re
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.core.logging import logger
from app.services.providers.base import SearchProvider


class OpenAlexSearchProvider(SearchProvider):
    """Real scientific literature search using the OpenAlex Scholarly Graph (250M+ works)."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://api.openalex.org/works?search={encoded_query}&per_page={max_results}"
            headers = {"User-Agent": "AI-Research-Assistant/1.0 (mailto:researcher@nexusai.com)"}

            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                resp = await client.get(url)
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
                        })
        except Exception as e:
            logger.warning(f"OpenAlex search error for query '{query}': {e}")
        return results


class EuropePMCSearchProvider(SearchProvider):
    """Real life sciences and biomedical literature search via Europe PMC / EMBL-EBI."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            encoded_query = urllib.parse.quote(query.strip())
            url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={encoded_query}&format=json&pageSize={max_results}"
            headers = {"User-Agent": "AI-Research-Assistant/1.0 (mailto:researcher@nexusai.com)"}

            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                resp = await client.get(url)
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
            headers = {"User-Agent": "AI-Research-Assistant/1.0 (mailto:researcher@nexusai.com)"}

            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                res = await client.get(esearch_url)
                if res.status_code == 200:
                    data = res.json()
                    id_list = data.get("esearchresult", {}).get("idlist", [])
                    if id_list:
                        ids_str = ",".join(id_list)
                        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids_str}&retmode=json"
                        sum_res = await client.get(summary_url)
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
            headers = {"User-Agent": "AI-Research-Assistant/1.0 (mailto:researcher@nexusai.com)"}

            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                resp = await client.get(url)
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
            async with httpx.AsyncClient(timeout=15.0) as client:
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
                        })
        except Exception as e:
            logger.warning(f"Tavily search error for query '{query}': {e}")
        return results


class MultiSearchAggregator:
    """Aggregates real academic and web literature from OpenAlex, Europe PMC, PubMed, Crossref, and Tavily."""

    def __init__(self):
        self.openalex_provider = OpenAlexSearchProvider()
        self.europepmc_provider = EuropePMCSearchProvider()
        self.pubmed_provider = PubmedSearchProvider()
        self.crossref_provider = CrossrefSearchProvider()
        self.tavily_provider = TavilySearchProvider()

    async def search_all(
        self,
        queries: List[str],
        include_academic: bool = True,
        max_per_query: int = 4
    ) -> List[Dict[str, Any]]:
        tasks = []
        for q in queries:
            if include_academic:
                tasks.append(self.openalex_provider.search(q, max_results=max_per_query))
                tasks.append(self.europepmc_provider.search(q, max_results=max_per_query))
                tasks.append(self.pubmed_provider.search(q, max_results=max_per_query))
                tasks.append(self.crossref_provider.search(q, max_results=max_per_query))
            if settings.TAVILY_API_KEY:
                tasks.append(self.tavily_provider.search(q, max_results=max_per_query))

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

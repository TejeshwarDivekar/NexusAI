import re
import logging
from typing import Dict, Any, List, Tuple, Optional, Set

logger = logging.getLogger("research_assistant")


class SourceRelevanceScorer:
    """
    Evaluates candidate literature and web sources for strict relevance to the user query.
    
    Principles:
    1. SOURCE_VALIDITY != QUERY_RELEVANCE: A verified academic paper from PubMed or OpenAlex
       is useless if it discusses catfish pharmacokinetics when the user asked about AI in farming.
    2. HARD RELEVANCE GATE: Sources scoring below the minimum threshold are completely rejected.
    3. COMPOUND CONCEPT INTERSECTION: For multi-faceted inquiries (e.g. AI + Agriculture),
       the candidate source MUST address both concepts or directly bridge their application.
    4. NO FORCED SOURCE FILLING: Never lower threshold or add irrelevant papers to reach a quota.
    """

    # Domain-specific disqualification terms when query is about Computing / AI / Agriculture / Engineering
    DISQUALIFY_MEDICAL_TERMS = {
        "pharmacokinetics", "doxycycline", "catfish", "swine", "broiler", "antibiotic residue",
        "pharmacokinetic", "in vitro cytotoxicity", "dental", "periodontitis", "carcinoma",
        "tumor resection", "cardiac arrest", "coronary artery", "chemotherapy regimen"
    }

    # Agricultural / Farming synonym and concept tokens
    AGRICULTURE_TOKENS = {
        "farm", "farming", "farmer", "farmers", "agriculture", "agricultural", "agronomy",
        "agritech", "agtech", "crop", "crops", "yield", "harvest", "soil", "irrigation",
        "livestock", "cultivation", "plant", "plants", "horticulture", "pesticide",
        "fertilizer", "weed", "weeds", "greenhouse", "orchard", "tillage", "pasture",
        "precision agriculture", "smart farming"
    }

    # AI / Computing / Technology concept tokens
    AI_TOKENS = {
        "ai", "artificial intelligence", "machine learning", "deep learning", "computer vision",
        "neural network", "neural networks", "transformer", "llm", "large language model",
        "robotics", "robot", "robots", "autonomous", "sensor", "sensors", "iot", "algorithm",
        "predictive", "prediction", "classifier", "classification", "detection", "segmentation",
        "yolo", "reinforcement learning", "generative ai"
    }

    # Quantum concept tokens
    QUANTUM_TOKENS = {
        "quantum", "qubit", "qubits", "superconducting", "surface code", "fault tolerant",
        "error correction", "entanglement", "quantum computing", "quantum circuit"
    }

    # Semantic synonym expansion dictionary
    SYNONYM_MAP = {
        "ai": {"artificial", "intelligence", "machine", "learning", "deep", "neural", "vision", "ai"},
        "farming": {"agriculture", "agricultural", "crop", "crops", "farm", "farming", "yield", "soil", "irrigation"},
        "agriculture": {"farming", "farm", "crop", "crops", "agricultural", "agritech", "precision", "harvest"},
        "doctor": {"physician", "clinical", "medical", "patient", "healthcare"},
        "quantum": {"qubit", "qubits", "superconducting", "surface", "code", "quantum"},
    }

    @classmethod
    def score_source(
        cls,
        query: str,
        cleaned_topic: str,
        classification: Dict[str, Any],
        source: Dict[str, Any]
    ) -> Tuple[float, str, str]:
        """
        Calculates a multi-factor relevance score (0.0 to 1.0), qualitative tier, and rationale.
        
        Returns:
            (relevance_score: float, relevance_tier: str, rationale: str)
        """
        title = (source.get("title") or "").strip()
        snippet = (source.get("snippet") or source.get("content") or "").strip()
        combined_text = f"{title} {snippet}".lower()
        title_lower = title.lower()

        if not title:
            return 0.0, "IRRELEVANT", "Source has no valid title."

        domain = classification.get("domain", "general")
        q_tokens = cls._expand_tokens(cls._tokenize(cleaned_topic.lower()))

        # 1. Check Hard Negative Domain Disqualification
        if domain in ["agriculture_farming", "computer_science_ai", "career_education"]:
            # If paper contains strong veterinary/clinical terms with ZERO AI or farming technology connection
            has_disqualifier = any(bad_term in combined_text for bad_term in cls.DISQUALIFY_MEDICAL_TERMS)
            has_ai = any(ai_term in combined_text for ai_term in cls.AI_TOKENS)
            has_agri = any(ag_term in combined_text for ag_term in cls.AGRICULTURE_TOKENS)

            if domain == "agriculture_farming":
                # For "AI in farming", candidate MUST relate to agriculture or technology
                if has_disqualifier and not has_ai:
                    return 0.05, "IRRELEVANT", f"Rejected: Unrelated pharmacological/veterinary paper ('{title[:50]}...')"
                if not has_agri and not has_ai:
                    return 0.10, "IRRELEVANT", "Rejected: Lacks topical keywords for AI or agricultural applications."
            elif domain == "computer_science_ai":
                if has_disqualifier and not has_ai:
                    return 0.05, "IRRELEVANT", "Rejected: Unrelated medical research lacking computing/AI scope."

        # 2. Concept Intersection Analysis
        concept_score = 0.0
        rationale_reasons = []

        if domain == "agriculture_farming":
            agri_match = any(w in combined_text for w in cls.AGRICULTURE_TOKENS)
            ai_match = any(w in combined_text for w in cls.AI_TOKENS)
            title_agri_match = any(w in title_lower for w in cls.AGRICULTURE_TOKENS)
            title_ai_match = any(w in title_lower for w in cls.AI_TOKENS)

            if title_agri_match and title_ai_match:
                concept_score += 0.55
                rationale_reasons.append("Title directly addresses AI applications in agriculture")
            elif agri_match and ai_match:
                concept_score += 0.40
                rationale_reasons.append("Covers both agricultural domain and artificial intelligence methods")
            elif title_agri_match or title_ai_match:
                concept_score += 0.25
                rationale_reasons.append("Covers domain foundation or enabling AI technique")
            else:
                concept_score += 0.05
        elif domain == "quantum_physics":
            q_match = any(w in combined_text for w in cls.QUANTUM_TOKENS)
            if q_match:
                concept_score += 0.45
                rationale_reasons.append("Directly investigates quantum information / physics")
        elif domain in ["computer_science_ai", "general", "career_education"]:
            ai_match = any(w in combined_text for w in cls.AI_TOKENS)
            title_ai_match = any(w in title_lower for w in cls.AI_TOKENS)
            if title_ai_match:
                concept_score += 0.40
                rationale_reasons.append("Title directly addresses core computing / AI mechanisms")
            elif ai_match:
                concept_score += 0.25
                rationale_reasons.append("Covers relevant technical / AI methodologies")
        else:
            concept_score += 0.20

        # 3. Title Semantic Keyword Overlap (Jaccard & Term Coverage with Synonyms)
        title_tokens = cls._tokenize(title_lower)
        overlap_tokens = q_tokens.intersection(title_tokens)
        title_overlap_ratio = len(overlap_tokens) / max(1, min(len(q_tokens), 6))
        
        # Keyword density in snippet
        snippet_tokens = cls._tokenize(snippet.lower())
        snippet_overlap_tokens = q_tokens.intersection(snippet_tokens)
        snippet_overlap_ratio = len(snippet_overlap_tokens) / max(1, min(len(q_tokens), 6))

        title_score = min(0.35, title_overlap_ratio * 0.35)
        snippet_score = min(0.20, snippet_overlap_ratio * 0.20)

        if overlap_tokens:
            rationale_reasons.append(f"Shares core domain entities: {', '.join(list(overlap_tokens)[:3])}")

        # 4. Exact Phrase Boost
        phrase_boost = 0.0
        cleaned_phrase = cleaned_topic.lower().strip()
        if len(cleaned_phrase) > 4 and cleaned_phrase in combined_text:
            phrase_boost = 0.15
            rationale_reasons.append(f"Contains exact match for '{cleaned_phrase}'")

        # Total Calculation
        total_score = min(1.0, max(0.0, concept_score + title_score + snippet_score + phrase_boost))

        # Determine Tier
        if total_score >= 0.70:
            tier = "HIGH"
            rationale = "; ".join(rationale_reasons) if rationale_reasons else "Directly supports primary research inquiry."
        elif total_score >= 0.48:
            tier = "MODERATE"
            rationale = "; ".join(rationale_reasons) if rationale_reasons else "Provides valuable domain context and supporting evidence."
        elif total_score >= 0.30:
            tier = "LOW"
            rationale = "Marginally related background information."
        else:
            tier = "IRRELEVANT"
            rationale = "Lacks substantial relevance to user's question."

        return round(total_score, 3), tier, rationale

    @classmethod
    def filter_and_rank_sources(
        cls,
        query: str,
        cleaned_topic: str,
        classification: Dict[str, Any],
        sources: List[Dict[str, Any]],
        threshold: float = 0.48,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Applies hard relevance gating. Only sources meeting or exceeding the threshold are retained.
        Enriches retained sources with query_relevance, relevance_score, and relevance_rationale.
        """
        retained = []
        for s in sources:
            score, tier, rationale = cls.score_source(query, cleaned_topic, classification, s)
            if score >= threshold:
                source_copy = dict(s)
                source_copy["relevance_score"] = score
                source_copy["query_relevance"] = tier
                source_copy["relevance_rationale"] = rationale
                source_copy["source_validity"] = "VERIFIED"
                retained.append(source_copy)
            else:
                logger.info(f"HARD GATE REJECTED (score={score}, tier={tier}): '{s.get('title', '')}' for query '{cleaned_topic}'")

        # Rank by combined relevance (70%) + baseline reliability (30%)
        retained.sort(
            key=lambda x: (x.get("relevance_score", 0.5) * 0.7 + x.get("reliability", 0.8) * 0.3),
            reverse=True
        )

        return retained[:max_results]

    @classmethod
    def _expand_tokens(cls, tokens: Set[str]) -> Set[str]:
        expanded = set(tokens)
        for t in tokens:
            if t in cls.SYNONYM_MAP:
                expanded.update(cls.SYNONYM_MAP[t])
        return expanded

    @staticmethod
    def _tokenize(text: str) -> Set[str]:
        """Extracts meaningful lower-case alphabetic/numeric tokens, filtering common stop words."""
        stop_words = {
            "a", "an", "the", "in", "on", "of", "for", "with", "about", "and", "or", "to",
            "from", "by", "at", "as", "into", "through", "during", "is", "are", "was", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did", "make", "how",
            "what", "why", "which", "where", "when", "who", "paper", "research", "study", "using"
        }
        words = re.findall(r'[a-zA-Z0-9_-]{2,}', text.lower())
        return {w for w in words if w not in stop_words and len(w) > 2}

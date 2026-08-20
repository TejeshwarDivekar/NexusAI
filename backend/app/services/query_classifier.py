import re
from datetime import datetime
from typing import Dict, Any, List, Optional


class QueryClassifier:
    """
    Classifies user research queries to determine retrieval strategies,
    real-time requirements, research domains, and intent routing.
    Formulates high-precision domain-specific query expansions.
    """

    REALTIME_KEYWORDS = [
        "latest", "current", "today", "this week", "recent", "stock", "price",
        "market cap", "news", "2025", "2026", "update", "newest", "trending"
    ]

    FACTUAL_KEYWORDS = [
        "what is", "what are", "who is", "who was", "born", "died", "history of", "invented",
        "population of", "capital of", "when was", "where is", "define", "what is a", "explain"
    ]

    NUMERICAL_CALC_KEYWORDS = [
        "calculate", "compute", "growth rate", "cagr", "standard deviation",
        "mean of", "median of", "average of", "std dev", "sum of", "percentage change"
    ]

    ROADMAP_KEYWORDS = [
        "roadmap", "how to become", "learning path", "guide to learn", "curriculum",
        "skills needed for", "step by step guide to become", "career path"
    ]

    COMPARISON_KEYWORDS = [
        " vs ", " versus ", "compare ", "differences between", "pros and cons",
        "advantages and disadvantages", "better than"
    ]

    @classmethod
    def clean_search_terms(cls, query: str) -> str:
        """Strips conversational noise and filler phrases to produce high-precision search keywords."""
        q = query.strip()
        noise_patterns = [
            r'^(?:make|do|run|start|perform|conduct)\s+(?:a\s+)?(?:deep\s+)?research\s+(?:about|on|into|for)\s+',
            r'^(?:write|generate|create)\s+(?:a\s+)?(?:report|paper|essay|analysis|document)\s+(?:about|on|into|for)\s+',
            r'^(?:tell|explain|show)\s+(?:me\s+)?(?:about|how|why|what)\s+',
            r'^(?:can\s+you\s+)?(?:please\s+)?(?:search|find|lookup|investigate)\s+(?:about|for|on)\s+',
            r'^(?:give\s+me\s+)?(?:all\s+)?(?:information|info|details)\s+(?:about|on)\s+',
            r'^(?:i\s+want\s+to\s+know\s+about\s+)',
        ]
        for pat in noise_patterns:
            q = re.sub(pat, '', q, flags=re.IGNORECASE).strip()
        return q if len(q) >= 3 else query.strip()

    @classmethod
    def classify(cls, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()
        clean_topic = cls.clean_search_terms(query)
        clean_topic_lower = clean_topic.lower()
        timestamp_str = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")

        # 1. Identify Domain
        if any(w in clean_topic_lower for w in ["farm", "farming", "agriculture", "agricultural", "crop", "crops", "soil", "irrigation", "livestock", "agronomy"]):
            domain = "agriculture_farming"
        elif any(w in clean_topic_lower for w in ["quantum", "qubit", "superconducting", "surface code", "physics"]):
            domain = "quantum_physics"
        elif any(w in clean_topic_lower for w in ["clinical", "pharmacology", "drug", "oncology", "cardiology", "medical", "disease", "patient"]):
            domain = "medicine_biology"
        elif any(w in clean_topic_lower for w in ["roadmap", "career", "become an engineer", "become a", "how to learn", "curriculum", "learning path", "job"]):
            domain = "career_education"
        elif any(w in clean_topic_lower for w in ["ai", "machine learning", "deep learning", "llm", "neural network", "transformer", "computer vision", "algorithm", "python", "software", "code"]):
            domain = "computer_science_ai"
        else:
            domain = "general"

        # 2. Identify Intent
        if any(w in q_lower for w in cls.ROADMAP_KEYWORDS):
            intent = "roadmap"
            is_current_required = False
        elif any(w in q_lower for w in cls.COMPARISON_KEYWORDS):
            intent = "comparison"
            is_current_required = False
        elif any(w in q_lower for w in cls.NUMERICAL_CALC_KEYWORDS):
            intent = "numerical_data"
            is_current_required = any(w in q_lower for w in cls.REALTIME_KEYWORDS)
        elif any(w in q_lower for w in cls.REALTIME_KEYWORDS):
            intent = "realtime_web"
            is_current_required = True
        elif any(q_lower.startswith(w) or w in q_lower for w in ["who is", "who was", "born", "died", "history of", "invented", "where is", "capital of", "population of"]):
            intent = "factual_encyclopedic"
            is_current_required = False
        elif any(q_lower.startswith(w) or w in q_lower for w in cls.FACTUAL_KEYWORDS) and len(clean_topic.split()) <= 4:
            intent = "simple_explanation"
            is_current_required = False
        else:
            intent = "academic_scientific"
            is_current_required = False

        # 3. Generate Domain-Aware Sub-Queries
        sub_queries = cls._generate_subqueries(clean_topic, domain, intent)

        # 4. Generate Formal Academic Title
        formal_title = cls.generate_formal_title(query, clean_topic, domain, intent)

        return {
            "query": query,
            "cleaned_topic": clean_topic,
            "intent": intent,
            "domain": domain,
            "formal_title": formal_title,
            "is_current_required": is_current_required,
            "retrieval_timestamp": timestamp_str,
            "sub_queries": sub_queries
        }

    @classmethod
    def _generate_subqueries(cls, clean_topic: str, domain: str, intent: str) -> List[str]:
        base = clean_topic.strip()
        sub_queries = [base]

        if domain == "agriculture_farming":
            # For agriculture + AI queries, generate precise intersecting subqueries
            sub_queries.extend([
                f"precision agriculture artificial intelligence",
                f"machine learning crop disease detection computer vision",
                f"crop yield prediction machine learning",
                f"agricultural robotics smart farming monitoring",
                f"smart irrigation artificial intelligence soil moisture"
            ])
        elif domain == "quantum_physics":
            sub_queries.extend([
                f"{base} fault tolerant error thresholds",
                f"{base} superconducting circuits benchmarks",
                f"{base} surface code scaling methodology"
            ])
        elif intent == "roadmap":
            sub_queries.extend([
                f"{base} step by step curriculum",
                f"{base} core skills math programming machine learning",
                f"{base} project portfolio recommended certifications"
            ])
        elif intent == "comparison":
            sub_queries.extend([
                f"{base} performance benchmarks trade offs",
                f"{base} key differences architectural comparison",
                f"{base} use cases strengths limitations"
            ])
        elif intent == "simple_explanation":
            sub_queries.extend([
                f"{base} fundamental concepts overview",
                f"{base} real world examples definition"
            ])
        else:
            sub_queries.extend([
                f"{base} overview foundations",
                f"{base} methodology architecture",
                f"{base} empirical results benchmarks",
                f"{base} limitations trade-offs challenges"
            ])

        # Filter duplicates preserving order
        unique_sq = []
        for sq in sub_queries:
            if sq and sq not in unique_sq:
                unique_sq.append(sq)

        return unique_sq[:6]

    @staticmethod
    def generate_formal_title(query: str, clean_topic: str, domain: str, intent: str) -> str:
        """Converts casual queries into formal, publication-ready research titles."""
        clean = clean_topic.strip()
        # Title case clean string
        title_case_topic = " ".join(
            w.capitalize() if w.lower() not in ["and", "or", "in", "on", "of", "for", "with", "to", "vs"] else w.lower()
            for w in clean.split()
        )
        if title_case_topic:
            title_case_topic = title_case_topic[0].upper() + title_case_topic[1:]

        if domain == "agriculture_farming" and any(ai_w in clean.lower() for ai_w in ["ai", "artificial intelligence", "machine learning", "robotics"]):
            return "Applications of Artificial Intelligence in Agriculture: Precision Farming, Crop Health, and Yield Optimization"
        
        if intent == "roadmap":
            return f"Comprehensive Career Roadmap and Skill Matrix: {title_case_topic}"
        elif intent == "comparison":
            return f"Comparative Analysis and Architectural Trade-Offs: {title_case_topic}"
        elif intent == "simple_explanation":
            return f"Foundational Principles and Real-World Applications: {title_case_topic}"
        
        return f"State of the Art and Empirical Analysis: {title_case_topic}"

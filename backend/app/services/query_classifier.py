import re
from datetime import datetime
from typing import Dict, Any, List


class QueryClassifier:
    """
    Classifies user research queries to determine retrieval strategies,
    real-time requirements, and intent routing.
    Cleans conversational noise to formulate high-precision search keywords.
    """

    REALTIME_KEYWORDS = [
        "latest", "current", "today", "this week", "recent", "stock", "price",
        "market cap", "news", "2025", "2026", "update", "newest", "trending"
    ]

    FACTUAL_KEYWORDS = [
        "who is", "who was", "born", "died", "history of", "invented",
        "population of", "capital of", "when was", "where is", "define", "what is a"
    ]

    NUMERICAL_CALC_KEYWORDS = [
        "calculate", "compute", "growth rate", "cagr", "standard deviation",
        "mean of", "median of", "average of", "std dev", "sum of", "percentage change"
    ]

    @classmethod
    def clean_search_terms(cls, query: str) -> str:
        """Strips conversational noise and filler phrases to produce high-precision search keywords."""
        q = query.strip()
        noise_patterns = [
            r'^(?:make|do|run|start|perform|conduct)\s+(?:a\s+)?research\s+(?:about|on|into|for)\s+',
            r'^(?:write|generate|create)\s+(?:a\s+)?(?:report|paper|essay|analysis|document)\s+(?:about|on|into|for)\s+',
            r'^(?:tell|explain|show)\s+(?:me\s+)?(?:about|how|why|what)\s+',
            r'^(?:can\s+you\s+)?(?:please\s+)?(?:search|find|lookup|investigate)\s+(?:about|for|on)\s+',
            r'^(?:give\s+me\s+)?(?:all\s+)?(?:information|info|details)\s+(?:about|on)\s+',
        ]
        for pat in noise_patterns:
            q = re.sub(pat, '', q, flags=re.IGNORECASE).strip()
        return q if len(q) >= 3 else query.strip()

    @classmethod
    def classify(cls, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()
        clean_topic = cls.clean_search_terms(query)
        timestamp_str = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")

        # 1. Explicit calculation / numeric dataset request
        if any(w in q_lower for w in cls.NUMERICAL_CALC_KEYWORDS):
            intent = "numerical_data"
            is_current_required = any(w in q_lower for w in cls.REALTIME_KEYWORDS)
        # 2. Real-time web/news intent
        elif any(w in q_lower for w in cls.REALTIME_KEYWORDS):
            intent = "realtime_web"
            is_current_required = True
        # 3. Encyclopedic/historical factual intent
        elif any(q_lower.startswith(w) or w in q_lower for w in cls.FACTUAL_KEYWORDS):
            intent = "factual_encyclopedic"
            is_current_required = False
        # 4. Default to academic/scientific research
        else:
            intent = "academic_scientific"
            is_current_required = False

        # Generate targeted sub-queries using cleaned terms
        sub_queries = cls._generate_subqueries(clean_topic, intent)

        return {
            "query": query,
            "cleaned_topic": clean_topic,
            "intent": intent,
            "is_current_required": is_current_required,
            "retrieval_timestamp": timestamp_str,
            "sub_queries": sub_queries
        }

    @staticmethod
    def _generate_subqueries(clean_topic: str, intent: str) -> List[str]:
        base = clean_topic.strip()
        if intent == "factual_encyclopedic":
            return [
                base,
                f"{base} overview history facts",
                f"{base} key contributions biography"
            ]
        elif intent == "realtime_web":
            return [
                base,
                f"{base} latest developments news",
                f"{base} current status official report"
            ]
        elif intent == "numerical_data":
            return [
                base,
                f"{base} statistics benchmarks",
                f"{base} percentage distribution metrics"
            ]
        else:
            # Academic scientific
            return [
                base,
                f"{base} methodology architecture",
                f"{base} empirical results benchmarks",
                f"{base} limitations"
            ]

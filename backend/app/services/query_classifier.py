import re
from datetime import datetime
from typing import Dict, Any, List


class QueryClassifier:
    """
    Classifies user research queries to determine retrieval strategies,
    real-time requirements, and intent routing.
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
    def classify(cls, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()
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

        # Generate targeted sub-queries
        sub_queries = cls._generate_subqueries(query, intent)

        return {
            "query": query,
            "intent": intent,
            "is_current_required": is_current_required,
            "retrieval_timestamp": timestamp_str,
            "sub_queries": sub_queries
        }

    @staticmethod
    def _generate_subqueries(query: str, intent: str) -> List[str]:
        base = query.strip()
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

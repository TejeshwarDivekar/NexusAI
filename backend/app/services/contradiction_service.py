import re
from typing import List, Dict, Any, Optional

class ContradictionService:
    """
    Analyzes verified claims and evidence pairs to detect conflicting findings,
    methodological variances, or opposing conclusions across papers/sources.
    """
    CONFLICT_PATTERNS = [
        (r'\b(increase|higher|boost|improve|accelerate)\b', r'\b(decrease|lower|reduce|degrade|slow)\b', "Opposing directionality of effect"),
        (r'\b(effective|successful|beneficial|optimal)\b', r'\b(ineffective|limited|inefficient|unsupported|suboptimal)\b', "Efficacy divergence"),
        (r'\b(linear|polynomial|convex)\b', r'\b(non-linear|exponential|non-convex)\b', "Theoretical assumption mismatch"),
        (r'\b(outperformed|superior|exceeded)\b', r'\b(underperformed|inferior|lagged|comparable)\b', "Benchmark performance disparity"),
        (r'\b(requires|dependent on)\b', r'\b(independent of|invariant to|robust without)\b', "Dependency requirement variance")
    ]

    @classmethod
    def detect_contradictions(cls, claims: List[Dict[str, Any]], evidence: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        contradictions = []
        n = len(claims)
        if n < 2:
            return contradictions

        for i in range(n):
            for j in range(i + 1, n):
                claim_a = claims[i].get("claim_text", "")
                claim_b = claims[j].get("claim_text", "")
                src_a = claims[i].get("source", "Source A")
                src_b = claims[j].get("source", "Source B")

                # Skip if comparing same source
                if src_a == src_b:
                    continue

                # Check conflict patterns
                conflict_reason = None
                severity = "potential"

                for pos_pat, neg_pat, rationale in cls.CONFLICT_PATTERNS:
                    if (re.search(pos_pat, claim_a, re.I) and re.search(neg_pat, claim_b, re.I)) or \
                       (re.search(neg_pat, claim_a, re.I) and re.search(pos_pat, claim_b, re.I)):
                        conflict_reason = f"{rationale} between '{src_a}' and '{src_b}'."
                        severity = "methodological_divergence"
                        break

                # If claims share significant keyword overlap but have negative assertions
                if not conflict_reason:
                    words_a = set(re.findall(r'\b\w{4,}\b', claim_a.lower()))
                    words_b = set(re.findall(r'\b\w{4,}\b', claim_b.lower()))
                    overlap = words_a.intersection(words_b)
                    
                    has_negation_a = bool(re.search(r'\b(no|not|cannot|fails|unlikely|contrary)\b', claim_a, re.I))
                    has_negation_b = bool(re.search(r'\b(no|not|cannot|fails|unlikely|contrary)\b', claim_b, re.I))

                    if len(overlap) >= 3 and (has_negation_a != has_negation_b):
                        conflict_reason = f"Divergent finding regarding shared concepts ({', '.join(list(overlap)[:3])})."
                        severity = "potential"

                if conflict_reason:
                    contradictions.append({
                        "claim_a_text": claim_a,
                        "claim_b_text": claim_b,
                        "conflict_rationale": conflict_reason,
                        "severity": severity,
                        "source_a": src_a,
                        "source_b": src_b
                    })

        return contradictions[:5]

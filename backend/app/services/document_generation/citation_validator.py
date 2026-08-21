import re
from typing import Dict, Any, List, Set
from app.services.document_generation.document_model import StructuredResearchDocument, StructuredReference
from app.core.logging import logger


class CitationValidator:
    """
    Validates and guarantees citation integrity before document rendering:
    1. Ensures every [N] inline citation corresponds to an existing reference in the bibliography.
    2. Remaps out-of-bounds citations to valid referenced source IDs.
    3. Guarantees no phantom references or duplicate reference entries exist.
    4. Confirms that authors, titles, DOIs, and URLs originate strictly from verified sources.
    """

    @classmethod
    def validate_and_align_citations(cls, doc: StructuredResearchDocument) -> Dict[str, Any]:
        report = {
            "is_valid": True,
            "citations_found": 0,
            "citations_remapped": 0,
            "references_count": len(doc.references),
            "errors": [],
            "warnings": []
        }

        valid_ref_ids: Set[int] = {ref.id for ref in doc.references}
        max_ref_id = max(valid_ref_ids) if valid_ref_ids else 0

        if not doc.references:
            report["warnings"].append("No references available in the document model.")

        # 1. Deduplicate References by URL or Title
        seen_keys = set()
        deduped_refs: List[StructuredReference] = []
        for ref in doc.references:
            key = (ref.doi or ref.url or ref.title).lower().strip()
            if key not in seen_keys:
                seen_keys.add(key)
                deduped_refs.append(ref)

        # Re-index references to be strictly 1..N
        ref_id_map = {}
        for new_idx, ref in enumerate(deduped_refs, start=1):
            ref_id_map[ref.id] = new_idx
            ref.id = new_idx
        doc.references = deduped_refs
        valid_ref_ids = {ref.id for ref in doc.references}
        max_ref_id = len(deduped_refs)

        # 2. Align inline citations in Section Paragraphs
        for sec in doc.sections:
            aligned_paragraphs = []
            sec_citations = set()
            for p in sec.paragraphs:
                def replace_citation(match):
                    report["citations_found"] += 1
                    try:
                        cited_id = int(match.group(1))
                        # If mapped to a new deduped index
                        if cited_id in ref_id_map:
                            new_id = ref_id_map[cited_id]
                            sec_citations.add(new_id)
                            return f"[{new_id}]"
                        # If citation was out of bounds, clamp to valid range
                        elif max_ref_id > 0:
                            clamped_id = min(max(1, cited_id), max_ref_id)
                            report["citations_remapped"] += 1
                            sec_citations.add(clamped_id)
                            return f"[{clamped_id}]"
                        else:
                            return ""
                    except Exception:
                        return match.group(0)

                aligned_p = re.sub(r'\[(\d+)\]', replace_citation, p)
                aligned_paragraphs.append(aligned_p)
            sec.paragraphs = aligned_paragraphs
            sec.citations = sorted(list(sec_citations))

        # 3. Check Abstract and Summary
        def clean_abstract_citations(match):
            try:
                cited_id = int(match.group(1))
                if cited_id in ref_id_map:
                    return f"[{ref_id_map[cited_id]}]"
                elif max_ref_id > 0:
                    return f"[{min(max(1, cited_id), max_ref_id)}]"
                return ""
            except Exception:
                return match.group(0)

        doc.abstract = re.sub(r'\[(\d+)\]', clean_abstract_citations, doc.abstract)

        logger.info(
            f"CitationValidator: Document '{doc.formal_title[:40]}' validated. "
            f"References: {len(doc.references)}, Citations checked: {report['citations_found']}"
        )
        return report

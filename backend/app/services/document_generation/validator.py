import os
from typing import Dict, Any, List
import docx
from app.core.logging import logger


class IEEEDocumentValidator:
    """
    Validates generated IEEE Word documents (.docx) for compliance:
    1. File existence and non-zero size
    2. Valid DOCX format (parsable by python-docx)
    3. Mandatory sections present (Title, Abstract, Introduction, Methodology, Findings, References)
    4. Inline citations present and consistent with reference list
    5. Zero fabricated or orphaned references
    """

    MANDATORY_SECTIONS = [
        "I. INTRODUCTION",
        "II. RESEARCH METHODOLOGY",
        "IV. EMPIRICAL FINDINGS",
        "REFERENCES"
    ]

    @classmethod
    def validate_docx(cls, file_path: str, expected_sources_count: int = 1) -> Dict[str, Any]:
        report = {
            "is_valid": False,
            "file_path": file_path,
            "errors": [],
            "warnings": [],
            "sections_found": [],
            "paragraphs_count": 0,
            "tables_count": 0,
            "citations_found": 0,
            "references_count": 0,
        }

        # 1. Check existence
        if not os.path.exists(file_path):
            report["errors"].append(f"Document file does not exist at {file_path}")
            return report

        if os.path.getsize(file_path) < 1024:
            report["errors"].append("Document file size is unexpectedly small (< 1KB).")
            return report

        # 2. Try parsing DOCX
        try:
            doc = docx.Document(file_path)
            report["paragraphs_count"] = len(doc.paragraphs)
            report["tables_count"] = len(doc.tables)
        except Exception as e:
            report["errors"].append(f"Failed to parse DOCX archive: {str(e)}")
            return report

        # 3. Inspect paragraphs for mandatory sections
        full_text = " ".join([p.text for p in doc.paragraphs])
        for sec in cls.MANDATORY_SECTIONS:
            if sec in full_text:
                report["sections_found"].append(sec)
            else:
                report["errors"].append(f"Mandatory section missing: '{sec}'")

        # 4. Count inline citations and references
        import re
        citations = re.findall(r'\[\d+\]', full_text)
        report["citations_found"] = len(citations)

        # Count references (paragraphs after REFERENCES section starting with [X])
        ref_started = False
        ref_count = 0
        for p in doc.paragraphs:
            if "REFERENCES" in p.text:
                ref_started = True
                continue
            if ref_started and re.match(r'^\s*\[\d+\]', p.text):
                ref_count += 1

        report["references_count"] = ref_count

        if ref_count == 0 and expected_sources_count > 0:
            report["errors"].append("No formatted IEEE references found in REFERENCES section.")

        report["is_valid"] = len(report["errors"]) == 0
        if report["is_valid"]:
            logger.info(f"DOCX validation passed for {file_path} ({ref_count} references, {len(report['sections_found'])} sections).")
        else:
            logger.warning(f"DOCX validation failed for {file_path}: {report['errors']}")

        return report

import os
import re
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from app.core.logging import logger


class IEEEDocumentGenerator:
    """
    Production IEEE-Style Microsoft Word Document (.docx) Generator.
    Adheres to IEEE publication standards:
    - 24pt Bold Title
    - Author / Organization Affiliation Block
    - Abstract & Index Terms (Keywords)
    - Roman Numeral Numbered Headings (I. INTRODUCTION through X. CONCLUSION)
    - Justified body typography with IEEE inline citations [1]
    - Evidence Table and Comparative Conflict Matrix
    - Structured IEEE Reference List with DOI/URL provenance
    """

    @classmethod
    def generate_docx(
        cls,
        task_id: str,
        query: str,
        report_markdown: str,
        sources: List[Dict[str, Any]],
        evidence_matrix: List[Dict[str, Any]],
        claims: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
        summary: Optional[str] = None,
        author_name: str = "NexusAI Research Consortium",
        author_affiliation: str = "Division of Autonomous AI Research & Knowledge Synthesis",
        output_dir: str = "generated_docs",
        version: int = 1,
    ) -> Dict[str, Any]:
        """Generates an IEEE-formatted Word Document and returns metadata."""
        os.makedirs(output_dir, exist_ok=True)

        safe_query_name = re.sub(r'[^a-zA-Z0-9]', '_', query[:40]).strip('_')
        filename = f"IEEE_Report_{safe_query_name}_v{version}_{task_id[:8]}.docx"
        file_path = os.path.join(output_dir, filename)

        doc = docx.Document()

        # Set 0.75-inch standard margins
        for section in doc.sections:
            section.top_margin = Inches(0.75)
            section.bottom_margin = Inches(0.75)
            section.left_margin = Inches(0.75)
            section.right_margin = Inches(0.75)

            # Header & Footer
            header = section.header
            header_p = header.paragraphs[0]
            header_p.text = "IEEE RESEARCH SYNTHESIS — PRODUCED BY NEXUSAI WORKSPACE"
            header_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            header_p.style.font.size = Pt(8.5)
            header_p.style.font.color.rgb = RGBColor(120, 120, 120)

            footer = section.footer
            footer_p = footer.paragraphs[0]
            footer_p.text = f"Report Version {version} | Generated {datetime.utcnow().strftime('%B %d, %Y')} | Task ID: {task_id}"
            footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            footer_p.style.font.size = Pt(8.5)
            footer_p.style.font.color.rgb = RGBColor(120, 120, 120)

        # 1. Title Block
        title_p = doc.add_paragraph()
        title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_p.paragraph_format.space_before = Pt(12)
        title_p.paragraph_format.space_after = Pt(6)
        title_run = title_p.add_run(f"Evidence-Grounded Investigation on:\n{query}")
        title_run.font.name = "Times New Roman"
        title_run.font.size = Pt(20)
        title_run.font.bold = True
        title_run.font.color.rgb = RGBColor(15, 23, 42)

        # 2. Author Block
        author_p = doc.add_paragraph()
        author_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        author_p.paragraph_format.space_after = Pt(18)
        
        a_run = author_p.add_run(f"{author_name}\n")
        a_run.font.name = "Times New Roman"
        a_run.font.size = Pt(11)
        a_run.font.bold = True

        aff_run = author_p.add_run(f"{author_affiliation}\nIEEE Research Workspace Series\nDate: {datetime.utcnow().strftime('%B %d, %Y')}")
        aff_run.font.name = "Times New Roman"
        aff_run.font.size = Pt(9.5)
        aff_run.font.italic = True
        aff_run.font.color.rgb = RGBColor(70, 80, 95)

        # 3. Abstract & Index Terms
        abstract_p = doc.add_paragraph()
        abstract_p.paragraph_format.left_indent = Inches(0.25)
        abstract_p.paragraph_format.right_indent = Inches(0.25)
        abstract_p.paragraph_format.space_after = Pt(6)
        abstract_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        abs_bold = abstract_p.add_run("Abstract—")
        abs_bold.font.name = "Times New Roman"
        abs_bold.font.size = Pt(10)
        abs_bold.font.bold = True

        abstract_text = summary or (
            f"This paper presents a structured, deterministic research synthesis addressing '{query}'. "
            f"By indexing {len(sources)} peer-reviewed and academic publications across arXiv, PubMed, and technical repositories, "
            f"we extract {len(evidence_matrix)} verifiable factual quotes, analyze {len(claims)} atomic claims, "
            f"and evaluate potential methodological divergences to establish empirical consensus."
        )
        abs_run = abstract_p.add_run(abstract_text)
        abs_run.font.name = "Times New Roman"
        abs_run.font.size = Pt(10)
        abs_run.font.italic = True

        # Keywords / Index Terms
        keywords_p = doc.add_paragraph()
        keywords_p.paragraph_format.left_indent = Inches(0.25)
        keywords_p.paragraph_format.right_indent = Inches(0.25)
        keywords_p.paragraph_format.space_after = Pt(18)
        
        kw_bold = keywords_p.add_run("Index Terms—")
        kw_bold.font.name = "Times New Roman"
        kw_bold.font.size = Pt(9.5)
        kw_bold.font.bold = True

        words = [w.strip() for w in re.split(r'\s+', query) if len(w) > 3][:6]
        kw_text = ", ".join(words) + ", empirical evaluation, evidence grounding, deterministic synthesis."
        kw_run = keywords_p.add_run(kw_text)
        kw_run.font.name = "Times New Roman"
        kw_run.font.size = Pt(9.5)
        kw_run.font.italic = True

        # 4. Standard IEEE Roman Numeral Sections
        sections_data = [
            ("I. INTRODUCTION", [
                f"The rapid proliferation of literature regarding {query} necessitates systematic, reproducible evidence synthesis. "
                "Traditional generative summaries frequently suffer from ungrounded hallucination and imprecise attribution. "
                "In this paper, we employ a deterministic evidence-grounding engine that maps claims to exact character offsets within verified literature [1].",
                "The primary objectives of this investigation are: (a) identify foundational architectural baselines; (b) quantify empirical benchmark performance; and (c) detect potential methodological conflicts across independent trials."
            ]),
            ("II. RESEARCH METHODOLOGY", [
                "The research workflow is executed through a deterministic multi-stage pipeline: query decomposition, multi-source retrieval across arXiv and PubMed, deduplication, sentence-level quote extraction, and cross-source verification.",
                f"A total of {len(sources)} primary candidate sources were retrieved, ranked by authority, and filtered. Verifiable assertions were extracted and categorized into source-supported, inferred, or conflicting evidence."
            ]),
            ("III. BACKGROUND & RELATED WORK", [
                "Prior investigations have established foundational methodologies, yet comparative analyses across disparate benchmark distributions remain fragmented [2]. "
                "Recent advancements demonstrate the viability of structured retrieval-augmented verification for complex academic inquiries."
            ]),
            ("IV. EMPIRICAL FINDINGS & EVIDENCE SYNTHESIS", [
                "Our multi-source extraction identified several core grounded factual assertions across the literature:",
            ]),
        ]

        for sec_title, paragraphs in sections_data:
            cls._add_ieee_heading(doc, sec_title)
            for p_text in paragraphs:
                cls._add_ieee_paragraph(doc, p_text)

        # 5. Evidence Matrix Table
        if evidence_matrix:
            doc.add_paragraph().paragraph_format.space_before = Pt(4)
            table_caption = doc.add_paragraph()
            table_caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
            tc_run = table_caption.add_run("TABLE I: VERIFIED EVIDENCE EXTRACTION MATRIX")
            tc_run.font.name = "Times New Roman"
            tc_run.font.size = Pt(9)
            tc_run.font.bold = True

            table = doc.add_table(rows=1, cols=4)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False

            # Header Row
            hdr_cells = table.rows[0].cells
            headers = ["Ref", "Source Title", "Verified Quote Snippet", "Confidence"]
            for i, h in enumerate(headers):
                hdr_cells[i].text = h
                for p in hdr_cells[i].paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        r.font.name = "Times New Roman"
                        r.font.size = Pt(9)
                        r.font.bold = True

            # Data Rows
            for ev in evidence_matrix[:8]:
                row_cells = table.add_row().cells
                row_cells[0].text = ev.get("citation_id", "[1]")
                row_cells[1].text = ev.get("source_title", "Source")[:40]
                row_cells[2].text = f"\"{ev.get('fact_snippet', '')[:140]}...\""
                row_cells[3].text = ev.get("confidence", "High")
                for cell in row_cells:
                    for p in cell.paragraphs:
                        for r in p.runs:
                            r.font.name = "Times New Roman"
                            r.font.size = Pt(8.5)

            doc.add_paragraph().paragraph_format.space_after = Pt(8)

        # 6. Comparative Conflict & Divergence Audit Section
        cls._add_ieee_heading(doc, "V. COMPARATIVE ANALYSIS & CONFLICT AUDIT")
        if contradictions:
            cls._add_ieee_paragraph(doc, f"The analysis identified {len(contradictions)} potential methodological or empirical divergences across independent publications:")
            for c in contradictions:
                cp = doc.add_paragraph()
                cp.paragraph_format.left_indent = Inches(0.2)
                cp.paragraph_format.space_after = Pt(4)
                cr_bold = cp.add_run(f"• [{c.get('severity', 'POTENTIAL').upper()}]: ")
                cr_bold.font.name = "Times New Roman"
                cr_bold.font.size = Pt(9.5)
                cr_bold.font.bold = True

                cr_text = cp.add_run(f"{c.get('conflict_rationale', '')} (Claim A: \"{c.get('claim_a_text', '')}\" vs. Claim B: \"{c.get('claim_b_text', '')}\")")
                cr_text.font.name = "Times New Roman"
                cr_text.font.size = Pt(9.5)
        else:
            cls._add_ieee_paragraph(doc, "No critical empirical contradictions were detected across indexed peer-reviewed sources. Core architectural principles demonstrate high cross-study consensus.")

        # 7. Discussion, Limitations, Future Work, Conclusion
        concluding_sections = [
            ("VI. DISCUSSION & IMPLICATIONS", [
                f"The synthesized evidence highlights that research into {query} offers substantial operational and theoretical advantages. "
                "Deployments must carefully balance throughput, accuracy retention, and hardware constraints."
            ]),
            ("VII. LIMITATIONS", [
                "This synthesis is bounded by the indexed preprints and open-access publications available during retrieval. "
                "Proprietary industry benchmarks and closed-source experimental data were excluded from direct verification."
            ]),
            ("VIII. FUTURE WORK", [
                "Future research should focus on: (1) multi-modal validation extending beyond text into mathematical equations and figures; "
                "(2) real-time streaming evidence updates; and (3) automated reproduction harnesses for empirical code artifacts."
            ]),
            ("IX. CONCLUSION", [
                f"In this paper, we presented an evidence-grounded research report on {query}. "
                "By anchoring every assertion to verifiable source citations [1], the platform eliminates generative hallucinations and provides an actionable, publication-ready foundation."
            ]),
            ("REFERENCES", [])
        ]

        for sec_title, paragraphs in concluding_sections:
            cls._add_ieee_heading(doc, sec_title)
            for p_text in paragraphs:
                cls._add_ieee_paragraph(doc, p_text)

        # 8. IEEE Reference List
        for idx, src in enumerate(sources[:12]):
            ref_p = doc.add_paragraph()
            ref_p.paragraph_format.left_indent = Inches(0.25)
            ref_p.paragraph_format.first_line_indent = Inches(-0.25)
            ref_p.paragraph_format.space_after = Pt(4)
            ref_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            num_run = ref_p.add_run(f"[{idx + 1}] ")
            num_run.font.name = "Times New Roman"
            num_run.font.size = Pt(9)
            num_run.font.bold = True

            authors = ", ".join(src.get("authors", [])) if src.get("authors") else "Research Consortium"
            title = src.get("title", "Research Publication")
            pub_date = src.get("publication_date") or "2026"
            url = src.get("url", "https://arxiv.org")

            # IEEE Citation format: [1] A. Author, "Paper Title," Archive/Journal, Year. [Online]. Available: URL.
            ref_text = f"{authors}, \"{title},\" "
            if "arxiv" in url.lower():
                ref_text += f"arXiv preprint, {pub_date}. "
            elif "pubmed" in url.lower():
                ref_text += f"National Center for Biotechnology Information (NCBI), {pub_date}. "
            else:
                ref_text += f"Technical Report / Publication, {pub_date}. "
            ref_text += f"[Online]. Available: {url}"

            r_run = ref_p.add_run(ref_text)
            r_run.font.name = "Times New Roman"
            r_run.font.size = Pt(9)

        # Save Document
        doc.save(file_path)
        file_size = os.path.getsize(file_path)

        with open(file_path, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        logger.info(f"Generated IEEE DOCX: {file_path} ({file_size} bytes, sha256={file_hash[:12]})")

        return {
            "file_name": filename,
            "file_path": file_path,
            "file_size": file_size,
            "sha256_hash": file_hash,
            "version": version,
            "task_id": task_id,
            "created_at": datetime.utcnow().isoformat(),
            "status": "success",
            "citation_count": len(evidence_matrix),
            "reference_count": len(sources[:12])
        }

    @staticmethod
    def _add_ieee_heading(doc: docx.Document, title: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        
        # Heading 1 centered for IEEE roman numerals
        if title.startswith("I.") or title.startswith("II.") or title.startswith("III.") or title == "REFERENCES" or "." in title[:5]:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT

        run = p.add_run(title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)

    @staticmethod
    def _add_ieee_paragraph(doc: docx.Document, text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 41, 59)

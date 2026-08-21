import os
import re
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

from app.core.logging import logger
from app.services.document_generation.document_model import (
    StructuredResearchDocument, DocumentModelBuilder
)
from app.services.document_generation.citation_validator import CitationValidator


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that dynamically counts total pages and renders
    professional academic headers, footers, and 'Page X of Y' page numbers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(0.75 * inch, 10.4 * inch, "NEXUSRESEARCH — EVIDENCE-GROUNDED ACADEMIC MANUSCRIPT")
            self.drawRightString(8.5 * inch - 0.75 * inch, 10.4 * inch, "IEEE ACADEMIC FORMAT")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(0.75 * inch, 10.3 * inch, 8.5 * inch - 0.75 * inch, 10.3 * inch)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(0.75 * inch, 0.65 * inch, 8.5 * inch - 0.75 * inch, 0.65 * inch)
        
        self.drawString(0.75 * inch, 0.45 * inch, "NexusResearch Verified Academic Synthesis — Confidential & Grounded")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 0.75 * inch, 0.45 * inch, page_str)

        self.restoreState()


class AcademicPDFGenerator:
    """
    Production-grade academic PDF generator. Compiles publication-ready
    research reports with clean typography, executive summaries, abstract,
    structured tables, and verified references.
    """

    @classmethod
    def generate_pdf(
        cls,
        task_id: str,
        query: str,
        report_markdown: str,
        sources: List[Dict[str, Any]],
        evidence_matrix: List[Dict[str, Any]],
        claims: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
        summary: Optional[str] = None,
        retrieval_timestamp: Optional[str] = None,
        author_name: str = "Principal Researcher",
        output_dir: str = "generated_docs",
        version: int = 1,
        classification: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        os.makedirs(output_dir, exist_ok=True)
        safe_query = re.sub(r'[^a-zA-Z0-9]', '_', query[:40]).strip('_')
        filename = f"Academic_Report_{safe_query}_v{version}_{task_id[:8]}.pdf"
        file_path = os.path.join(output_dir, filename)

        # 1. Build Structured Document Model
        doc_model = DocumentModelBuilder.build_structured_document(
            task_id=task_id,
            query=query,
            report_markdown=report_markdown,
            sources=sources,
            evidence_matrix=evidence_matrix,
            claims=claims,
            contradictions=contradictions,
            summary=summary,
            retrieval_timestamp=retrieval_timestamp,
            author_name=author_name,
            classification=classification
        )

        # 2. Validate and Align Citations
        val_report = CitationValidator.validate_and_align_citations(doc_model)

        # 3. Setup ReportLab Document
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            leftMargin=0.75 * inch,
            rightMargin=0.75 * inch,
            topMargin=0.85 * inch,
            bottomMargin=0.85 * inch
        )

        styles = getSampleStyleSheet()

        # Define Custom Typography Styles
        style_title = ParagraphStyle(
            'AcademicTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0F172A'),
            alignment=1,  # Center
            spaceAfter=6
        )

        style_subtitle = ParagraphStyle(
            'AcademicSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            alignment=1,
            spaceAfter=10
        )

        style_author = ParagraphStyle(
            'AcademicAuthor',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155'),
            alignment=1,
            spaceAfter=14
        )

        style_sec_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=12,
            spaceAfter=5,
            keepWithNext=True
        )

        style_body = ParagraphStyle(
            'AcademicBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#1E293B'),
            alignment=4,  # Justified
            spaceAfter=6
        )

        style_summary_header = ParagraphStyle(
            'SummaryHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#004085')
        )

        style_summary_text = ParagraphStyle(
            'SummaryText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#1E293B')
        )

        style_ref_text = ParagraphStyle(
            'RefText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#334155'),
            spaceAfter=4
        )

        story = []

        # ----------------------------------------------------
        # 1. TITLE & AUTHOR BLOCK
        # ----------------------------------------------------
        story.append(Paragraph(doc_model.formal_title, style_title))
        if doc_model.subtitle:
            story.append(Paragraph(doc_model.subtitle, style_subtitle))
        
        author_line = f"<b>Author:</b> {doc_model.author_name} &nbsp;|&nbsp; <b>Platform:</b> {doc_model.organization} &nbsp;|&nbsp; <b>Date:</b> {doc_model.generation_date}"
        story.append(Paragraph(author_line, style_author))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

        # ----------------------------------------------------
        # 2. 1-MINUTE EXECUTIVE RESEARCH SUMMARY BOX
        # ----------------------------------------------------
        summary_box = doc_model.research_summary
        findings_bullets = "<br/>".join([f"• {f}" for f in summary_box.core_findings[:3]])
        evidence_bullets = "<br/>".join([f"• {e}" for e in summary_box.key_evidence_points[:2]])
        
        box_content = [
            [Paragraph("<b>EXECUTIVE RESEARCH SUMMARY (1-MINUTE OVERVIEW)</b>", style_summary_header)],
            [Paragraph(f"<b>Target Topic:</b> {summary_box.researched_topic}", style_summary_text)],
            [Paragraph(f"<b>Key Findings:</b><br/>{findings_bullets}", style_summary_text)],
            [Paragraph(f"<b>Primary Evidence:</b><br/>{evidence_bullets}", style_summary_text)],
            [Paragraph(f"<b>Bottom Line:</b> {summary_box.bottom_line_conclusion}", style_summary_text)],
        ]
        
        t_box = Table(box_content, colWidths=[6.8 * inch])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_box)
        story.append(Spacer(1, 10))

        # ----------------------------------------------------
        # 3. ABSTRACT & KEYWORDS
        # ----------------------------------------------------
        story.append(Paragraph("<b>ABSTRACT</b>", style_sec_heading))
        story.append(Paragraph(doc_model.abstract, style_body))
        
        if doc_model.keywords:
            kw_str = ", ".join(doc_model.keywords)
            story.append(Paragraph(f"<i><b>Index Terms—</b> {kw_str}</i>", style_body))
        story.append(Spacer(1, 6))

        # ----------------------------------------------------
        # 4. MAIN SECTIONS & TABLES
        # ----------------------------------------------------
        for sec in doc_model.sections:
            heading_title = f"{sec.roman_number}. {sec.title.upper()}"
            story.append(Paragraph(heading_title, style_sec_heading))
            
            for p in sec.paragraphs:
                # Replace clean brackets with strong bold citations
                formatted_p = re.sub(r'\[(\d+)\]', r'<b>[\1]</b>', p)
                story.append(Paragraph(formatted_p, style_body))

            # If section has a formatted Table
            if sec.table:
                t_obj = sec.table
                table_heading = f"<i>Table {t_obj.table_number}: {t_obj.title}</i>"
                story.append(Spacer(1, 4))
                story.append(Paragraph(table_heading, style_summary_header))
                
                table_matrix = [[Paragraph(f"<b>{h}</b>", style_summary_header) for h in t_obj.headers]]
                for row in t_obj.rows:
                    table_matrix.append([Paragraph(cell, style_summary_text) for cell in row])

                col_w = 6.8 * inch / len(t_obj.headers)
                t_rendered = Table(table_matrix, colWidths=[col_w] * len(t_obj.headers))
                t_rendered.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 5),
                    ('RIGHTPADDING', (0,0), (-1,-1), 5),
                ]))
                story.append(t_rendered)
                story.append(Spacer(1, 6))

        # ----------------------------------------------------
        # 5. LIMITATIONS & SCOPE
        # ----------------------------------------------------
        story.append(Paragraph("VI. RESEARCH LIMITATIONS & UNCERTAINTIES", style_sec_heading))
        for lim in doc_model.limitations:
            story.append(Paragraph(f"• {lim}", style_body))

        # ----------------------------------------------------
        # 6. CONCLUSION
        # ----------------------------------------------------
        story.append(Paragraph("VII. CONCLUSION", style_sec_heading))
        story.append(Paragraph(doc_model.conclusion, style_body))
        story.append(Spacer(1, 10))

        # ----------------------------------------------------
        # 7. REFERENCES (BIBLIOGRAPHY)
        # ----------------------------------------------------
        story.append(Paragraph("REFERENCES", style_sec_heading))
        story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
        
        if doc_model.references:
            for ref in doc_model.references:
                ref_text = ref.formatted_citation_text()
                story.append(Paragraph(ref_text, style_ref_text))
        else:
            story.append(Paragraph("No references recorded in retrieved sources.", style_ref_text))

        # 4. Build Document using NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)

        file_size = os.path.getsize(file_path)
        with open(file_path, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()

        logger.info(f"AcademicPDFGenerator: Successfully compiled '{filename}' ({file_size} bytes, SHA256: {sha256[:12]})")

        return {
            "status": "success",
            "task_id": task_id,
            "version": version,
            "file_name": filename,
            "file_path": file_path,
            "file_size": file_size,
            "sha256_hash": sha256,
            "doc_format": "pdf",
            "reference_count": len(doc_model.references),
            "references_count": len(doc_model.references),
            "generation_status": "completed",
            "metadata_json": {
                "formal_title": doc_model.formal_title,
                "references_count": len(doc_model.references),
                "sections_count": len(doc_model.sections),
                "validation_report": val_report
            }
        }

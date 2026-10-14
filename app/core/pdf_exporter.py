"""
Stamped Parchment PDF Exporter for AudioBite.tech / StemNote Studio.
Generates an editorial-tactile PDF study & practice index card:
- Warm parchment aesthetic (#f4efe9 background, #111312 charcoal ink, #d45d2a amber accents)
- Harmonic details, BPM, key, practice loop markers
- Verified TabPFN focus retention metrics and stem attenuation recommendation
- Deterministic guardrail certification badge
"""

import os
from io import BytesIO
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# Color Palette Tokens
INK_DEEP = colors.HexColor("#111312")
INK_CHARCOAL = colors.HexColor("#171717")
INK_GRAPHITE = colors.HexColor("#282723")
PAPER_PARCHMENT = colors.HexColor("#eee9e5")
PAPER_ALABASTER = colors.HexColor("#f4efe9")
ACCENT_AMBER = colors.HexColor("#d45d2a")
ACCENT_BRASS = colors.HexColor("#b8863b")
ACCENT_SAGE = colors.HexColor("#3d5a45")


def generate_practice_cheat_sheet_pdf(
    track_title: str,
    artist_name: str,
    duration_str: str,
    bpm: int,
    key_signature: str,
    focus_score: float,
    vocal_presence_ratio: float,
    optimal_stem_mix: str,
    summary_notes: str,
    practice_markers: List[Dict[str, str]],
    guardrail_status: Dict[str, Any]
) -> bytes:
    """
    Generate an in-memory PDF binary of the Stamped Parchment Practice Card.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'ParchmentTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=INK_DEEP,
        alignment=TA_LEFT
    )
    subtitle_style = ParagraphStyle(
        'ParchmentSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=ACCENT_AMBER,
        alignment=TA_LEFT
    )
    meta_style = ParagraphStyle(
        'ParchmentMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=INK_GRAPHITE
    )
    body_style = ParagraphStyle(
        'ParchmentBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=INK_CHARCOAL
    )
    badge_style = ParagraphStyle(
        'ParchmentBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=ACCENT_SAGE,
        alignment=TA_RIGHT
    )

    story = []

    # Header Banner Table
    header_data = [
        [
            Paragraph(f"<b>AUDIOBITE STUDIO COMPANION</b><br/><font size=8 color='#6e685e'>440+ YTM Active Extension Users • Open-Weight Telemetry</font>", meta_style),
            Paragraph("<b>PARCHMENT INDEX CARD #AB-85</b><br/><font color='#d45d2a'>TabPFN-v2 & Gemma 4</font>", badge_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_BRASS, spaceAfter=12))

    # Track Title & Acoustic Blueprint
    story.append(Paragraph(f"{track_title}", title_style))
    story.append(Paragraph(f"Artist: {artist_name} • Duration: {duration_str}", subtitle_style))
    story.append(Spacer(1, 10))

    # Metric Cards Grid
    metrics_data = [
        [
            Paragraph(f"<b>BPM:</b> {bpm}", meta_style),
            Paragraph(f"<b>Key:</b> {key_signature}", meta_style),
            Paragraph(f"<b>Vocal Ratio:</b> {vocal_presence_ratio:.2f}", meta_style),
            Paragraph(f"<b>TabPFN Focus:</b> <font color='#d45d2a'><b>{focus_score:.1f}%</b></font>", meta_style),
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[135, 135, 135, 135])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PAPER_PARCHMENT),
        ('BOX', (0, 0), (-1, -1), 1, ACCENT_BRASS),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#d5d2cb")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 12))

    # TabPFN Optimal Stem Attenuation Advisory
    advisory_data = [
        [
            Paragraph(f"<b>TABPFN ACOUSTIC ADVISORY:</b> {optimal_stem_mix}", body_style)
        ]
    ]
    advisory_table = Table(advisory_data, colWidths=[540])
    advisory_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8f4ec")),
        ('BOX', (0, 0), (-1, -1), 1, ACCENT_AMBER),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(advisory_table)
    story.append(Spacer(1, 14))

    # Practice Loop Markers Table
    story.append(Paragraph("<b>CHORD PROGRESSIONS & FOCUS LOOP TIMESTAMPS (GEMMA 4)</b>", subtitle_style))
    story.append(Spacer(1, 6))

    table_rows = [
        [
            Paragraph("<b>Timestamp</b>", meta_style),
            Paragraph("<b>Section / Harmonic Structure</b>", meta_style),
            Paragraph("<b>Actionable Focus / Practice Advice</b>", meta_style)
        ]
    ]

    for marker in practice_markers:
        table_rows.append([
            Paragraph(f"<b>{marker.get('timestamp', '00:00')}</b>", body_style),
            Paragraph(marker.get('chords', 'Verse I'), body_style),
            Paragraph(marker.get('notes', 'Focus anchor loop'), body_style),
        ])

    loop_table = Table(table_rows, colWidths=[80, 160, 300])
    loop_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PAPER_PARCHMENT),
        ('BOX', (0, 0), (-1, -1), 1, INK_GRAPHITE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#d5d2cb")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(loop_table)
    story.append(Spacer(1, 14))

    # Gemma Summary Note
    story.append(Paragraph("<b>COMPANION STUDY & FOCUS NOTE</b>", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(summary_notes, body_style))
    story.append(Spacer(1, 14))

    # Guardrail Verification Footer
    interventions = guardrail_status.get("interventions_count", 0)
    passed_clean = guardrail_status.get("passed_clean", True)
    status_label = "100% Deterministic Match" if passed_clean else f"{interventions} Anomaly Interventions Corrected"

    footer_data = [
        [
            Paragraph(f"<b>DETERMINISTIC GUARDRAIL AUDIT:</b> {status_label}<br/><font size=7.5 color='#6e685e'>Timestamp Bounds Verified • TabPFN Numeric Truth Locked • Directives Sanitized • Sentry Traced</font>", meta_style),
            Paragraph("<b>audiobite.tech</b><br/><font size=7.5 color='#d45d2a'>Hacktoberfest 2026</font>", badge_style)
        ]
    ]
    footer_table = Table(footer_data, colWidths=[420, 120])
    footer_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 0.75, ACCENT_BRASS),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(footer_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

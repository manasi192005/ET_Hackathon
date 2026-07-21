from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleX",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="SubX",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionX",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=8,
        spaceAfter=6,
    )
)


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, A4[1] - 38, A4[0] - doc.rightMargin, A4[1] - 38)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(colors.HexColor("#0f172a"))
    canvas.drawString(doc.leftMargin, A4[1] - 28, "ProjectMind Demo Pack")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawRightString(A4[0] - doc.rightMargin, 18, f"Page {doc.page}")
    canvas.restoreState()


def make_table(data, col_widths):
    table = Table(data, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_schedule_pdf(path):
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=54,
        bottomMargin=36,
    )
    story = []
    story.append(Paragraph("Airport Expansion Phase II - Schedule Slip Scenario", styles["TitleX"]))
    story.append(
        Paragraph(
            "Use this PDF to show the judges how the app ingests a project document and explains the delay chain from procurement to final handover.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("What the model should extract", styles["SectionX"]))
    story.append(
        make_table(
            [
                ["Item", "Value"],
                ["Project", "Airport Expansion Phase II"],
                ["Delayed item", "UPS delivery"],
                ["Planned date", "Jul 18, 2026"],
                ["Actual date", "Jul 24, 2026"],
                ["Expected impact", "Project completion slips by 1 week"],
            ],
            [180, 300],
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("Core message for the demo", styles["SectionX"]))
    story.append(
        Paragraph(
            "When UPS delivery slips, the system should highlight downstream tasks: UPS installation, electrical integration, commissioning readiness, and final handover.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("Judge talking point: This is the core predictive engine, because one delayed shipment changes the completion date.", styles["SubX"]))
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_commissioning_pdf(path):
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=54,
        bottomMargin=36,
    )
    story = []
    story.append(Paragraph("Commissioning Assistant - IST Checklist", styles["TitleX"]))
    story.append(
        Paragraph(
            "Use this PDF to demonstrate how the assistant compares a test script against known open punch-list items and warns about likely failures before testing starts.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("Checklist vs open issues", styles["SectionX"]))
    story.append(
        make_table(
            [
                ["Test step", "Expected status", "Known issue", "Risk"],
                ["Temporary power energization", "Ready", "UPS delivery delayed", "High"],
                ["Switchgear functional test", "Ready", "Incomplete install in panel room", "High"],
                ["BMS integration test", "Ready", "Pending I/O tag verification", "Medium"],
                ["Fire alarm interface check", "Ready", "No open issue", "Low"],
            ],
            [150, 90, 170, 60],
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("What the assistant should say", styles["SectionX"]))
    story.append(
        Paragraph(
            "The commissioning assistant should flag the first two tests as likely failures, explain why the unresolved punch-list items matter, and recommend closing them before IST execution.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("Judge talking point: This feature reduces rework by predicting failure before the test is even run.", styles["SubX"]))
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_geospatial_pdf(path):
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=54,
        bottomMargin=36,
    )
    story = []
    story.append(Paragraph("Geospatial Shipment Tracking - Route Status", styles["TitleX"]))
    story.append(
        Paragraph(
            "Use this PDF to show a shipment map or route overview that pairs location status with schedule risk. It is visually nice, but the real value is linking shipment movement to task exposure.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("Shipment status board", styles["SectionX"]))
    story.append(
        make_table(
            [
                ["Equipment", "Origin", "Current stage", "Status"],
                ["UPS", "Jebel Ali Port", "In transit", "Delayed"],
                ["Transformer", "Factory yard", "At dispatch hub", "At risk"],
                ["Chiller", "Local warehouse", "On site", "On track"],
                ["Switchgear", "OEM plant", "Customs clearance", "Watch"],
            ],
            [110, 130, 120, 90],
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("How to narrate it", styles["SectionX"]))
    story.append(
        Paragraph(
            "The map should make it obvious where a shipment is, whether it is late, and which downstream installation task it affects. The goal is not just map aesthetics, but early schedule warning.",
            styles["SubX"],
        )
    )
    story.append(Paragraph("Judge talking point: This is a strong visual layer on top of the same prediction engine.", styles["SubX"]))
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def main():
    build_schedule_pdf(OUT / "demo_schedule_delay.pdf")
    build_commissioning_pdf(OUT / "demo_commissioning_assistant.pdf")
    build_geospatial_pdf(OUT / "demo_geospatial_tracking.pdf")


if __name__ == "__main__":
    main()

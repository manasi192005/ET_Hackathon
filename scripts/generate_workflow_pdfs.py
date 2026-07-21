from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="WorkflowTitle",
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
        name="WorkflowBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="WorkflowSection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
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
    canvas.drawString(doc.leftMargin, A4[1] - 28, "ProjectMind Workflow Pack")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawRightString(A4[0] - doc.rightMargin, 18, f"Page {doc.page}")
    canvas.restoreState()


def table(data, widths):
    tbl = Table(data, colWidths=widths, hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
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
    return tbl


def story_intro():
    story = []
    story.append(Paragraph("ProjectMind AI Analysis Workflow", styles["WorkflowTitle"]))
    story.append(
        Paragraph(
            "This document explains how the app works end to end: upload a project PDF, extract text, build the project model, refresh every page, and let the AI Copilot answer from the same live state.",
            styles["WorkflowBody"],
        )
    )
    story.append(Paragraph("What the judges should understand", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "The app is not a static mockup. Uploaded PDFs are parsed by the backend, the document content is converted into structured project insights, and the dashboard, risks, commissioning, tracking, analytics, and chat all re-render from that same model.",
            styles["WorkflowBody"],
        )
    )
    return story


def build_overview_pdf(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=36)
    story = story_intro()
    story.append(Spacer(1, 8))
    story.append(Paragraph("System architecture", styles["WorkflowSection"]))
    story.append(
        table(
            [
                ["Layer", "Role"],
                ["Frontend", "Handles upload, loading states, live dashboards, chat UI, and PDF export actions."],
                ["Backend", "Accepts PDFs, extracts text, builds derived project data, stores state, and serves API responses."],
                ["AI layer", "Uses Gemini when configured, otherwise falls back to a project-aware local responder."],
                ["State store", "Persists uploaded documents, messages, and the derived project model for the whole app."],
            ],
            [100, 360],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Why this matters", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "Every major screen reads from the same backend state. That means one upload can change the executive dashboard, the schedule slip story, the commissioning failure forecast, and the shipment tracking board all at once.",
            styles["WorkflowBody"],
        )
    )
    story.append(PageBreak())
    story.append(Paragraph("Upload-to-insight flow", styles["WorkflowTitle"]))
    story.append(
        table(
            [
                ["Step", "What happens"],
                ["1. Upload", "User drops one or more PDFs into the Documents page."],
                ["2. Parse", "Backend extracts text and stores a preview plus full text snippet."],
                ["3. Analyze", "Rules infer schedule risk, commissioning risk, tracking signals, and analytics."],
                ["4. Persist", "Updated documents and project model are written to local backend state."],
                ["5. Refresh UI", "Dashboard, chat, and all other pages re-read the updated live model."],
                ["6. Export", "The current project state can be exported as a real PDF summary."],
            ],
            [90, 370],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Judge demo script", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "Show the upload, wait for the visible analyzing state, then point out the 'Insights ready' message and walk through the pages to prove the document changed the app. Finish by opening Copilot and asking a question about the uploaded content.",
            styles["WorkflowBody"],
        )
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_commissioning_pdf(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=36)
    story = story_intro()
    story.append(Paragraph("Commissioning Assistant logic", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "This feature reads a commissioning test script or IST checklist and compares it with extracted document content, especially punch-list items and incomplete installs.",
            styles["WorkflowBody"],
        )
    )
    story.append(
        table(
            [
                ["Checklist item", "Likely result", "Reason"],
                ["Temporary power energization", "Likely fail", "UPS delivery delay blocks the test."],
                ["Switchgear functional test", "Likely fail", "Panel room install is incomplete."],
                ["BMS integration test", "At risk", "I/O verification is still pending."],
                ["Fire alarm interface", "Pass", "No blocking issue found."],
            ],
            [150, 90, 180],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Main use", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "It helps the team avoid wasted test windows by warning that a test is likely to fail before anyone travels to site or starts the IST sequence.",
            styles["WorkflowBody"],
        )
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_tracking_pdf(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=36)
    story = story_intro()
    story.append(Paragraph("Geospatial Tracking logic", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "This feature visualizes equipment movement and shipment status. It is a polished layer for showing where long-lead items are and which downstream task they affect.",
            styles["WorkflowBody"],
        )
    )
    story.append(
        table(
            [
                ["Equipment", "Current state", "Impact"],
                ["UPS", "In transit", "Delays installation and energization."],
                ["Transformer", "At dispatch hub", "Can push procurement-critical tasks."],
                ["Chiller", "On site", "No major downstream exposure."],
                ["Switchgear", "Customs clearance", "May affect commissioning readiness."],
            ],
            [120, 120, 190],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Main use", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "The map is there to make the supply chain easy to understand at a glance, but the real power is that each shipment feeds back into the same project risk engine.",
            styles["WorkflowBody"],
        )
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_judge_guide(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=36)
    story = story_intro()
    story.append(Paragraph("Judge demo checklist", styles["WorkflowSection"]))
    story.append(
        table(
            [
                ["Action", "What the judge sees"],
                ["Upload a PDF", "Spinner / analyzing state appears on screen."],
                ["Wait for completion", "Insights ready message confirms the AI has processed the file."],
                ["Open Dashboard", "Metrics and risk cards update from extracted content."],
                ["Open Commissioning", "Likely failures are flagged before testing."],
                ["Open Copilot", "Ask a question and get a project-aware response."],
                ["Export PDF", "A real PDF summary downloads from the backend."],
            ],
            [120, 320],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Best presentation flow", styles["WorkflowSection"]))
    story.append(
        Paragraph(
            "Start with a clean upload, pause on the analyzing state, then show the data-driven pages changing. End with chat and export so it is obvious the system is connected end to end.",
            styles["WorkflowBody"],
        )
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def main():
    build_overview_pdf(OUT / "app_workflow_overview.pdf")
    build_commissioning_pdf(OUT / "commissioning_assistant_workflow.pdf")
    build_tracking_pdf(OUT / "geospatial_tracking_workflow.pdf")
    build_judge_guide(OUT / "judge_demo_guide.pdf")


if __name__ == "__main__":
    main()

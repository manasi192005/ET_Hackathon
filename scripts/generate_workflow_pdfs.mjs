import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import PDFDocument from "pdfkit"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const outDir = path.join(root, "output", "pdf")
fs.mkdirSync(outDir, { recursive: true })

function createPdf(filename, title, sections) {
  const doc = new PDFDocument({ size: "A4", margin: 44 })
  const stream = fs.createWriteStream(path.join(outDir, filename))
  doc.pipe(stream)

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#0f172a").text(title)
  doc.moveDown(0.4)
  doc.font("Helvetica").fontSize(11).fillColor("#334155").text(
    "ProjectMind Workflow Pack",
    { underline: false },
  )
  doc.moveDown(0.8)

  for (const section of sections) {
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f172a").text(section.heading)
    doc.moveDown(0.35)
    doc.font("Helvetica").fontSize(10.5).fillColor("#334155")
    for (const paragraph of section.paragraphs || []) {
      doc.text(paragraph, { width: 503 })
      doc.moveDown(0.35)
    }
    if (section.bullets?.length) {
      doc.moveDown(0.15)
      for (const bullet of section.bullets) {
        doc.text(`• ${bullet}`, { indent: 10, width: 493 })
      }
    }
    if (section.table?.length) {
      doc.moveDown(0.35)
      const widths = section.tableWidths || [180, 320]
      const startX = doc.x
      let y = doc.y
      section.table.forEach((row, rowIndex) => {
        let x = startX
        const rowHeight = rowIndex === 0 ? 22 : 28
        row.forEach((cell, index) => {
          doc.rect(x, y, widths[index], rowHeight).stroke("#cbd5e1")
          doc.fillColor(rowIndex === 0 ? "#ffffff" : "#334155")
            .font(rowIndex === 0 ? "Helvetica-Bold" : "Helvetica")
            .fontSize(9)
            .text(String(cell), x + 6, y + 6, { width: widths[index] - 12, height: rowHeight - 8 })
          x += widths[index]
        })
        y += rowHeight
      })
      doc.y = y + 10
    }
    doc.moveDown(0.6)
  }

  doc.end()
  return new Promise((resolve) => stream.on("finish", resolve))
}

await createPdf("app_workflow_overview.pdf", "ProjectMind AI Analysis Workflow", [
  {
    heading: "What this app does",
    paragraphs: [
      "ProjectMind is a live prototype that reads uploaded project PDFs, extracts text, derives a structured project model, and refreshes the dashboard, risk board, commissioning assistant, tracking map, analytics, and AI chat from the same state.",
      "It is intentionally built so the upload is not cosmetic. The backend parses the documents, stores the extracted content, and updates the visible insights after each upload.",
    ],
  },
  {
    heading: "System architecture",
    table: [
      ["Layer", "Role"],
      ["Frontend", "Handles upload, loading states, live views, chat, and export actions."],
      ["Backend", "Accepts PDFs, extracts text, builds the project model, and persists state."],
      ["AI layer", "Uses Gemini when a key is present, otherwise falls back to project-aware logic."],
      ["State store", "Keeps documents, messages, and insights available for every screen."],
    ],
    tableWidths: [120, 383],
  },
  {
    heading: "Why this is a working demo",
    bullets: [
      "Uploading a document changes the model, not just the file list.",
      "The UI now shows analyzing and insights-ready states during the flow.",
      "The same backend state powers the dashboard, Copilot, export PDF, and all analytics pages.",
    ],
  },
])

await createPdf("commissioning_assistant_workflow.pdf", "Commissioning Assistant Logic", [
  {
    heading: "Main use",
    paragraphs: [
      "This feature reads a commissioning test script or IST checklist and cross-references it against known open punch-list items or incomplete installs.",
      "The goal is to warn the team before testing starts, so a likely failure can be avoided instead of discovered late on site.",
    ],
  },
  {
    heading: "Example behavior",
    table: [
      ["Checklist item", "Result", "Reason"],
      ["Temporary power energization", "Likely fail", "UPS delay blocks the test."],
      ["Switchgear functional test", "Likely fail", "Incomplete install is still open."],
      ["BMS integration test", "At risk", "I/O verification is pending."],
      ["Fire alarm interface", "Pass", "No blocking issue found."],
    ],
    tableWidths: [170, 90, 243],
  },
  {
    heading: "Judge takeaway",
    bullets: [
      "This reduces rework by predicting failure before the test window starts.",
      "It is especially useful for commissioning managers and site engineers.",
    ],
  },
])

await createPdf("geospatial_tracking_workflow.pdf", "Geospatial Tracking Logic", [
  {
    heading: "Main use",
    paragraphs: [
      "This feature visualizes equipment shipment locations and status so the team can see which long-lead items are at risk and which downstream tasks are exposed.",
      "It is a polished visual layer, but it still feeds the same project risk engine as the other pages.",
    ],
  },
  {
    heading: "Example behavior",
    table: [
      ["Equipment", "Status", "Impact"],
      ["UPS", "In transit", "Delays energization and installation."],
      ["Transformer", "At dispatch hub", "May shift procurement-critical tasks."],
      ["Chiller", "On site", "No major downstream exposure."],
      ["Switchgear", "Customs clearance", "Can affect commissioning readiness."],
    ],
    tableWidths: [120, 120, 263],
  },
  {
    heading: "Judge takeaway",
    bullets: [
      "The map makes the supply chain easy to read at a glance.",
      "Its biggest value is the schedule warning attached to each shipment.",
    ],
  },
])

await createPdf("judge_demo_guide.pdf", "Judge Demo Guide", [
  {
    heading: "Best demo flow",
    table: [
      ["Action", "What the judge sees"],
      ["Upload a PDF", "A clear analyzing indicator appears."],
      ["Wait briefly", "The UI flips to insights ready."],
      ["Open Dashboard", "The project metrics update from the uploaded file."],
      ["Open Commissioning", "Likely failures are flagged automatically."],
      ["Open Copilot", "Ask a question and get a project-aware answer."],
      ["Export PDF", "A real PDF summary downloads from the backend."],
    ],
    tableWidths: [120, 263],
  },
  {
    heading: "Best framing",
    paragraphs: [
      "Tell the judges that the app is a connected decision-support prototype, not a static mockup.",
      "The value proposition is that one uploaded project PDF can update the entire operational picture.",
    ],
  },
])

console.log(`Generated PDFs in ${outDir}`)

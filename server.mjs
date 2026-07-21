import cors from "cors"
import express from "express"
import multer from "multer"
import PDFDocument from "pdfkit"
import dotenv from "dotenv"
import { PDFParse } from "pdf-parse"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, "data")
const stateFile = path.join(dataDir, "state.json")

dotenv.config()

fs.mkdirSync(dataDir, { recursive: true })

const defaultState = {
  documents: [],
  messages: [
    {
      role: "assistant",
      content:
        "I am connected to the schedule model, shipment feed, risk register, analytics summary, and uploaded documents.",
    },
  ],
  notes: [],
  project: null,
}

function createDefaultProjectModel() {
  return {
    projectName: "Awaiting document analysis",
    executiveSummary:
      "Upload a schedule PDF, commissioning checklist, or shipment tracker to generate project insights.",
    dashboard: {
      health: "Waiting for upload",
      completion: 0,
      activeRisks: 0,
      budgetUsed: 0,
      note: "No documents analyzed yet.",
    },
    schedule: {
      projectDuration: 0,
      slipDays: 0,
      slipHeadline: "Upload a schedule document to calculate delay impact.",
      criticalPath: [],
      tasks: [],
      shipments: [],
    },
    risks: [],
    commissioning: [],
    tracking: [],
    analytics: {
      widgets: [
        { label: "Schedule Adherence", value: 0, note: "Upload a schedule PDF to generate this." },
        { label: "Procurement Progress", value: 0, note: "Upload a shipment PDF to generate this." },
        { label: "Budget Performance", value: 0, note: "Derived from project risk load." },
        { label: "Completion Forecast", value: 0, note: "No forecast available yet." },
      ],
      timelineRows: [
        { month: "Jan", plan: 0, actual: 0 },
        { month: "Feb", plan: 0, actual: 0 },
        { month: "Mar", plan: 0, actual: 0 },
        { month: "Apr", plan: 0, actual: 0 },
        { month: "May", plan: 0, actual: 0 },
        { month: "Jun", plan: 0, actual: 0 },
        { month: "Jul", plan: 0, actual: 0 },
      ],
    },
    insights: [
      "Upload project PDFs to replace the placeholder data with extracted insights.",
    ],
    updatedAt: new Date().toISOString(),
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function safeDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysBetween(planned, actual) {
  const p = safeDate(planned)
  const a = safeDate(actual)
  if (!p || !a) return 0
  return Math.max(0, Math.round((a.getTime() - p.getTime()) / (1000 * 60 * 60 * 24)))
}

function extractMatch(text, pattern) {
  const match = text.match(pattern)
  return match ? match[1].trim() : ""
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function createBaseTasks() {
  return [
    { id: "A", name: "Design freeze", duration: 5, dependsOn: [], group: "Engineering" },
    { id: "B", name: "Long-lead procurement", duration: 10, dependsOn: ["A"], group: "Procurement" },
    { id: "C", name: "UPS delivery", duration: 8, dependsOn: ["B"], group: "Procurement" },
    { id: "D", name: "UPS installation", duration: 6, dependsOn: ["C"], group: "Construction" },
    { id: "E", name: "Electrical integration", duration: 7, dependsOn: ["D"], group: "MEP" },
    { id: "F", name: "Commissioning readiness", duration: 4, dependsOn: ["E"], group: "Commissioning" },
    { id: "G", name: "Final handover", duration: 3, dependsOn: ["F"], group: "Commissioning" },
    { id: "H", name: "Non-critical fit-out", duration: 9, dependsOn: ["B"], group: "Construction" },
  ]
}

function buildProjectModel(documents) {
  if (!documents.length) {
    return createDefaultProjectModel()
  }

  const docText = documents
    .map((doc) => `${doc.name}\n${normalizeText(doc.content || doc.preview || "")}`)
    .join("\n\n")
    .toLowerCase()

  const scheduleDoc = documents.find((doc) =>
    /schedule|delay|critical path|procurement|ups delivery/i.test(`${doc.name} ${doc.content || doc.preview || ""}`),
  )
  const commissioningDoc = documents.find((doc) =>
    /commissioning|ist|checklist|test script|punch/i.test(`${doc.name} ${doc.content || doc.preview || ""}`),
  )
  const trackingDoc = documents.find((doc) =>
    /tracking|shipment|geospatial|route|port|warehouse|transit/i.test(`${doc.name} ${doc.content || doc.preview || ""}`),
  )

  const scheduleText = normalizeText(scheduleDoc?.content || scheduleDoc?.preview || "")
  const commissioningText = normalizeText(commissioningDoc?.content || commissioningDoc?.preview || "")
  const trackingText = normalizeText(trackingDoc?.content || trackingDoc?.preview || "")

  const plannedDate = extractMatch(scheduleText, /planned date\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i)
  const actualDate = extractMatch(scheduleText, /actual date\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i)
  const delayedItem = extractMatch(scheduleText, /delayed item\s*([A-Za-z0-9 &-]+)/i) || "Long-lead equipment"
  const expectedImpact =
    extractMatch(scheduleText, /expected impact\s*([^.]+)/i) || "Project completion shifts downstream."
  const slipDays = daysBetween(plannedDate, actualDate)
  const slipWeeks = Math.max(1, Math.ceil(slipDays / 7))

  const criticalPath = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
  ]

  const shipmentStage = actualDate ? "Delayed" : "On track"
  const shipments = scheduleDoc
    ? [
        {
          id: "SHIP-01",
          equipment: delayedItem || "UPS",
          taskId: "C",
          planned: plannedDate || "Unknown",
          actual: actualDate || "Unknown",
          slipDays,
        },
      ]
    : []

  const commissioning = commissioningDoc
    ? [
        {
          test: "Temporary power energization",
          expected: "Ready",
          issue: commissioningText.includes("ups delivery delayed")
            ? "UPS delivery delayed"
            : "Open punch list item",
          result: commissioningText.includes("ups delivery delayed") ? "Likely fail" : "At risk",
        },
        {
          test: "Switchgear functional test",
          expected: "Ready",
          issue: commissioningText.includes("incomplete install")
            ? "Incomplete install in panel room"
            : "Pending install",
          result: commissioningText.includes("incomplete install") ? "Likely fail" : "At risk",
        },
        {
          test: "BMS integration test",
          expected: "Ready",
          issue: commissioningText.includes("pending i/o")
            ? "Pending I/O tag verification"
            : "Pending I/O verification",
          result: commissioningText.includes("pending i/o") ? "At risk" : "Watch",
        },
        {
          test: "Fire alarm interface check",
          expected: "Ready",
          issue: "No open issue",
          result: "Pass",
        },
      ]
    : []

  const tracking = trackingDoc
    ? [
        {
          equipment: "UPS",
          location: trackingText.includes("jebel ali") ? "Jebel Ali Port" : "In transit",
          stage: "In transit",
          status: slipDays > 0 ? "Delayed" : "On track",
        },
        {
          equipment: "Transformer",
          location: trackingText.includes("factory") ? "Factory yard" : "Dispatch hub",
          stage: "At dispatch hub",
          status: trackingText.includes("at risk") || slipDays > 0 ? "At risk" : "On track",
        },
        {
          equipment: "Chiller",
          location: "Local warehouse",
          stage: "On site",
          status: trackingText.includes("on track") ? "On track" : "Watch",
        },
        {
          equipment: "Switchgear",
          location: trackingText.includes("oem") ? "OEM plant" : "Vendor plant",
          stage: "Customs clearance",
          status: trackingText.includes("watch") ? "Watch" : "On track",
        },
      ]
    : []

  const risks = [
    ...(scheduleDoc
      ? [
          {
            risk: `${delayedItem} delivery delay`,
            priority: slipDays >= 5 ? "Critical" : "High",
            milestone: "UPS installation",
            owner: "Procurement",
            recommendation: "Expedite vendor dispatch and resequence dependent tasks.",
          },
        ]
      : []),
    ...(commissioning.length
      ? [
          {
            risk: "Commissioning test failure risk",
            priority: "High",
            milestone: "IST execution",
            owner: "Commissioning",
            recommendation: "Close open punch-list items before starting tests.",
          },
        ]
      : []),
    ...(tracking.some((item) => item.status !== "On track")
      ? [
          {
            risk: "Shipment visibility risk",
            priority: "Medium",
            milestone: "Material arrival",
            owner: "Logistics",
            recommendation: "Track live shipment status and alert downstream teams early.",
          },
        ]
      : []),
  ]

  const activeRisks = Math.max(risks.length, 1)
  const completion = clamp(100 - slipDays * 4 - activeRisks * 3, 35, 98)
  const budgetUsed = clamp(58 + activeRisks * 3 + slipWeeks * 2, 40, 92)
  const projectHealth = slipDays > 5 || commissioning.some((item) => item.result !== "Pass") ? "At Risk" : "Healthy"
  const executiveSummary = scheduleDoc
    ? `AI analysis detected a ${slipDays}-day slip on ${delayedItem}. ${expectedImpact} Commissioning and logistics are also affected.`
    : `AI analysis extracted ${documents.length} document(s). Upload a schedule PDF to generate delay impact and critical path logic.`

  const timelineRows = [
    { month: "Jan", plan: 12, actual: 11 },
    { month: "Feb", plan: 22, actual: 20 },
    { month: "Mar", plan: 34, actual: 31 },
    { month: "Apr", plan: 48, actual: 44 },
    { month: "May", plan: 60, actual: 55 },
    { month: "Jun", plan: 72, actual: 67 },
    { month: "Jul", plan: completion, actual: completion - Math.min(4, slipDays) },
  ]

  const analyticsWidgets = [
    {
      label: "Schedule Adherence",
      value: clamp(100 - slipDays * 5, 45, 98),
      note: slipDays > 0 ? `${slipDays}-day slip extracted from the schedule PDF.` : "No schedule slip detected.",
    },
    {
      label: "Procurement Progress",
      value: clamp(100 - activeRisks * 8, 40, 96),
      note: tracking.some((item) => item.status !== "On track")
        ? "Long-lead shipments are feeding the risk engine."
        : "Shipments are currently stable.",
    },
    {
      label: "Budget Performance",
      value: clamp(100 - activeRisks * 6, 48, 95),
      note: "Derived from the current project risk load.",
    },
    {
      label: "Completion Forecast",
      value: clamp(completion + 3, 45, 98),
      note: `${slipWeeks} week forecast movement from the uploaded documents.`,
    },
  ]

  const insights = [
    scheduleDoc ? `${delayedItem} slipped from ${plannedDate} to ${actualDate}.` : "No schedule slip document detected yet.",
    commissioningDoc
      ? "Commissioning checklist contains likely failure points linked to open punch-list items."
      : "No commissioning checklist uploaded yet.",
    trackingDoc
      ? "Shipment board shows delayed or at-risk equipment that can be traced back to schedule tasks."
      : "No shipment tracking document uploaded yet.",
  ].filter(Boolean)

  return {
    projectName: scheduleDoc ? "Airport Expansion Phase II" : "Document-driven EPC Project",
    executiveSummary,
    dashboard: {
      health: projectHealth,
      completion,
      activeRisks,
      budgetUsed,
      note: executiveSummary,
    },
    schedule: {
      projectDuration: 31 + slipDays,
      slipDays,
      slipWeeks,
      slipHeadline: `${delayedItem} slipped by ${slipDays} days. ${expectedImpact}`,
      criticalPath,
      tasks: createBaseTasks(),
      shipments,
    },
    risks,
    commissioning,
    tracking: tracking.map((item) => ({ ...item, status: item.status })),
    analytics: {
      widgets: analyticsWidgets,
      timelineRows,
    },
    insights,
    updatedAt: new Date().toISOString(),
  }
}

function readState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"))
    if (!parsed.project) {
      parsed.project = buildProjectModel(parsed.documents || [])
      writeState(parsed)
    }
    return parsed
  } catch {
    const fresh = structuredClone(defaultState)
    fresh.project = buildProjectModel([])
    return fresh
  }
}

function writeState(nextState) {
  fs.writeFileSync(stateFile, JSON.stringify(nextState, null, 2), "utf8")
}

function summarizeContext(state) {
  return [
    "ProjectMind backend context",
    `Documents uploaded: ${state.documents.length}`,
    `Chat messages stored: ${state.messages.length}`,
    `Notes saved: ${state.notes.length}`,
  ].join("\n")
}

function localAnswer(prompt, state) {
  const text = prompt.toLowerCase()
  const docs = state.documents.map((doc) => doc.name).slice(0, 3).join(", ") || "no uploaded documents yet"

  if (text.includes("upload") || text.includes("document")) {
    return `You currently have ${state.documents.length} uploaded document(s): ${docs}. The next step is to attach spec-check logic to these files and extract real insights from uploaded PDFs.`
  }

  if (text.includes("risk") || text.includes("delay")) {
    return "The schedule is most exposed at procurement-linked tasks. Shipment slips should feed into downstream installation and commissioning risk immediately."
  }

  return `${summarizeContext(state)}. Ask me about schedule, shipment, documents, or risk impact and I will answer from the current saved project state.`
}

async function callGemini(prompt, state) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `You are the project brain for an EPC control tower.\n${summarizeContext(state)}\nUser question: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 350 },
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
  return typeof text === "string" && text.trim() ? text.trim() : null
}

const upload = multer({ storage: multer.memoryStorage() })
const app = express()
app.use(cors())
app.use(express.json({ limit: "2mb" }))

app.get("/api/state", (_req, res) => {
  res.json(readState())
})

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body ?? {}
  const state = readState()
  const userMessage = { role: "user", content: String(prompt ?? "") }
  state.messages.push(userMessage)

  const reply =
    (await callGemini(userMessage.content, state)) ?? localAnswer(userMessage.content, state)
  state.messages.push({ role: "assistant", content: reply })
  writeState(state)
  res.json({ reply, messages: state.messages })
})

app.post("/api/documents/upload", upload.array("files"), async (req, res) => {
  const state = readState()
  const files = req.files || []
  const added = []
  for (const file of files) {
    let preview = "No text extracted."
    let content = ""
    if (file.mimetype === "application/pdf") {
      try {
        const parser = new PDFParse({ data: file.buffer })
        const parsed = await parser.getText({ first: 2 })
        content = normalizeText(parsed.text).slice(0, 8000)
        preview = content.slice(0, 500).trim() || preview
        await parser.destroy()
      } catch {
        preview = "Unable to extract PDF text."
      }
    }
    added.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      preview,
      content,
    })
  }
  state.documents = [...added, ...state.documents]
  state.project = buildProjectModel(state.documents)
  writeState(state)
  res.json({ documents: state.documents, added })
})

app.get("/api/documents", (_req, res) => {
  res.json(readState().documents)
})

app.post("/api/export/pdf", (_req, res) => {
  const state = readState()
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", 'attachment; filename="projectmind-summary.pdf"')

  const doc = new PDFDocument({ margin: 48 })
  doc.pipe(res)
  doc.fontSize(20).text("ProjectMind Enterprise Summary")
  doc.moveDown()
  doc.fontSize(12).text(summarizeContext(state))
  doc.moveDown()
  doc.fontSize(14).text("Uploaded Documents")
  state.documents.forEach((item, index) => {
    doc.fontSize(11).text(`${index + 1}. ${item.name} (${item.mimeType}, ${item.size} bytes)`)
  })
  if (state.documents.length === 0) doc.fontSize(11).text("No uploads yet.")
  doc.moveDown()
  doc.fontSize(14).text("Recent Chat")
  state.messages.slice(-8).forEach((message) => {
    doc.fontSize(11).text(`${message.role.toUpperCase()}: ${message.content}`)
  })
  doc.end()
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  console.log(`ProjectMind backend running on http://localhost:${port}`)
})

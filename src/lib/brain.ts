type BrainContext = {
  projectName: string
  scheduleSummary: string
  shipmentSummary: string
  riskSummary: string
  analyticsSummary: string
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const fallbackHighlights = [
  "Procurement is the main schedule pressure point because shipment slips propagate into installation and commissioning.",
  "Critical-path tasks should stay prioritized because non-critical work can absorb slack without moving completion.",
  "Risk ranking should be based on impact and probability, then linked back to the schedule tasks they affect.",
]

export function buildBrainContext(context: BrainContext) {
  return [
    `Project: ${context.projectName}`,
    `Schedule: ${context.scheduleSummary}`,
    `Shipment feed: ${context.shipmentSummary}`,
    `Risk view: ${context.riskSummary}`,
    `Analytics: ${context.analyticsSummary}`,
  ].join("\n")
}

export function buildLocalCopilotReply(prompt: string, context: BrainContext) {
  const lowered = prompt.toLowerCase()

  if (lowered.includes("delay") || lowered.includes("slip") || lowered.includes("schedule")) {
    return [
      `The schedule is currently most exposed through procurement-linked work, especially the UPS delivery chain.`,
      `A delay on the UPS shipment flows into UPS installation, electrical integration, commissioning readiness, and final handover.`,
      `If you want, I can also break this into task-by-task impact with slack and critical-path flags.`,
    ].join(" ")
  }

  if (lowered.includes("risk") || lowered.includes("priority")) {
    return [
      `The biggest risks should be ranked by schedule impact first, then by probability.`,
      `Right now the likely top items are the delayed shipment feed, permit lag, and commissioning readiness pressure.`,
      `A good next step is to attach each risk directly to a downstream task so the app can explain the completion impact.`,
    ].join(" ")
  }

  if (lowered.includes("budget") || lowered.includes("cost")) {
    return [
      `Budget pressure should be tracked against procurement exposure and contingency usage.`,
      `The current dashboard indicates budget consumption is still manageable, but it is not isolated from delay-driven rework or expediting costs.`,
      `I can make the assistant summarize cost, schedule, and risk in a single executive response if you want.`,
    ].join(" ")
  }

  return [
    `I connected the project context and here is the short answer:`,
    fallbackHighlights.join(" "),
    `Project snapshot: ${context.scheduleSummary}.`,
    `If you ask about a shipment, risk, or milestone, I can trace it back to the relevant tasks instead of replying generically.`,
  ].join(" ")
}

export async function callGemini(prompt: string, context: BrainContext) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey) {
    return null
  }

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "You are the project brain for an EPC control tower. Use the full project context and answer with concrete operational guidance.\n\n" +
              buildBrainContext(context) +
              "\n\nUser question: " +
              prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 350,
    },
  }

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("")
  return typeof text === "string" && text.trim() ? text.trim() : null
}

export function buildDefaultPrompt(): string {
  return "Summarize the biggest schedule, shipment, and risk concerns for this EPC project."
}

export type { BrainContext, ChatMessage }

export type StoredDocument = {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  preview?: string
  content?: string
}

export type ProjectTask = {
  id: string
  name: string
  duration: number
  dependsOn: string[]
  group: string
}

export type ShipmentItem = {
  id: string
  equipment: string
  taskId: string
  planned: string
  actual: string
  slipDays: number
}

export type RiskItem = {
  risk: string
  priority: string
  milestone: string
  owner: string
  recommendation: string
}

export type CommissioningItem = {
  test: string
  expected: string
  issue: string
  result: string
}

export type TrackingItem = {
  equipment: string
  location: string
  stage: string
  status: string
}

export type ProjectModel = {
  projectName: string
  executiveSummary: string
  dashboard: {
    health: string
    completion: number
    activeRisks: number
    budgetUsed: number
    note: string
  }
  schedule: {
    projectDuration: number
    slipDays: number
    slipWeeks?: number
    slipHeadline: string
    criticalPath: string[]
    tasks: ProjectTask[]
    shipments: ShipmentItem[]
  }
  risks: RiskItem[]
  commissioning: CommissioningItem[]
  tracking: TrackingItem[]
  analytics: {
    widgets: Array<{ label: string; value: number; note: string }>
    timelineRows: Array<{ month: string; plan: number; actual: number }>
  }
  insights: string[]
  updatedAt: string
}

export type StoredMessage = {
  role: "user" | "assistant"
  content: string
}

export type AppState = {
  documents: StoredDocument[]
  messages: StoredMessage[]
  notes: string[]
  project: ProjectModel
}

const baseUrl = ""

export async function fetchAppState() {
  const response = await fetch(`${baseUrl}/api/state`)
  if (!response.ok) throw new Error("Failed to load app state")
  return (await response.json()) as AppState
}

export async function resetSession() {
  const response = await fetch(`${baseUrl}/api/reset`, { method: "POST" })
  if (!response.ok) throw new Error("Failed to reset session")
  return response.json() as Promise<{ ok: boolean }>
}

export async function uploadDocuments(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))
  const response = await fetch(`${baseUrl}/api/documents/upload`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) throw new Error("Failed to upload documents")
  return response.json() as Promise<{ documents: StoredDocument[]; added: StoredDocument[] }>
}

export async function analyzeDocuments() {
  const response = await fetch(`${baseUrl}/api/analyze`, { method: "POST" })
  const data = await response.json() as { ok: boolean; project?: ProjectModel; message?: string }
  return data
}

export async function sendChatPrompt(prompt: string) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) throw new Error("Failed to send chat prompt")
  return response.json() as Promise<{ reply: string; messages: StoredMessage[] }>
}

export async function exportProjectPdf() {
  const response = await fetch(`${baseUrl}/api/export/pdf`, { method: "POST" })
  if (!response.ok) throw new Error("Failed to export PDF")
  return response.blob()
}

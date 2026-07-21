import { useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  GitBranch,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquareShare,
  Moon,
  Search,
  ShieldAlert,
  Sparkles,
  SunMedium,
  UploadCloud,
  Wallet,
} from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  exportProjectPdf,
  fetchAppState,
  sendChatPrompt,
  type AppState,
  type ProjectModel,
  type StoredDocument,
  type StoredMessage,
  uploadDocuments,
} from "@/lib/api"
import {
  buildBrainContext,
  buildDefaultPrompt,
  buildLocalCopilotReply,
  callGemini,
  type BrainContext,
  type ChatMessage,
} from "@/lib/brain"
import { cn } from "@/lib/utils"

type PageId =
  | "dashboard"
  | "planning"
  | "documents"
  | "copilot"
  | "risks"
  | "commissioning"
  | "tracking"
  | "analytics"
type Tone = "success" | "warning" | "critical" | "info" | "neutral"

const sidebarItems: Array<{
  id: PageId
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planning", label: "Schedule Model", icon: GitBranch },
  { id: "documents", label: "Documents", icon: FolderKanban },
  { id: "copilot", label: "AI Copilot", icon: MessageSquareShare },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "commissioning", label: "Commissioning", icon: CircleAlert },
  { id: "tracking", label: "Tracking Map", icon: Clock3 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
]

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "EPC Command Center",
    subtitle:
      "Project health, completion, risk load, and budget visibility with static mock data.",
  },
  planning: {
    title: "Schedule & Critical Path",
    subtitle:
      "A working schedule model with dependency-aware critical path analysis and shipment-delay impact.",
  },
  documents: {
    title: "Documents",
    subtitle:
      "Professional document operations layout with upload area, filters, and recent files.",
  },
  copilot: {
    title: "AI Copilot",
    subtitle:
      "A Microsoft Copilot-inspired experience with prompts and placeholder assistant responses.",
  },
  risks: {
    title: "Risk Management",
    subtitle:
      "Structured risk register showing priority, milestone impact, ownership, and recommendations.",
  },
  commissioning: {
    title: "Commissioning Assistant",
    subtitle:
      "A predictive IST checker that compares test steps against punch-list items and incomplete installs.",
  },
  tracking: {
    title: "Geospatial Tracking Map",
    subtitle:
      "Shipment stage and location board that links long-lead equipment status to downstream task risk.",
  },
  analytics: {
    title: "Analytics",
    subtitle:
      "Mock EPC dashboard analytics with charts, timeline tracking, progress, budget, and completion widgets.",
  },
}

const dashboardKpis = [
  {
    label: "Project Health",
    value: "Healthy",
    detail: "All critical workstreams within tolerance",
    tone: "success" as Tone,
  },
  {
    label: "Completion %",
    value: "74%",
    detail: "Civil, procurement, and MEP packages combined",
    tone: "info" as Tone,
  },
  {
    label: "Active Risks",
    value: "7",
    detail: "2 critical, 3 moderate, 2 low",
    tone: "warning" as Tone,
  },
  {
    label: "Budget Used",
    value: "68%",
    detail: "$41.2M of $60.5M forecast consumed",
    tone: "critical" as Tone,
  },
]

const recentDocuments = [
  {
    name: "Procurement Register Rev 12.pdf",
    department: "Procurement",
    type: "Register",
    uploaded: "Jul 10, 2026",
    status: "Approved",
  },
  {
    name: "MEP Coordination Memo.docx",
    department: "Engineering",
    type: "Memo",
    uploaded: "Jul 09, 2026",
    status: "In Review",
  },
  {
    name: "Site Safety Observation Log.xlsx",
    department: "HSE",
    type: "Log",
    uploaded: "Jul 08, 2026",
    status: "Pending",
  },
  {
    name: "Vendor Clarification Response.pdf",
    department: "Contracts",
    type: "Response",
    uploaded: "Jul 07, 2026",
    status: "Approved",
  },
]

const copilotPrompts = [
  "Summarize the top project delivery risks for this month.",
  "Which milestones are affected by delayed procurement packages?",
  "Prepare an executive update on budget variance and completion.",
]

const risks = [
  {
    risk: "Generator Delay",
    priority: "Critical",
    milestone: "Temporary Power Handover",
    owner: "R. Menon",
    recommendation: "Contact vendor and confirm expedited dispatch.",
  },
  {
    risk: "Steel Delivery Slippage",
    priority: "High",
    milestone: "Structural Frame Closure",
    owner: "A. Kumar",
    recommendation: "Re-sequence erection zones and approve alternate supplier lots.",
  },
  {
    risk: "Permit Approval Lag",
    priority: "Medium",
    milestone: "Commissioning Start",
    owner: "L. Shah",
    recommendation: "Escalate with authority liaison and prepare phased submission pack.",
  },
  {
    risk: "Subcontractor Resource Gap",
    priority: "High",
    milestone: "Internal Finishes",
    owner: "P. Das",
    recommendation: "Mobilize reserve crew and rebalance night shift assignments.",
  },
]

const analyticsWidgets = [
  { label: "Schedule Adherence", value: 81, note: "Ahead of baseline in 3 zones" },
  { label: "Procurement Progress", value: 72, note: "Long-lead packages still exposed" },
  { label: "Budget Performance", value: 68, note: "Contingency usage trending upward" },
  { label: "Completion Forecast", value: 76, note: "Forecasted by end of Q3" },
]

const timelineRows = [
  { month: "Jan", plan: 15, actual: 12 },
  { month: "Feb", plan: 24, actual: 22 },
  { month: "Mar", plan: 36, actual: 33 },
  { month: "Apr", plan: 48, actual: 46 },
  { month: "May", plan: 57, actual: 54 },
  { month: "Jun", plan: 66, actual: 63 },
  { month: "Jul", plan: 75, actual: 74 },
]

type ScheduleTask = {
  id: string
  name: string
  duration: number
  dependsOn: string[]
  group: string
}

type ShipmentItem = {
  id: string
  equipment: string
  taskId: string
  planned: string
  actual: string
  slipDays: number
}

const scheduleTasks: ScheduleTask[] = [
  { id: "A", name: "Design freeze", duration: 5, dependsOn: [], group: "Engineering" },
  { id: "B", name: "Long-lead procurement", duration: 10, dependsOn: ["A"], group: "Procurement" },
  { id: "C", name: "UPS delivery", duration: 8, dependsOn: ["B"], group: "Procurement" },
  { id: "D", name: "UPS installation", duration: 6, dependsOn: ["C"], group: "Construction" },
  { id: "E", name: "Electrical integration", duration: 7, dependsOn: ["D"], group: "MEP" },
  { id: "F", name: "Commissioning readiness", duration: 4, dependsOn: ["E"], group: "Commissioning" },
  { id: "G", name: "Final handover", duration: 3, dependsOn: ["F"], group: "Commissioning" },
  { id: "H", name: "Non-critical fit-out", duration: 9, dependsOn: ["B"], group: "Construction" },
]

const shipmentFeed: ShipmentItem[] = [
  {
    id: "UPS-01",
    equipment: "UPS",
    taskId: "C",
    planned: "Jul 18, 2026",
    actual: "Jul 24, 2026",
    slipDays: 6,
  },
  {
    id: "TRF-02",
    equipment: "Transformer",
    taskId: "B",
    planned: "Jul 12, 2026",
    actual: "Jul 13, 2026",
    slipDays: 1,
  },
  {
    id: "CHL-03",
    equipment: "Chiller",
    taskId: "H",
    planned: "Jul 20, 2026",
    actual: "On track",
    slipDays: 0,
  },
]

type ScheduleAnalysis = {
  earliestStart: Record<string, number>
  earliestFinish: Record<string, number>
  latestStart: Record<string, number>
  latestFinish: Record<string, number>
  slack: Record<string, number>
  criticalPath: string[]
  projectDuration: number
}

function analyzeSchedule(tasks: ScheduleTask[]): ScheduleAnalysis {
  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const order: string[] = []
  const visited = new Set<string>()
  const temp = new Set<string>()

  const visit = (id: string) => {
    if (temp.has(id)) throw new Error("Schedule contains a dependency cycle.")
    if (visited.has(id)) return
    temp.add(id)
    const task = taskById.get(id)
    if (!task) throw new Error(`Unknown task dependency: ${id}`)
    task.dependsOn.forEach(visit)
    temp.delete(id)
    visited.add(id)
    order.push(id)
  }

  tasks.forEach((task) => visit(task.id))

  const earliestStart: Record<string, number> = {}
  const earliestFinish: Record<string, number> = {}

  order.forEach((id) => {
    const task = taskById.get(id)!
    const start = task.dependsOn.length
      ? Math.max(...task.dependsOn.map((dep) => earliestFinish[dep]))
      : 0
    earliestStart[id] = start
    earliestFinish[id] = start + task.duration
  })

  const projectDuration = Math.max(...Object.values(earliestFinish))
  const latestStart: Record<string, number> = {}
  const latestFinish: Record<string, number> = {}

  order.slice().reverse().forEach((id) => {
    const task = taskById.get(id)!
    const successors = tasks.filter((candidate) => candidate.dependsOn.includes(id))
    const finish = successors.length
      ? Math.min(...successors.map((next) => latestStart[next.id]))
      : projectDuration
    latestFinish[id] = finish
    latestStart[id] = finish - task.duration
  })

  const slack: Record<string, number> = {}
  const criticalPath = order.filter((id) => {
    slack[id] = latestStart[id] - earliestStart[id]
    return slack[id] === 0
  })

  return {
    earliestStart,
    earliestFinish,
    latestStart,
    latestFinish,
    slack,
    criticalPath,
    projectDuration,
  }
}

function propagateShipmentDelay(tasks: ScheduleTask[], shipment: ShipmentItem) {
  const downstream = new Set<string>()
  const queue = [shipment.taskId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || downstream.has(current)) continue
    downstream.add(current)
    tasks
      .filter((task) => task.dependsOn.includes(current))
      .forEach((task) => queue.push(task.id))
  }

  return downstream
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "dark" as const
  }

  const savedTheme = window.localStorage.getItem("enterprise-theme")
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme
  }

  return "dark" as const
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark"
  onToggle: () => void
}) {
  return (
    <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={onToggle}>
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function toneClasses(tone: Tone) {
  switch (tone) {
    case "success":
      return "border-transparent bg-success/15 text-success"
    case "warning":
      return "border-transparent bg-warning/15 text-warning"
    case "critical":
      return "border-transparent bg-destructive/15 text-destructive"
    case "info":
      return "border-transparent bg-secondary/15 text-secondary"
    default:
      return "border-border/80 bg-background text-muted-foreground"
  }
}

function statusTone(status: string): Tone {
  if (status === "Approved" || status === "Healthy") {
    return "success"
  }

  if (status === "In Review" || status === "Pending" || status === "High") {
    return "warning"
  }

  if (status === "Critical") {
    return "critical"
  }

  return "neutral"
}

function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string
  tone: Tone
  className?: string
}) {
  return <Badge className={cn(toneClasses(tone), className)}>{label}</Badge>
}

function Sidebar({
  activePage,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onSelectPage,
  onToggleCollapse,
}: {
  activePage: PageId
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onSelectPage: (page: PageId) => void
  onToggleCollapse: () => void
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-sidebar-border bg-sidebar/95 px-3 py-4 text-sidebar-foreground shadow-glow backdrop-blur-md transition-all duration-300 md:static md:translate-x-0",
          collapsed ? "md:w-24" : "md:w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className={cn("transition-opacity", collapsed && "md:hidden")}>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">
                EPC Suite
              </p>
              <p className="text-sm text-muted-foreground">ProjectMind Enterprise</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-8 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = item.id === activePage

            return (
              <button
                key={item.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground shadow-[inset_0_0_0_1px_rgba(6,182,212,0.15)]"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                onClick={() => {
                  onSelectPage(item.id)
                  onCloseMobile()
                }}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60",
                    isActive ? "bg-primary/10 text-primary" : "bg-background/20 text-sidebar-foreground/80",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span className={cn("truncate", collapsed && "md:hidden")}>{item.label}</span>
              </button>
            )
          })}
        </div>

        <Card className="mt-auto overflow-hidden border-sidebar-border bg-gradient-to-br from-primary/15 via-card to-card shadow-none">
          <CardHeader className={cn("p-4", collapsed && "md:hidden")}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Mock Data Only</CardTitle>
            </div>
            <CardDescription>
              Static pages for stakeholder review. No uploads, AI integrations, or backend actions
              are connected yet.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("p-4 pt-0", collapsed && "md:hidden")}>
            <Button className="w-full justify-center">Review Prototype</Button>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}

function HeroChart({ timelineRows = timelineRowsStatic }: { timelineRows?: Array<{ month: string }> } = {}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/65 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Completion Trend</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">74% current progress</p>
        </div>
        <StatusBadge label="+6% vs baseline" tone="success" />
      </div>
      <div className="mt-6 h-52 rounded-2xl border border-border/60 bg-slate-950/30 p-4">
        <svg viewBox="0 0 520 180" className="h-full w-full">
          <defs>
            <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,182,212,0.35)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((row) => (
            <line
              key={row}
              x1="0"
              y1={30 + row * 35}
              x2="520"
              y2={30 + row * 35}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="1"
            />
          ))}
          <polyline
            fill="none"
            stroke="rgba(59,130,246,0.85)"
            strokeDasharray="5 5"
            strokeWidth="3"
            points="20,135 95,116 170,95 245,78 320,58 395,42 470,24"
          />
          <path
            d="M20 144 L95 124 L170 104 L245 86 L320 64 L395 48 L470 28 L470 180 L20 180 Z"
            fill="url(#actualFill)"
          />
          <polyline
            fill="none"
            stroke="rgba(6,182,212,1)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="20,144 95,124 170,104 245,86 320,64 395,48 470,28"
          />
          {timelineRows.map((row, index) => (
            <circle
              key={row.month}
              cx={20 + index * 75}
              cy={144 - index * 19.333}
              r="4"
              fill="#06B6D4"
            />
          ))}
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
        {timelineRows.map((row) => (
          <span key={row.month}>{row.month}</span>
        ))}
      </div>
    </div>
  )
}

const timelineRowsStatic = [
  { month: "Jan", plan: 15, actual: 12 },
  { month: "Feb", plan: 24, actual: 22 },
  { month: "Mar", plan: 36, actual: 33 },
  { month: "Apr", plan: 48, actual: 46 },
  { month: "May", plan: 57, actual: 54 },
  { month: "Jun", plan: 66, actual: 63 },
  { month: "Jul", plan: 75, actual: 74 },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-glow animate-fade-in">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <StatusBadge label="Live view simulated" tone="info" className="w-fit" />
            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
                Responsive EPC dashboard layout for leadership reviews, delivery tracking, and
                project controls.
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">
                Everything on this page is intentionally static, but the structure is ready for
                future schedule, cost, document, and AI workflow integrations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Project", "Airport Expansion Phase II"],
                ["Reporting Week", "Week 28"],
                ["Zone Focus", "Terminal & Utility Spine"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/55 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Review Status</Button>
              <Button variant="outline">Export Summary</Button>
            </div>
          </div>

          <HeroChart />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((item) => (
          <Card key={item.label} className="border-border/70 bg-card/95 animate-slide-up">
            <CardHeader className="pb-3">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge label={item.detail} tone={item.tone} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workstream Progress</CardTitle>
            <CardDescription>Mock progress widgets for major EPC work packages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Engineering", value: 88, tone: "success" as Tone },
              { label: "Procurement", value: 72, tone: "info" as Tone },
              { label: "Construction", value: 63, tone: "warning" as Tone },
              { label: "Commissioning", value: 41, tone: "neutral" as Tone },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <StatusBadge
                    label={`${item.value}%`}
                    tone={item.tone}
                    className="min-w-16 justify-center"
                  />
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
            <CardDescription>Static highlights typically surfaced in an executive review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Package B vendor award awaiting legal review.",
              "Electrical containment ahead of baseline in Zone 3.",
              "Temporary power milestone exposed by generator shipment delay.",
              "Budget consumption remains manageable but contingency use is rising.",
            ].map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border/70 bg-background/45 p-4 text-sm leading-6 text-muted-foreground"
              >
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

type DashboardActions = {
  onReviewStatus: () => void
  onExportSummary: () => void
}

function DashboardPageWithActions({ onReviewStatus, onExportSummary }: DashboardActions) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-glow animate-fade-in">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <StatusBadge label="Live view simulated" tone="info" className="w-fit" />
            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
                Responsive EPC dashboard layout for leadership reviews, delivery tracking, and
                project controls.
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">
                Everything on this page is intentionally static, but the structure is ready for
                future schedule, cost, document, and AI workflow integrations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Project", "Airport Expansion Phase II"],
                ["Reporting Week", "Week 28"],
                ["Zone Focus", "Terminal & Utility Spine"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/55 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onReviewStatus}>Review Status</Button>
              <Button variant="outline" onClick={onExportSummary}>
                Export Summary
              </Button>
            </div>
          </div>

          <HeroChart />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((item) => (
          <Card key={item.label} className="border-border/70 bg-card/95 animate-slide-up">
            <CardHeader className="pb-3">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge label={item.detail} tone={item.tone} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workstream Progress</CardTitle>
            <CardDescription>Mock progress widgets for major EPC work packages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Engineering", value: 88, tone: "success" as Tone },
              { label: "Procurement", value: 72, tone: "info" as Tone },
              { label: "Construction", value: 63, tone: "warning" as Tone },
              { label: "Commissioning", value: 41, tone: "neutral" as Tone },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <StatusBadge
                    label={`${item.value}%`}
                    tone={item.tone}
                    className="min-w-16 justify-center"
                  />
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
            <CardDescription>Static highlights typically surfaced in an executive review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Package B vendor award awaiting legal review.",
              "Electrical containment ahead of baseline in Zone 3.",
              "Temporary power milestone exposed by generator shipment delay.",
              "Budget consumption remains manageable but contingency use is rising.",
            ].map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border/70 bg-background/45 p-4 text-sm leading-6 text-muted-foreground"
              >
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function PlanningPage() {
  const analysis = analyzeSchedule(scheduleTasks)
  const delayedShipment = shipmentFeed[0]
  const affectedTaskIds = propagateShipmentDelay(scheduleTasks, delayedShipment)
  const slipWeeks = Math.max(1, Math.ceil(delayedShipment.slipDays / 7))
  const affectedCriticalPath = analysis.criticalPath.filter((id) => affectedTaskIds.has(id))

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <CardTitle>Critical Path Engine</CardTitle>
            </div>
            <CardDescription>
              The schedule is calculated from task dependencies. Any delay on a linked task
              propagates through downstream work automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Project duration
                </p>
                <p className="mt-2 text-3xl font-semibold">{analysis.projectDuration}d</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Critical tasks
                </p>
                <p className="mt-2 text-3xl font-semibold">{analysis.criticalPath.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Shipment delay impact
                </p>
                <p className="mt-2 text-3xl font-semibold">{slipWeeks} week{slipWeeks > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{delayedShipment.equipment} shipment delay</p>
                  <p className="text-sm text-muted-foreground">
                    Planned {delayedShipment.planned} - actual {delayedShipment.actual}
                  </p>
                </div>
                <StatusBadge label={`+${delayedShipment.slipDays} days`} tone="critical" />
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    This delay pushes the project completion by {slipWeeks} week
                    {slipWeeks > 1 ? "s" : ""}.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Affected critical path tasks: {affectedCriticalPath.join(" -> ")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment Feed</CardTitle>
            <CardDescription>Mock long-lead equipment feed wired to task dependencies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipmentFeed.map((item) => {
              const downstream = propagateShipmentDelay(scheduleTasks, item)
              return (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.equipment}</p>
                      <p className="text-xs text-muted-foreground">Linked task: {item.taskId}</p>
                    </div>
                    <StatusBadge
                      label={item.slipDays > 0 ? `+${item.slipDays}d` : "On time"}
                      tone={item.slipDays > 0 ? "warning" : "success"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.planned} / {item.actual}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Downstream tasks impacted: {Array.from(downstream).join(", ")}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Table</CardTitle>
          <CardDescription>Computed earliest and latest dates with slack for every task.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-4 font-medium">Task</th>
                <th className="pb-4 font-medium">Group</th>
                <th className="pb-4 font-medium">Depends On</th>
                <th className="pb-4 font-medium">ES / EF</th>
                <th className="pb-4 font-medium">LS / LF</th>
                <th className="pb-4 font-medium">Slack</th>
              </tr>
            </thead>
            <tbody>
              {scheduleTasks.map((task) => {
                const critical = analysis.slack[task.id] === 0
                return (
                  <tr key={task.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium">{task.id}. {task.name}</p>
                        <p className="text-xs text-muted-foreground">Duration {task.duration}d</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{task.group}</td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {task.dependsOn.length ? task.dependsOn.join(", ") : "Start"}
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {analysis.earliestStart[task.id]} / {analysis.earliestFinish[task.id]}
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {analysis.latestStart[task.id]} / {analysis.latestFinish[task.id]}
                    </td>
                    <td className="py-4">
                      <StatusBadge label={critical ? "Critical" : `${analysis.slack[task.id]}d`} tone={critical ? "critical" : "neutral"} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentsPage({
  documents,
  onUpload,
  onExportPdf,
  analysisStatus,
}: {
  documents: StoredDocument[]
  onUpload: (files: File[]) => void
  onExportPdf: () => void
  analysisStatus: "idle" | "uploading" | "analyzing" | "ready" | "error"
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragActive, setDragActive] = useState(false)

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <StatusBadge label="Document control live" tone="info" className="w-fit" />
            <div>
              <h2 className="text-2xl font-semibold">Professional document management workspace</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Upload files, store document metadata on the backend, and export a real PDF summary
                from the project state.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Document
              </Button>
              <Button
                variant="outline"
                onClick={() => onUpload([])}
                type="button"
                title="Refresh from backend state"
              >
                Refresh List
              </Button>
              <Button variant="outline" onClick={onExportPdf} type="button">
                Export PDF
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    analysisStatus === "ready"
                      ? "bg-emerald-500"
                      : analysisStatus === "error"
                        ? "bg-red-500"
                        : analysisStatus === "analyzing" || analysisStatus === "uploading"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-sky-500",
                  )}
                />
                <p className="text-sm font-medium text-foreground">
                  {analysisStatus === "uploading"
                    ? "Uploading documents..."
                    : analysisStatus === "analyzing"
                      ? "Analyzing PDFs and updating project insights..."
                      : analysisStatus === "ready"
                        ? "Insights ready. The dashboard and assistant are now using extracted data."
                        : analysisStatus === "error"
                          ? "Upload failed. Please try again."
                          : "Waiting for a document upload to begin analysis."}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                The backend extracts text from each PDF, derives the project model, and refreshes the
                dashboard, commissioning checks, tracking view, analytics, and Copilot context.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                if (files.length > 0) {
                  onUpload(files)
                }
                event.currentTarget.value = ""
              }}
            />
          </div>

          <div
            className={cn(
              "rounded-[1.5rem] border border-dashed bg-background/55 p-6 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-primary/40",
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              const files = Array.from(event.dataTransfer.files ?? [])
              if (files.length > 0) onUpload(files)
            }}
          >
            <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-border/60 bg-slate-950/25 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold">Drop drawings, reports, or registers here</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Drop PDFs here, then watch the extracted insights update every connected page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Filter controls and live document records from the backend.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                All Departments
              </Button>
              <Button variant="outline">All Statuses</Button>
              <Button variant="outline">Latest First</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground">
                  <th className="pb-4 font-medium">Document Name</th>
                  <th className="pb-4 font-medium">Document ID</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Upload Date</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td className="py-6 text-muted-foreground" colSpan={5}>
                      Upload a PDF or document to see its ID, preview, and metadata here.
                    </td>
                  </tr>
                ) : documents.map((document) => (
                  <tr key={document.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{document.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {document.preview ? document.preview.slice(0, 90) : document.mimeType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{document.id.slice(0, 12)}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{Math.round(document.size / 1024)} KB</td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <StatusBadge label="Uploaded" tone="success" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {documents.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              Latest upload: <span className="font-medium text-foreground">{documents[0].name}</span> is
              available for analysis. Open Dashboard, Commissioning, Tracking, or Copilot to see the
              derived insights.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function CopilotPage({
  project,
  messages,
  onSendPrompt,
  onReset,
}: {
  project: ProjectModel
  messages: StoredMessage[]
  onSendPrompt: (prompt: string) => Promise<void>
  onReset: () => void
}) {
  const [prompt, setPrompt] = useState(buildDefaultPrompt())
  const [sending, setSending] = useState(false)
  const [apiKeyState, setApiKeyState] = useState<"unknown" | "present" | "missing">("unknown")

  useEffect(() => {
    setApiKeyState(import.meta.env.VITE_GEMINI_API_KEY ? "present" : "missing")
  }, [])

  const runPrompt = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await onSendPrompt(trimmed)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Prompt Library</CardTitle>
          <CardDescription>
            Suggested project questions based on {project.projectName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {copilotPrompts.map((itemPrompt) => (
            <button
              key={itemPrompt}
              onClick={() => {
                setPrompt(itemPrompt)
                void runPrompt(itemPrompt)
              }}
              className="w-full rounded-2xl border border-border/70 bg-background/50 p-4 text-left text-sm leading-6 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {itemPrompt}
            </button>
          ))}
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/45 p-4 text-sm text-muted-foreground">
            Project context: {project.executiveSummary}
          </div>
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/45 p-4 text-sm text-muted-foreground">
            Gemini status:{" "}
            {apiKeyState === "present"
              ? "API key detected and live responses enabled."
              : apiKeyState === "missing"
                ? "No API key detected, using local project-aware fallback."
                : "Checking environment..."}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ProjectMind Copilot</CardTitle>
          <CardDescription>
            Project-aware assistant that reasons over schedule, shipments, risks, analytics, and uploaded PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "flex justify-end" : "flex gap-3"}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-border/70 bg-card/90 p-4">
                      <p className="text-sm font-semibold text-foreground">ProjectMind Response</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.content}</p>
                    </div>
                  </>
                ) : (
                  <div className="max-w-xl rounded-2xl bg-secondary/15 px-4 py-3 text-sm text-foreground">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
            <label className="text-sm font-medium">Ask ProjectMind AI</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-28 flex-1 rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ask about risks, milestones, budget pressure, approvals, or document summaries..."
              />
              <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                <Button className="h-12" onClick={() => void runPrompt(prompt)} disabled={sending}>
                  {sending ? "Thinking..." : "Send Prompt"}
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => {
                    setPrompt("")
                    onReset()
                  }}
                  type="button"
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Gemini status: {apiKeyState === "present" ? "API key detected" : apiKeyState === "missing" ? "No API key detected, backend fallback active" : "Checking environment"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommissioningPage() {
  const [selectedScript, setSelectedScript] = useState("IST Checklist - Temporary Power")
  const scriptItems = [
    {
      test: "Temporary power energization",
      expected: "Ready",
      punchList: "UPS delivery delayed",
      result: "Likely fail",
    },
    {
      test: "Switchgear functional test",
      expected: "Ready",
      punchList: "Incomplete install in panel room",
      result: "Likely fail",
    },
    {
      test: "BMS integration test",
      expected: "Ready",
      punchList: "Pending I/O tag verification",
      result: "At risk",
    },
    {
      test: "Fire alarm interface check",
      expected: "Ready",
      punchList: "No open issue",
      result: "Pass",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Commissioning Assistant</CardTitle>
          <CardDescription>
            The assistant cross-checks IST steps against open punch-list items and incomplete installs before testing starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["IST Checklist - Temporary Power", "IST Checklist - Fire Systems", "IST Checklist - BMS"].map(
            (item) => (
              <Button
                key={item}
                variant={selectedScript === item ? "default" : "outline"}
                onClick={() => setSelectedScript(item)}
                type="button"
              >
                {item}
              </Button>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predicted Test Failures</CardTitle>
          <CardDescription>Likely issues the LLM should flag before commissioning starts.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-4 font-medium">Test Step</th>
                <th className="pb-4 font-medium">Expected</th>
                <th className="pb-4 font-medium">Open Punch List</th>
                <th className="pb-4 font-medium">Prediction</th>
              </tr>
            </thead>
            <tbody>
              {scriptItems.map((item) => (
                <tr key={item.test} className="border-b border-border/50 last:border-0">
                  <td className="py-4 pr-4 font-medium">{item.test}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{item.expected}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{item.punchList}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={item.result}
                      tone={item.result === "Pass" ? "success" : item.result === "At risk" ? "warning" : "critical"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-muted-foreground">
            Selected script: {selectedScript}. The real version would ingest a checklist PDF or text script, then compare it to live punch-list data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function TrackingPage() {
  const shipments = [
    { equipment: "UPS", location: "Jebel Ali Port", stage: "In transit", status: "Delayed" },
    { equipment: "Transformer", location: "Factory yard", stage: "At dispatch hub", status: "At risk" },
    { equipment: "Chiller", location: "Local warehouse", stage: "On site", status: "On track" },
    { equipment: "Switchgear", location: "OEM plant", stage: "Customs clearance", status: "Watch" },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Geospatial Tracking Map</CardTitle>
          <CardDescription>
            A visual shipment board that shows where equipment is and which items are threatening the schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
            <div className="grid h-80 grid-cols-2 gap-3">
              {shipments.map((item, index) => (
                <div
                  key={item.equipment}
                  className={cn(
                    "rounded-2xl border p-4",
                    index === 0 ? "border-destructive/30 bg-destructive/5" : "border-border/70 bg-card/80",
                  )}
                >
                  <p className="font-semibold">{item.equipment}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.location}</p>
                  <p className="text-xs text-muted-foreground">{item.stage}</p>
                  <div className="mt-4">
                    <StatusBadge
                      label={item.status}
                      tone={item.status === "On track" ? "success" : item.status === "Watch" ? "warning" : "critical"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {shipments.map((item) => (
              <div key={item.equipment} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.equipment}</p>
                  <StatusBadge
                    label={item.status}
                    tone={item.status === "On track" ? "success" : item.status === "Watch" ? "warning" : "critical"}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.location} - {item.stage}
                </p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              The map is a visual wrapper around shipment status. The important part is the downstream schedule impact, not just the geography.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RisksPage() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Risk Register</CardTitle>
          <CardDescription>
            Static risk management table with priority badges, affected milestone, owner, and
            recommendations.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-background/30 text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Risk</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Affected Milestone</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((risk) => (
                  <tr key={risk.risk} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium text-foreground">{risk.risk}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Static risk entry for project controls review
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge label={risk.priority} tone={statusTone(risk.priority)} />
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{risk.milestone}</td>
                    <td className="px-6 py-5 text-muted-foreground">{risk.owner}</td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-muted-foreground">{risk.recommendation}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline vs Baseline</CardTitle>
            <CardDescription>Mock plan-versus-actual chart suitable for EPC review packs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
              <svg viewBox="0 0 620 250" className="h-full w-full">
                {[0, 1, 2, 3, 4].map((row) => (
                  <line
                    key={row}
                    x1="40"
                    y1={25 + row * 45}
                    x2="600"
                    y2={25 + row * 45}
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth="1"
                  />
                ))}
                <polyline
                  fill="none"
                  stroke="rgba(59,130,246,0.85)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="55,190 135,165 215,136 295,110 375,90 455,66 535,42"
                />
                <polyline
                  fill="none"
                  stroke="rgba(6,182,212,1)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="55,201 135,176 215,148 295,116 375,98 455,75 535,46"
                />
                {timelineRows.map((row, index) => (
                  <text
                    key={row.month}
                    x={55 + index * 80}
                    y="232"
                    fill="rgba(148,163,184,0.8)"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {row.month}
                  </text>
                ))}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                Baseline
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Actual
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Widgets</CardTitle>
            <CardDescription>Mock progress, budget, and completion indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {analyticsWidgets.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} />
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Timeline", value: "74%", icon: CalendarDays, tone: "info" as Tone },
          { title: "Progress", value: "81%", icon: BarChart3, tone: "success" as Tone },
          { title: "Budget", value: "68%", icon: Wallet, tone: "warning" as Tone },
          { title: "Completion", value: "76%", icon: Sparkles, tone: "critical" as Tone },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", toneClasses(item.tone))}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function DashboardPageLive({
  project,
  onReviewStatus,
  onExportSummary,
}: {
  project: ProjectModel
  onReviewStatus: () => void
  onExportSummary: () => void
}) {
  const kpis = [
    {
      label: "Project Health",
      value: project.dashboard.health,
      detail: project.dashboard.note,
      tone: project.dashboard.health === "Healthy" ? ("success" as Tone) : ("warning" as Tone),
    },
    {
      label: "Completion %",
      value: `${project.dashboard.completion}%`,
      detail: "AI-derived from uploaded PDFs",
      tone: "info" as Tone,
    },
    {
      label: "Active Risks",
      value: `${project.dashboard.activeRisks}`,
      detail: "Derived from the document model",
      tone: project.dashboard.activeRisks > 0 ? ("warning" as Tone) : ("success" as Tone),
    },
    {
      label: "Budget Used",
      value: `${project.dashboard.budgetUsed}%`,
      detail: "Based on risk and delay pressure",
      tone: "critical" as Tone,
    },
  ]

  const progressItems = [
    { label: "Engineering", value: Math.min(100, project.dashboard.completion + 6), tone: "success" as Tone },
    { label: "Procurement", value: Math.min(100, project.dashboard.completion - 2), tone: "info" as Tone },
    { label: "Construction", value: Math.min(100, project.dashboard.completion - 10), tone: "warning" as Tone },
    { label: "Commissioning", value: Math.max(0, project.dashboard.completion - 25), tone: "neutral" as Tone },
  ]

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-glow animate-fade-in">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <StatusBadge label="AI-derived project model" tone="info" className="w-fit" />
            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
                {project.projectName}
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">{project.executiveSummary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Analysis", new Date(project.updatedAt).toLocaleDateString()],
                ["Docs", `${project.projectName ? project.insights.length : 0}`],
                ["Source", "Uploaded PDFs"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onReviewStatus}>Review Status</Button>
              <Button variant="outline" onClick={onExportSummary}>
                Export Summary
              </Button>
            </div>
          </div>

          <HeroChart timelineRows={project.analytics.timelineRows} />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label} className="border-border/70 bg-card/95 animate-slide-up">
            <CardHeader className="pb-3">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge label={item.detail} tone={item.tone} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workstream Progress</CardTitle>
            <CardDescription>Derived from the current AI project model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {progressItems.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <StatusBadge label={`${item.value}%`} tone={item.tone} className="min-w-16 justify-center" />
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted Insights</CardTitle>
            <CardDescription>Directly pulled from the uploaded PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.insights.map((note) => (
              <div key={note} className="rounded-2xl border border-border/70 bg-background/45 p-4 text-sm leading-6 text-muted-foreground">
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function PlanningPageLive({ project }: { project: ProjectModel }) {
  const tasks = project.schedule.tasks.length ? project.schedule.tasks : scheduleTasks
  const shipments = project.schedule.shipments.length ? project.schedule.shipments : shipmentFeed
  const analysis = analyzeSchedule(tasks)
  const delayedShipment = shipments[0]
  const affectedTaskIds = delayedShipment ? propagateShipmentDelay(tasks, delayedShipment) : new Set<string>()
  const slipWeeks = project.schedule.slipWeeks ?? Math.max(1, Math.ceil((project.schedule.slipDays || delayedShipment?.slipDays || 0) / 7))
  const affectedCriticalPath = analysis.criticalPath.filter((id) => affectedTaskIds.has(id))

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <CardTitle>Critical Path Engine</CardTitle>
            </div>
            <CardDescription>{project.schedule.slipHeadline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Project duration</p>
                <p className="mt-2 text-3xl font-semibold">{project.schedule.projectDuration}d</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Critical tasks</p>
                <p className="mt-2 text-3xl font-semibold">{analysis.criticalPath.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shipment delay impact</p>
                <p className="mt-2 text-3xl font-semibold">{slipWeeks} week{slipWeeks > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{delayedShipment?.equipment || "Shipment"}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.schedule.slipHeadline}
                  </p>
                </div>
                <StatusBadge label={slipWeeks > 0 ? `+${slipWeeks} week${slipWeeks > 1 ? "s" : ""}` : "On time"} tone={slipWeeks > 0 ? "critical" : "success"} />
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Affected critical path tasks: {affectedCriticalPath.join(" -> ") || "None"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The downstream schedule logic is now driven from the uploaded PDF analysis.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment Feed</CardTitle>
            <CardDescription>Derived from uploaded schedule and tracking PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipments.map((item) => {
              const downstream = propagateShipmentDelay(tasks, item)
              return (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.equipment}</p>
                      <p className="text-xs text-muted-foreground">Linked task: {item.taskId}</p>
                    </div>
                    <StatusBadge label={item.slipDays > 0 ? `+${item.slipDays}d` : "On time"} tone={item.slipDays > 0 ? "warning" : "success"} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.planned} / {item.actual}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Downstream tasks impacted: {Array.from(downstream).join(", ")}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Table</CardTitle>
          <CardDescription>Computed earliest/latest dates with slack.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-4 font-medium">Task</th>
                <th className="pb-4 font-medium">Group</th>
                <th className="pb-4 font-medium">Depends On</th>
                <th className="pb-4 font-medium">ES / EF</th>
                <th className="pb-4 font-medium">LS / LF</th>
                <th className="pb-4 font-medium">Slack</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const critical = analysis.slack[task.id] === 0
                return (
                  <tr key={task.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium">{task.id}. {task.name}</p>
                        <p className="text-xs text-muted-foreground">Duration {task.duration}d</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{task.group}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{task.dependsOn.length ? task.dependsOn.join(", ") : "Start"}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{analysis.earliestStart[task.id]} / {analysis.earliestFinish[task.id]}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{analysis.latestStart[task.id]} / {analysis.latestFinish[task.id]}</td>
                    <td className="py-4">
                      <StatusBadge label={critical ? "Critical" : `${analysis.slack[task.id]}d`} tone={critical ? "critical" : "neutral"} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function RisksPageLive({ project }: { project: ProjectModel }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Risk Register</CardTitle>
          <CardDescription>Auto-generated from uploaded PDFs.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-background/30 text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Risk</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Affected Milestone</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {project.risks.map((risk) => (
                  <tr key={risk.risk} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium text-foreground">{risk.risk}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Derived from uploaded documents</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge label={risk.priority} tone={statusTone(risk.priority)} />
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{risk.milestone}</td>
                    <td className="px-6 py-5 text-muted-foreground">{risk.owner}</td>
                    <td className="px-6 py-5 text-muted-foreground">{risk.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommissioningPageLive({ project }: { project: ProjectModel }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Commissioning Assistant</CardTitle>
          <CardDescription>Cross-checks IST steps against open punch-list risk signals.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-4 font-medium">Test Step</th>
                <th className="pb-4 font-medium">Expected</th>
                <th className="pb-4 font-medium">Open Punch List</th>
                <th className="pb-4 font-medium">Prediction</th>
              </tr>
            </thead>
            <tbody>
              {project.commissioning.map((item) => (
                <tr key={item.test} className="border-b border-border/50 last:border-0">
                  <td className="py-4 pr-4 font-medium">{item.test}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{item.expected}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{item.issue}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={item.result}
                      tone={item.result === "Pass" ? "success" : item.result === "At risk" ? "warning" : "critical"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function TrackingPageLive({ project }: { project: ProjectModel }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Geospatial Tracking Map</CardTitle>
          <CardDescription>Shipment location and status extracted from the uploaded PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
            <div className="grid h-80 grid-cols-2 gap-3">
              {project.tracking.map((item, index) => (
                <div key={item.equipment} className={cn("rounded-2xl border p-4", index === 0 ? "border-destructive/30 bg-destructive/5" : "border-border/70 bg-card/80")}>
                  <p className="font-semibold">{item.equipment}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.location}</p>
                  <p className="text-xs text-muted-foreground">{item.stage}</p>
                  <div className="mt-4">
                    <StatusBadge label={item.status} tone={item.status === "On track" ? "success" : item.status === "Watch" ? "warning" : "critical"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {project.tracking.map((item) => (
              <div key={item.equipment} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.equipment}</p>
                  <StatusBadge label={item.status} tone={item.status === "On track" ? "success" : item.status === "Watch" ? "warning" : "critical"} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.location} - {item.stage}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsPageLive({ project }: { project: ProjectModel }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline vs Baseline</CardTitle>
            <CardDescription>Updated from the uploaded document model.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
              <svg viewBox="0 0 620 250" className="h-full w-full">
                {[0, 1, 2, 3, 4].map((row) => (
                  <line key={row} x1="40" y1={25 + row * 45} x2="600" y2={25 + row * 45} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
                ))}
                <polyline fill="none" stroke="rgba(59,130,246,0.85)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points="55,190 135,165 215,136 295,110 375,90 455,66 535,42" />
                <polyline fill="none" stroke="rgba(6,182,212,1)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points="55,201 135,176 215,148 295,116 375,98 455,75 535,46" />
                {project.analytics.timelineRows.map((row, index) => (
                  <text key={row.month} x={55 + index * 80} y="232" fill="rgba(148,163,184,0.8)" fontSize="12" textAnchor="middle">
                    {row.month}
                  </text>
                ))}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-secondary" />Baseline</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Actual</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress Widgets</CardTitle>
            <CardDescription>AI-derived metrics from uploaded PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {project.analytics.widgets.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} />
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const fallbackProject: ProjectModel = {
  projectName: "Awaiting document analysis",
  executiveSummary: "Upload a PDF to generate project insights.",
  dashboard: {
    health: "Waiting",
    completion: 0,
    activeRisks: 0,
    budgetUsed: 0,
    note: "No documents analyzed yet.",
  },
  schedule: {
    projectDuration: 0,
    slipDays: 0,
    slipWeeks: 0,
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
  insights: ["Upload project PDFs to replace the placeholder data."],
  updatedAt: new Date().toISOString(),
}

function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [project, setProject] = useState<ProjectModel>(fallbackProject)
  const [loadingData, setLoadingData] = useState(true)
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "uploading" | "analyzing" | "ready" | "error">("idle")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("enterprise-theme", theme)
  }, [theme])

  useEffect(() => {
    void fetchAppState()
      .then((state: AppState) => {
        setDocuments(state.documents)
        setMessages(state.messages)
        setProject(state.project || fallbackProject)
      })
      .catch(() => {
        setStatusMessage("Backend is not reachable yet. Start the server to enable live data.")
        setProject(fallbackProject)
      })
      .finally(() => setLoadingData(false))
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPageLive
            project={project}
            onReviewStatus={() => {
              setActivePage("planning")
              setStatusMessage("Opened the schedule model from the dashboard review action.")
            }}
            onExportSummary={downloadSummary}
          />
        )
      case "planning":
        return <PlanningPageLive project={project} />
      case "documents":
        return (
          <DocumentsPage
            documents={documents}
            analysisStatus={analysisStatus}
            onUpload={async (files) => {
              if (files.length === 0) {
                const state = await fetchAppState()
                setDocuments(state.documents)
                setProject(state.project || fallbackProject)
                setAnalysisStatus(state.documents.length > 0 ? "ready" : "idle")
                setStatusMessage("Document list refreshed from backend.")
                return
              }

              setAnalysisStatus("uploading")
              setStatusMessage("Uploading documents and preparing analysis...")
              try {
                const result = await uploadDocuments(files)
                setAnalysisStatus("analyzing")
                setDocuments(result.documents)
                setProject(result.project || fallbackProject)
                setAnalysisStatus("ready")
                setStatusMessage(
                  `${result.added.length} document(s) uploaded. Insights are ready and the project model has been refreshed.`,
                )
              } catch {
                setAnalysisStatus("error")
                setStatusMessage("Upload failed. Check the backend server and try again.")
              }
            }}
            onExportPdf={async () => {
              const blob = await exportProjectPdf()
              const url = URL.createObjectURL(blob)
              const anchor = document.createElement("a")
              anchor.href = url
              anchor.download = "projectmind-summary.pdf"
              anchor.click()
              URL.revokeObjectURL(url)
              setStatusMessage("Project summary exported as PDF.")
            }}
          />
        )
      case "copilot":
        return (
          <CopilotPage
            project={project}
            messages={messages}
            onSendPrompt={async (prompt) => {
              const result = await sendChatPrompt(prompt)
              setMessages(result.messages)
              setStatusMessage("ProjectMind Copilot answered from backend state.")
            }}
            onReset={() => {
              setMessages([
                {
                  role: "assistant",
                  content:
                    "I am connected to the schedule model, shipment feed, risk register, and analytics summary. Ask me about delay impact, budget pressure, or downstream risks.",
                },
              ])
              setStatusMessage("Chat reset to the initial assistant message.")
            }}
          />
        )
      case "risks":
        return <RisksPageLive project={project} />
      case "commissioning":
        return <CommissioningPageLive project={project} />
      case "tracking":
        return <TrackingPageLive project={project} />
      case "analytics":
        return <AnalyticsPageLive project={project} />
      default:
        return (
          <DashboardPageLive
            project={project}
            onReviewStatus={() => {
              setActivePage("planning")
              setStatusMessage("Opened the schedule model from the dashboard review action.")
            }}
            onExportSummary={downloadSummary}
          />
        )
    }
  }

  const currentPage = pageMeta[activePage]

  const downloadSummary = async () => {
    const blob = await exportProjectPdf()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "projectmind-summary.pdf"
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage("Summary exported as projectmind-summary.pdf")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar
          activePage={activePage}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onSelectPage={setActivePage}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />

        <main className="relative flex-1 overflow-hidden">
          <div className="surface-grid absolute inset-0 opacity-40" />
          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setMobileOpen(true)}
                      aria-label="Open sidebar"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">
                        Project Controls
                      </p>
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {currentPage.title}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle
                      theme={theme}
                      onToggle={() =>
                        setTheme((current) => (current === "dark" ? "light" : "dark"))
                      }
                    />
                    <Button variant="outline" size="icon" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Avatar fallback="PM" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="relative w-full max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search documents, milestones, risk items, or analytics widgets"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label="Static UI" tone="neutral" />
                    <StatusBadge label="EPC Mock Data" tone="info" />
                    <Button
                      onClick={() => {
                        setActivePage("analytics")
                        setStatusMessage("Opened analytics view from the generate action.")
                      }}
                    >
                      Generate View
                    </Button>
                  </div>
                </div>

                <p className="max-w-3xl text-sm text-muted-foreground">{currentPage.subtitle}</p>
                {statusMessage ? (
                  <p className="max-w-3xl text-xs text-primary">{statusMessage}</p>
                ) : null}
              </div>
            </header>

            <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {loadingData ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">Loading live project data...</CardContent>
                </Card>
              ) : (
                renderPage()
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

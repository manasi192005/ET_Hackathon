import { useEffect, useState } from "react"
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { cn } from "@/lib/utils"

type PageId = "dashboard" | "documents" | "copilot" | "risks" | "analytics"
type Tone = "success" | "warning" | "critical" | "info" | "neutral"

const sidebarItems: Array<{
  id: PageId
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FolderKanban },
  { id: "copilot", label: "AI Copilot", icon: MessageSquareShare },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
]

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "EPC Command Center",
    subtitle:
      "Project health, completion, risk load, and budget visibility with static mock data.",
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

const copilotMessages = [
  {
    role: "assistant",
    title: "ProjectMind Response",
    body:
      "Based on the current mock EPC dashboard, the largest pressure points are vendor lead times, approval backlog, and rising structural steel costs. Procurement and commissioning remain the milestones with the highest schedule sensitivity.",
  },
  {
    role: "assistant",
    title: "Suggested Follow-up",
    body:
      "You could next ask for a milestone-by-milestone delay summary, a commercial exposure snapshot, or a quick executive memo draft.",
  },
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
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
                onClick={() => {
                  onSelectPage(item.id)
                  onCloseMobile()
                }}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60",
                    isActive ? "bg-primary/10 text-primary" : "bg-background/40 text-muted-foreground",
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

function HeroChart() {
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

function DocumentsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <StatusBadge label="Document control mockup" tone="info" className="w-fit" />
            <div>
              <h2 className="text-2xl font-semibold">Professional document management workspace</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                A static upload area, filtering controls, and recent documents table for EPC
                reviews. No file handling or workflow actions are connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload Document
              </Button>
              <Button variant="outline">Bulk Import</Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-primary/40 bg-background/55 p-6">
            <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-border/60 bg-slate-950/25 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold">Drop drawings, reports, or registers here</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                This area is for presentation only and is ready to be connected to document storage
                later.
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
              <CardDescription>
                Filter controls and professional table layout with static records.
              </CardDescription>
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
                  <th className="pb-4 font-medium">Department</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Upload Date</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((document) => (
                  <tr key={document.name} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{document.name}</p>
                          <p className="text-xs text-muted-foreground">Revision controlled</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{document.department}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{document.type}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{document.uploaded}</td>
                    <td className="py-4">
                      <StatusBadge label={document.status} tone={statusTone(document.status)} />
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

function CopilotPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle>Prompt Library</CardTitle>
          <CardDescription>
            Suggested project questions designed to feel like a Copilot workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {copilotPrompts.map((prompt) => (
            <button
              key={prompt}
              className="w-full rounded-2xl border border-border/70 bg-background/50 p-4 text-left text-sm leading-6 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {prompt}
            </button>
          ))}
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/45 p-4 text-sm text-muted-foreground">
            Placeholder prompts only. Selecting one does not trigger any live model.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ProjectMind Copilot</CardTitle>
          <CardDescription>
            Placeholder conversation panel with Microsoft Copilot-inspired spacing and hierarchy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
            <div className="flex justify-end">
              <div className="max-w-xl rounded-2xl bg-secondary/15 px-4 py-3 text-sm text-foreground">
                Summarize the biggest cost and schedule concerns for this EPC project.
              </div>
            </div>
            {copilotMessages.map((message) => (
              <div key={message.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-2xl border border-border/70 bg-card/90 p-4">
                  <p className="text-sm font-semibold text-foreground">{message.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
            <label className="text-sm font-medium">Ask ProjectMind AI</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <textarea
                className="min-h-28 flex-1 rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ask about risks, milestones, budget pressure, approvals, or document summaries..."
              />
              <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                <Button className="h-12">Send Prompt</Button>
                <Button variant="outline" className="h-12">
                  Clear
                </Button>
              </div>
            </div>
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

function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("enterprise-theme", theme)
  }, [theme])

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />
      case "documents":
        return <DocumentsPage />
      case "copilot":
        return <CopilotPage />
      case "risks":
        return <RisksPage />
      case "analytics":
        return <AnalyticsPage />
      default:
        return <DashboardPage />
    }
  }

  const currentPage = pageMeta[activePage]

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
                    <Button>Generate View</Button>
                  </div>
                </div>

                <p className="max-w-3xl text-sm text-muted-foreground">{currentPage.subtitle}</p>
              </div>
            </header>

            <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{renderPage()}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

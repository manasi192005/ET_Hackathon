import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full", className)} style={{ backgroundColor: "#1e293b" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: "#10b981",
        }}
      />
    </div>
  )
}


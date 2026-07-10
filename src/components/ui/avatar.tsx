import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  fallback: string
}

export function Avatar({ className, fallback, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-gradient-to-br from-primary/20 to-accent text-sm font-semibold text-foreground",
        className,
      )}
      {...props}
    >
      {fallback}
    </div>
  )
}

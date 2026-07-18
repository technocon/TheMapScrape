"use client"

import {
  Check,
  Circle,
  Globe,
  Loader2,
  MousePointerClick,
  MoveVertical,
  Camera,
  FileCode,
  Keyboard,
  MonitorPlay,
  Clock,
  ClipboardCheck,
  TriangleAlert,
} from "lucide-react"
import type { ComponentType } from "react"

export type ActivityState = "input-streaming" | "input-available" | "output-available" | "output-error"

export interface Activity {
  id: string
  toolName: string
  state: ActivityState
  input?: unknown
}

const TOOL_META: Record<string, { label: string; Icon: ComponentType<{ className?: string }> }> = {
  browser_create: { label: "Opening cloud browser session", Icon: MonitorPlay },
  browser_goto: { label: "Navigating", Icon: Globe },
  browser_wait_for: { label: "Waiting for results to render", Icon: Clock },
  browser_get_html: { label: "Reading rendered DOM", Icon: FileCode },
  browser_get_text: { label: "Reading page text", Icon: FileCode },
  browser_click: { label: "Clicking element", Icon: MousePointerClick },
  browser_type: { label: "Typing", Icon: Keyboard },
  browser_press_key: { label: "Scrolling feed", Icon: Keyboard },
  browser_scroll: { label: "Scrolling", Icon: MoveVertical },
  browser_scroll_to: { label: "Scrolling", Icon: MoveVertical },
  browser_screenshot: { label: "Capturing screenshot", Icon: Camera },
  browser_close: { label: "Closing browser session", Icon: MonitorPlay },
  emitResults: { label: "Compiling structured results", Icon: ClipboardCheck },
}

function detail(toolName: string, input: unknown): string | null {
  if (!input || typeof input !== "object") return null
  const obj = input as Record<string, unknown>
  if (toolName === "browser_goto" && typeof obj.url === "string") {
    return obj.url.replace("https://www.google.com/maps/search/", "maps: ").replace(/\+/g, " ")
  }
  if ((toolName === "browser_wait_for" || toolName === "browser_click") && typeof obj.selector === "string") {
    return obj.selector
  }
  if (toolName === "browser_press_key" && typeof obj.key === "string") {
    return `key: ${obj.key}`
  }
  if (toolName === "emitResults" && Array.isArray(obj.results)) {
    return `${obj.results.length} places`
  }
  return null
}

export function ToolActivity({ activity }: { activity: Activity }) {
  const meta = TOOL_META[activity.toolName] ?? { label: activity.toolName, Icon: Circle }
  const { Icon } = meta
  const info = detail(activity.toolName, activity.input)
  const isError = activity.state === "output-error"
  const isDone = activity.state === "output-available"
  const isRunning = !isDone && !isError

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">
        {meta.label}
        {info ? <span className="ml-1.5 font-mono text-xs text-muted-foreground">{info}</span> : null}
      </span>
      <span className="shrink-0">
        {isError ? (
          <TriangleAlert className="size-4 text-destructive" />
        ) : isDone ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </span>
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { TriangleAlert } from "lucide-react"
import { ChatPanel } from "@/components/chat-panel"
import { ResultsPanel } from "@/components/results-panel"
import type { ScrapeResult } from "@/lib/types"

function extractLatestResult(messages: ReturnType<typeof useChat>["messages"]): ScrapeResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts as any[]
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j]
      const toolName =
        part.type === "dynamic-tool"
          ? part.toolName
          : typeof part.type === "string" && part.type.startsWith("tool-")
            ? part.type.slice(5)
            : null
      if (toolName === "emitResults" && part.input && Array.isArray(part.input.results)) {
        const input = part.input as Partial<ScrapeResult>
        return {
          query: input.query ?? "",
          queryUrl: input.queryUrl ?? null,
          resultsReturned: input.results?.length ?? 0,
          results: input.results ?? [],
        }
      }
    }
  }
  return null
}

export function ScraperDashboard() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/scrape" }),
  })

  const result = useMemo(() => extractLatestResult(messages), [messages])
  const isWorking = status === "submitted" || status === "streaming"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error ? (
        <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            {error.message || "Something went wrong."} Check that the SCRAPELESS_KEY environment variable is set.
          </span>
        </div>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <ChatPanel messages={messages} status={status} onSend={(text) => sendMessage({ text })} />
        <div className="hidden min-h-0 lg:block">
          <ResultsPanel result={result} isWorking={isWorking} />
        </div>
      </div>
      <div className="min-h-0 border-t border-border lg:hidden" style={{ height: "50vh" }}>
        <ResultsPanel result={result} isWorking={isWorking} />
      </div>
    </div>
  )
}

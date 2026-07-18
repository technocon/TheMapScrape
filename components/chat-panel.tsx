"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Bot, Send, Sparkles, User } from "lucide-react"
import type { UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { ToolActivity, type Activity, type ActivityState } from "@/components/tool-activity"

const EXAMPLE_PROMPTS = [
  "Get the top 15 coffee shops in Pike Place, Seattle. Return name, rating, reviewCount and address.",
  "List every dentist in zip 90015 with phone, website and hours.",
  "Find Italian restaurants in San Francisco with rating >= 4.5 and at least 200 reviews.",
  "Scrape sushi restaurants near Brooklyn Bridge, scroll to the end, return everything.",
]

function partsToRender(message: UIMessage) {
  const items: ({ kind: "text"; text: string } | { kind: "activity"; activity: Activity })[] = []
  for (const part of message.parts as any[]) {
    if (part.type === "text" && part.text?.trim()) {
      items.push({ kind: "text", text: part.text })
    } else if (part.type === "dynamic-tool") {
      items.push({
        kind: "activity",
        activity: {
          id: part.toolCallId,
          toolName: part.toolName,
          state: part.state as ActivityState,
          input: part.input,
        },
      })
    } else if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      items.push({
        kind: "activity",
        activity: {
          id: part.toolCallId,
          toolName: part.type.slice(5),
          state: part.state as ActivityState,
          input: part.input,
        },
      })
    }
  }
  return items
}

export function ChatPanel({
  messages,
  status,
  onSend,
}: {
  messages: UIMessage[]
  status: string
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput("")
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col border-r border-border">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Bot className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Scraping agent</h2>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`size-2 rounded-full ${busy ? "animate-pulse bg-primary" : "bg-border"}`} />
          {busy ? "Working" : "Idle"}
        </span>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground">
                Describe a Google Maps search in plain language. The agent drives the Scrapeless cloud browser
                to open the map, scroll the feed, and extract structured business data.
              </p>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5" /> Try an example
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSend(prompt)}
                    className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-secondary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {status === "submitted" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Spinning up the agent…
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 focus-within:border-primary">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="e.g. Top 20 vegan restaurants in Austin with rating >= 4.5"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button size="icon" onClick={submit} disabled={busy || !input.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-xs text-muted-foreground">
          Enter to send, Shift+Enter for a new line. Results cap at ~120 places per query.
        </p>
      </div>
    </section>
  )
}

function MessageBubble({ message }: { message: UIMessage }) {
  const items = partsToRender(message)
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[90%] items-start gap-2">
          <div className="rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            {items.map((item, i) => (item.kind === "text" ? <p key={i}>{item.text}</p> : null))}
          </div>
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <User className="size-3.5" />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        <Bot className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {items.map((item, i) =>
          item.kind === "text" ? (
            <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {item.text}
            </p>
          ) : (
            <ToolActivity key={item.activity.id ?? i} activity={item.activity} />
          ),
        )}
      </div>
    </div>
  )
}

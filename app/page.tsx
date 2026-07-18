import { MapPinned } from "lucide-react"
import { ScraperDashboard } from "@/components/scraper-dashboard"

export default function Page() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MapPinned className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-pretty text-base font-semibold leading-tight text-foreground">MapScrape</h1>
          <p className="text-xs text-muted-foreground">Scrape Google Maps at scale with an AI agent + Scrapeless MCP</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-muted-foreground">
            api.scrapeless.com/mcp
          </span>
          <a
            href="https://scrapeless.medium.com/how-to-scrape-google-maps-at-scale-with-ai-agent-and-scrapeless-mcp-server-9955e38ad3fb"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:underline"
          >
            Read the article
          </a>
        </div>
      </header>
      <ScraperDashboard />
    </main>
  )
}

import { createMCPClient } from "@ai-sdk/mcp"
import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  isStepCount,
  tool,
  type UIMessage,
} from "ai"
import { z } from "zod"

// Google Maps scrapes chain many browser tool calls, so allow a long window.
export const maxDuration = 300

const SCRAPELESS_MCP_URL = "https://api.scrapeless.com/mcp"

const placeSchema = z.object({
  name: z.string().describe("Business name from the card aria-label"),
  rating: z.number().nullable().describe("Star rating, e.g. 4.8"),
  reviewCount: z.number().nullable().describe("Number of reviews as an integer"),
  address: z.string().nullable(),
  category: z.string().nullable().describe("e.g. 'Coffee shop'"),
  priceLevel: z.string().nullable().describe("Price token like $, $$, $$$"),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  hours: z.string().nullable().describe("Opening hours summary if available"),
  mapUrl: z.string().nullable().describe("Canonical /maps/place/ URL from a.hfpxzc href"),
  placeId: z.string().nullable().describe("Parsed from mapUrl !1s0x...:0x... segment"),
  isSponsored: z.boolean().default(false),
})

const SYSTEM_INSTRUCTIONS = `You are a Google Maps scraping agent. You drive the Scrapeless cloud browser through the MCP browser tools to extract business listings and return them as structured data.

You have generic browser primitives available as tools (names may be prefixed): browser_create, browser_goto, browser_wait_for, browser_get_html, browser_get_text, browser_click, browser_type, browser_press_key, browser_scroll, browser_scroll_to, browser_screenshot, browser_close.

Follow this exact flow for every Google Maps scrape:

1. Call browser_create to mint a cloud-browser session. If it returns a transient connection/proxy error, retry once.
2. Build the search URL: https://www.google.com/maps/search/<url-encoded query> and call browser_goto with it.
3. Consent wall: after navigating, if the page text contains "consent" or an Accept-all button (Accept all / Accetta tutto / Akzeptieren / Accepter), call browser_click on "button[aria-label*='Accept' i], form[action*='consent'] button:last-of-type" and browser_goto again.
4. Call browser_wait_for with selector "a.hfpxzc" so the place cards have rendered before you extract.
5. To load more than the first ~10-20 cards up to the requested count: browser_click on "a.hfpxzc:first-of-type" to focus the feed, then call browser_press_key with key "End" (or "PageDown") 3-5 times. Google Maps caps at ~120 results per query.
6. Call browser_get_html to get the rendered DOM. Parse each "a.hfpxzc" anchor and its surrounding card for: name (aria-label), rating (role="img" aria-label "X stars"), reviewCount (text like "(3,174)"), address, category, priceLevel ($ tokens), mapUrl (href), placeId (the !1s0x...:0x... segment of mapUrl), isSponsored ([aria-label="Sponsored"]).
7. Only if the user explicitly asks for phone / website / full hours / reviews: for each place click the card, wait_for "h1.DUwDvf", browser_get_html, and parse the detail panel (button[data-item-id="address"], button[data-item-id^="phone:tel:"], a[data-item-id="authority"] for website, button[jsaction*="openhours"] for hours). Otherwise leave those fields null.
8. Apply any requested filters (e.g. rating >= 4.5, reviewCount >= 200) and honor the requested result count.
9. Call the emitResults tool ONCE with the final structured records. This is what populates the results table for the user — you MUST call it.
10. Call browser_close with the sessionId to release the session.

Keep your chat messages short and human: briefly narrate each phase (e.g. "Opening a cloud browser", "Loading the Maps SERP", "Scrolling the feed", "Parsing 15 cards"). NEVER paste raw HTML into your chat replies. After emitResults, give a one or two sentence summary of what you found.`

export async function POST(req: Request) {
  const apiKey = process.env.SCRAPELESS_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing SCRAPELESS_KEY environment variable." }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: SCRAPELESS_MCP_URL,
      headers: { "x-api-token": apiKey },
    },
  })

  const browserTools = await mcpClient.tools()

  const emitResults = tool({
    description:
      "Emit the final structured Google Maps place records. Call this exactly once when extraction is complete.",
    inputSchema: z.object({
      query: z.string().describe("The search query that was scraped"),
      queryUrl: z.string().nullable(),
      results: z.array(placeSchema),
    }),
    execute: async ({ results }) => ({
      status: "saved",
      count: results.length,
    }),
  })

  const agent = new ToolLoopAgent({
    model: "anthropic/claude-sonnet-5",
    instructions: SYSTEM_INSTRUCTIONS,
    tools: { ...browserTools, emitResults },
    stopWhen: isStepCount(40),
    // Release the cloud browser + MCP connection when the run ends.
    onEnd: async () => {
      await mcpClient.close().catch(() => {})
    },
  })

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    onError: (error) => {
      console.log("[v0] scrape agent error:", error)
      return error instanceof Error ? error.message : String(error)
    },
  })
}

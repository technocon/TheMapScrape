"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, Braces, ExternalLink, FileSpreadsheet, MapPinned, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCsv, downloadJson } from "@/lib/export"
import type { Place, ScrapeResult } from "@/lib/types"

type SortKey = "name" | "rating" | "reviewCount"

function Rating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <Star className="size-3.5 fill-star text-star" />
      {value.toFixed(1)}
    </span>
  )
}

export function ResultsPanel({ result, isWorking }: { result: ScrapeResult | null; isWorking: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("reviewCount")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const sorted = useMemo(() => {
    if (!result) return []
    const rows = [...result.results]
    rows.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return rows
  }, [result, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "name" ? "asc" : "desc")
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Extracted places</h2>
          <p className="truncate text-xs text-muted-foreground">
            {result
              ? `${result.resultsReturned} results for "${result.query}"`
              : "Structured results will appear here after a scrape"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!result || result.results.length === 0}
            onClick={() => result && downloadCsv(result)}
          >
            <FileSpreadsheet className="size-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!result || result.results.length === 0}
            onClick={() => result && downloadJson(result)}
          >
            <Braces className="size-4" />
            JSON
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <MapPinned className="size-6" />
            </span>
            <p className="max-w-xs text-pretty text-sm text-muted-foreground">
              {isWorking
                ? "The agent is driving the cloud browser. Results populate here as soon as extraction finishes."
                : "No results yet. Ask the agent to scrape a Google Maps query to build a structured table."}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-secondary text-left">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Name <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("rating")}>
                    Rating <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("reviewCount")}>
                    Reviews <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Address</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((place, i) => (
                <PlaceRow key={place.placeId ?? `${place.name}-${i}`} place={place} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function PlaceRow({ place }: { place: Place }) {
  return (
    <tr className="border-b border-border align-top last:border-0 hover:bg-secondary/50">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="font-medium text-foreground">
            {place.mapUrl ? (
              <a
                href={place.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary hover:underline"
              >
                {place.name}
                <ExternalLink className="size-3 opacity-60" />
              </a>
            ) : (
              place.name
            )}
          </span>
          {place.isSponsored ? (
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent-foreground">
              Ad
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <Rating value={place.rating} />
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {place.reviewCount !== null ? place.reviewCount.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {place.category ?? "—"}
        {place.priceLevel ? <span className="ml-1.5 font-mono text-xs">{place.priceLevel}</span> : null}
      </td>
      <td className="max-w-[220px] px-4 py-3 text-muted-foreground">{place.address ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          {place.phone ? <span className="font-mono text-xs">{place.phone}</span> : null}
          {place.website ? (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Website <ExternalLink className="size-3" />
            </a>
          ) : null}
          {!place.phone && !place.website ? "—" : null}
        </div>
      </td>
    </tr>
  )
}

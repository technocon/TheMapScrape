import type { Place, ScrapeResult } from "./types"

const CSV_FIELDS: (keyof Place)[] = [
  "name",
  "rating",
  "reviewCount",
  "category",
  "priceLevel",
  "address",
  "phone",
  "website",
  "hours",
  "mapUrl",
  "placeId",
  "isSponsored",
]

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(places: Place[]): string {
  const header = CSV_FIELDS.join(",")
  const rows = places.map((place) => CSV_FIELDS.map((field) => escapeCsv(place[field])).join(","))
  return [header, ...rows].join("\n")
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function slugify(query: string): string {
  return (
    query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "results"
  )
}

export function downloadCsv(result: ScrapeResult) {
  download(`maps-${slugify(result.query)}.csv`, toCsv(result.results), "text/csv;charset=utf-8;")
}

export function downloadJson(result: ScrapeResult) {
  download(`maps-${slugify(result.query)}.json`, JSON.stringify(result, null, 2), "application/json")
}

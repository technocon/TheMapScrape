export interface Place {
  name: string
  rating: number | null
  reviewCount: number | null
  address: string | null
  category: string | null
  priceLevel: string | null
  phone: string | null
  website: string | null
  hours: string | null
  mapUrl: string | null
  placeId: string | null
  isSponsored: boolean
}

export interface ScrapeResult {
  query: string
  queryUrl: string | null
  resultsReturned: number
  results: Place[]
}

export const PLACE_COLUMNS: { key: keyof Place; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "rating", label: "Rating" },
  { key: "reviewCount", label: "Reviews" },
  { key: "category", label: "Category" },
  { key: "priceLevel", label: "Price" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "hours", label: "Hours" },
]

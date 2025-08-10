"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Suggestion = {
  properties: {
    label?: string
    city?: string
    name?: string
    municipality?: string
    postcode?: string
    postalcode?: string
    type?: string
  }
}

type AddressAutocompleteInputProps = {
  id: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  // "address" returns full addresses, "municipality" favors city/town results
  mode?: "address" | "municipality"
  // Optional aria
  "aria-invalid"?: boolean
  maxLength?: number
}

/**
 * Reusable address/municipality autocomplete using api-adresse.data.gouv.fr
 * - Debounced fetch
 * - Click to select suggestion
 * - Graceful empty states
 */
export function AddressAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  mode = "address",
  maxLength,
  ...aria
}: AddressAutocompleteInputProps) {
  const [query, setQuery] = React.useState(value)
  const [open, setOpen] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [loading, setLoading] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const controllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    setQuery(value)
  }, [value])

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        controllerRef.current?.abort()
        const ctrl = new AbortController()
        controllerRef.current = ctrl
        setLoading(true)

        const url = new URL("https://api-adresse.data.gouv.fr/search/")
        url.searchParams.set("q", query)
        url.searchParams.set("limit", "6")
        if (mode === "municipality") {
          url.searchParams.set("type", "municipality")
        }

        const res = await fetch(url.toString(), { signal: ctrl.signal })
        const data = await res.json()
        let feats: Suggestion[] = Array.isArray(data?.features) ? data.features : []
        if (mode === "municipality") {
          feats = feats.filter(
            (f: any) => f?.properties?.type === "municipality" || f?.properties?.city || f?.properties?.name,
          )
        }
        setSuggestions(feats)
        setOpen(true)
      } catch {
        // Ignore aborted or network errors; keep UX silent
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => clearTimeout(timeout)
  }, [query, mode])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  const formatMunicipality = (s: Suggestion) => {
    const p = s.properties || {}
    const city = p.city || p.name || p.municipality || p.label || ""
    const cp = p.postcode || p.postalcode || ""
    return `${city}${cp ? ` ${cp}` : ""}`.trim()
  }

  const selectSuggestion = (s: Suggestion) => {
    const label = mode === "municipality" ? formatMunicipality(s) : s.properties.label || formatMunicipality(s)
    onChange(label)
    setQuery(label)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        className={cn("mt-1", className)}
        maxLength={maxLength}
        autoComplete="off"
        {...aria}
      />
      {open && (loading || suggestions.length > 0) && (
        <div
          role="listbox"
          className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-md mt-1 max-h-60 overflow-auto"
        >
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Recherche en cours…</div>}
          {!loading &&
            suggestions.map((s, idx) => (
              <button
                key={`${idx}-${s.properties.label || s.properties.name || s.properties.city || "item"}`}
                type="button"
                role="option"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                {mode === "municipality" ? formatMunicipality(s) : s.properties.label}
              </button>
            ))}
          {!loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">
              Aucune proposition. Continuez à taper pour plus de résultats.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

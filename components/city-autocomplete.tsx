"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type CityHit = {
  id: string
  city: string
  postcode: string
  context?: string
}

export type CityAutocompleteProps = {
  id?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  ariaInvalid?: boolean
  maxSuggestions?: number
  onValidSelect?: (data: { city: string; postcode: string; label: string; context?: string }) => void
}

/**
 * CityAutocomplete
 * - Suggests French municipalities with postcode using the Adresse API
 * - Formats selection as "Ville (CP)" to match the locataire behavior
 */
export function CityAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Ville (ex: Brest) + code postal",
  className,
  disabled,
  ariaInvalid,
  maxSuggestions = 8,
  onValidSelect,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value || "")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CityHit[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setQuery(value || "")
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl
        setLoading(true)

        // Adresse API: municipality search with autocomplete
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=${maxSuggestions}&autocomplete=1`
        const res = await fetch(url, { signal: ctrl.signal })
        const json = await res.json()
        const feats = Array.isArray(json?.features) ? json.features : []

        const seen = new Set<string>()
        const hits: CityHit[] = []
        for (const f of feats) {
          const props = f?.properties || {}
          const city = String(props.city || props.name || "").trim()
          const postcode = String(props.postcode || "").trim()
          const context = String(props.context || "").trim()
          if (!city || !postcode) continue
          const key = city.toLowerCase() + "|" + postcode
          if (seen.has(key)) continue
          seen.add(key)
          hits.push({
            id: String(f?.properties?.id || f?.geometry?.coordinates?.join(",") || key),
            city,
            postcode,
            context,
          })
        }

        setResults(hits)
        setOpen(hits.length > 0)
      } catch {
        // silently ignore abort or network errors
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [query, maxSuggestions])

  const handleSelect = (hit: CityHit) => {
    const label = `${hit.city} (${hit.postcode})`
    onChange(label)
    onValidSelect?.({ city: hit.city, postcode: hit.postcode, label, context: hit.context })
    setQuery(label)
    setOpen(false)
    setActiveIndex(-1)
  }

  const showSpinner = loading && query.trim().length >= 2

  const listId = useMemo(() => (id ? `${id}-listbox` : undefined), [id])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        className={cn(className)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        autoComplete="off"
      />
      {showSpinner ? <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">…</div> : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md max-h-64 overflow-auto"
        >
          {results.map((hit, i) => {
            const label = `${hit.city} (${hit.postcode})`
            return (
              <button
                key={hit.id + "-" + i}
                role="option"
                aria-selected={i === activeIndex}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => handleSelect(hit)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  i === activeIndex ? "bg-slate-100" : "hover:bg-slate-50",
                )}
              >
                <div className="font-medium text-slate-800">{label}</div>
                {hit.context ? <div className="text-xs text-slate-500">{hit.context}</div> : null}
              </button>
            )
          })}
          {results.length === 0 ? <div className="px-3 py-2 text-sm text-slate-500">Aucun résultat</div> : null}
        </div>
      ) : null}
    </div>
  )
}

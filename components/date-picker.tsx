"use client"

import * as React from "react"
import { format, isAfter, isBefore, parseISO, startOfYear, endOfYear, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DatePickerProps = {
  id?: string
  value?: string // ISO: yyyy-MM-dd
  onChange?: (iso: string) => void
  fromYear?: number
  toYear?: number
  disableFuture?: boolean
  ariaLabel?: string
  className?: string
  placeholder?: string
  displayFormat?: string // default dd/MM/yyyy
}

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
]

export function DatePicker({
  id,
  value,
  onChange,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 5,
  disableFuture = false,
  ariaLabel,
  className,
  placeholder = "jj/mm/aaaa",
  displayFormat = "dd/MM/yyyy",
}: DatePickerProps) {
  const selected = React.useMemo(() => {
    if (!value) return undefined
    const d = parseISO(value)
    return isValid(d) ? d : undefined
  }, [value])

  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())

  React.useEffect(() => {
    if (selected) setMonth(selected)
  }, [selected])

  const years = React.useMemo(() => {
    const list: number[] = []
    for (let y = toYear; y >= fromYear; y--) list.push(y)
    return list
  }, [fromYear, toYear])

  const minDate = React.useMemo(() => startOfYear(new Date(fromYear, 0, 1)), [fromYear])
  const today = new Date()
  const maxDate = React.useMemo(() => {
    const logicalMax = endOfYear(new Date(toYear, 11, 31))
    return disableFuture && isAfter(logicalMax, today) ? today : logicalMax
  }, [toYear, disableFuture])

  const handleSelect = (d?: Date) => {
    if (!d) return
    if (isBefore(d, minDate) || isAfter(d, maxDate)) return
    onChange?.(format(d, "yyyy-MM-dd"))
    setOpen(false)
  }

  const handleMonthChange = (newMonthIndex: number) => {
    const next = new Date(month)
    next.setMonth(newMonthIndex)
    setMonth(next)
  }

  const handleYearChange = (newYear: number) => {
    const next = new Date(month)
    next.setFullYear(newYear)
    setMonth(next)
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn("w-full justify-between")}
          >
            <span className="truncate">{selected ? format(selected, displayFormat, { locale: fr }) : placeholder}</span>
            <div className="ml-2 flex items-center gap-2 text-slate-500">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Select value={String(month.getMonth())} onValueChange={(v) => handleMonthChange(Number.parseInt(v))}>
              <SelectTrigger aria-label="Sélectionner le mois">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS_FR.map((m, idx) => (
                  <SelectItem key={m} value={String(idx)}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(month.getFullYear())} onValueChange={(v) => handleYearChange(Number.parseInt(v))}>
              <SelectTrigger aria-label="Sélectionner l'année">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={handleSelect}
            initialFocus
            locale={fr}
            disabled={(date) => isBefore(date, minDate) || isAfter(date, maxDate)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

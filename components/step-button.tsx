"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StepButtonProps {
  label: string
  completed: boolean
  current: boolean
  disabled: boolean
  icon?: LucideIcon
  onClick: () => void
  className?: string
}

export function StepButton({
  label,
  completed,
  current,
  disabled,
  icon: Icon,
  onClick,
  className,
}: StepButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-300 group",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed hover:scale-100",
        completed && "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800 shadow-sm hover:shadow-md",
        current && "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800 shadow-md ring-2 ring-blue-200",
        !completed &&
          !current &&
          !disabled &&
          "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300",
        className
      )}
    >
      <div
        className={cn(
          "p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center",
          completed && "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 group-hover:scale-110",
          current && "bg-blue-100 text-blue-700 group-hover:bg-blue-200 group-hover:scale-110",
          !completed && !current && !disabled && "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:scale-110",
          disabled && "bg-slate-50 text-slate-400"
        )}
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : Icon ? (
          <Icon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Circle className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate">{label}</span>
        {current && (
          <span className="text-xs text-blue-600 font-medium block mt-1">En cours</span>
        )}
        {completed && (
          <span className="text-xs text-emerald-600 font-medium block mt-1">Terminé</span>
        )}
      </div>
      
      {/* Progress indicator for current step */}
      {current && (
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
      )}
    </button>
  )
} 
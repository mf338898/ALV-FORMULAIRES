"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Circle, Play, ArrowRight } from "lucide-react"

export type SegmentedStep = {
  key: string
  label: string
  index: number // 1-based
}

type SegmentedProgressProps = {
  steps: SegmentedStep[]
  currentStep: number // 1-based
  maxReachedStep: number // gate for navigation
  title?: string
  onSelect?: (stepIndex: number) => void
  className?: string
}

export function CircularStepIndicator({
  current,
  total,
  size = 36,
  trackColor = "rgb(226,232,240)", // slate-200
  progressColor = "rgb(37,99,235)", // blue-600
}: {
  current: number
  total: number
  size?: number
  trackColor?: string
  progressColor?: string
}) {
  const pct = Math.max(0, Math.min(1, current / total))
  const angle = Math.round(360 * pct)
  const ringStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "9999px",
    backgroundImage: `conic-gradient(${progressColor} ${angle}deg, ${trackColor} 0deg)`,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
  }
  const innerSize = Math.max(0, size - 8)
  return (
    <div aria-hidden="true" className="relative grid place-items-center animate-pulse" style={ringStyle}>
      <div
        className="bg-white rounded-full flex items-center justify-center text-[11px] font-semibold text-slate-700 tabular-nums shadow-sm border-2 border-white"
        style={{ width: innerSize, height: innerSize }}
      >
        {current}/{total}
      </div>
      {/* Animated dots around the circle */}
      <div className="absolute inset-0 w-full h-full">
        {Array.from({ length: total }, (_, i) => {
          const dotAngle = (i * 360) / total
          const dotRadius = size / 2 - 2
          const x = Math.cos((dotAngle - 90) * (Math.PI / 180)) * dotRadius + size / 2
          const y = Math.sin((dotAngle - 90) * (Math.PI / 180)) * dotRadius + size / 2
          const isCompleted = i < current
          const isCurrent = i === current - 1
          
          return (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full transition-all duration-300",
                isCompleted && "bg-emerald-500 shadow-lg shadow-emerald-500/50",
                isCurrent && "bg-blue-600 shadow-lg shadow-blue-600/50 animate-pulse",
                !isCompleted && !isCurrent && "bg-slate-300"
              )}
              style={{
                left: x - 4,
                top: y - 4,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function SegmentedProgress({
  steps,
  currentStep,
  maxReachedStep,
  title,
  onSelect,
  className,
}: SegmentedProgressProps) {
  const total = steps.length

  return (
    <div className={cn("w-full", className)}>
      <TooltipProvider delayDuration={100}>
        {/* Nouvelle barre de progression simplifiée et intuitive */}
        <div className="relative mb-6">
          {/* Barre de progression principale */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            {/* Barre de progression complétée */}
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (total - 1)) * 100}%` }}
            />
            
            {/* Barre de progression actuelle */}
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${(currentStep / total) * 100}%` }}
            />
          </div>

          {/* Étapes avec indicateurs visuels clairs */}
          <div className="relative -mt-1.5">
            <div className="flex justify-between">
              {steps.map((step, idx) => {
                const isCompleted = step.index < currentStep
                const isCurrent = step.index === currentStep
                const isDisabled = step.index > maxReachedStep
                const isAccessible = step.index <= maxReachedStep

                return (
                  <div key={step.key} className="relative flex flex-col items-center">
                    {/* Indicateur d'étape */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isAccessible && onSelect) {
                          onSelect(step.index)
                        }
                      }}
                      disabled={!isAccessible}
                      className={cn(
                        "relative w-8 h-8 rounded-full border-2 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                        isCompleted && [
                          "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30",
                          "hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-500/40"
                        ],
                        isCurrent && [
                          "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-200",
                          "hover:bg-blue-600 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/40"
                        ],
                        !isCompleted && !isCurrent && isAccessible && [
                          "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50",
                          "hover:shadow-md"
                        ],
                        isDisabled && [
                          "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
                          "hover:scale-100 hover:shadow-none"
                        ]
                      )}
                    >
                      {/* Icône ou numéro selon l'état */}
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 mx-auto" />
                      ) : isCurrent ? (
                        <Play className="w-3 h-3 mx-auto ml-0.5" />
                      ) : (
                        <span className="text-xs font-semibold">{step.index}</span>
                      )}
                    </button>

                    {/* Ligne de connexion (sauf pour la dernière étape) */}
                    {idx < steps.length - 1 && (
                      <div className="absolute top-4 left-1/2 w-full h-0.5 bg-slate-200 -z-10" />
                    )}

                    {/* Label de l'étape */}
                    <div className="mt-2 text-center max-w-24">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "block text-xs font-medium transition-colors duration-200 cursor-pointer",
                            isCurrent && "text-blue-700 font-semibold",
                            isCompleted && "text-emerald-700",
                            !isCompleted && !isCurrent && isAccessible && "text-slate-600 hover:text-slate-800",
                            isDisabled && "text-slate-400 cursor-not-allowed"
                          )}>
                            {step.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-48">
                          <p className="font-medium">{step.label}</p>
                          {isCurrent && <p className="text-blue-600">Étape en cours</p>}
                          {isCompleted && <p className="text-emerald-600">Étape terminée</p>}
                          {isDisabled && <p className="text-slate-500">Étape verrouillée</p>}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Indicateur de progression pour l'étape actuelle */}
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Titre centré avec indicateur de progression */}
        {title && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <span className="font-medium text-blue-600">{currentStep}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{total}</span>
              </div>
            </div>
          </div>
        )}
      </TooltipProvider>

      {/* A11y live region for screen readers */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Étape ${currentStep} sur ${total}${title ? `: ${title}` : ""}`}
      </p>
    </div>
  )
}

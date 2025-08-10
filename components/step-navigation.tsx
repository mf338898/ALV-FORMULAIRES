"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Lock } from "lucide-react"

type StepNavigationProps = {
  currentStep: number
  totalSteps: number
  maxReachedStep: number
  onPrevious: () => void
  onNext: () => void
  onStepClick: (step: number) => void
  canGoNext: boolean
  canGoPrevious: boolean
  className?: string
  isLastStep?: boolean
  onLastStepAction?: () => void
  lastStepButtonText?: string
  isSubmitting?: boolean
}

export function StepNavigation({
  currentStep,
  totalSteps,
  maxReachedStep,
  onPrevious,
  onNext,
  onStepClick,
  canGoNext,
  canGoPrevious,
  className,
  isLastStep = false,
  onLastStepAction,
  lastStepButtonText = "Terminer",
  isSubmitting = false,
}: StepNavigationProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200", className)}>
      {/* Navigation principale */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            canGoPrevious && "hover:bg-slate-100 hover:border-slate-300 hover:shadow-md",
            !canGoPrevious && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-blue-600">{currentStep}</span>
          <span>sur</span>
          <span className="font-semibold">{totalSteps}</span>
        </div>

        {isLastStep ? (
          <Button
            onClick={onLastStepAction}
            disabled={!canGoNext || isSubmitting}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              canGoNext && "bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105",
              !canGoNext && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                {lastStepButtonText}
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              canGoNext && "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105",
              !canGoNext && "opacity-50 cursor-not-allowed"
            )}
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation rapide par étapes */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600 mr-2">Aller à :</span>
        {steps.map((step) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const isAccessible = step <= maxReachedStep

          return (
            <button
              key={step}
              onClick={() => onStepClick(step)}
              disabled={!isAccessible}
              className={cn(
                "relative w-8 h-8 rounded-full border-2 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                isCompleted && [
                  "bg-emerald-500 border-emerald-500 text-white shadow-md",
                  "hover:bg-emerald-600 hover:shadow-lg"
                ],
                isCurrent && [
                  "bg-blue-500 border-blue-500 text-white shadow-lg ring-2 ring-blue-200",
                  "hover:bg-blue-600 hover:shadow-xl"
                ],
                !isCompleted && !isCurrent && isAccessible && [
                  "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50",
                  "hover:shadow-md"
                ],
                !isAccessible && [
                  "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
                  "hover:scale-100 hover:shadow-none"
                ]
              )}
              title={`Étape ${step}${isCompleted ? " (terminée)" : isCurrent ? " (en cours)" : !isAccessible ? " (verrouillée)" : ""}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 mx-auto" />
              ) : isCurrent ? (
                <Play className="w-3 h-3 mx-auto ml-0.5" />
              ) : !isAccessible ? (
                <Lock className="w-3 h-3 mx-auto" />
              ) : (
                <span className="text-xs font-semibold">{step}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
} 
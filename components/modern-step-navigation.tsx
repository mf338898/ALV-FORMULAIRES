import { CheckCircle, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  key: string
  label: string
  index: number
  completed?: boolean
  current?: boolean
  disabled?: boolean
}

interface ModernStepNavigationProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  className?: string
}

export function ModernStepNavigation({ 
  steps, 
  currentStep, 
  onStepClick, 
  className 
}: ModernStepNavigationProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Navigation desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.completed || step.index < currentStep
            const isCurrent = step.current || step.index === currentStep
            const isDisabled = step.disabled || step.index > currentStep
            
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                {/* Ligne de connexion */}
                {index < steps.length - 1 && (
                  <div className="w-full h-0.5 bg-slate-200 relative">
                    {isCompleted && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500" />
                    )}
                  </div>
                )}
                
                {/* Cercle de l'étape */}
                <div className="relative mt-4">
                  <button
                    onClick={() => onStepClick?.(step.index)}
                    disabled={isDisabled}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                      isCompleted && "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg",
                      isCurrent && !isCompleted && "bg-blue-100 border-2 border-blue-500 text-blue-700",
                      !isCompleted && !isCurrent && "bg-slate-100 border-2 border-slate-300 text-slate-500",
                      isDisabled && "cursor-not-allowed opacity-50",
                      !isDisabled && "hover:scale-110 hover:shadow-md"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : isCurrent ? (
                      <Circle className="h-6 w-6" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                    
                    {/* Indicateur de progression */}
                    {isCurrent && !isCompleted && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-dashed animate-pulse" />
                    )}
                  </button>
                  
                  {/* Label de l'étape */}
                  <div className="mt-3 text-center">
                    <div className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      isCompleted && "text-slate-900",
                      isCurrent && !isCompleted && "text-blue-700",
                      !isCompleted && !isCurrent && "text-slate-500"
                    )}>
                      {step.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Étape {step.index}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Navigation mobile */}
      <div className="md:hidden">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              Étape {currentStep} sur {steps.length}
            </span>
            <span className="text-xs text-slate-500">
              {Math.round((currentStep / steps.length) * 100)}% complété
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Étapes en liste */}
          <div className="mt-4 space-y-2">
            {steps.map((step, index) => {
              const isCompleted = step.completed || step.index < currentStep
              const isCurrent = step.current || step.index === currentStep
              
              return (
                <div 
                  key={step.key}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200",
                    isCurrent && "bg-blue-50 border border-blue-200",
                    isCompleted && "bg-emerald-50 border border-emerald-200"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    isCompleted && "bg-emerald-500 text-white",
                    isCurrent && !isCompleted && "bg-blue-500 text-white",
                    !isCompleted && !isCurrent && "bg-slate-300 text-slate-600"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      step.index
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-emerald-700",
                    isCurrent && !isCompleted && "text-blue-700",
                    !isCompleted && !isCurrent && "text-slate-500"
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

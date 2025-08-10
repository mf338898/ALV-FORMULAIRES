import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ModernFormSectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  isActive?: boolean
  isCompleted?: boolean
  showValidation?: boolean
  isValid?: boolean
}

export function ModernFormSection({
  title,
  subtitle,
  icon,
  children,
  className,
  isActive = false,
  isCompleted = false,
  showValidation = false,
  isValid = false
}: ModernFormSectionProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg transition-all duration-300",
      isActive && "ring-2 ring-blue-500 ring-offset-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/30",
      isCompleted && "bg-gradient-to-br from-emerald-50/50 to-teal-50/30",
      !isActive && !isCompleted && "bg-white",
      className
    )}>
      {/* Éléments décoratifs */}
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl" />
      )}
      {isCompleted && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl" />
      )}
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className={cn(
                "p-2 rounded-lg transition-colors duration-300",
                isActive && "bg-blue-100 text-blue-600",
                isCompleted && "bg-emerald-100 text-emerald-600",
                !isActive && !isCompleted && "bg-slate-100 text-slate-600"
              )}>
                {icon}
              </div>
            )}
            <div>
              <CardTitle className={cn(
                "text-xl font-bold transition-colors duration-300",
                isActive && "text-blue-900",
                isCompleted && "text-emerald-900",
                !isActive && !isCompleted && "text-slate-900"
              )}>
                {title}
              </CardTitle>
              {subtitle && (
                <p className={cn(
                  "text-sm mt-1 transition-colors duration-300",
                  isActive && "text-blue-700",
                  isCompleted && "text-emerald-700",
                  !isActive && !isCompleted && "text-slate-600"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Indicateur de validation */}
          {showValidation && (
            <div className={cn(
              "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
              isValid 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-amber-100 text-amber-700 border border-amber-200"
            )}>
              {isValid ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>Validé</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span>À compléter</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {children}
      </CardContent>
    </Card>
  )
}

// Composant pour les champs de formulaire
interface ModernFormFieldProps {
  label: string
  required?: boolean
  error?: string
  helpText?: string
  children: ReactNode
  className?: string
}

export function ModernFormField({
  label,
  required = false,
  error,
  helpText,
  children,
  className
}: ModernFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 flex items-center space-x-1">
          <div className="w-1 h-1 bg-red-600 rounded-full" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

// Composant pour les boutons d'action
interface ModernFormActionsProps {
  onPrevious?: () => void
  onNext?: () => void
  onSave?: () => void
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  nextLabel?: string
  previousLabel?: string
  saveLabel?: string
  className?: string
}

export function ModernFormActions({
  onPrevious,
  onNext,
  onSave,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  nextLabel = "Suivant",
  previousLabel = "Précédent",
  saveLabel = "Enregistrer",
  className
}: ModernFormActionsProps) {
  return (
    <div className={cn("flex items-center justify-between pt-6 border-t border-slate-200", className)}>
      <div className="flex-1">
        {onPrevious && (
          <button
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {previousLabel}
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {saveLabel}
          </button>
        )}
        
        {onNext && (
          <button
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : (
              nextLabel
            )}
          </button>
        )}
      </div>
    </div>
  )
}

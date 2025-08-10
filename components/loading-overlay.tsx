"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2, FileText, CheckCircle2, Clock } from "lucide-react"

type LoadingOverlayProps = {
  show?: boolean
  message?: string
}

export function LoadingOverlay({
  show = false,
  message = "Veuillez patienter… Votre dossier est en cours de traitement",
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    "Préparation des données...",
    "Génération du PDF...",
    "Finalisation...",
    "Terminé !"
  ]

  useEffect(() => {
    if (!show) return
    
    setProgress(0)
    setCurrentStep(0)
    
    // Animation du progrès avec étapes
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100
        return p + 1
      })
    }, 50)

    // Changement d'étapes
    const stepInterval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= steps.length - 1) return s
        return s + 1
      })
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [show])

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Traitement du dossier en cours"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      {/* Carte de contenu centrée */}
      <div
        role="status"
        aria-live="polite"
        className="relative z-[101] w-[95%] max-w-lg rounded-2xl border-0 bg-white/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center gap-6">
          {/* Logo ALV avec indicateur de chargement */}
          <div className="relative">
            <Image
              src="/images/logo-alv-2.jpg"
              alt="ALV Immobilier"
              width={200}
              height={52}
              className="h-12 w-auto sm:h-14"
              priority
            />
            <div className="absolute -top-2 -right-2">
              <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
            </div>
          </div>

          {/* Titre et message */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Génération en cours...
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-sm">
              {message}
            </p>
          </div>

          {/* Barre de progression */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progression</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Étapes actuelles */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{steps[currentStep]}</span>
            </div>
          </div>

          {/* Indicateurs visuels */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Email</span>
            </div>
          </div>

          {/* Message d'aide */}
          <p className="text-xs text-slate-400 max-w-xs">
            Ne fermez pas cette page. Vous serez redirigé automatiquement une fois terminé.
          </p>
        </div>
      </div>
    </div>
  )
}

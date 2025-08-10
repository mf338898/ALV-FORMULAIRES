"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type LoadingOverlayProps = {
  show?: boolean
  message?: string
}

export function LoadingOverlay({
  show = false,
  message = "Veuillez patienter… Votre dossier est en cours de traitement",
}: LoadingOverlayProps) {
  const [imageError, setImageError] = useState(false)
  const [progress, setProgress] = useState(12)

  useEffect(() => {
    if (!show) return
    setProgress(12)
    const id = setInterval(() => {
      setProgress((p) => {
        // Ease towards 90% while "in progress" for a subtle animated feel
        if (p >= 90) return 90
        const delta = Math.max(0.5, (90 - p) * 0.07)
        return Math.min(90, p + delta)
      })
    }, 120)
    return () => clearInterval(id)
  }, [show])

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Traitement du dossier en cours"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src="/images/alv-logo-3d-facade.png"
            alt="ALV Immobilier - logo 3D sur façade vitrée"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200" />
        )}
        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-black/35 md:bg-black/30" />
      </div>

      {/* Centered content card */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "relative z-[101] w-[92%] max-w-md rounded-xl border bg-white/90 backdrop-blur",
          "shadow-xl p-5 sm:p-6",
        )}
      >
        <div className="flex flex-col items-center text-center gap-3">
          {/* Classic logo as brand anchor + fallback visual if bg fails */}
          <Image
            src="/images/logo-alv-2.jpg"
            alt="ALV Immobilier"
            width={180}
            height={48}
            className="h-10 w-auto sm:h-12"
            priority
          />

          {/* Message */}
          <div className="mt-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Veuillez patienter…</h2>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
          </div>

          {/* Subtle progress indicator */}
          <div className="mt-4 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div
                className="h-full bg-emerald-600 transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Animated dots for extra affordance */}
            <div className="mt-3 flex items-center justify-center gap-1 text-slate-500">
              <span className="sr-only">Chargement</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>

          {/* Accessibility helper text */}
          <p className="sr-only">Le PDF est en cours de génération. Vous serez redirigé automatiquement.</p>
        </div>
      </div>
    </div>
  )
}

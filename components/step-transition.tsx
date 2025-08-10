"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface StepTransitionProps {
  children: React.ReactNode
  step: number
  className?: string
}

export function StepTransition({ children, step, className }: StepTransitionProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [displayStep, setDisplayStep] = useState(step)

  useEffect(() => {
    if (step !== displayStep) {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setDisplayStep(step)
        setIsVisible(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [step, displayStep])

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
} 
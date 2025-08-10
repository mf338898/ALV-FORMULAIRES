import type { ReactNode } from "react"
import Link from "next/link"

export default function LocataireLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 underline">
          Accueil
        </Link>
        <h2 className="text-xl font-semibold">Fiche de renseignements</h2>
        <div />
      </header>
      {children}
    </div>
  )
}

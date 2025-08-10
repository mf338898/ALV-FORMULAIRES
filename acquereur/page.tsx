import { Construction } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      <Construction className="w-16 h-16 text-blue-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Bientôt disponible</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Cette page est en cours de construction. Nous travaillons pour vous offrir la meilleure expérience possible.
      </p>
      <Link href="/">
        <Button>Retour à l'accueil</Button>
      </Link>
    </div>
  )
}

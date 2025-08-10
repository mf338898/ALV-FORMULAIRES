import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function ComingSoon() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <Image
          src="/images/logo.png"
          alt="ALV Immobilier Pleyben"
          width={200}
          height={74}
          className="mx-auto"
          priority
        />
      </div>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit mb-4">
            <Wrench className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Page en construction</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            Ce formulaire est en cours de développement. Merci de votre compréhension.
            <br />
            Vous pouvez revenir au menu principal pour sélectionner un autre formulaire.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

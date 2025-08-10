"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Mail, Phone, MapPin, ArrowLeft, ExternalLink } from "lucide-react"

export default function ConfirmationPage() {
  const params = useSearchParams()
  const email = params.get("email") || "votre adresse email"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header avec logo */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Image
                src="/images/logo-alv-2.jpg"
                alt="Logo ALV Pleyben Immobilier"
                width={180}
                height={60}
                className="h-12 w-auto"
                priority
              />
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-slate-800">ALV Pleyben Immobilier</h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <a
                href="tel:0298267147"
                className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">02 98 26 71 47</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Carte principale de confirmation */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
          
          <CardContent className="relative p-8 sm:p-12">
            {/* Badge de succès */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Titre et message principal */}
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Dossier envoyé avec succès !
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Votre fiche de renseignements a été transmise à l'agence ALV Immobilier. 
                Notre équipe vous recontacte rapidement pour la suite de votre demande.
              </p>
            </div>

            {/* Informations importantes */}
            <div className="bg-blue-50/50 rounded-xl p-6 mb-8 border border-blue-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Confirmation par email</h3>
              </div>
              <p className="text-slate-700">
                Un email de confirmation a été envoyé à : 
                <span className="font-semibold text-blue-700 ml-2">{email}</span>
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Vérifiez vos spams si vous ne le recevez pas dans les prochaines minutes.
              </p>
            </div>

            {/* Prochaines étapes */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
                Prochaines étapes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-2">Vérification</h3>
                  <p className="text-sm text-slate-600">
                    Nous vérifions vos informations et documents
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-2">Contact</h3>
                  <p className="text-sm text-slate-600">
                    Notre équipe vous recontacte sous 24-48h
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-2">Visite</h3>
                  <p className="text-sm text-slate-600">
                    Organisation d'une visite du logement
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <Link href="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour à l'accueil</span>
                </Link>
              </Button>
              
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Link
                  href="https://www.alvimmobilier.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <span>Découvrir nos biens</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informations de contact */}
        <div className="mt-12 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Besoin d'aide ?
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-slate-600">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span>02 98 26 71 47</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>contact@alvimobilier.bzh</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>19 Place du Général de Gaulle, 29190 Pleyben</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

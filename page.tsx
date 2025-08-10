import { ArrowRight, Building, Home, Key, ShieldCheck, User } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const parcours = [
  {
    title: "Je suis locataire",
    description: "Complétez votre fiche de renseignements pour déposer une demande de location en quelques minutes.",
    href: "/locataire",
    icon: <User className="h-8 w-8 text-blue-600" />,
    enabled: true,
    cta: "Remplir la fiche",
  },
  {
    title: "Je suis propriétaire",
    description:
      "Vous nous confiez la gestion ou la location de votre bien ? La fiche propriétaire sera bientôt disponible.",
    href: "/proprietaire",
    icon: <Key className="h-8 w-8 text-gray-500" />,
    enabled: false,
    cta: "Bientôt disponible",
  },
  {
    title: "Je suis acquéreur",
    description: "Vous achetez un bien par notre agence ? La fiche acquéreur sera bientôt disponible.",
    href: "/acquereur",
    icon: <Home className="h-8 w-8 text-gray-500" />,
    enabled: false,
    cta: "Bientôt disponible",
  },
  {
    title: "Je suis vendeur",
    description: "Vous vendez avec ALV Immobilier ? La fiche vendeur sera bientôt disponible.",
    href: "/vendeur",
    icon: <Building className="h-8 w-8 text-gray-500" />,
    enabled: false,
    cta: "Bientôt disponible",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <Image
              src="/images/logo.png"
              alt="ALV Immobilier Pleyben"
              width={200}
              height={74}
              className="mx-auto mb-6"
              priority
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              Bienvenue sur votre espace ALV Immobilier
            </h1>
            <p className="text-base sm:text-lg text-gray-600">Remplissez la fiche adaptée à votre projet immobilier.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {parcours.map((item) => {
              const cardContent = (
                <Card
                  className={`h-full flex flex-col rounded-xl shadow-sm transition-all duration-300 ${
                    item.enabled
                      ? "group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-blue-500 cursor-pointer border-2 border-transparent"
                      : "opacity-70 bg-gray-100 cursor-not-allowed"
                  }`}
                >
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <div className={`p-3 rounded-full flex-shrink-0 ${item.enabled ? "bg-blue-100" : "bg-gray-200"}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={!item.enabled ? "text-gray-700" : ""}>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow" />
                  <CardFooter>
                    <div
                      className={`flex items-center font-semibold ${item.enabled ? "text-blue-600" : "text-gray-500"}`}
                    >
                      {item.cta}
                      {item.enabled && (
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )

              return (
                <div key={item.title}>
                  {item.enabled ? (
                    <Link href={item.href} className="block h-full group" aria-label={item.title}>
                      {cardContent}
                    </Link>
                  ) : (
                    <div className="h-full">{cardContent}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <p className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="h-4 w-4 text-green-700 flex-shrink-0" />
                Vos données sont strictement confidentielles et utilisées uniquement par notre agence, dans le respect
                du RGPD.
              </p>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">ALV IMMOBILIER</p>
              <p>19 Place du Général de Gaulle - 29190 PLEYBEN</p>
              <p>Tél. : 02 98 26 71 47 | E-mail : contact@alvimmobilier.bzh</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <p>
                Carte Professionnelle n° 2903 2016 000 009 781 – Compte séquestre CMB 04544529149 – garantie SOCAF 120
                000 €
              </p>
              <p>SAS AU CAPITAL DE 5720 € - Siret 440 808 913 00014 - R.C.S. QUIMPER 440 808 913 - NAF 6831Z</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

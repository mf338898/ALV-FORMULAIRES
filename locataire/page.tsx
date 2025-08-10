"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Clock, FileText, Users, CheckCircle, Info, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LocataireHomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <Image
              src="/images/logo.png"
              alt="ALV Immobilier Pleyben"
              width={200}
              height={74}
              className="mx-auto"
              priority
            />
          </div>

          {/* Main Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Fiche de renseignement location</h1>
            <p className="text-base sm:text-lg text-gray-600">
              Merci de compléter ce formulaire pour présenter votre candidature à la location d'un bien.
            </p>
          </div>

          {/* Time Badge */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
              <Clock className="h-4 w-4" />
              Le processus est simple et prend moins de 5 minutes.
            </div>
          </div>

          <div className="space-y-8">
            {/* Section: Pourquoi ce formulaire ? */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                Pourquoi ce formulaire ?
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pour renseigner vos informations personnelles (et celles de vos éventuels co-locataires)</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Pour générer une fiche de renseignements claire, transmise à notre équipe et au propriétaire du bien
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pour faciliter l'étude de votre candidature et, le cas échéant, organiser une visite</span>
                </li>
              </ul>
            </div>

            {/* Section: À savoir */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-3 mb-4">
                <Info className="h-5 w-5" />À savoir
              </h2>
              <ul className="space-y-2 text-blue-700 list-disc list-inside">
                <li>Ce formulaire est une première étape de candidature.</li>
                <li>Il ne vous engage pas et ne remplace pas une visite.</li>
                <li>
                  Si le bien correspond à vos critères et reste disponible, une visite sera organisée avec vous après
                  accord du propriétaire.
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-12 text-center">
            <Link href="/locataire/formulaire" passHref>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 w-full sm:w-auto"
              >
                Commencer la fiche
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Confidentiality notice */}
          <div className="text-center mt-6">
            <p className="flex items-center justify-center gap-2 text-sm text-green-700">
              <ShieldCheck className="h-4 w-4" />
              Vos données sont traitées de manière confidentielle
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center text-xs text-gray-600 space-y-2">
            <p className="font-semibold text-gray-700 text-sm">ALV IMMOBILIER</p>
            <p>19 Place du Général de Gaulle - 29190 PLEYBEN</p>
            <p>Tél. : 02 98 26 71 47 | E-mail : contact@alvimmobilier.bzh</p>
            <p>Site : www.alvimmobilier.com</p>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
              <p>Carte Professionnelle n° 2903 2016 000 009 781</p>
              <p>Compte séquestre CMB 04544529149 - Garantie SOCAF 120 000 €</p>
              <p>SAS AU CAPITAL DE 5720 € - Siret 440 808 913 00014</p>
              <p>R.C.S. QUIMPER 440 808 913 - NAF 6831Z</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

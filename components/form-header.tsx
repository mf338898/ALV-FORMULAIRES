import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
}

export function FormHeader({ title, subtitle, showBackButton = true, backHref = "/" }: FormHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo et titre */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Image
                src="/images/logo-alv-2.jpg"
                alt="Logo ALV Pleyben Immobilier"
                width={150}
                height={50}
                className="h-10 w-auto"
                priority
              />
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-slate-800">ALV Pleyben Immobilier</h2>
              </div>
            </div>
            
            {/* Séparateur vertical */}
            <div className="hidden md:block w-px h-8 bg-slate-300" />
            
            {/* Titre du formulaire */}
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-600">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions et contact */}
          <div className="flex items-center space-x-4">
            {/* Bouton retour */}
            {showBackButton && (
              <Button asChild variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <Link href={backHref} className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Retour</span>
                </Link>
              </Button>
            )}
            
            {/* Contact info */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <a
                href="tel:0298267147"
                className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <div className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">02 98 26 71 47</span>
              </a>
              <a
                href="mailto:contact@alvimobilier.bzh"
                className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <div className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">contact@alvimobilier.bzh</span>
              </a>
            </div>
            
            {/* Bouton contact mobile */}
            <div className="md:hidden">
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

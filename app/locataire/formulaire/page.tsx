"use client"

import { useState, type ReactNode, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LoadingOverlay } from "@/components/loading-overlay"

import {
  ArrowLeft,
  ArrowRight,
  Plus,
  AlertTriangle,
  Minus,
  Lock,
  Info,
  FilePenLine,
  Pencil,
  Mail,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Circle,
  ListIcon,
  Trash2,
  User,
  Briefcase,
  Baby,
  Shield,
  Search,
  FolderOpen,
  ClipboardCheck,
} from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import type { Locataire, CriteresRecherche, Garanties, RevenuAdditionnel } from "@/lib/types"
import { SegmentedProgress, type SegmentedStep, CircularStepIndicator } from "@/components/segmented-progress"
import { StepNavigation } from "@/components/step-navigation"

const createLocataireVide = (): Locataire => ({
  nom: "",
  prenom: "",
  civilite: "",
  situationConjugale: "",
  adresseActuelle: "",
  telephone: "",
  email: "",
  dateNaissance: "",
  lieuNaissance: "",
  situationActuelle: "",
  preavisADeposer: "",
  dureePreavise: "",
  dureePreaviseAutre: "",
  hebergeParQui: "",
  profession: "",
  etablissementFormation: "",
  employeurNom: "",
  employeurAdresse: "",
  employeurTelephone: "",
  dateEmbauche: "",
  typeContrat: "",
  salaire: "",
  revenusAdditionnels: [],
  dateFinContrat: "",
  dureeInscriptionInterim: "",
  agenceInterim: "",
  dateDebutActivite: "",
  regimeRetraite: "",
  dateDebutRetraite: "",
  alternance: "",
  typeAlternance: "",
  situationActuelleSansEmploi: "",
  origineRevenuPrincipal: "",
  origineRevenuPrincipalAutre: "",
})

// Fonction temporaire avec des données de test pour faciliter les tests
const createLocataireTest = (): Locataire => ({
  nom: "Dupont",
  prenom: "Marie",
  civilite: "femme",
  situationConjugale: "celibataire",
  adresseActuelle: "123 Rue de la Paix, 75001 Paris",
  telephone: "0612345678",
  email: "marie.dupont@email.com",
  dateNaissance: "1990-05-15",
  lieuNaissance: "Paris",
  situationActuelle: "locataire",
  preavisADeposer: "oui",
  dureePreavise: "3mois",
  dureePreaviseAutre: "",
  hebergeParQui: "",
  profession: "ingenieur",
  etablissementFormation: "",
  employeurNom: "TechCorp SARL",
  employeurAdresse: "456 Avenue des Champs, 75008 Paris",
  employeurTelephone: "0145678901",
  dateEmbauche: "2020-09-01",
  typeContrat: "cdi",
  salaire: "4500",
  revenusAdditionnels: [],
  dateFinContrat: "",
  dureeInscriptionInterim: "",
  agenceInterim: "",
  dateDebutActivite: "",
  regimeRetraite: "",
  dateDebutRetraite: "",
  alternance: "non",
  typeAlternance: "",
  situationActuelleSansEmploi: "",
  origineRevenuPrincipal: "salaire",
  origineRevenuPrincipalAutre: "",
})

// Fonction pour créer le 3ème locataire de test
const createLocataireTest3 = (): Locataire => ({
  nom: "Martin",
  prenom: "Pierre",
  civilite: "homme",
  situationConjugale: "marie",
  adresseActuelle: "789 Boulevard Saint-Germain, 75006 Paris",
  telephone: "0645678901",
  email: "pierre.martin@email.com",
  dateNaissance: "1988-12-03",
  lieuNaissance: "Lyon",
  situationActuelle: "locataire",
  preavisADeposer: "oui",
  dureePreavise: "2mois",
  dureePreaviseAutre: "",
  hebergeParQui: "",
  profession: "avocat",
  etablissementFormation: "",
  employeurNom: "Cabinet Martin & Associés",
  employeurAdresse: "321 Rue de Rivoli, 75001 Paris",
  employeurTelephone: "0145678902",
  dateEmbauche: "2018-03-15",
  typeContrat: "cdi",
  salaire: "5200",
  revenusAdditionnels: [],
  dateFinContrat: "",
  dureeInscriptionInterim: "",
  agenceInterim: "",
  dateDebutActivite: "",
  regimeRetraite: "",
  dateDebutRetraite: "",
  alternance: "non",
  typeAlternance: "",
  situationActuelleSansEmploi: "",
  origineRevenuPrincipal: "salaire",
  origineRevenuPrincipalAutre: "",
})

// Fonction pour créer le 4ème locataire de test
const createLocataireTest4 = (): Locataire => ({
  nom: "Dubois",
  prenom: "Sophie",
  civilite: "femme",
  situationConjugale: "divorcee",
  adresseActuelle: "456 Avenue Montaigne, 75008 Paris",
  telephone: "0678901234",
  email: "sophie.dubois@email.com",
  dateNaissance: "1992-08-22",
  lieuNaissance: "Marseille",
  situationActuelle: "locataire",
  preavisADeposer: "oui",
  dureePreavise: "1mois",
  dureePreaviseAutre: "",
  hebergeParQui: "",
  profession: "medecin",
  etablissementFormation: "",
  employeurNom: "Centre Médical Saint-Lazare",
  employeurAdresse: "654 Rue du Faubourg Saint-Honoré, 75008 Paris",
  employeurTelephone: "0145678903",
  dateEmbauche: "2021-11-01",
  typeContrat: "cdd",
  salaire: "3800",
  revenusAdditionnels: [],
  dateFinContrat: "2025-06-30",
  dureeInscriptionInterim: "",
  agenceInterim: "",
  dateDebutActivite: "",
  regimeRetraite: "",
  dateDebutRetraite: "",
  alternance: "non",
  typeAlternance: "",
  situationActuelleSansEmploi: "",
  origineRevenuPrincipal: "salaire",
  origineRevenuPrincipalAutre: "",
})

const criteresVides: CriteresRecherche = {
  nombreChambres: "",
  secteurSouhaite: "",
  rayonKm: "",
  dateEmmenagement: "",
  preavisADeposer: "",
  raisonDemenagement: "",
  informationsComplementaires: "",
  loyerMax: "",
}

// Données de test pour les critères de recherche
const criteresTest: CriteresRecherche = {
  nombreChambres: "2",
  secteurSouhaite: "centre-ville",
  rayonKm: "5",
  dateEmmenagement: "2024-09-01",
  preavisADeposer: "oui",
  raisonDemenagement: "changement de travail",
  informationsComplementaires: "Appartement lumineux avec balcon souhaité",
  loyerMax: "1200",
}

const garantiesVides: Garanties = {
  garantFamilial: "non",
  garantieVisale: "non",
  precisionGarant: "",
  garants: [],
}

// Données de test pour les garanties
const garantiesTest: Garanties = {
  garantFamilial: "oui",
  garantieVisale: "non",
  precisionGarant: "Parents comme garants familiaux",
  garants: [
    { nom: "Dupont", prenom: "Jean", email: "jean.dupont@email.com", telephone: "0623456789" },
    { nom: "Martin", prenom: "Sophie", email: "sophie.martin@email.com", telephone: "0634567890" }
  ],
}

const NumberInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const increment = () => onChange(value + 1)
  const decrement = () => onChange(Math.max(0, value - 1))

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={decrement} className="h-10 w-10 bg-transparent">
        <Minus className="h-4 w-4" />
      </Button>
      <Input type="text" readOnly value={value} className="w-16 text-center text-lg font-bold" />
      <Button type="button" variant="outline" size="icon" onClick={increment} className="h-10 w-10 bg-transparent">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

const RecapSection = ({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) => (
  <div className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between pb-2 border-b">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
      >
        <Pencil className="h-4 w-4" />
        Modifier
      </Button>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
)

const RecapItem = ({ label, value }: { label: string; value?: string | number | null }) => {
  const displayValue = value !== null && value !== undefined && String(value).trim() !== "" ? value : "Non renseigné"
  const valueClass = displayValue === "Non renseigné" ? "text-slate-400 italic" : "text-slate-800"
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-2">
      <p className="text-slate-500">{label}</p>
      <p className={cn("md:col-span-2 font-medium whitespace-pre-wrap break-words", valueClass)}>{displayValue}</p>
    </div>
  )
}

type StepDescriptor = {
  key: string
  label: string
  index: number
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhoneDigits(phone: string, min = 10) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= min
}

function isValidPhoneFR(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 && digits.startsWith("0")
}

// Accept "0" as valid. Empty string is invalid when required.
function isNonNegativeIntegerString(v: string) {
  if (!/^[0-9]+$/.test(v)) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= 0
}

export default function FormulairePage() {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false)

  const [bienConcerne, setBienConcerne] = useState("")
  const [locataires, setLocataires] = useState<Locataire[]>([createLocataireVide()])
  const [nombreEnfantsFoyer, setNombreEnfantsFoyer] = useState(0)
  const [criteresRecherche, setCriteresRecherche] = useState<CriteresRecherche>(criteresVides)
  const [garanties, setGaranties] = useState<Garanties>(garantiesVides)
  const [veutRemplirRecherche, setVeutRemplirRecherche] = useState<"oui" | "non">("non")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeAddressField, setActiveAddressField] = useState<string>("")
  const [dossierFacileLink, setDossierFacileLink] = useState<string>("")

  // Error visibility flags (only after "Étape suivante")
  const [showIdErrors, setShowIdErrors] = useState(false)
  const [showProErrors, setShowProErrors] = useState(false)
  const [showGarantErrors, setShowGarantErrors] = useState(false)
  const [errorLocIdx, setErrorLocIdx] = useState<number | null>(null)

  const isEmpty = (v?: string) => !v || v.trim() === ""

  // Steps config
  const etapesParLocataire = 2
  const etapeBien = 1
  const etapesLocataires = locataires.length * etapesParLocataire
  const etapeEnfants = locataires.length > 1 ? 1 : 0
  const etapeGaranties = 1
  const etapeRecherche = 1
  const etapeDossierFacile = 1
  const etapeRecap = 1
  const totalEtapes =
    etapeBien + etapesLocataires + etapeEnfants + etapeGaranties + etapeRecherche + etapeDossierFacile + etapeRecap

  const getEtapeDetails = () => {
    let currentEtape = etape
    if (currentEtape === 1) return { type: "bien", title: "Informations sur le bien" }
    currentEtape--

    if (currentEtape <= etapesLocataires) {
      const locataireIndex = Math.floor((currentEtape - 1) / etapesParLocataire)
      const isIdentite = (currentEtape - 1) % etapesParLocataire === 0
      const locataireIdText = locataires.length > 1 ? ` (Locataire ${locataireIndex + 1})` : ""
      return {
        type: (isIdentite ? "identite" : "professionnel"),
        title: `${isIdentite ? "Identité & Situation" : "Situation professionnelle"}${locataireIdText}`,
        subtitle: isIdentite
          ? "Toutes les informations sont obligatoires."
          : "Toutes les informations sont obligatoires.",
        locataireIndex,
      }
    }
    currentEtape -= etapesLocataires

    if (etapeEnfants && currentEtape === 1) return { type: "enfants", title: "Composition du foyer" }
    if (etapeEnfants) currentEtape--

    if (currentEtape === 1)
      return {
        type: "garanties",
        title: "Garanties du dossier",
        subtitle:
          "Facultatif, mais fortement recommandé. Un seul garant ou une seule garantie Visale couvre tous les locataires.",
      }
    currentEtape--

    if (currentEtape === 1) return { type: "recherche", title: "Votre recherche (facultatif)" }
    currentEtape--

    if (currentEtape === 1)
      return {
        type: "dossierfacile",
        title: "Gagnez du temps avec DossierFacile (ou vos pièces déjà prêtes)",
      }
    currentEtape--

    if (currentEtape === 1)
      return {
        type: "recapitulatif",
        title: "Récapitulatif de votre dossier",
        subtitle: "Veuillez vérifier vos informations avant de soumettre.",
      }

    return { type: "unknown", title: "Formulaire" }
  }

  const detailsEtape = getEtapeDetails()
  const currentLocataireGroupIndex =
    detailsEtape.type === "identite" || detailsEtape.type === "professionnel" ? (detailsEtape.locataireIndex ?? 0) : 0

  const ajouterLocataire = () => {
    if (locataires.length < 4) {
      setLocataires([...locataires, createLocataireVide()])
    }
  }

  const supprimerLocataire = (index: number) => {
    if (locataires.length > 1) {
      const nouveauxLocataires = locataires.filter((_, i) => i !== index)
      setLocataires(nouveauxLocataires)
      const newTotal =
        etapeBien +
        nouveauxLocataires.length * etapesParLocataire +
        etapeEnfants +
        etapeGaranties +
        etapeRecherche +
        etapeDossierFacile +
        etapeRecap
      if (etape > newTotal) {
        setEtape(newTotal)
      }
      setMaxReachedStep((prev) => Math.min(prev, newTotal))
    }
  }

  const handleNumericInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    callback: (value: string) => void,
    allowSpaces = false,
  ) => {
    const regex = allowSpaces ? /^[0-9\s]*$/ : /^[0-9]*$/
    if (regex.test(e.target.value)) {
      callback(e.target.value)
    }
  }

  // Validation en temps réel pour les champs critiques
  const validateFieldInRealTime = (field: string, value: string, locataireIndex: number) => {
    const L = locataires[locataireIndex]
    
    switch (field) {
      case 'email':
        if (value && !isValidEmail(value)) {
          return "Format d'email invalide"
        }
        break
      case 'telephone':
        if (value && !isValidPhoneDigits(value, 10)) {
          return "Le téléphone doit contenir au moins 10 chiffres"
        }
        break
      case 'salaire':
        if (value && !isNonNegativeIntegerString(value)) {
          return "Le salaire doit être un nombre positif"
        }
        break
      case 'employeurTelephone':
        if (value && !isValidPhoneDigits(value, 10)) {
          return "Le téléphone employeur doit contenir au moins 10 chiffres"
        }
        break
    }
    return null
  }

  const updateLocataire = (index: number, field: keyof Locataire, value: any) => {
    setLocataires(
      locataires.map((loc, i) => {
        if (i === index) {
          return { ...loc, [field]: value }
        }
        return loc
      }),
    )
  }

  const updateCriteresRecherche = (field: keyof CriteresRecherche, value: string) => {
    setCriteresRecherche((prev) => ({ ...prev, [field]: value }))
  }

  const updateGaranties = (field: keyof Garanties, value: "oui" | "non" | "" | any) => {
    setGaranties((prev) => ({ ...prev, [field]: value }))
  }

  const rechercherAdresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`)
      const data = await response.json()
      setSuggestions(data.features || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error("Erreur lors de la recherche d'adresses:", error)
    }
  }

  const rechercherVillesMunicipalites = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const url = new URL("https://api-adresse.data.gouv.fr/search/")
      url.searchParams.set("q", query)
      url.searchParams.set("type", "municipality")
      url.searchParams.set("limit", "6")
      const response = await fetch(url.toString())
      const data = await response.json()
      // Force municipalities only fallback check
      const feats = Array.isArray(data?.features)
        ? data.features.filter((f: any) => f?.properties?.type === "municipality" || f?.properties?.city)
        : []
      setSuggestions(feats)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Erreur lors de la recherche de villes:", error)
    }
  }

  const selectionnerAdresse = (adresse: any, fieldId: string) => {
    const adresseComplete = adresse.properties.label
    if (fieldId.startsWith("adresseActuelle-")) {
      const index = Number.parseInt(fieldId.split("-")[1])
      updateLocataire(index, "adresseActuelle", adresseComplete)
    } else if (fieldId.startsWith("employeurAdresse-")) {
      const index = Number.parseInt(fieldId.split("-")[1])
      updateLocataire(index, "employeurAdresse", adresseComplete)
    } else if (fieldId === "secteurSouhaite") {
      const p = adresse?.properties || {}
      const city = p.city || p.name || p.municipality || ""
      const cp = p.postcode || p.postalcode || ""
      const formatted = `${city}${cp ? ` ${cp}` : ""}`
      updateCriteresRecherche("secteurSouhaite", formatted.trim())
    } else if (fieldId.startsWith("lieuNaissance-")) {
      const index = Number.parseInt(fieldId.split("-")[1])
      const p = adresse?.properties || {}
      const city = p.city || p.name || p.municipality || ""
      const cp = p.postcode || p.postalcode || ""
      const formatted = `${city}${cp ? ` ${cp}` : ""}`
      updateLocataire(index, "lieuNaissance", formatted.trim())
    }
    setShowSuggestions(false)
    setActiveAddressField("")
  }

  const typesRevenusAdditionnels = ["Allocations familiales", "CAF", "Pension alimentaire", "Aide familiale", "Autre"]
  const originesRevenuSansEmploi = ["RSA", "Indemnités chômage", "Aide familiale", "Pension alimentaire", "Autre"]

  type GarantContact = {
    nom: string
    prenom: string
    email: string
    telephone: string
  }

  const addGarant = () => {
    if (garanties.garants.length >= 2) return
    // Ajouter un garant avec des données de test
    const nouveauGarant = garanties.garants.length === 0 ? {
      nom: "Dubois",
      prenom: "Claire",
      email: "claire.dubois@email.com",
      telephone: "0656789012"
    } : { nom: "", prenom: "", email: "", telephone: "" }
    setGaranties((prev) => ({
      ...prev,
      garants: [...(prev.garants || []), nouveauGarant],
    }))
  }

  const removeGarant = (index: number) => {
    setGaranties((prev) => ({
      ...prev,
      garants: (prev.garants || []).filter((_, i) => i !== index),
    }))
  }

  const updateGarantField = (index: number, field: keyof GarantContact, value: string) => {
    setGaranties((prev) => {
      const next = [...(prev.garants || [])]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, garants: next }
    })
  }

  const isGarantValid = (g: GarantContact) => {
    return (
      g.nom.trim() !== "" && g.prenom.trim() !== "" && isValidEmail(g.email || "") && isValidPhoneFR(g.telephone || "")
    )
  }

  const ajouterRevenuAdditionnel = (indexLocataire: number, typeRevenu: string) => {
    if (!typeRevenu) return
    // Ajouter un revenu avec des données de test
    const nouveauRevenu: RevenuAdditionnel = { 
      id: Date.now().toString(), 
      type: typeRevenu, 
      montant: typeRevenu === "freelance" ? "800" : typeRevenu === "investissement" ? "300" : "500", 
      precision: typeRevenu === "freelance" ? "Développement web freelance" : typeRevenu === "investissement" ? "Actions et obligations" : "Location saisonnière" 
    }
    setLocataires(
      locataires.map((loc, i) => {
        if (i === indexLocataire) {
          return {
            ...loc,
            revenusAdditionnels: [...loc.revenusAdditionnels, nouveauRevenu],
          }
        }
        return loc
      }),
    )
  }

  const supprimerRevenuAdditionnel = (indexLocataire: number, idRevenu: string) => {
    setLocataires(
      locataires.map((loc, i) => {
        if (i === indexLocataire) {
          return {
            ...loc,
            revenusAdditionnels: loc.revenusAdditionnels.filter((r) => r.id !== idRevenu),
          }
        }
        return loc
      }),
    )
  }

  const updateRevenuAdditionnel = (
    indexLocataire: number,
    idRevenu: string,
    field: "montant" | "precision",
    value: string,
  ) => {
    setLocataires(
      locataires.map((loc, i) => {
        if (i === indexLocataire) {
          return {
            ...loc,
            revenusAdditionnels: loc.revenusAdditionnels.map((revenu) => {
              if (revenu.id === idRevenu) {
                const updatedRevenu = { ...revenu }
                if (field === "montant") {
                  if (/^[0-9]*$/.test(value)) {
                    updatedRevenu[field] = value
                  }
                } else {
                  updatedRevenu[field] = value
                }
                return updatedRevenu
              }
              return revenu
            }),
          }
        }
        return loc
      }),
    )
  }

  // Validation helpers
  const validateIdentite = (idx: number) => {
    const L = locataires[idx]
    const requiredOk =
      !isEmpty(L.civilite) &&
      !isEmpty(L.prenom) &&
      !isEmpty(L.nom) &&
      !isEmpty(L.email) &&
      !isEmpty(L.telephone) &&
      !isEmpty(L.adresseActuelle) &&
      !isEmpty(L.situationConjugale) &&
      !isEmpty(L.situationActuelle) &&
      !isEmpty(L.dateNaissance) &&
      !isEmpty(L.lieuNaissance)

    const emailOk = isValidEmail(L.email || "")
    const phoneOk = isValidPhoneDigits(L.telephone || "", 10)
    return requiredOk && emailOk && phoneOk
  }

  type ProErrors = Record<string, boolean>

  const getProErrors = (idx: number): ProErrors => {
    const L = locataires[idx]
    const errors: ProErrors = {}

    const requireNonNegativeSalary = (flag: boolean) => {
      if (flag && !isNonNegativeIntegerString(L.salaire)) errors.salaire = true
    }
    const requireEmployerPhoneIf = (flag: boolean) => {
      if (flag && !isValidPhoneDigits(L.employeurTelephone || "", 10)) errors.employeurTelephone = true
    }

    switch (L.typeContrat) {
      case "cdi":
        if (isEmpty(L.employeurNom)) errors.employeurNom = true
        if (isEmpty(L.profession)) errors.profession = true
        if (isEmpty(L.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(L.dateEmbauche)) errors.dateEmbauche = true
        requireEmployerPhoneIf(true)
        requireNonNegativeSalary(true)
        break
      case "cdd":
        if (isEmpty(L.employeurNom)) errors.employeurNom = true
        if (isEmpty(L.profession)) errors.profession = true
        if (isEmpty(L.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(L.dateEmbauche)) errors.dateEmbauche = true
        if (isEmpty(L.dateFinContrat)) errors.dateFinContrat = true
        // make phone required for CDD too
        requireEmployerPhoneIf(true)
        requireNonNegativeSalary(true)
        break
      case "interim":
        if (isEmpty(L.agenceInterim)) errors.agenceInterim = true
        if (isEmpty(L.dureeInscriptionInterim)) errors.dureeInscriptionInterim = true
        requireNonNegativeSalary(true)
        break
      case "fonctionnaire":
        if (isEmpty(L.employeurNom)) errors.employeurNom = true
        if (isEmpty(L.profession)) errors.profession = true
        if (isEmpty(L.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(L.dateEmbauche)) errors.dateEmbauche = true
        requireEmployerPhoneIf(true)
        requireNonNegativeSalary(true)
        break
      case "freelance":
        if (isEmpty(L.profession)) errors.profession = true
        if (isEmpty(L.employeurNom)) errors.employeurNom = true
        if (isEmpty(L.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(L.dateDebutActivite)) errors.dateDebutActivite = true
        requireEmployerPhoneIf(true)
        requireNonNegativeSalary(true)
        break
      case "retraite":
        if (isEmpty(L.regimeRetraite)) errors.regimeRetraite = true
        if (isEmpty(L.dateDebutRetraite)) errors.dateDebutRetraite = true
        requireNonNegativeSalary(true)
        break
      case "etudiant":
        if (isEmpty(L.etablissementFormation)) errors.etablissementFormation = true
        // alternance answer itself is required (yes/no)
        if (isEmpty(L.alternance)) errors.alternance = true
        if (L.alternance === "oui") {
          if (isEmpty(L.typeAlternance)) errors.typeAlternance = true
          if (isEmpty(L.employeurNom)) errors.employeurNom = true
          if (isEmpty(L.employeurAdresse)) errors.employeurAdresse = true
          if (isEmpty(L.profession)) errors.profession = true
          if (isEmpty(L.dateEmbauche)) errors.dateEmbauche = true
          if (isEmpty(L.dateFinContrat)) errors.dateFinContrat = true
          requireEmployerPhoneIf(true)
          requireNonNegativeSalary(true)
        }
        break
      case "sans_emploi":
        if (isEmpty(L.situationActuelleSansEmploi)) errors.situationActuelleSansEmploi = true
        requireNonNegativeSalary(true)
        if (isEmpty(L.origineRevenuPrincipal)) errors.origineRevenuPrincipal = true
        if (L.origineRevenuPrincipal === "Autre" && isEmpty(L.origineRevenuPrincipalAutre))
          errors.origineRevenuPrincipalAutre = true
        break
      default:
        errors.typeContrat = isEmpty(L.typeContrat)
        break
    }

    // Autres revenus: allow 0 as valid
    if (L.revenusAdditionnels && L.revenusAdditionnels.length > 0) {
      for (const r of L.revenusAdditionnels) {
        if (!isNonNegativeIntegerString(r.montant)) {
          errors[`revenu-${r.id}`] = true
        }
      }
    }

    return errors
  }

  const isProfessionnelValid = (idx: number) => {
    const type = locataires[idx].typeContrat
    if (isEmpty(type)) return false
    const errs = getProErrors(idx)
    return Object.keys(errs).length === 0
  }

  const ouvrirConfirmation = () => {
    setShowConfirmDialog(true)
    setConfirmationChecked(false)
  }

  const fermerConfirmation = () => {
    setShowConfirmDialog(false)
    setConfirmationChecked(false)
  }

  const soumettreFormulaire = async () => {
    setIsSubmitting(true)
    setShowConfirmDialog(false)
    toast.info("Envoi de votre dossier en cours...")
    try {
      const response = await fetch("/api/generer-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienConcerne,
          locataires,
          nombreEnfantsFoyer,
          criteresRecherche,
          garanties,
          veutRemplirRecherche,
          dossierFacileLink,
        }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success(result.message || "Dossier envoyé avec succès !")
        router.push("/locataire/confirmation?email=" + encodeURIComponent(locataires[0].email))
      } else {
        toast.error(result.message || "Une erreur est survenue.", {
          description: result.error || "Veuillez réessayer ou contacter l'agence.",
        })
      }
    } catch (error) {
      console.error("Erreur soumission:", error)
      toast.error("Erreur de communication avec le serveur.", {
        description: "Veuillez vérifier votre connexion internet et réessayer.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextButtonText =
    detailsEtape.type === "dossierfacile"
      ? "Passer au récapitulatif"
      : etape === totalEtapes - 1
        ? "Voir le récapitulatif"
        : "Étape suivante"

  const getEtapeIndex = (type: string, locataireIndex = 0) => {
    switch (type) {
      case "bien":
        return 1
      case "identite":
        return 1 + locataireIndex * etapesParLocataire + 1
      case "professionnel":
        return 1 + locataireIndex * etapesParLocataire + 2
      case "enfants":
        return 1 + etapesLocataires + 1
      case "garanties":
        return 1 + etapesLocataires + etapeEnfants + 1
      case "recherche":
        return 1 + etapesLocataires + etapeEnfants + etapeGaranties + 1
      case "dossierfacile":
        return 1 + etapesLocataires + etapeEnfants + etapeGaranties + etapeRecherche + 1
      case "recapitulatif":
        return totalEtapes
      default:
        return etape
    }
  }

  const steps: StepDescriptor[] = [
    { key: "bien", label: "Bien", index: getEtapeIndex("bien") },
    ...locataires.flatMap((_, i) => [
      {
        key: `identite-${i}`,
        label: locataires.length > 1 ? `Identité L${i + 1}` : "Identité",
        index: getEtapeIndex("identite", i),
      },
      {
        key: `pro-${i}`,
        label: locataires.length > 1 ? `Profession L${i + 1}` : "Profession",
        index: getEtapeIndex("professionnel", i),
      },
    ]),
    ...(locataires.length > 1 ? [{ key: "enfants", label: "Enfants", index: getEtapeIndex("enfants") }] : []),
    { key: "garanties", label: "Garanties", index: getEtapeIndex("garanties") },
    { key: "recherche", label: "Recherche", index: getEtapeIndex("recherche") },
    { key: "dossierfacile", label: "Dossier", index: getEtapeIndex("dossierfacile") },
    { key: "recapitulatif", label: "Récapitulatif", index: getEtapeIndex("recapitulatif") },
  ]

  // Current step validity (for disabling Next button preemptively)
  const isCurrentStepValid = (() => {
    if (detailsEtape.type === "bien") {
      return !isEmpty(bienConcerne)
    }
    if (detailsEtape.type === "identite" && typeof detailsEtape.locataireIndex === "number") {
      return validateIdentite(detailsEtape.locataireIndex)
    }
    if (detailsEtape.type === "professionnel" && typeof detailsEtape.locataireIndex === "number") {
      return isProfessionnelValid(detailsEtape.locataireIndex)
    }
    return true
  })()

  const canLeaveCurrentStep = () => {
    if (detailsEtape.type === "bien" && isEmpty(bienConcerne)) {
      toast.error("Veuillez renseigner la référence du bien.")
      return false
    }
    
    if (detailsEtape.type === "identite" && typeof detailsEtape.locataireIndex === "number") {
      const li = detailsEtape.locataireIndex
      if (!validateIdentite(li)) {
        setShowIdErrors(true)
        setErrorLocIdx(li)
        
        // Message d'erreur plus détaillé
        const L = locataires[li]
        const missingFields: string[] = []
        if (isEmpty(L.civilite)) missingFields.push("civilité")
        if (isEmpty(L.prenom)) missingFields.push("prénom")
        if (isEmpty(L.nom)) missingFields.push("nom")
        if (isEmpty(L.email)) missingFields.push("email")
        if (isEmpty(L.telephone)) missingFields.push("téléphone")
        if (isEmpty(L.adresseActuelle)) missingFields.push("adresse actuelle")
        if (isEmpty(L.situationConjugale)) missingFields.push("situation conjugale")
        if (isEmpty(L.situationActuelle)) missingFields.push("situation actuelle")
        if (isEmpty(L.dateNaissance)) missingFields.push("date de naissance")
        if (isEmpty(L.lieuNaissance)) missingFields.push("lieu de naissance")
        
        const message = `Champs manquants : ${missingFields.join(", ")}. Veuillez compléter toutes les informations d'identité.`
        toast.error(message)
        return false
      }
    }
    
    if (detailsEtape.type === "professionnel" && typeof detailsEtape.locataireIndex === "number") {
      const li = detailsEtape.locataireIndex
      if (!isProfessionnelValid(li)) {
        setShowProErrors(true)
        setErrorLocIdx(li)
        
        // Message d'erreur plus détaillé selon le type de contrat
        const L = locataires[li]
        const proErrors = getProErrors(li)
        const missingFields = Object.keys(proErrors).map(key => {
          switch(key) {
            case 'employeurNom': return 'nom de l\'employeur'
            case 'profession': return 'profession'
            case 'employeurAdresse': return 'adresse de l\'employeur'
            case 'dateEmbauche': return 'date d\'embauche'
            case 'dateFinContrat': return 'date de fin de contrat'
            case 'agenceInterim': return 'agence d\'intérim'
            case 'dureeInscriptionInterim': return 'durée d\'inscription intérim'
            case 'regimeRetraite': return 'régime de retraite'
            case 'dateDebutRetraite': return 'date de début de retraite'
            case 'etablissementFormation': return 'établissement de formation'
            case 'alternance': return 'alternance'
            case 'typeAlternance': return 'type d\'alternance'
            case 'dateDebutActivite': return 'date de début d\'activité'
            case 'situationActuelleSansEmploi': return 'situation actuelle'
            case 'origineRevenuPrincipal': return 'origine du revenu principal'
            case 'origineRevenuPrincipalAutre': return 'précision origine revenu'
            case 'salaire': return 'salaire'
            case 'employeurTelephone': return 'téléphone employeur'
            default: return key
          }
        })
        
        const message = `Champs professionnels manquants : ${missingFields.join(", ")}. Veuillez compléter toutes les informations professionnelles.`
        toast.error(message)
        return false
      }
    }

    if (detailsEtape.type === "garanties") {
      if (garanties.garantFamilial === "oui") {
        const list = garanties.garants || []
        if (list.length === 0) {
          setShowGarantErrors(true)
          toast.error("Veuillez saisir au moins un garant familial (nom, prénom, e‑mail et téléphone).")
          return false
        }
        const allValid = list.every(isGarantValid)
        if (!allValid) {
          setShowGarantErrors(true)
          
          // Message d'erreur plus détaillé pour les garanties
          const invalidGarants = list.filter(g => !isGarantValid(g))
          const missingFields: string[] = []
          invalidGarants.forEach((g, idx) => {
            if (isEmpty(g.nom)) missingFields.push(`nom du garant ${idx + 1}`)
            if (isEmpty(g.prenom)) missingFields.push(`prénom du garant ${idx + 1}`)
            if (isEmpty(g.email)) missingFields.push(`email du garant ${idx + 1}`)
            if (isEmpty(g.telephone)) missingFields.push(`téléphone du garant ${idx + 1}`)
          })
          
          const message = `Informations garant manquantes : ${missingFields.join(", ")}. Veuillez compléter tous les champs.`
          toast.error(message)
          return false
        }
      }
    }

    setShowIdErrors(false)
    setShowProErrors(false)
    setErrorLocIdx(null)
    return true
  }

  const goToStep = (targetIndex: number) => {
    if (targetIndex <= etape) {
      setEtape(targetIndex)
      return
    }
    if (targetIndex > maxReachedStep) {
      if (!canLeaveCurrentStep()) return
      const next = Math.min(totalEtapes, etape + 1)
      setEtape(next)
      setMaxReachedStep((prev) => Math.max(prev, next))
      toast.info("Continuez pas à pas. Les étapes suivantes se débloqueront au fur et à mesure.")
      return
    }
    setEtape(targetIndex)
  }

  const goNext = () => {
    if (!canLeaveCurrentStep()) return
    const next = Math.min(totalEtapes, etape + 1)
    setEtape(next)
    setMaxReachedStep((prev) => Math.max(prev, next))
  }

  // For SegmentedProgress
  const segSteps: SegmentedStep[] = steps.map((s) => ({ key: s.key, label: s.label, index: s.index }))

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Mobile sticky header with circular step indicator */}
      <div className="md:hidden sticky top-0 z-30 -mt-8 mb-4 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <CircularStepIndicator current={etape} total={totalEtapes} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">{etape}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">
              Étape {etape} sur {totalEtapes}
            </p>
            <p className="text-xs text-slate-600">
              {detailsEtape.title}
            </p>
          </div>
        </div>
      </div>

      {/* Main header with title and back button */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Fiche de renseignement
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Formulaire de candidature locataire - ALV Immobilier
                </p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            size="lg"
            className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <div className="p-1.5 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold">Retour à l'accueil</span>
          </Button>
        </div>
      </div>

      {/* Segmented progress with centered title (desktop/tablet) + mobile steps toggle on the side */}
      {detailsEtape.type !== "recapitulatif" && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="w-full">
            <SegmentedProgress
              steps={segSteps}
              currentStep={etape}
              maxReachedStep={maxReachedStep}
              title={detailsEtape.title}
              onSelect={(idx) => {
                if (idx > maxReachedStep) {
                  toast.info("Veuillez terminer l'étape en cours avant d'accéder à la suivante.")
                  return
                }
                goToStep(idx)
              }}
            />
          </div>
          {/* Mobile: open steps plan */}
          <div className="md:hidden">
            <Sheet open={mobileStepsOpen} onOpenChange={setMobileStepsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm">
                  <ListIcon className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-700 font-medium">Étapes</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[380px] bg-gradient-to-br from-slate-50 to-white">
                <SheetHeader className="border-b border-slate-200 pb-4">
                  <SheetTitle className="text-xl font-bold text-slate-800">Étapes du formulaire</SheetTitle>
                  <p className="text-sm text-slate-600 mt-1">Progression : {etape} sur {totalEtapes}</p>
                </SheetHeader>
                <nav aria-label="Étapes (mobile)" className="mt-6 space-y-3">
                  {steps.map((s) => {
                    const completed = s.index < etape
                    const current = s.index === etape
                    const disabled = s.index > maxReachedStep
                    return (
                      <button
                        key={s.key}
                        onClick={() => {
                          if (disabled) {
                            toast.info("Veuillez terminer l'étape en cours avant d'accéder à la suivante.")
                            return
                          }
                          goToStep(s.index)
                          setMobileStepsOpen(false)
                        }}
                        aria-disabled={disabled}
                        className={cn(
                          "w-full text-left flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-300",
                          "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                          disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed hover:scale-100",
                          completed && "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800 shadow-sm",
                          current && "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800 shadow-md ring-2 ring-blue-200",
                          !completed &&
                            !current &&
                            !disabled &&
                            "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300",
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-300",
                          completed && "bg-emerald-100 text-emerald-700",
                          current && "bg-blue-100 text-blue-700",
                          !completed && !current && !disabled && "bg-slate-100 text-slate-600",
                          disabled && "bg-slate-50 text-slate-400"
                        )}>
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Circle className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium block">{s.label}</span>
                          {current && (
                            <span className="text-xs text-blue-600 font-medium">En cours</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Desktop/tablet: left steps sidebar + content */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Sidebar (hidden on small) */}
        <aside className="md:col-span-4 lg:col-span-3 hidden md:block">
          <nav aria-label="Étapes du formulaire" className="space-y-4">
            {/* Grouped per locataire */}
            <div className="px-3 py-2">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Informations personnelles</h3>
              <p className="text-xs text-slate-500 mt-1">Données des locataires</p>
            </div>
            <Accordion type="multiple" defaultValue={[`loc-${currentLocataireGroupIndex}`]} className="space-y-3">
              {locataires.map((_, i) => {
                const idxIdentite = getEtapeIndex("identite", i)
                const idxPro = getEtapeIndex("professionnel", i)

                const section = (key: "identite" | "professionnel", label: string, index: number) => {
                  const completed = index < etape
                  const current = index === etape
                  const disabled = index > maxReachedStep
                  
                  return (
                    <button
                      key={`${key}-${i}`}
                      onClick={() => {
                        if (disabled) {
                          toast.info("Veuillez terminer l'étape en cours avant d'accéder à la suivante.")
                          return
                        }
                        goToStep(index)
                      }}
                      aria-disabled={disabled}
                      className={cn(
                        "w-full text-left flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 group",
                        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                        disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed hover:scale-100",
                        completed && "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800 shadow-sm",
                        current && "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800 shadow-md ring-2 ring-blue-200",
                        !completed &&
                          !current &&
                          !disabled &&
                          "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        completed && "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
                        current && "bg-blue-100 text-blue-700 group-hover:bg-blue-200",
                        !completed && !current && !disabled && "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                        disabled && "bg-slate-50 text-slate-400"
                      )}>
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : key === "identite" ? (
                          <User className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Briefcase className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  )
                }

                return (
                  <AccordionItem key={`loc-${i}`} value={`loc-${i}`} className="border-0 rounded-xl bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {i + 1}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Locataire {i + 1}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 space-y-3">
                      {section("identite", "Identité", idxIdentite)}
                      {section("professionnel", "Profession", idxPro)}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>

            {/* Global sections */}
            <div className="space-y-3">
              <div className="px-3 py-2">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Étapes générales</h3>
                <p className="text-xs text-slate-500 mt-1">Configuration et finalisation</p>
              </div>
              {locataires.length > 1 &&
                (() => {
                  const index = getEtapeIndex("enfants")
                  const completed = index < etape
                  const current = index === etape
                  const disabled = index > maxReachedStep
                  return (
                    <button
                      onClick={() => {
                        if (disabled) {
                          toast.info("Veuillez terminer l'étape en cours avant d'accéder à la suivante.")
                          return
                        }
                        goToStep(index)
                      }}
                      aria-disabled={disabled}
                      className={cn(
                        "w-full text-left flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 group",
                        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                        disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed hover:scale-100",
                        completed && "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800 shadow-sm",
                        current && "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800 shadow-md ring-2 ring-blue-200",
                        !completed &&
                          !current &&
                          !disabled &&
                          "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        completed && "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
                        current && "bg-blue-100 text-blue-700 group-hover:bg-blue-200",
                        !completed && !current && !disabled && "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                        disabled && "bg-slate-50 text-slate-400"
                      )}>
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Baby className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <span className="text-sm font-medium">Enfants</span>
                    </button>
                  )
                })()}

              {[
                { key: "garanties", label: "Garanties", icon: Shield },
                { key: "recherche", label: "Recherche", icon: Search },
                { key: "dossierfacile", label: "Dossier", icon: FolderOpen },
                { key: "recapitulatif", label: "Récapitulatif", icon: ClipboardCheck },
              ].map((g) => {
                const index = getEtapeIndex(g.key)
                const completed = index < etape
                const current = index === etape
                const disabled = index > maxReachedStep
                const IconComponent = g.icon
                
                return (
                  <button
                    key={g.key}
                    onClick={() => {
                      if (disabled) {
                        toast.info("Veuillez terminer l'étape en cours avant d'accéder à la suivante.")
                        return
                      }
                      goToStep(index)
                    }}
                    aria-disabled={disabled}
                    className={cn(
                      "w-full text-left flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 group",
                      "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                      disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed hover:scale-100",
                      completed && "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800 shadow-sm",
                      current && "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800 shadow-md ring-2 ring-blue-200",
                      !completed &&
                        !current &&
                        !disabled &&
                        "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300",
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-all duration-300",
                      completed && "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
                      current && "bg-blue-100 text-blue-700 group-hover:bg-blue-200",
                      !completed && !current && !disabled && "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                      disabled && "bg-slate-50 text-slate-400"
                    )}>
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <IconComponent className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{g.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main card */}
        <section className="md:col-span-8 lg:col-span-9">
          <Card
            className={cn(
              "border-gray-200 shadow-lg",
              detailsEtape.type === "recapitulatif" ? "bg-transparent border-none shadow-none" : "bg-white",
            )}
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">{detailsEtape.title}</CardTitle>
              {"subtitle" in detailsEtape && detailsEtape.subtitle && (
                <p className="text-slate-500">{detailsEtape.subtitle}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* BIEN */}
              {detailsEtape.type === "bien" && (
                <div className="space-y-8">
                  <div>
                    <Label htmlFor="bien" className="font-semibold text-gray-700">
                      Référence du bien/location concernée{" "}
                      <span className="text-red-600" aria-hidden="true">
                        *
                      </span>
                    </Label>
                    <Input
                      id="bien"
                      value={bienConcerne}
                      onChange={(e) => setBienConcerne(e.target.value)}
                      placeholder="Ex: Réf. 4105, Maison PLEYBEN 650 €, Appartement Quimper 900€..."
                      className="mt-2"
                      required
                      maxLength={50}
                      aria-invalid={isEmpty(bienConcerne)}
                    />
                    {isEmpty(bienConcerne) && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                  </div>
                  <div className="space-y-4">
                    <Label className="font-semibold text-gray-700">Nombre de locataires</Label>
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg">
                      <div className="flex">
                        <div className="py-1">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
                        </div>
                        <div>
                          <p className="font-bold">
                            Merci d&apos;ajouter uniquement les personnes majeures qui seront signataires du bail.
                          </p>
                          <p className="text-sm">
                            N&apos;incluez pas les enfants ou les personnes qui n&apos;auront pas à signer le contrat de
                            location.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium text-gray-800">
                        {locataires.length} locataire{locataires.length > 1 ? "s" : ""}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={ajouterLocataire}
                        disabled={locataires.length >= 4}
                        className="flex items-center gap-2"
                        aria-label="Ajouter un locataire"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => supprimerLocataire(locataires.length - 1)}
                        disabled={locataires.length <= 1}
                        className="text-gray-600 hover:text-red-600"
                        aria-label="Retirer le dernier locataire"
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* IDENTITE */}
              {detailsEtape.type === "identite" &&
                typeof detailsEtape.locataireIndex === "number" &&
                (() => {
                  const i = detailsEtape.locataireIndex
                  const L = locataires[i]
                  const emailInvalid = !isEmpty(L.email) && !isValidEmail(L.email)
                  const phoneInvalid = !isEmpty(L.telephone) && !isValidPhoneDigits(L.telephone, 10)
                  // Only show after trying to leave step
                  const showReq = showIdErrors && errorLocIdx === i
                  return (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>
                            Civilité{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Select
                            value={L.civilite}
                            onValueChange={(value) => {
                              updateLocataire(i, "civilite", value)
                            }}
                          >
                            <SelectTrigger
                              className={cn("mt-1", showReq && isEmpty(L.civilite) && "border-red-500 bg-red-50")}
                              aria-invalid={showReq && isEmpty(L.civilite)}
                            >
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monsieur">Monsieur</SelectItem>
                              <SelectItem value="madame">Madame</SelectItem>
                            </SelectContent>
                          </Select>
                          {showReq && isEmpty(L.civilite) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                        <div />
                        <div>
                          <Label htmlFor={`prenom-${i}`}>
                            Prénom{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`prenom-${i}`}
                            value={L.prenom}
                            onChange={(e) => updateLocataire(i, "prenom", e.target.value)}
                            className={cn("mt-1", showReq && isEmpty(L.prenom) && "border-red-500 bg-red-50")}
                            maxLength={30}
                            aria-invalid={showReq && isEmpty(L.prenom)}
                          />
                          {showReq && isEmpty(L.prenom) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`nom-${i}`}>
                            Nom{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`nom-${i}`}
                            value={L.nom}
                            onChange={(e) => updateLocataire(i, "nom", e.target.value)}
                            className={cn("mt-1", showReq && isEmpty(L.nom) && "border-red-500 bg-red-50")}
                            maxLength={50}
                            aria-invalid={showReq && isEmpty(L.nom)}
                          />
                          {showReq && isEmpty(L.nom) && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                        </div>
                        <div>
                          <Label htmlFor={`email-${i}`}>
                            Email{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`email-${i}`}
                            type="email"
                            value={L.email}
                            onChange={(e) => updateLocataire(i, "email", e.target.value)}
                            className={cn(
                              "mt-1",
                              (showReq && isEmpty(L.email)) || emailInvalid ? "border-red-500 bg-red-50" : "",
                            )}
                            maxLength={60}
                            aria-invalid={(showReq && isEmpty(L.email)) || emailInvalid}
                          />
                          {showReq && isEmpty(L.email) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                          {!isEmpty(L.email) && emailInvalid && (
                            <p className="text-xs text-red-600 mt-1">Adresse email invalide</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`telephone-${i}`}>
                            Téléphone{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`telephone-${i}`}
                            type="tel"
                            value={L.telephone}
                            onChange={(e) => {
                              handleNumericInputChange(e, (value) => updateLocataire(i, "telephone", value), true)
                            }}
                            placeholder="06 12 34 56 78"
                            className={cn(
                              "mt-1",
                              (showReq && isEmpty(L.telephone)) || phoneInvalid ? "border-red-500 bg-red-50" : "",
                            )}
                            maxLength={15}
                            aria-invalid={(showReq && isEmpty(L.telephone)) || phoneInvalid}
                          />
                          {showReq && isEmpty(L.telephone) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                          {!isEmpty(L.telephone) && phoneInvalid && (
                            <p className="text-xs text-red-600 mt-1">Numéro invalide (10 chiffres requis)</p>
                          )}
                        </div>
                        <div>
                          <Label>
                            Date de naissance{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <DatePicker
                            id={`dateNaissance-${i}`}
                            value={L.dateNaissance}
                            onChange={(iso) => updateLocataire(i, "dateNaissance", iso)}
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            disableFuture
                            ariaLabel="Sélectionner la date de naissance"
                            className={cn("mt-1", showReq && isEmpty(L.dateNaissance) && "ring-1 ring-red-500 rounded")}
                            placeholder="jj/mm/aaaa"
                            displayFormat="dd/MM/yyyy"
                          />
                          {showReq && isEmpty(L.dateNaissance) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                        <div className="relative">
                          <Label htmlFor={`lieuNaissance-${i}`}>
                            Lieu de naissance{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`lieuNaissance-${i}`}
                            value={L.lieuNaissance}
                            onChange={(e) => {
                              updateLocataire(i, "lieuNaissance", e.target.value)
                              setActiveAddressField(`lieuNaissance-${i}`)
                              rechercherVillesMunicipalites(e.target.value)
                            }}
                            className={cn("mt-1", showReq && isEmpty(L.lieuNaissance) && "border-red-500 bg-red-50")}
                            maxLength={80}
                            placeholder="Ville ou code postal"
                            aria-invalid={showReq && isEmpty(L.lieuNaissance)}
                          />
                          {showReq && isEmpty(L.lieuNaissance) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                          {showSuggestions && activeAddressField === `lieuNaissance-${i}` && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                              {suggestions.map((suggestion, idx) => {
                                const p = suggestion?.properties || {}
                                const city = p.city || p.name || p.municipality || ""
                                const cp = p.postcode || p.postalcode || ""
                                const affichage = `${city}${cp ? ` ${cp}` : ""}`
                                return (
                                  <div
                                    key={idx}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => selectionnerAdresse(suggestion, `lieuNaissance-${i}`)}
                                  >
                                    {affichage || p.label}
                                  </div>
                                )
                              })}
                              <div className="p-2 text-xs text-slate-500 border-t">
                                Aucune de ces propositions ? Continuez à saisir librement.
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2 relative">
                          <Label htmlFor={`adresseActuelle-${i}`}>
                            Adresse actuelle{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            id={`adresseActuelle-${i}`}
                            value={L.adresseActuelle}
                            onChange={(e) => {
                              updateLocataire(i, "adresseActuelle", e.target.value)
                              setActiveAddressField(`adresseActuelle-${i}`)
                              rechercherAdresses(e.target.value)
                            }}
                            className={cn("mt-1", showReq && isEmpty(L.adresseActuelle) && "border-red-500 bg-red-50")}
                            placeholder="Commencez à taper votre adresse..."
                            maxLength={120}
                            aria-invalid={showReq && isEmpty(L.adresseActuelle)}
                          />
                          {showReq && isEmpty(L.adresseActuelle) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                          {showSuggestions &&
                            activeAddressField === `adresseActuelle-${i}` &&
                            suggestions.length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                {suggestions.map((suggestion, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => selectionnerAdresse(suggestion, `adresseActuelle-${i}`)}
                                  >
                                    {suggestion.properties.label}
                                  </div>
                                ))}
                                <div className="p-2 text-xs text-slate-500 border-t">
                                  Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                </div>
                              </div>
                            )}
                        </div>
                        <div className="md:col-span-2 -mt-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Bouton pour copier depuis le locataire 1 (toujours disponible si c'est pas le locataire 1) */}
                            {i > 0 && locataires[0]?.adresseActuelle?.trim() && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateLocataire(i, "adresseActuelle", locataires[0].adresseActuelle)}
                                className="h-8 px-2 text-xs"
                              >
                                Copier depuis Locataire 1
                              </Button>
                            )}
                            {/* Bouton pour copier depuis le locataire précédent (seulement si différent du locataire 1) */}
                            {i > 1 && locataires[i - 1]?.adresseActuelle?.trim() && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateLocataire(i, "adresseActuelle", locataires[i - 1].adresseActuelle)}
                                className="h-8 px-2 text-xs"
                              >
                                Copier depuis Locataire {i}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>
                            Situation conjugale{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Select
                            value={L.situationConjugale}
                            onValueChange={(value) => {
                              updateLocataire(i, "situationConjugale", value)
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "mt-1",
                                showReq && isEmpty(L.situationConjugale) && "border-red-500 bg-red-50",
                              )}
                              aria-invalid={showReq && isEmpty(L.situationConjugale)}
                            >
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="celibataire">Célibataire</SelectItem>
                              <SelectItem value="marie">Marié(e)</SelectItem>
                              <SelectItem value="pacs">Pacsé(e)</SelectItem>
                              <SelectItem value="concubinage">Concubinage</SelectItem>
                              <SelectItem value="divorce">Divorcé(e)</SelectItem>
                              <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                            </SelectContent>
                          </Select>
                          {showReq && isEmpty(L.situationConjugale) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                        <div>
                          <Label>
                            Statut logement actuel{" "}
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Select
                            value={L.situationActuelle}
                            onValueChange={(value) => {
                              updateLocataire(i, "situationActuelle", value)
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "mt-1",
                                showReq && isEmpty(L.situationActuelle) && "border-red-500 bg-red-50",
                              )}
                              aria-invalid={showReq && isEmpty(L.situationActuelle)}
                            >
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="locataire">Locataire</SelectItem>
                              <SelectItem value="proprietaire">Propriétaire occupant</SelectItem>
                              <SelectItem value="heberge_gratuit">Hébergé à titre gratuit</SelectItem>
                              <SelectItem value="loge_employeur">Logé par un employeur</SelectItem>
                              <SelectItem value="sans_logement">Sans logement fixe</SelectItem>
                            </SelectContent>
                          </Select>
                          {showReq && isEmpty(L.situationActuelle) && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                      </div>
                      {locataires.length === 1 && (
                        <div className="pt-6 border-t">
                          <Label className="font-semibold text-gray-700">Nombre d&apos;enfants à charge</Label>
                          <p className="text-sm text-slate-500 mt-1">Combien d&apos;enfants à charge dans le foyer ?</p>
                          <div className="mt-2">
                            <NumberInput value={nombreEnfantsFoyer} onChange={setNombreEnfantsFoyer} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

              {/* PROFESSIONNEL */}
              {detailsEtape.type === "professionnel" &&
                typeof detailsEtape.locataireIndex === "number" &&
                (() => {
                  const i = detailsEtape.locataireIndex
                  const L = locataires[i]
                  const proErrors = getProErrors(i)
                  // Only reveal on navigation attempt
                  const showErr = showProErrors && errorLocIdx === i
                  const err = (key: keyof typeof proErrors) => showErr && proErrors[key as string]

                  const phoneErrorMsg = "Numéro invalide (10 chiffres minimum)"

                  return (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <Label htmlFor={`situation-pro-${i}`}>
                          Sélectionner votre situation professionnelle{" "}
                          <span className="text-red-600" aria-hidden="true">
                            *
                          </span>
                        </Label>
                        <Select
                          value={L.typeContrat}
                          onValueChange={(value) => {
                            updateLocataire(i, "typeContrat", value)
                          }}
                        >
                          <SelectTrigger
                            id={`situation-pro-${i}`}
                            className={cn(err("typeContrat") && "border-red-500 bg-red-50")}
                            aria-invalid={err("typeContrat")}
                          >
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cdi">CDI</SelectItem>
                            <SelectItem value="cdd">CDD</SelectItem>
                            <SelectItem value="interim">Intérim</SelectItem>
                            <SelectItem value="fonctionnaire">Fonctionnaire</SelectItem>
                            <SelectItem value="freelance">Freelance / Indépendant</SelectItem>
                            <SelectItem value="retraite">Retraité(e)</SelectItem>
                            <SelectItem value="etudiant">Étudiant(e)</SelectItem>
                            <SelectItem value="sans_emploi">Sans emploi</SelectItem>
                          </SelectContent>
                        </Select>
                        {showErr && isEmpty(L.typeContrat) && <p className="text-xs text-red-600">Champ obligatoire</p>}
                      </div>

                      {/* CDI */}
                      {L.typeContrat === "cdi" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Nom de l'entreprise / administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurNom}
                              onChange={(e) => {
                                updateLocataire(i, "employeurNom", e.target.value)
                              }}
                              placeholder="Ex: Carrefour, CHU de Quimper…"
                              className={cn("mt-1", err("employeurNom") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("employeurNom")}
                            />
                            {err("employeurNom") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Profession / poste occupé <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.profession}
                              onChange={(e) => {
                                updateLocataire(i, "profession", e.target.value)
                              }}
                              placeholder="Ex: Vendeur(se), Enseignant(e)…"
                              className={cn("mt-1", err("profession") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("profession")}
                            />
                            {err("profession") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2 relative">
                            <Label>
                              Adresse de l'entreprise / administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurAdresse}
                              onChange={(e) => {
                                updateLocataire(i, "employeurAdresse", e.target.value)
                                setActiveAddressField(`employeurAdresse-${i}`)
                                rechercherAdresses(e.target.value)
                              }}
                              placeholder="Ex: 12 rue du Stade, 29000 Quimper"
                              className={cn("mt-1", err("employeurAdresse") && "border-red-500 bg-red-50")}
                              maxLength={120}
                              aria-invalid={err("employeurAdresse")}
                            />
                            {showSuggestions &&
                              activeAddressField === `employeurAdresse-${i}` &&
                              suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                  {suggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectionnerAdresse(suggestion, `employeurAdresse-${i}`)}
                                    >
                                      {suggestion.properties.label}
                                    </div>
                                  ))}
                                  <div className="p-2 text-xs text-slate-500 border-t">
                                    Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                  </div>
                                </div>
                              )}
                          </div>
                          <div>
                            <Label>
                              Numéro de téléphone de l'entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="tel"
                              value={L.employeurTelephone}
                              onChange={(e) =>
                                handleNumericInputChange(
                                  e,
                                  (value) => updateLocataire(i, "employeurTelephone", value),
                                  true,
                                )
                              }
                              placeholder="01 23 45 67 89"
                              className={cn("mt-1", err("employeurTelephone") && "border-red-500 bg-red-50")}
                              maxLength={15}
                              aria-invalid={err("employeurTelephone")}
                            />
                            {err("employeurTelephone") && <p className="text-xs text-red-600 mt-1">{phoneErrorMsg}</p>}
                          </div>
                          <div>
                            <Label>
                              Date d'embauche <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateEmbauche-${i}`}
                              value={L.dateEmbauche}
                              onChange={(iso) => updateLocataire(i, "dateEmbauche", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 1}
                              ariaLabel="Sélectionner la date d'embauche"
                              className={cn("mt-1", err("dateEmbauche") && "ring-1 ring-red-500 rounded")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateEmbauche") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Salaire net mensuel (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CDD */}
                      {L.typeContrat === "cdd" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Nom de l'entreprise / administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurNom}
                              onChange={(e) => {
                                updateLocataire(i, "employeurNom", e.target.value)
                              }}
                              className={cn("mt-1", err("employeurNom") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("employeurNom")}
                            />
                            {err("employeurNom") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Profession / poste occupé <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.profession}
                              onChange={(e) => {
                                updateLocataire(i, "profession", e.target.value)
                              }}
                              placeholder="Ex: Serveur(se), Ouvrier(ère)…"
                              className={cn("mt-1", err("profession") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("profession")}
                            />
                            {err("profession") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Adresse de l'entreprise / administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurAdresse}
                              onChange={(e) => {
                                updateLocataire(i, "employeurAdresse", e.target.value)
                                setActiveAddressField(`employeurAdresse-${i}`)
                                rechercherAdresses(e.target.value)
                              }}
                              className={cn("mt-1", err("employeurAdresse") && "border-red-500 bg-red-50")}
                              maxLength={120}
                              aria-invalid={err("employeurAdresse")}
                              placeholder="Commencez à taper l'adresse de l'entreprise…"
                            />
                            {showSuggestions &&
                              activeAddressField === `employeurAdresse-${i}` &&
                              suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                  {suggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectionnerAdresse(suggestion, `employeurAdresse-${i}`)}
                                    >
                                      {suggestion.properties.label}
                                    </div>
                                  ))}
                                  <div className="p-2 text-xs text-slate-500 border-t">
                                    Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                  </div>
                                </div>
                              )}
                          </div>
                          <div>
                            <Label>
                              Numéro de téléphone de l'entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="tel"
                              value={L.employeurTelephone}
                              onChange={(e) =>
                                handleNumericInputChange(
                                  e,
                                  (value) => updateLocataire(i, "employeurTelephone", value),
                                  true,
                                )
                              }
                              placeholder="01 23 45 67 89"
                              className={cn("mt-1", err("employeurTelephone") && "border-red-500 bg-red-50")}
                              maxLength={15}
                              aria-invalid={err("employeurTelephone")}
                            />
                            {err("employeurTelephone") && <p className="text-xs text-red-600 mt-1">{phoneErrorMsg}</p>}
                          </div>
                          <div>
                            <Label>
                              Date d'embauche <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateEmbauche-${i}`}
                              value={L.dateEmbauche}
                              onChange={(iso) => updateLocataire(i, "dateEmbauche", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 2}
                              ariaLabel="Sélectionner la date d'embauche"
                              className={cn("mt-1", err("dateEmbauche") && "ring-1 ring-red-500 rounded-md")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateEmbauche") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Date de fin de contrat <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateFinContrat-${i}`}
                              value={L.dateFinContrat}
                              onChange={(iso) => updateLocataire(i, "dateFinContrat", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 2}
                              ariaLabel="Sélectionner la date de fin de contrat"
                              className={cn("mt-1", err("dateFinContrat") && "ring-1 ring-red-500 rounded-md")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateFinContrat") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Salaire net mensuel (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Intérim */}
                      {L.typeContrat === "interim" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Agence d'intérim principale <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.agenceInterim}
                              onChange={(e) => {
                                updateLocataire(i, "agenceInterim", e.target.value)
                              }}
                              placeholder="Ex: Manpower, Adecco…"
                              className={cn("mt-1", err("agenceInterim") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("agenceInterim")}
                            />
                            {err("agenceInterim") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Depuis combien de temps êtes-vous en intérim ? <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.dureeInscriptionInterim}
                              onChange={(e) => {
                                updateLocataire(i, "dureeInscriptionInterim", e.target.value)
                              }}
                              placeholder="Ex: 18 mois, Depuis janvier 2023…"
                              className={cn("mt-1", err("dureeInscriptionInterim") && "border-red-500 bg-red-50")}
                              maxLength={50}
                              aria-invalid={err("dureeInscriptionInterim")}
                            />
                            {err("dureeInscriptionInterim") && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Revenu net mensuel moyen (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              placeholder="Ex: 1400"
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fonctionnaire */}
                      {L.typeContrat === "fonctionnaire" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Nom de l'administration / entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurNom}
                              onChange={(e) => {
                                updateLocataire(i, "employeurNom", e.target.value)
                              }}
                              placeholder="Ex: Mairie de Quimper, CHU de Quimper…"
                              className={cn("mt-1", err("employeurNom") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("employeurNom")}
                            />
                            {err("employeurNom") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Profession / poste occupé <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.profession}
                              onChange={(e) => {
                                updateLocataire(i, "profession", e.target.value)
                              }}
                              placeholder="Ex: Enseignant(e), Infirmier(ère)…"
                              className={cn("mt-1", err("profession") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("profession")}
                            />
                            {err("profession") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2 relative">
                            <Label>
                              Adresse de l'administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurAdresse}
                              onChange={(e) => {
                                updateLocataire(i, "employeurAdresse", e.target.value)
                                setActiveAddressField(`employeurAdresse-${i}`)
                                rechercherAdresses(e.target.value)
                              }}
                              className={cn("mt-1", err("employeurAdresse") && "border-red-500 bg-red-50")}
                              maxLength={120}
                              aria-invalid={err("employeurAdresse")}
                              placeholder="Commencez à taper l'adresse de l'administration…"
                            />
                            {showSuggestions &&
                              activeAddressField === `employeurAdresse-${i}` &&
                              suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                  {suggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectionnerAdresse(suggestion, `employeurAdresse-${i}`)}
                                    >
                                      {suggestion.properties.label}
                                    </div>
                                  ))}
                                  <div className="p-2 text-xs text-slate-500 border-t">
                                    Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                  </div>
                                </div>
                              )}
                          </div>
                          <div>
                            <Label>
                              Numéro de téléphone de l'administration <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="tel"
                              value={L.employeurTelephone}
                              onChange={(e) =>
                                handleNumericInputChange(
                                  e,
                                  (value) => updateLocataire(i, "employeurTelephone", value),
                                  true,
                                )
                              }
                              placeholder="01 23 45 67 89"
                              className={cn("mt-1", err("employeurTelephone") && "border-red-500 bg-red-50")}
                              maxLength={15}
                              aria-invalid={err("employeurTelephone")}
                            />
                            {err("employeurTelephone") && <p className="text-xs text-red-600 mt-1">{phoneErrorMsg}</p>}
                          </div>
                          <div>
                            <Label>
                              Date d'embauche <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateEmbauche-${i}`}
                              value={L.dateEmbauche}
                              onChange={(iso) => updateLocataire(i, "dateEmbauche", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 1}
                              ariaLabel="Sélectionner la date d'embauche"
                              className={cn("mt-1", err("dateEmbauche") && "ring-1 ring-red-500 rounded")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateEmbauche") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Salaire net mensuel (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Freelance */}
                      {L.typeContrat === "freelance" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Activité / métier <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.profession}
                              onChange={(e) => {
                                updateLocataire(i, "profession", e.target.value)
                              }}
                              placeholder="Ex: Graphiste, Plombier…"
                              className={cn("mt-1", err("profession") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("profession")}
                            />
                            {err("profession") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Nom de la structure <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurNom}
                              onChange={(e) => {
                                updateLocataire(i, "employeurNom", e.target.value)
                              }}
                              placeholder="Ex: SARL Dubois"
                              className={cn("mt-1", err("employeurNom") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("employeurNom")}
                            />
                            {err("employeurNom") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2 relative">
                            <Label>
                              Adresse de la structure <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.employeurAdresse}
                              onChange={(e) => {
                                updateLocataire(i, "employeurAdresse", e.target.value)
                                setActiveAddressField(`employeurAdresse-${i}`)
                                rechercherAdresses(e.target.value)
                              }}
                              className={cn("mt-1", err("employeurAdresse") && "border-red-500 bg-red-50")}
                              maxLength={120}
                              aria-invalid={err("employeurAdresse")}
                              placeholder="Commencez à taper l'adresse (numéro + rue + ville)…"
                            />
                            {showSuggestions &&
                              activeAddressField === `employeurAdresse-${i}` &&
                              suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                  {suggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectionnerAdresse(suggestion, `employeurAdresse-${i}`)}
                                    >
                                      {suggestion.properties.label}
                                    </div>
                                  ))}
                                  <div className="p-2 text-xs text-slate-500 border-t">
                                    Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                  </div>
                                </div>
                              )}
                          </div>
                          <div>
                            <Label>
                              Numéro de téléphone <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="tel"
                              value={L.employeurTelephone}
                              onChange={(e) =>
                                handleNumericInputChange(
                                  e,
                                  (value) => updateLocataire(i, "employeurTelephone", value),
                                  true,
                                )
                              }
                              placeholder="01 23 45 67 89"
                              className={cn("mt-1", err("employeurTelephone") && "border-red-500 bg-red-50")}
                              maxLength={15}
                              aria-invalid={err("employeurTelephone")}
                            />
                            {err("employeurTelephone") && <p className="text-xs text-red-600 mt-1">{phoneErrorMsg}</p>}
                          </div>
                          <div>
                            <Label>
                              Date de début d'activité <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateDebutActivite-${i}`}
                              value={L.dateDebutActivite}
                              onChange={(iso) => updateLocataire(i, "dateDebutActivite", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 1}
                              ariaLabel="Sélectionner la date de début d'activité"
                              className={cn("mt-1", err("dateDebutActivite") && "ring-1 ring-red-500 rounded")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateDebutActivite") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Revenu net moyen mensuel (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Retraite */}
                      {L.typeContrat === "retraite" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>
                              Régime ou caisse principale <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.regimeRetraite}
                              onChange={(e) => {
                                updateLocataire(i, "regimeRetraite", e.target.value)
                              }}
                              placeholder="Ex: Sécurité Sociale, Agirc-Arrco…"
                              className={cn("mt-1", err("regimeRetraite") && "border-red-500 bg-red-50")}
                              maxLength={100}
                              aria-invalid={err("regimeRetraite")}
                            />
                            {err("regimeRetraite") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div>
                            <Label>
                              Date de départ à la retraite <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id={`dateDebutRetraite-${i}`}
                              value={L.dateDebutRetraite}
                              onChange={(iso) => updateLocataire(i, "dateDebutRetraite", iso)}
                              fromYear={1950}
                              toYear={new Date().getFullYear() + 5}
                              ariaLabel="Sélectionner la date de départ à la retraite"
                              className={cn("mt-1", err("dateDebutRetraite") && "ring-1 ring-red-500 rounded-md")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {err("dateDebutRetraite") && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Montant de la pension nette mensuelle (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={err("salaire")}
                            />
                            {err("salaire") && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Étudiant */}
                      {L.typeContrat === "etudiant" && (
                        <div className="space-y-6">
                          <div>
                            <Label>
                              Établissement / formation <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.etablissementFormation}
                              onChange={(e) => {
                                updateLocataire(i, "etablissementFormation", e.target.value)
                              }}
                              placeholder="Ex: Université de Rennes, BTS Comptabilité…"
                              className={cn(
                                "mt-1",
                                showErr && proErrors.etablissementFormation && "border-red-500 bg-red-50",
                              )}
                              maxLength={150}
                              aria-invalid={showErr && proErrors.etablissementFormation}
                            />
                            {showErr && proErrors.etablissementFormation && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Êtes-vous en alternance ? <span className="text-red-600">*</span>
                            </Label>
                            <Select
                              value={L.alternance}
                              onValueChange={(value) => {
                                updateLocataire(i, "alternance", value)
                              }}
                            >
                              <SelectTrigger
                                className={cn("mt-1", showErr && proErrors.alternance && "border-red-500 bg-red-50")}
                              >
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oui">Oui</SelectItem>
                                <SelectItem value="non">Non</SelectItem>
                              </SelectContent>
                            </Select>
                            {showErr && proErrors.alternance && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          {L.alternance === "oui" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                              <div>
                                <Label>
                                  Type de contrat <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                  value={L.typeAlternance}
                                  onValueChange={(value) => {
                                    updateLocataire(i, "typeAlternance", value)
                                  }}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "mt-1",
                                      showErr && proErrors.typeAlternance && "border-red-500 bg-red-50",
                                    )}
                                    aria-invalid={showErr && proErrors.typeAlternance}
                                  >
                                    <SelectValue placeholder="Ex: Apprentissage, Pro" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="apprentissage">Apprentissage</SelectItem>
                                    <SelectItem value="professionnalisation">Professionnalisation</SelectItem>
                                  </SelectContent>
                                </Select>
                                {showErr && proErrors.typeAlternance && (
                                  <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                )}
                              </div>
                              <div>
                                <Label>
                                  Nom de l'entreprise <span className="text-red-600">*</span>
                                </Label>
                                <Input
                                  value={L.employeurNom}
                                  onChange={(e) => {
                                    updateLocataire(i, "employeurNom", e.target.value)
                                  }}
                                  className={cn(
                                    "mt-1",
                                    showErr && proErrors.employeurNom && "border-red-500 bg-red-50",
                                  )}
                                  maxLength={100}
                                  aria-invalid={showErr && proErrors.employeurNom}
                                />
                                {showErr && proErrors.employeurNom && (
                                  <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                )}
                              </div>
                              <div className="md:col-span-2 relative">
                                <Label>
                                  Adresse de l'entreprise <span className="text-red-600">*</span>
                                </Label>
                                <Input
                                  value={L.employeurAdresse}
                                  onChange={(e) => {
                                    updateLocataire(i, "employeurAdresse", e.target.value)
                                    setActiveAddressField(`employeurAdresse-${i}`)
                                    rechercherAdresses(e.target.value)
                                  }}
                                  className={cn(
                                    "mt-1",
                                    showErr && proErrors.employeurAdresse && "border-red-500 bg-red-50",
                                  )}
                                  maxLength={120}
                                  aria-invalid={showErr && proErrors.employeurAdresse}
                                  placeholder="Commencez à taper l'adresse de l'entreprise…"
                                />
                                {showSuggestions &&
                                  activeAddressField === `employeurAdresse-${i}` &&
                                  suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                      {suggestions.map((suggestion, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                          onClick={() => selectionnerAdresse(suggestion, `employeurAdresse-${i}`)}
                                        >
                                          {suggestion.properties.label}
                                        </div>
                                      ))}
                                      <div className="p-2 text-xs text-slate-500 border-t">
                                        Aucune de ces propositions ? Continuez à saisir votre adresse librement.
                                      </div>
                                    </div>
                                  )}
                              </div>
                              <div>
                                <Label>
                                  Numéro de téléphone de l'entreprise <span className="text-red-600">*</span>
                                </Label>
                                <Input
                                  type="tel"
                                  value={L.employeurTelephone}
                                  onChange={(e) =>
                                    handleNumericInputChange(
                                      e,
                                      (value) => updateLocataire(i, "employeurTelephone", value),
                                      true,
                                    )
                                  }
                                  placeholder="01 23 45 67 89"
                                  className={cn(
                                    "mt-1",
                                    showErr && proErrors.employeurTelephone && "border-red-500 bg-red-50",
                                  )}
                                  maxLength={15}
                                  aria-invalid={showErr && proErrors.employeurTelephone}
                                />
                                {showErr && proErrors.employeurTelephone && (
                                  <p className="text-xs text-red-600 mt-1">{phoneErrorMsg}</p>
                                )}
                              </div>
                              <div>
                                <Label>
                                  Profession / poste occupé <span className="text-red-600">*</span>
                                </Label>
                                <Input
                                  value={L.profession}
                                  onChange={(e) => {
                                    updateLocataire(i, "profession", e.target.value)
                                  }}
                                  className={cn("mt-1", showErr && proErrors.profession && "border-red-500 bg-red-50")}
                                  maxLength={100}
                                  aria-invalid={showErr && proErrors.profession}
                                />
                                {showErr && proErrors.profession && (
                                  <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                )}
                              </div>
                              <div>
                                <Label>
                                  Date de début de contrat <span className="text-red-600">*</span>
                                </Label>
                                <DatePicker
                                  id={`dateDebut-${i}`}
                                  value={L.dateEmbauche}
                                  onChange={(iso) => updateLocataire(i, "dateEmbauche", iso)}
                                  fromYear={1990}
                                  toYear={new Date().getFullYear() + 2}
                                  ariaLabel="Sélectionner la date de début de contrat"
                                  className={cn(
                                    "mt-1",
                                    showErr && proErrors.dateEmbauche && "ring-1 ring-red-500 rounded",
                                  )}
                                  placeholder="jj/mm/aaaa"
                                  displayFormat="dd/MM/yyyy"
                                />
                                {showErr && proErrors.dateEmbauche && (
                                  <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                )}
                              </div>
                              <div>
                                <Label>
                                  Date de fin de contrat <span className="text-red-600">*</span>
                                </Label>
                                <DatePicker
                                  id={`dateFin-${i}`}
                                  value={L.dateFinContrat}
                                  onChange={(iso) => updateLocataire(i, "dateFinContrat", iso)}
                                  fromYear={1990}
                                  toYear={new Date().getFullYear() + 3}
                                  ariaLabel="Sélectionner la date de fin de contrat"
                                  className={cn(
                                    "mt-1",
                                    showErr && proErrors.dateFinContrat && "ring-1 ring-red-500 rounded",
                                  )}
                                  placeholder="jj/mm/aaaa"
                                  displayFormat="dd/MM/yyyy"
                                />
                                {showErr && proErrors.dateFinContrat && (
                                  <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                )}
                              </div>
                              <div className="md:col-span-2">
                                <Label>
                                  Salaire net mensuel (€) <span className="text-red-600">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  value={L.salaire}
                                  onChange={(e) => {
                                    handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                                  }}
                                  className={cn("mt-1", err("salaire") && "border-red-500 bg-red-50")}
                                  aria-invalid={err("salaire")}
                                />
                                {err("salaire") && (
                                  <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sans emploi */}
                      {L.typeContrat === "sans_emploi" && (
                        <div className="space-y-6">
                          <div>
                            <Label>
                              Situation actuelle <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={L.situationActuelleSansEmploi}
                              onChange={(e) => {
                                updateLocataire(i, "situationActuelleSansEmploi", e.target.value)
                              }}
                              placeholder="Ex: À la recherche d'un emploi, en reconversion…"
                              className={cn(
                                "mt-1",
                                showErr && proErrors.situationActuelleSansEmploi && "border-red-500 bg-red-50",
                              )}
                              maxLength={150}
                              aria-invalid={showErr && proErrors.situationActuelleSansEmploi}
                            />
                            {showErr && proErrors.situationActuelleSansEmploi && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Ressources mensuelles principales (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={L.salaire}
                              onChange={(e) => {
                                handleNumericInputChange(e, (value) => updateLocataire(i, "salaire", value))
                              }}
                              placeholder="Ex: 800"
                              className={cn("mt-1", showErr && proErrors.salaire && "border-red-500 bg-red-50")}
                              maxLength={10}
                              aria-invalid={showErr && proErrors.salaire}
                            />
                            {showErr && proErrors.salaire && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Origine du revenu principal <span className="text-red-600">*</span>
                            </Label>
                            <Select
                              value={L.origineRevenuPrincipal}
                              onValueChange={(value) => {
                                updateLocataire(i, "origineRevenuPrincipal", value)
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "mt-1",
                                  showErr && proErrors.origineRevenuPrincipal && "border-red-500 bg-red-50",
                                )}
                              >
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                {originesRevenuSansEmploi.map((origine) => (
                                  <SelectItem key={origine} value={origine}>
                                    {origine}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {showErr && proErrors.origineRevenuPrincipal && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          {L.origineRevenuPrincipal === "Autre" && (
                            <div>
                              <Label>
                                Précisez la nature du revenu <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                value={L.origineRevenuPrincipalAutre}
                                onChange={(e) => {
                                  updateLocataire(i, "origineRevenuPrincipalAutre", e.target.value)
                                }}
                                className={cn(
                                  "mt-1",
                                  showErr && proErrors.origineRevenuPrincipalAutre && "border-red-500 bg-red-50",
                                )}
                                maxLength={100}
                                aria-invalid={showErr && proErrors.origineRevenuPrincipalAutre}
                              />
                              {showErr && proErrors.origineRevenuPrincipalAutre && (
                                <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AUTRES REVENUS */}
                      <div className="pt-8 border-t">
                        <h3 className="text-lg font-semibold text-gray-800">Autres revenus</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Ajoutez vos autres sources de revenus et indiquez le montant mensuel perçu.
                        </p>
                        <div className="space-y-4 mt-4">
                          {L.revenusAdditionnels.map((revenu) => {
                            const montantInvalid = !isNonNegativeIntegerString(revenu.montant)
                            return (
                              <div key={revenu.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-slate-700">{revenu.type}</p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => supprimerRevenuAdditionnel(i, revenu.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    aria-label="Supprimer ce revenu"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-slate-600">
                                  Indiquez le montant mensuel net de cette source de revenu.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {revenu.type === "Autre" && (
                                    <div>
                                      <Label>
                                        Précisez la nature du revenu <span className="text-red-600">*</span>
                                      </Label>
                                      <Input
                                        value={revenu.precision}
                                        onChange={(e) =>
                                          updateRevenuAdditionnel(i, revenu.id, "precision", e.target.value)
                                        }
                                        className={cn(
                                          "mt-1",
                                          showErr && isEmpty(revenu.precision) && "border-red-500 bg-red-50",
                                        )}
                                        maxLength={100}
                                      />
                                      {showErr && isEmpty(revenu.precision) && (
                                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <Label>
                                      Montant mensuel (€) <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                      type="text"
                                      value={revenu.montant}
                                      onChange={(e) =>
                                        handleNumericInputChange(e, (value) =>
                                          updateRevenuAdditionnel(i, revenu.id, "montant", value),
                                        )
                                      }
                                      placeholder="Ex: 150"
                                      className={cn("mt-1", showErr && montantInvalid && "border-red-500 bg-red-50")}
                                      maxLength={10}
                                      aria-invalid={showErr && montantInvalid}
                                    />
                                    {showErr && montantInvalid && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Le montant doit être un nombre entier ≥ 0
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-4">
                          <Select onValueChange={(value) => ajouterRevenuAdditionnel(i, value)} value="">
                            <SelectTrigger className="w-full md:w-auto">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <SelectValue placeholder="Ajouter un autre revenu" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {typesRevenusAdditionnels.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* ENFANTS */}
              {detailsEtape.type === "enfants" && (
                <div>
                  <Label className="font-semibold text-gray-700">Nombre d&apos;enfants à charge</Label>
                  <p className="text-sm text-slate-500 mt-1">Combien d&apos;enfants au total seront à votre charge ?</p>
                  <div className="mt-2">
                    <NumberInput value={nombreEnfantsFoyer} onChange={setNombreEnfantsFoyer} />
                  </div>
                </div>
              )}

              {/* GARANTIES (facultatif) */}
              {detailsEtape.type === "garanties" && (
                <div className="space-y-8">
                  <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg">
                    <div className="flex">
                      <div className="py-1">
                        <Lock className="h-5 w-5 text-amber-500 mr-3" />
                      </div>
                      <div>
                        <p className="font-bold">Conseil</p>
                        <p className="text-sm">
                          Si vos revenus sont {"<"} 3 fois le loyer, pensez à fournir une garantie pour renforcer votre
                          dossier.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Avez-vous la possibilité de présenter l&apos;une des garanties suivantes ?
                    </h3>
                    <p className="text-sm text-slate-600 -mt-4">(Plusieurs choix possibles)</p>

                    <div className="space-y-2">
                      <Label className="font-medium">Un garant familial (parent, frère, sœur, etc.)</Label>
                      <p className="text-xs text-slate-500">Couvre l&apos;ensemble des locataires.</p>
                      <RadioGroup
                        value={garanties.garantFamilial}
                        onValueChange={(value) => updateGaranties("garantFamilial", value as "oui" | "non")}
                        className="flex items-center space-x-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="oui" id="garant-oui" />
                          <Label htmlFor="garant-oui">Oui</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non" id="garant-non" />
                          <Label htmlFor="garant-non">Non</Label>
                        </div>
                      </RadioGroup>
                      {garanties.garantFamilial === "oui" && (
                        <div className="pl-1 pt-2 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Coordonnées du (des) garant(s)</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addGarant}
                              disabled={(garanties.garants || []).length >= 2}
                              className="bg-transparent"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter un garant
                            </Button>
                          </div>
                          {(garanties.garants || []).map((g, idx) => {
                            const invalidNom = showGarantErrors && g.nom.trim() === ""
                            const invalidPrenom = showGarantErrors && g.prenom.trim() === ""
                            const invalidEmail = showGarantErrors && !isValidEmail(g.email || "")
                            const invalidPhone = showGarantErrors && !isValidPhoneFR(g.telephone || "")
                            return (
                              <div key={idx} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-slate-700">Garant {idx + 1}</p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeGarant(idx)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    aria-label={`Supprimer le garant ${idx + 1}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>
                                      Prénom <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                      value={g.prenom}
                                      onChange={(e) => updateGarantField(idx, "prenom", e.target.value)}
                                      className={cn("mt-1", invalidPrenom && "border-red-500 bg-red-50")}
                                      aria-invalid={invalidPrenom}
                                      maxLength={50}
                                    />
                                    {invalidPrenom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                                  </div>
                                  <div>
                                    <Label>
                                      Nom <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                      value={g.nom}
                                      onChange={(e) => updateGarantField(idx, "nom", e.target.value)}
                                      className={cn("mt-1", invalidNom && "border-red-500 bg-red-50")}
                                      aria-invalid={invalidNom}
                                      maxLength={50}
                                    />
                                    {invalidNom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                                  </div>
                                  <div>
                                    <Label>
                                      E‑mail <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                      type="email"
                                      value={g.email}
                                      onChange={(e) => updateGarantField(idx, "email", e.target.value)}
                                      className={cn("mt-1", invalidEmail && "border-red-500 bg-red-50")}
                                      aria-invalid={invalidEmail}
                                      maxLength={80}
                                    />
                                    {invalidEmail && (
                                      <p className="text-xs text-red-600 mt-1">Adresse e‑mail invalide</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label>
                                      Téléphone <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                      type="tel"
                                      value={g.telephone}
                                      onChange={(e) =>
                                        handleNumericInputChange(
                                          e,
                                          (val) => updateGarantField(idx, "telephone", val),
                                          true,
                                        )
                                      }
                                      placeholder="06 12 34 56 78"
                                      className={cn("mt-1", invalidPhone && "border-red-500 bg-red-50")}
                                      aria-invalid={invalidPhone}
                                      maxLength={15}
                                    />
                                    {invalidPhone && (
                                      <p className="text-xs text-red-600 mt-1">Numéro invalide (10 chiffres requis)</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {(garanties.garants || []).length === 0 && showGarantErrors && (
                            <p className="text-xs text-red-600">Au moins un garant est requis.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {garanties.garantFamilial === "oui" && (
                      <div className="pl-6 pt-2 space-y-2">
                        <Label htmlFor="precision-garant">
                          Souhaitez-vous ajouter une précision ?{" "}
                          <span className="ml-1 text-slate-400 text-xs">(facultatif)</span>
                        </Label>
                        <Textarea
                          id="precision-garant"
                          value={garanties.precisionGarant}
                          onChange={(e) => setGaranties((prev) => ({ ...prev, precisionGarant: e.target.value }))}
                          placeholder="Ex : Mon père, cadre sup, sera garant."
                          className="mt-1"
                          maxLength={150}
                        />
                        <p className="text-xs text-right text-slate-500 mt-1">
                          {garanties.precisionGarant.length} / 150
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="font-medium">Garantie Visale</Label>
                      <p className="text-xs text-slate-500">Couvre l&apos;ensemble des locataires.</p>
                      <RadioGroup
                        value={garanties.garantieVisale}
                        onValueChange={(value) => updateGaranties("garantieVisale", value as "oui" | "non")}
                        className="flex items-center space-x-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="oui" id="visale-oui" />
                          <Label htmlFor="visale-oui">Oui</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non" id="visale-non" />
                          <Label htmlFor="visale-non">Non</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                    <div className="flex">
                      <div className="py-1">
                        <Info className="h-5 w-5 text-blue-500 mr-3" />
                      </div>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="font-bold">Garantie Visale :</span> caution gratuite proposée par Action
                          Logement. Vérifiez votre éligibilité sur{" "}
                          <a
                            href="https://visale.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600"
                          >
                            visale.fr
                          </a>
                          .
                        </p>
                        <p>
                          <span className="font-bold">Cautionnaire familial :</span> un membre de votre famille qui
                          accepte de se porter garant.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RECHERCHE (facultatif) */}
              {detailsEtape.type === "recherche" && (
                <div className="space-y-8">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                    <div className="flex">
                      <div className="py-1">
                        <FilePenLine className="h-5 w-5 text-blue-500 mr-3" />
                      </div>
                      <div>
                        <p className="font-bold">Section facultative</p>
                        <p className="text-sm">
                          Ces informations aident à mieux cibler les biens qui vous correspondent.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Souhaitez-vous remplir vos critères de recherche ?</Label>
                    <RadioGroup
                      value={veutRemplirRecherche}
                      onValueChange={(value) => setVeutRemplirRecherche(value as "oui" | "non")}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="oui" id="recherche-oui" />
                        <Label htmlFor="recherche-oui">Oui</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non" id="recherche-non" />
                        <Label htmlFor="recherche-non">Non</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {veutRemplirRecherche === "oui" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      <div>
                        <Label htmlFor="nombreChambres">Nombre de chambres minimum</Label>
                        <Select
                          value={criteresRecherche.nombreChambres}
                          onValueChange={(value) => updateCriteresRecherche("nombreChambres", value)}
                        >
                          <SelectTrigger id="nombreChambres" className="mt-1">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 chambre</SelectItem>
                            <SelectItem value="2">2 chambres</SelectItem>
                            <SelectItem value="3">3 chambres</SelectItem>
                            <SelectItem value="4">4 chambres</SelectItem>
                            <SelectItem value="5+">5 chambres ou plus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative">
                        <Label htmlFor="secteurSouhaite">Secteur souhaité (ville)</Label>
                        <Input
                          id="secteurSouhaite"
                          value={criteresRecherche.secteurSouhaite}
                          onChange={(e) => {
                            updateCriteresRecherche("secteurSouhaite", e.target.value)
                            setActiveAddressField("secteurSouhaite")
                            rechercherVillesMunicipalites(e.target.value)
                          }}
                          placeholder="Ville + code postal (ex: Brest 29200)"
                          className="mt-1"
                          maxLength={150}
                        />
                        {showSuggestions && activeAddressField === "secteurSouhaite" && suggestions.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                            {suggestions.map((suggestion, idx) => {
                              const p = suggestion?.properties || {}
                              const city = p.city || p.name || p.municipality || ""
                              const cp = p.postcode || p.postalcode || ""
                              const affichage = `${city}${cp ? ` ${cp}` : ""}`
                              return (
                                <div
                                  key={idx}
                                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => selectionnerAdresse(suggestion, "secteurSouhaite")}
                                >
                                  {affichage || p.label}
                                </div>
                              )
                            })}
                            <div className="p-2 text-xs text-slate-500 border-t">
                              Saisissez une ville uniquement (pas de rue). Choisissez dans la liste.
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="rayonKm">Rayon de recherche (km)</Label>
                        <Select
                          value={criteresRecherche.rayonKm}
                          onValueChange={(value) => updateCriteresRecherche("rayonKm", value)}
                        >
                          <SelectTrigger id="rayonKm" className="mt-1">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 km</SelectItem>
                            <SelectItem value="10">10 km</SelectItem>
                            <SelectItem value="15">15 km</SelectItem>
                            <SelectItem value="20">20 km</SelectItem>
                            <SelectItem value="30">30 km</SelectItem>
                            <SelectItem value="50+">50 km ou plus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dateEmmenagement">Date souhaitée d&apos;emménagement</Label>
                        <DatePicker
                          id="dateEmmenagement"
                          value={criteresRecherche.dateEmmenagement}
                          onChange={(iso) => updateCriteresRecherche("dateEmmenagement", iso)}
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 2}
                          ariaLabel="Sélectionner la date d'emménagement"
                          className="mt-1"
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preavisADeposer">Avez-vous un préavis à déposer ?</Label>
                        <Select
                          value={criteresRecherche.preavisADeposer}
                          onValueChange={(value) => updateCriteresRecherche("preavisADeposer", value)}
                        >
                          <SelectTrigger id="preavisADeposer" className="mt-1">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oui">Oui</SelectItem>
                            <SelectItem value="non">Non</SelectItem>
                            <SelectItem value="ne_sais_pas">Je ne sais pas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="raisonDemenagement">
                          Raison du déménagement <span className="ml-1 text-slate-400 text-xs">(facultatif)</span>
                        </Label>
                        <Textarea
                          id="raisonDemenagement"
                          value={criteresRecherche.raisonDemenagement}
                          onChange={(e) => updateCriteresRecherche("raisonDemenagement", e.target.value)}
                          placeholder="Mutation professionnelle, famille qui s'agrandit, séparation…"
                          className="mt-1"
                          maxLength={300}
                        />
                        <p className="text-xs text-right text-slate-500 mt-1">
                          {criteresRecherche.raisonDemenagement.length} / 300 caractères utilisés
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="pt-4">
                    <Label htmlFor="informationsComplementaires">
                      Informations complémentaires <span className="ml-1 text-slate-400 text-xs">(facultatif)</span>
                    </Label>
                    <Textarea
                      id="informationsComplementaires"
                      value={criteresRecherche.informationsComplementaires}
                      onChange={(e) => updateCriteresRecherche("informationsComplementaires", e.target.value)}
                      placeholder="Ex : demande particulière, accessibilité PMR…"
                      className="mt-1"
                      maxLength={300}
                    />
                    <p className="text-xs text-right text-slate-500 mt-1">
                      {criteresRecherche.informationsComplementaires.length} / 300 caractères utilisés
                    </p>
                  </div>
                </div>
              )}

              {/* DOSSIER FACILE */}
              {detailsEtape.type === "dossierfacile" && (
                <div className="space-y-8">
                  <p className="text-slate-600">
                    Si vous disposez déjà d'un dossier numérique locatif (ex : DossierFacile), vous pouvez renseigner le
                    lien ci-dessous. Sinon, ne transmettez aucune pièce justificative pour le moment. Nous vous les
                    demanderons uniquement si votre dossier est présélectionné.
                  </p>

                  <div>
                    <Label htmlFor="dossierFacileLink" className="flex items-center gap-2 font-semibold text-gray-700">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Lien DossierFacile <span className="ml-1 text-slate-400 text-xs">(facultatif)</span>
                    </Label>
                    <Input
                      id="dossierFacileLink"
                      type="url"
                      value={dossierFacileLink}
                      onChange={(e) => setDossierFacileLink(e.target.value)}
                      placeholder="https://www.dossierfacile.fr/partager/..."
                      className="mt-2"
                      maxLength={255}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Ex: https://www.dossierfacile.fr/partager/abcdef</p>
                  </div>

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-300 text-blue-800 rounded-r-lg space-y-3">
                    <h4 className="font-bold flex items-center gap-2 text-blue-900">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      Pourquoi utiliser DossierFacile ?
                    </h4>
                    <ul className="space-y-1 text-sm list-inside list-disc pl-2 text-blue-700">
                      <li>Service public officiel</li>
                      <li>Vos données restent protégées</li>
                      <li>Partage simple et sécurisé</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-amber-900">
                          Ne transmettez jamais de justificatifs par email sans demande de notre part.
                        </p>
                        <p className="text-sm mt-1">
                          Si besoin, nous vous contacterons personnellement pour expliquer la marche à suivre.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RECAP */}
              {detailsEtape.type === "recapitulatif" && (
                <div className="space-y-6">
                  <RecapSection title="Bien concerné" onEdit={() => setEtape(getEtapeIndex("bien"))}>
                    <RecapItem label="Référence" value={bienConcerne} />
                  </RecapSection>

                  {locataires.map((loc, index) => (
                    <div key={index} className="space-y-6">
                      <RecapSection
                        title={`Identité - ${loc.civilite === "monsieur" ? "M." : "Mme"} ${loc.prenom} ${loc.nom}`}
                        onEdit={() => setEtape(getEtapeIndex("identite", index))}
                      >
                        <RecapItem label="Civilité" value={loc.civilite === "monsieur" ? "Monsieur" : "Madame"} />
                        <RecapItem label="Prénom" value={loc.prenom} />
                        <RecapItem label="Nom" value={loc.nom} />
                        <RecapItem label="Contact" value={`${loc.email} / ${loc.telephone}`} />
                        <RecapItem label="Né(e) le" value={loc.dateNaissance} />
                        <RecapItem label="Lieu de naissance" value={loc.lieuNaissance} />
                        <RecapItem label="Adresse actuelle" value={loc.adresseActuelle} />
                        <RecapItem label="Situation conjugale" value={loc.situationConjugale} />
                        <RecapItem label="Statut logement" value={loc.situationActuelle} />
                      </RecapSection>

                      <RecapSection
                        title={`Situation professionnelle - ${loc.civilite === "monsieur" ? "M." : "Mme"} ${loc.prenom} ${
                          loc.nom
                        }`}
                        onEdit={() => setEtape(getEtapeIndex("professionnel", index))}
                      >
                        <RecapItem label="Situation" value={loc.typeContrat} />

                        {["cdi", "cdd", "fonctionnaire", "freelance"].includes(loc.typeContrat) && (
                          <>
                            <RecapItem label="Profession" value={loc.profession} />
                            <RecapItem label="Nom de l'employeur" value={loc.employeurNom} />
                            <RecapItem label="Adresse de l'employeur" value={loc.employeurAdresse} />
                            <RecapItem label="Téléphone de l'employeur" value={loc.employeurTelephone} />
                          </>
                        )}
                        {["cdi", "fonctionnaire"].includes(loc.typeContrat) && (
                          <RecapItem label="Date d'embauche" value={loc.dateEmbauche} />
                        )}
                        {loc.typeContrat === "cdd" && (
                          <RecapItem label="Date de fin de contrat" value={loc.dateFinContrat} />
                        )}
                        {loc.typeContrat === "interim" && (
                          <>
                            <RecapItem label="Agence d'intérim" value={loc.agenceInterim} />
                            <RecapItem label="En intérim depuis" value={loc.dureeInscriptionInterim} />
                          </>
                        )}
                        {loc.typeContrat === "freelance" && (
                          <RecapItem label="Date de début d'activité" value={loc.dateDebutActivite} />
                        )}
                        {loc.typeContrat === "retraite" && (
                          <>
                            <RecapItem label="Caisse de retraite" value={loc.regimeRetraite} />
                            <RecapItem label="Date de départ" value={loc.dateDebutRetraite} />
                          </>
                        )}
                        {loc.typeContrat === "etudiant" && (
                          <>
                            <RecapItem label="Établissement / Formation" value={loc.etablissementFormation} />
                            <RecapItem label="En alternance" value={loc.alternance} />
                            {loc.alternance === "oui" && (
                              <>
                                <RecapItem label="Profession / Poste" value={loc.profession} />
                                <RecapItem label="Type de contrat" value={loc.typeAlternance} />
                                <RecapItem label="Employeur" value={loc.employeurNom} />
                                <RecapItem label="Adresse employeur" value={loc.employeurAdresse} />
                                <RecapItem label="Téléphone" value={loc.employeurTelephone} />
                                <RecapItem label="Début" value={loc.dateEmbauche} />
                                <RecapItem label="Fin" value={loc.dateFinContrat} />
                                <RecapItem label="Salaire" value={loc.salaire ? `${loc.salaire} €` : ""} />
                              </>
                            )}
                          </>
                        )}
                        {loc.typeContrat === "sans_emploi" && (
                          <>
                            <RecapItem label="Situation" value={loc.situationActuelleSansEmploi} />
                            <RecapItem
                              label="Origine du revenu"
                              value={
                                loc.origineRevenuPrincipal === "Autre"
                                  ? loc.origineRevenuPrincipalAutre
                                  : loc.origineRevenuPrincipal
                              }
                            />
                          </>
                        )}

                        <RecapItem label="Revenu principal" value={loc.salaire ? `${loc.salaire} €` : ""} />

                        {loc.revenusAdditionnels.length > 0 && (
                          <div className="pt-2 mt-2 border-t">
                            <p className="text-slate-500 mb-1">Revenus additionnels :</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {loc.revenusAdditionnels.map((rev) => {
                                const label = rev.type === "Autre" ? rev.precision || "Autre" : rev.type
                                const amount = rev.montant && rev.montant.trim() !== "" ? `${rev.montant} €` : "-"
                                return (
                                  <li
                                    key={rev.id}
                                    className="font-medium text-slate-800 break-words whitespace-pre-wrap leading-relaxed"
                                  >
                                    {label}
                                    <span className="whitespace-nowrap">{` : ${amount}`}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                      </RecapSection>
                    </div>
                  ))}

                  {(locataires.length > 1 || nombreEnfantsFoyer > 0) && (
                    <RecapSection
                      title="Enfants à charge"
                      onEdit={() => setEtape(getEtapeIndex(locataires.length > 1 ? "enfants" : "identite"))}
                    >
                      <RecapItem label="Nombre d'enfants" value={nombreEnfantsFoyer} />
                    </RecapSection>
                  )}

                  <RecapSection title="Garanties" onEdit={() => setEtape(getEtapeIndex("garanties"))}>
                    <RecapItem label="Garant familial" value={garanties.garantFamilial} />
                    {garanties.garantFamilial === "oui" && (
                      <RecapItem label="Précision" value={garanties.precisionGarant} />
                    )}
                    <RecapItem label="Garantie Visale" value={garanties.garantieVisale} />
                    {Array.isArray(garanties.garants) && garanties.garants.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-slate-500 mb-1">Garants déclarés :</p>
                        {garanties.garants.map((g, i) => (
                          <p key={`${g.email}-${i}`} className="font-medium text-slate-800">
                            • {g.prenom} {g.nom} — {g.email} — {g.telephone}
                          </p>
                        ))}
                      </div>
                    )}
                  </RecapSection>

                  {(veutRemplirRecherche === "oui" || criteresRecherche.informationsComplementaires.trim() !== "") && (
                    <RecapSection title="Critères de recherche" onEdit={() => setEtape(getEtapeIndex("recherche"))}>
                      {veutRemplirRecherche === "oui" && (
                        <>
                          <RecapItem label="Chambres minimum" value={criteresRecherche.nombreChambres} />
                          <RecapItem label="Secteur" value={criteresRecherche.secteurSouhaite} />
                          <RecapItem label="Rayon" value={criteresRecherche.rayonKm} />
                          <RecapItem label="Date d'emménagement" value={criteresRecherche.dateEmmenagement} />
                          <RecapItem label="Préavis à déposer" value={criteresRecherche.preavisADeposer} />
                          <RecapItem label="Raison déménagement" value={criteresRecherche.raisonDemenagement} />
                        </>
                      )}
                      <RecapItem
                        label="Informations complémentaires"
                        value={criteresRecherche.informationsComplementaires}
                      />
                    </RecapSection>
                  )}

                  {dossierFacileLink && (
                    <RecapSection title="Dossier Numérique" onEdit={() => setEtape(getEtapeIndex("dossierfacile"))}>
                      <RecapItem label="Lien DossierFacile" value={dossierFacileLink} />
                    </RecapSection>
                  )}

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                    <div className="flex">
                      <div className="py-1">
                        <Info className="h-5 w-5 text-blue-500 mr-3" />
                      </div>
                      <div className="text-sm space-y-2">
                        <p className="font-bold">Vérification avant envoi</p>
                        <p>
                          Veuillez vérifier attentivement toutes les informations. Un PDF sera automatiquement généré et
                          transmis à l&apos;agence.
                        </p>
                        <p>Vous pouvez revenir aux étapes précédentes pour modifier si nécessaire.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation améliorée entre étapes */}
              <div className="pt-6 border-t">
                {etape < totalEtapes ? (
                  <StepNavigation
                    currentStep={etape}
                    totalSteps={totalEtapes}
                    maxReachedStep={maxReachedStep}
                    onPrevious={() => setEtape(Math.max(1, etape - 1))}
                    onNext={goNext}
                    onStepClick={goToStep}
                    canGoNext={etape < totalEtapes}
                    canGoPrevious={etape > 1}
                    className="mb-4"
                  />
                ) : (
                  <div className="text-center">
                    <Button
                      type="button"
                      onClick={ouvrirConfirmation}
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi en cours...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Envoyer ma fiche de renseignements
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <DialogTitle className="text-lg">Confirmation d&apos;envoi</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Vous êtes sur le point d&apos;envoyer votre demande de visite à l&apos;agence ALV Immobilier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Cette action va :</p>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Générer automatiquement un PDF de votre dossier</li>
                <li>L&apos;envoyer directement à notre agence</li>
                <li>Déclencher le traitement de votre demande de visite</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Vérifiez vos adresses email :</h4>
              </div>
              <div className="space-y-2">
                {locataires.map((locataire, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                    <Mail className="h-4 w-4" />
                    <span>
                      <span className="font-medium">
                        {locataire.prenom && locataire.nom
                          ? `${locataire.prenom} ${locataire.nom}`
                          : `Locataire ${index + 1}`}{" "}
                        :
                      </span>{" "}
                      {locataire.email || "Email non renseigné"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-3">Ces adresses seront utilisées pour vous recontacter.</p>
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="confirmation"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(Boolean(checked))}
                className="mt-1"
              />
              <label htmlFor="confirmation" className="text-sm leading-relaxed cursor-pointer">
                J&apos;atteste sur l&apos;honneur l&apos;exactitude des informations communiquées et j&apos;autorise
                l&apos;agence ALV Immobilier à traiter ces données dans le cadre de ma demande de location.
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="w-full sm:w-auto bg-transparent"
            >
              Annuler
            </Button>
            <Button
              onClick={soumettreFormulaire}
              disabled={!confirmationChecked || isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Envoi en cours..." : "Confirmer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoadingOverlay show={isSubmitting} message="Veuillez patienter… Votre dossier est en cours de traitement" />
    </main>
  )
}

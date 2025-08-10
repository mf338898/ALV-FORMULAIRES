"use client"

import { useState, type ReactNode, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
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
import { ArrowLeft, ArrowRight, Plus, AlertTriangle, Minus, Trash2, Lock, Info, FilePenLine, Pencil, Mail, FileText, ShieldCheck } from 'lucide-react'
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Locataire, CriteresRecherche, Garanties, RevenuAdditionnel } from "@/lib/types"

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

const garantiesVides: Garanties = {
garantFamilial: "non",
garantieVisale: "non",
precisionGarant: "",
garants: []
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

export default function FormulairePage() {
const router = useRouter()
const [etape, setEtape] = useState(1)
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
/* ─────────── Validation IDENTITÉ ─────────── */
const [showIdErrors, setShowIdErrors] = useState(false)
const [errorLocIdx, setErrorLocIdx] = useState<number | null>(null) // quel locataire est en erreur ?

const isEmpty = (v?: string) => !v || v.trim() === ""
const validateIdentite = (idx: number) => {
  const L = locataires[idx]
  return !(
    isEmpty(L.civilite) ||
    isEmpty(L.prenom) ||
    isEmpty(L.nom) ||
    isEmpty(L.email) ||
    isEmpty(L.telephone) ||
    isEmpty(L.adresseActuelle)
  )
}

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
      type: isIdentite ? "identite" : "professionnel",
      title: `${isIdentite ? "Identité & Situation" : "Situation professionnelle"}${locataireIdText}`,
      subtitle: isIdentite ? "Informations personnelles." : "Ressources et profession.",
      locataireIndex: locataireIndex,
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

const ajouterLocataire = () => {
  if (locataires.length < 4) {
    setLocataires([...locataires, createLocataireVide()])
  }
}

const supprimerLocataire = (index: number) => {
  if (locataires.length > 1) {
    const nouveauxLocataires = locataires.filter((_, i) => i !== index)
    setLocataires(nouveauxLocataires)
    if (etape > totalEtapes - 1) {
      setEtape(etape - etapesParLocataire)
    }
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

const updateGaranties = (field: keyof Garanties, value: "oui" | "non" | "") => {
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

const selectionnerAdresse = (adresse: any, fieldId: string) => {
  const adresseComplete = adresse.properties.label
  if (fieldId.startsWith("adresseActuelle-")) {
    const index = Number.parseInt(fieldId.split("-")[1])
    updateLocataire(index, "adresseActuelle", adresseComplete)
  } else if (fieldId.startsWith("employeurAdresse-")) {
    const index = Number.parseInt(fieldId.split("-")[1])
    updateLocataire(index, "employeurAdresse", adresseComplete)
  } else if (fieldId === "secteurSouhaite") {
    updateCriteresRecherche("secteurSouhaite", adresseComplete)
  }
  setShowSuggestions(false)
  setActiveAddressField("")
}

const typesRevenusAdditionnels = ["Allocations familiales", "CAF", "Pension alimentaire", "Aide familiale", "Autre"]
const originesRevenuSansEmploi = ["RSA", "Indemnités chômage", "Aide familiale", "Pension alimentaire", "Autre"]

const ajouterRevenuAdditionnel = (indexLocataire: number, typeRevenu: string) => {
  if (!typeRevenu) return
  const nouveauRevenu: RevenuAdditionnel = { id: Date.now().toString(), type: typeRevenu, montant: "", precision: "" }
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

const ouvrirConfirmation = () => {
  setShowConfirmDialog(true)
  setConfirmationChecked(false)
}

const fermerConfirmation = () => {
  setShowConfirmDialog(false)
  setConfirmationChecked(false)
}

const soumettreFormulaire = async () => {
  console.log("Début de soumettreFormulaire. isSubmitting: true")
  setIsSubmitting(true)
  setShowConfirmDialog(false)
  toast.info("Envoi de votre dossier en cours...")
  try {
    console.log("Préparation de la requête fetch...")
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
    console.log("Réponse reçue:", response.status, response.statusText)

    const result = await response.json()
    console.log("Résultat JSON:", result)

    if (response.ok && result.success) {
      console.log("Succès. Redirection...")
      toast.success(result.message || "Dossier envoyé avec succès !")
      router.push("/locataire/confirmation?email=" + encodeURIComponent(locataires[0].email))
    } else {
      console.error("Échec de la requête:", result)
      toast.error(result.message || "Une erreur est survenue.", {
        description: result.error || "Veuillez réessayer ou contacter l'agence.",
      })
    }
  } catch (error) {
    console.error("Erreur dans le bloc catch de soumettreFormulaire:", error)
    toast.error("Erreur de communication avec le serveur.", {
      description: "Veuillez vérifier votre connexion internet et réessayer.",
    })
  } finally {
    console.log("Fin de soumettreFormulaire. isSubmitting: false")
    setIsSubmitting(false)
  }
}

const progressValue = (etape / totalEtapes) * 100
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
    default:
      return etape
  }
}

return (
  <>
    <div className="text-center mb-8">
      {detailsEtape.type !== "recapitulatif" && (
        <>
          <Progress value={progressValue} className="w-full max-w-md mx-auto bg-gray-200" />
          <p className="text-sm text-slate-600 mt-2">
            Étape {etape} sur {totalEtapes}
          </p>
        </>
      )}
    </div>

    <Card
      className={cn(
        "border-gray-200 shadow-lg",
        detailsEtape.type === "recapitulatif" ? "bg-transparent border-none shadow-none" : "bg-white",
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">{detailsEtape.title}</CardTitle>
        {detailsEtape.subtitle && <p className="text-slate-500">{detailsEtape.subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        {detailsEtape.type === "bien" && (
          <div className="space-y-8">
            <div>
              <Label htmlFor="bien" className="font-semibold text-gray-700">
                Référence du bien/location concernée
              </Label>
              <Input
                id="bien"
                value={bienConcerne}
                onChange={(e) => setBienConcerne(e.target.value)}
                placeholder="Ex: Réf. 4105, Maison PLEYBEN 650 €, Appartement quimper 900€..."
                className="mt-2"
                required
                maxLength={50}
              />
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
                      Merci d'ajouter uniquement les personnes majeures qui seront signataires du bail.
                    </p>
                    <p className="text-sm">
                      N'incluez pas les enfants ou les personnes qui n'auront pas à signer le contrat de location.
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
                >
                  Retirer
                </Button>
              </div>
            </div>
          </div>
        )}

        {detailsEtape.type === "identite" && typeof detailsEtape.locataireIndex === "number" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Civilité *</Label>
                <Select
                  value={locataires[detailsEtape.locataireIndex].civilite}
                  onValueChange={(value) => updateLocataire(detailsEtape.locataireIndex, "civilite", value)}
                >
                  <SelectTrigger
                    className={cn(
                      "mt-1",
                      showIdErrors &&
                        errorLocIdx === detailsEtape.locataireIndex &&
                        isEmpty(locataires[detailsEtape.locataireIndex].civilite) &&
                        "border-red-500 bg-red-50",
                    )}
                  >
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monsieur">Monsieur</SelectItem>
                    <SelectItem value="madame">Madame</SelectItem>
                  </SelectContent>
                </Select>
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].civilite) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
              </div>
              <div />
              <div>
                <Label htmlFor={`prenom-${detailsEtape.locataireIndex}`}>Prénom *</Label>
                <Input
                  id={`prenom-${detailsEtape.locataireIndex}`}
                  value={locataires[detailsEtape.locataireIndex].prenom}
                  onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "prenom", e.target.value)}
                  className={cn(
                    "mt-1",
                    showIdErrors &&
                      errorLocIdx === detailsEtape.locataireIndex &&
                      isEmpty(locataires[detailsEtape.locataireIndex].prenom) &&
                      "border-red-500 bg-red-50",
                  )}
                  maxLength={30}
                />
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].prenom) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
                {locataires[detailsEtape.locataireIndex].prenom.length === 30 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`nom-${detailsEtape.locataireIndex}`}>Nom *</Label>
                <Input
                  id={`nom-${detailsEtape.locataireIndex}`}
                  value={locataires[detailsEtape.locataireIndex].nom}
                  onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "nom", e.target.value)}
                  className={cn(
                    "mt-1",
                    showIdErrors &&
                      errorLocIdx === detailsEtape.locataireIndex &&
                      isEmpty(locataires[detailsEtape.locataireIndex].nom) &&
                      "border-red-500 bg-red-50",
                  )}
                  maxLength={50}
                />
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].nom) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
                {locataires[detailsEtape.locataireIndex].nom.length === 50 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`email-${detailsEtape.locataireIndex}`}>Email *</Label>
                <Input
                  id={`email-${detailsEtape.locataireIndex}`}
                  type="email"
                  value={locataires[detailsEtape.locataireIndex].email}
                  onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "email", e.target.value)}
                  className={cn(
                    "mt-1",
                    showIdErrors &&
                      errorLocIdx === detailsEtape.locataireIndex &&
                      isEmpty(locataires[detailsEtape.locataireIndex].email) &&
                      "border-red-500 bg-red-50",
                  )}
                  maxLength={60}
                />
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].email) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
                {locataires[detailsEtape.locataireIndex].email.length === 60 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`telephone-${detailsEtape.locataireIndex}`}>Téléphone *</Label>
                <Input
                  id={`telephone-${detailsEtape.locataireIndex}`}
                  type="tel"
                  value={locataires[detailsEtape.locataireIndex].telephone}
                  onChange={(e) =>
                    handleNumericInputChange(
                      e,
                      (value) => updateLocataire(detailsEtape.locataireIndex, "telephone", value),
                      true,
                    )
                  }
                  placeholder="06 12 34 56 78"
                  className={cn(
                    "mt-1",
                    showIdErrors &&
                      errorLocIdx === detailsEtape.locataireIndex &&
                      isEmpty(locataires[detailsEtape.locataireIndex].telephone) &&
                      "border-red-500 bg-red-50",
                  )}
                  maxLength={15}
                />
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].telephone) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
                {locataires[detailsEtape.locataireIndex].telephone.length === 15 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
              </div>
              <div>
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={locataires[detailsEtape.locataireIndex].dateNaissance}
                  onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "dateNaissance", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`lieuNaissance-${detailsEtape.locataireIndex}`}>Lieu de naissance</Label>
                <Input
                  id={`lieuNaissance-${detailsEtape.locataireIndex}`}
                  value={locataires[detailsEtape.locataireIndex].lieuNaissance}
                  onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "lieuNaissance", e.target.value)}
                  className="mt-1"
                  maxLength={40}
                />
                {locataires[detailsEtape.locataireIndex].lieuNaissance.length === 40 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
              </div>
              <div className="md:col-span-2 relative">
                <Label htmlFor={`adresseActuelle-${detailsEtape.locataireIndex}`}>Adresse actuelle *</Label>
                <Input
                  id={`adresseActuelle-${detailsEtape.locataireIndex}`}
                  value={locataires[detailsEtape.locataireIndex].adresseActuelle}
                  onChange={(e) => {
                    updateLocataire(detailsEtape.locataireIndex, "adresseActuelle", e.target.value)
                    setActiveAddressField(`adresseActuelle-${detailsEtape.locataireIndex}`)
                    rechercherAdresses(e.target.value)
                  }}
                  className={cn(
                    "mt-1",
                    showIdErrors &&
                      errorLocIdx === detailsEtape.locataireIndex &&
                      isEmpty(locataires[detailsEtape.locataireIndex].adresseActuelle) &&
                      "border-red-500 bg-red-50",
                  )}
                  placeholder="Commencez à taper votre adresse..."
                  maxLength={100}
                />
                {showIdErrors &&
                  errorLocIdx === detailsEtape.locataireIndex &&
                  isEmpty(locataires[detailsEtape.locataireIndex].adresseActuelle) && (
                    <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                  )}
                {locataires[detailsEtape.locataireIndex].adresseActuelle.length === 100 && (
                  <p className="text-xs text-red-600 mt-1">
                    Vous avez atteint la longueur maximale autorisée pour ce champ.
                  </p>
                )}
                {showSuggestions &&
                  activeAddressField === `adresseActuelle-${detailsEtape.locataireIndex}` &&
                  suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() =>
                            selectionnerAdresse(suggestion, `adresseActuelle-${detailsEtape.locataireIndex}`)
                          }
                        >
                          {suggestion.properties.label}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              <div>
                <Label>Situation conjugale</Label>
                <Select
                  value={locataires[detailsEtape.locataireIndex].situationConjugale}
                  onValueChange={(value) =>
                    updateLocataire(detailsEtape.locataireIndex, "situationConjugale", value)
                  }
                >
                  <SelectTrigger className="mt-1">
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
              </div>
              <div>
                <Label>Statut logement actuel</Label>
                <Select
                  value={locataires[detailsEtape.locataireIndex].situationActuelle}
                  onValueChange={(value) =>
                    updateLocataire(detailsEtape.locataireIndex, "situationActuelle", value)
                  }
                >
                  <SelectTrigger className="mt-1">
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
              </div>
            </div>
            {locataires.length === 1 && (
              <div className="pt-6 border-t">
                <Label className="font-semibold text-gray-700">Nombre d'enfants à charge</Label>
                <p className="text-sm text-slate-500 mt-1">Combien d'enfants à charge dans le foyer ?</p>
                <div className="mt-2">
                  <NumberInput value={nombreEnfantsFoyer} onChange={setNombreEnfantsFoyer} />
                </div>
              </div>
            )}
          </div>
        )}

        {detailsEtape.type === "professionnel" && typeof detailsEtape.locataireIndex === "number" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor={`situation-pro-${detailsEtape.locataireIndex}`}>
                Sélectionner votre situation professionnelle
              </Label>
              <Select
                value={locataires[detailsEtape.locataireIndex].typeContrat}
                onValueChange={(value) => updateLocataire(detailsEtape.locataireIndex, "typeContrat", value)}
              >
                <SelectTrigger id={`situation-pro-${detailsEtape.locataireIndex}`}>
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
            </div>

            <div className="space-y-6">
              {locataires[detailsEtape.locataireIndex].typeContrat === "cdi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nom de l’entreprise / administration</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurNom}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "employeurNom", e.target.value)}
                      placeholder="Ex: Carrefour, CHU de Quimper…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Profession / poste occupé</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].profession}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "profession", e.target.value)}
                      placeholder="Ex: Vendeur(se), Enseignant(e)…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse de l’entreprise / administration</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurAdresse}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "employeurAdresse", e.target.value)
                      }
                      placeholder="Ex: 12 rue du Stade, 29000 Quimper"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Numéro de téléphone de l’entreprise</Label>
                    <Input
                      type="tel"
                      value={locataires[detailsEtape.locataireIndex].employeurTelephone}
                      onChange={(e) =>
                        handleNumericInputChange(
                          e,
                          (value) => updateLocataire(detailsEtape.locataireIndex, "employeurTelephone", value),
                          true,
                        )
                      }
                      placeholder="01 23 45 67 89"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label>Date d’embauche</Label>
                    <Input
                      type="date"
                      value={locataires[detailsEtape.locataireIndex].dateEmbauche}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "dateEmbauche", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Salaire net mensuel (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      placeholder="Ex: 1700"
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "cdd" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nom de l’entreprise / administration</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurNom}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "employeurNom", e.target.value)}
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Profession / poste occupé</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].profession}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "profession", e.target.value)}
                      placeholder="Ex: Serveur(se), Ouvrier(ère)…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse de l’entreprise / administration</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurAdresse}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "employeurAdresse", e.target.value)
                      }
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Numéro de téléphone de l’entreprise</Label>
                    <Input
                      type="tel"
                      value={locataires[detailsEtape.locataireIndex].employeurTelephone}
                      onChange={(e) =>
                        handleNumericInputChange(
                          e,
                          (value) => updateLocataire(detailsEtape.locataireIndex, "employeurTelephone", value),
                          true,
                        )
                      }
                      placeholder="01 23 45 67 89"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label>Date de fin de contrat</Label>
                    <Input
                      type="date"
                      value={locataires[detailsEtape.locataireIndex].dateFinContrat}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "dateFinContrat", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Salaire net mensuel (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "interim" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Agence d’intérim principale (facultatif)</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].agenceInterim}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "agenceInterim", e.target.value)
                      }
                      placeholder="Ex: Manpower, Adecco…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Depuis combien de temps êtes-vous en intérim ?</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].dureeInscriptionInterim}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "dureeInscriptionInterim", e.target.value)
                      }
                      placeholder="Ex: 18 mois, Depuis janvier 2023…"
                      className="mt-1"
                      maxLength={50}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Revenu net mensuel moyen (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      placeholder="Ex: 1400"
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "fonctionnaire" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nom de l’administration / entreprise</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurNom}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "employeurNom", e.target.value)}
                      placeholder="Ex: Mairie de Quimper, CHU de Quimper…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Profession / poste occupé</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].profession}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "profession", e.target.value)}
                      placeholder="Ex: Enseignant(e), Infirmier(ère), Policier(ère)…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse de l’administration</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurAdresse}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "employeurAdresse", e.target.value)
                      }
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Numéro de téléphone de l’administration</Label>
                    <Input
                      type="tel"
                      value={locataires[detailsEtape.locataireIndex].employeurTelephone}
                      onChange={(e) =>
                        handleNumericInputChange(
                          e,
                          (value) => updateLocataire(detailsEtape.locataireIndex, "employeurTelephone", value),
                          true,
                        )
                      }
                      placeholder="01 23 45 67 89"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label>Date d’embauche</Label>
                    <Input
                      type="date"
                      value={locataires[detailsEtape.locataireIndex].dateEmbauche}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "dateEmbauche", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Salaire net mensuel (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "freelance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Activité / métier</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].profession}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "profession", e.target.value)}
                      placeholder="Ex: Graphiste, Plombier…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Nom de la structure (si applicable)</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurNom}
                      onChange={(e) => updateLocataire(detailsEtape.locataireIndex, "employeurNom", e.target.value)}
                      placeholder="Ex: SARL Dubois"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse de la structure (si applicable)</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].employeurAdresse}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "employeurAdresse", e.target.value)
                      }
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Numéro de téléphone (si applicable)</Label>
                    <Input
                      type="tel"
                      value={locataires[detailsEtape.locataireIndex].employeurTelephone}
                      onChange={(e) =>
                        handleNumericInputChange(
                          e,
                          (value) => updateLocataire(detailsEtape.locataireIndex, "employeurTelephone", value),
                          true,
                        )
                      }
                      placeholder="01 23 45 67 89"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label>Date de début d’activité</Label>
                    <Input
                      type="date"
                      value={locataires[detailsEtape.locataireIndex].dateDebutActivite}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "dateDebutActivite", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Revenu net moyen mensuel (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "retraite" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Régime ou caisse principale</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].regimeRetraite}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "regimeRetraite", e.target.value)
                      }
                      placeholder="Ex: Sécurité Sociale, Agirc-Arrco…"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Date de départ à la retraite</Label>
                    <Input
                      type="date"
                      value={locataires[detailsEtape.locataireIndex].dateDebutRetraite}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "dateDebutRetraite", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Montant de la pension nette mensuelle (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "etudiant" && (
                <div className="space-y-6">
                  <div>
                    <Label>Établissement / formation</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].etablissementFormation}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "etablissementFormation", e.target.value)
                      }
                      placeholder="Ex: Université de Rennes, BTS Comptabilité…"
                      className="mt-1"
                      maxLength={150}
                    />
                  </div>
                  <div>
                    <Label>Êtes-vous en alternance ?</Label>
                    <Select
                      value={locataires[detailsEtape.locataireIndex].alternance}
                      onValueChange={(value) => updateLocataire(detailsEtape.locataireIndex, "alternance", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oui">Oui</SelectItem>
                        <SelectItem value="non">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {locataires[detailsEtape.locataireIndex].alternance === "oui" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                      <div>
                        <Label>Type de contrat</Label>
                        <Select
                          value={locataires[detailsEtape.locataireIndex].typeAlternance}
                          onValueChange={(value) =>
                            updateLocataire(detailsEtape.locataireIndex, "typeAlternance", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Ex: Apprentissage, Pro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apprentissage">Apprentissage</SelectItem>
                            <SelectItem value="professionnalisation">Professionnalisation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nom de l’entreprise</Label>
                        <Input
                          value={locataires[detailsEtape.locataireIndex].employeurNom}
                          onChange={(e) =>
                            updateLocataire(detailsEtape.locataireIndex, "employeurNom", e.target.value)
                          }
                          className="mt-1"
                          maxLength={100}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Adresse de l’entreprise</Label>
                        <Input
                          value={locataires[detailsEtape.locataireIndex].employeurAdresse}
                          onChange={(e) =>
                            updateLocataire(detailsEtape.locataireIndex, "employeurAdresse", e.target.value)
                          }
                          className="mt-1"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label>Numéro de téléphone de l’entreprise</Label>
                        <Input
                          type="tel"
                          value={locataires[detailsEtape.locataireIndex].employeurTelephone}
                          onChange={(e) =>
                            handleNumericInputChange(
                              e,
                              (value) => updateLocataire(detailsEtape.locataireIndex, "employeurTelephone", value),
                              true,
                            )
                          }
                          placeholder="01 23 45 67 89"
                          className="mt-1"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <Label>Profession / poste occupé</Label>
                        <Input
                          value={locataires[detailsEtape.locataireIndex].profession}
                          onChange={(e) =>
                            updateLocataire(detailsEtape.locataireIndex, "profession", e.target.value)
                          }
                          className="mt-1"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label>Date de début de contrat</Label>
                        <Input
                          type="date"
                          value={locataires[detailsEtape.locataireIndex].dateEmbauche}
                          onChange={(e) =>
                            updateLocataire(detailsEtape.locataireIndex, "dateEmbauche", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Date de fin de contrat</Label>
                        <Input
                          type="date"
                          value={locataires[detailsEtape.locataireIndex].dateFinContrat}
                          onChange={(e) =>
                            updateLocataire(detailsEtape.locataireIndex, "dateFinContrat", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Salaire net mensuel (€)</Label>
                        <Input
                          type="text"
                          value={locataires[detailsEtape.locataireIndex].salaire}
                          onChange={(e) =>
                            handleNumericInputChange(e, (value) =>
                              updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {locataires[detailsEtape.locataireIndex].typeContrat === "sans_emploi" && (
                <div className="space-y-6">
                  <div>
                    <Label>Situation actuelle</Label>
                    <Input
                      value={locataires[detailsEtape.locataireIndex].situationActuelleSansEmploi}
                      onChange={(e) =>
                        updateLocataire(detailsEtape.locataireIndex, "situationActuelleSansEmploi", e.target.value)
                      }
                      placeholder="Ex: À la recherche d’un emploi, en reconversion…"
                      className="mt-1"
                      maxLength={150}
                    />
                  </div>
                  <div>
                    <Label>Ressources mensuelles principales (€)</Label>
                    <Input
                      type="text"
                      value={locataires[detailsEtape.locataireIndex].salaire}
                      onChange={(e) =>
                        handleNumericInputChange(e, (value) =>
                          updateLocataire(detailsEtape.locataireIndex, "salaire", value),
                        )
                      }
                      placeholder="Ex: 800"
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>Origine du revenu principal</Label>
                    <Select
                      value={locataires[detailsEtape.locataireIndex].origineRevenuPrincipal}
                      onValueChange={(value) =>
                        updateLocataire(detailsEtape.locataireIndex, "origineRevenuPrincipal", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
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
                  </div>
                  {locataires[detailsEtape.locataireIndex].origineRevenuPrincipal === "Autre" && (
                    <div>
                      <Label>Précisez la nature du revenu</Label>
                      <Input
                        value={locataires[detailsEtape.locataireIndex].origineRevenuPrincipalAutre}
                        onChange={(e) =>
                          updateLocataire(
                            detailsEtape.locataireIndex,
                            "origineRevenuPrincipalAutre",
                            e.target.value,
                          )
                        }
                        className="mt-1"
                        maxLength={100}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-800">Autres revenus</h3>
              <div className="space-y-4 mt-4">
                {locataires[detailsEtape.locataireIndex].revenusAdditionnels.map((revenu) => (
                  <div key={revenu.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-700">{revenu.type}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => supprimerRevenuAdditionnel(detailsEtape.locataireIndex, revenu.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {revenu.type === "Autre" && (
                        <div>
                          <Label>Précisez la nature du revenu</Label>
                          <Input
                            value={revenu.precision}
                            onChange={(e) =>
                              updateRevenuAdditionnel(
                                detailsEtape.locataireIndex,
                                revenu.id,
                                "precision",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                            maxLength={100}
                          />
                        </div>
                      )}
                      <div>
                        <Label>Montant mensuel (€)</Label>
                        <Input
                          type="text"
                          value={revenu.montant}
                          onChange={(e) =>
                            handleNumericInputChange(e, (value) =>
                              updateRevenuAdditionnel(detailsEtape.locataireIndex, revenu.id, "montant", value),
                            )
                          }
                          placeholder="Ex: 150"
                          className="mt-1"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Select
                  onValueChange={(value) => ajouterRevenuAdditionnel(detailsEtape.locataireIndex, value)}
                  value=""
                >
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
        )}

        {detailsEtape.type === "enfants" && (
          <div>
            <Label className="font-semibold text-gray-700">Nombre d'enfants à charge</Label>
            <p className="text-sm text-slate-500 mt-1">
              Combien d'enfants au total seront à votre charge dans le foyer ?
            </p>
            <div className="mt-2">
              <NumberInput value={nombreEnfantsFoyer} onChange={setNombreEnfantsFoyer} />
            </div>
          </div>
        )}

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
                    Si vos revenus sont &lt; 3 fois le loyer, pensez à fournir une garantie pour renforcer votre
                    dossier.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Avez-vous la possibilité de présenter l'une des garanties suivantes pour votre dossier ?
              </h3>
              <p className="text-sm text-slate-600 -mt-4">
                (Plusieurs choix possibles, il n'est pas nécessaire d'avoir un garant/Visale par locataire)
              </p>

              <div className="space-y-2">
                <Label className="font-medium">Un garant familial (parent, frère, sœur, etc.)</Label>
                <p className="text-xs text-slate-500">Couvre l'ensemble des locataires.</p>
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
              </div>

              {garanties.garantFamilial === "oui" && (
                <div className="pl-6 pt-2 space-y-2">
                  <Label htmlFor="precision-garant">Souhaitez-vous ajouter une précision sur le garant ?</Label>
                  <Textarea
                    id="precision-garant"
                    value={garanties.precisionGarant}
                    onChange={(e) => setGaranties((prev) => ({ ...prev, precisionGarant: e.target.value }))}
                    placeholder="Ex : Mon père, cadre sup, sera garant."
                    className="mt-1"
                    maxLength={150}
                  />
                  <p className="text-xs text-right text-slate-500 mt-1">
                    {garanties.precisionGarant.length} / 150 caractères utilisés
                  </p>
                  <p className="text-xs text-slate-500 pt-1">
                    Pour être accepté, un garant doit généralement justifier de revenus nets mensuels supérieurs à
                    3x le montant du loyer.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-medium">Garantie Visale</Label>
                <p className="text-xs text-slate-500">Couvre l'ensemble des locataires.</p>
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
                    <span className="font-bold">Garantie Visale :</span> Caution gratuite proposée par Action
                    Logement, ouverte à tous types de profils. Pour vérifier votre éligibilité, rendez-vous sur{" "}
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
                    <span className="font-bold">Cautionnaire familial :</span> Toute personne de votre famille
                    (parent, frère, sœur, etc.) qui accepte de se porter garant pour vous.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    Ces informations nous aideront à mieux cibler les biens qui vous correspondent.
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
                  <Label htmlFor="recherche-oui">Oui, je souhaite préciser mes critères</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="recherche-non" />
                  <Label htmlFor="recherche-non">Non, pas pour le moment</Label>
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
                <div>
                  <Label htmlFor="loyerMax">Loyer maximum souhaité (€ / mois)</Label>
                  <Input
                    id="loyerMax"
                    type="text"
                    value={criteresRecherche.loyerMax}
                    onChange={(e) =>
                      handleNumericInputChange(e, (value) => updateCriteresRecherche("loyerMax", value))
                    }
                    placeholder="Ex: 800"
                    className="mt-1"
                    maxLength={10}
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="secteurSouhaite">Secteur souhaité (ville)</Label>
                  <Input
                    id="secteurSouhaite"
                    value={criteresRecherche.secteurSouhaite}
                    onChange={(e) => {
                      updateCriteresRecherche("secteurSouhaite", e.target.value)
                      setActiveAddressField("secteurSouhaite")
                      rechercherAdresses(e.target.value)
                    }}
                    placeholder="Ex: Brest, Quimper..."
                    className="mt-1"
                    maxLength={150}
                  />
                  {showSuggestions && activeAddressField === "secteurSouhaite" && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => selectionnerAdresse(suggestion, "secteurSouhaite")}
                        >
                          {suggestion.properties.label}
                        </div>
                      ))}
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
                  <Label htmlFor="dateEmmenagement">Date souhaitée d'emménagement</Label>
                  <Input
                    id="dateEmmenagement"
                    type="date"
                    value={criteresRecherche.dateEmmenagement}
                    onChange={(e) => updateCriteresRecherche("dateEmmenagement", e.target.value)}
                    className="mt-1"
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
                  <Label htmlFor="raisonDemenagement">Raison du déménagement</Label>
                  <Textarea
                    id="raisonDemenagement"
                    value={criteresRecherche.raisonDemenagement}
                    onChange={(e) => updateCriteresRecherche("raisonDemenagement", e.target.value)}
                    placeholder="Mutation professionnelle, famille qui s’agrandit, séparation…"
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
              <Label htmlFor="informationsComplementaires">Informations complémentaires</Label>
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

        {detailsEtape.type === "dossierfacile" && (
          <div className="space-y-8">
            <p className="text-slate-600">
              Si vous disposez déjà d’un dossier numérique locatif (ex : DossierFacile), vous pouvez renseigner le
              lien ci-dessous.
              <br />
              Sinon, ne transmettez aucune pièce justificative pour le moment. Nous ne vous demanderons des
              justificatifs par mail que si votre dossier est présélectionné et uniquement après vous avoir
              recontacté.
            </p>

            <div>
              <Label htmlFor="dossierFacileLink" className="flex items-center gap-2 font-semibold text-gray-700">
                <FileText className="h-4 w-4 text-gray-500" />
                Lien DossierFacile
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
                <li>Service public officiel, reconnu par toutes les agences</li>
                <li>Vos données restent protégées</li>
                <li>Vous partagez votre dossier en un seul clic lors de l’étude de votre candidature</li>
              </ul>
              <p className="text-sm pt-2">
                Si vous ne connaissez pas encore DossierFacile,{" "}
                <a
                  href="https://www.dossierfacile.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 font-medium"
                >
                  cliquez ici pour en savoir plus
                </a>
                .
              </p>
            </div>

            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-900">
                    Ne transmettez jamais de justificatifs par email sans demande de notre part.
                  </p>
                  <p className="text-sm mt-1">
                    Préparer un dossier numérique vous fait gagner du temps, mais ce n’est jamais obligatoire à ce
                    stade. Si besoin, nous vous contacterons personnellement pour obtenir les documents nécessaires,
                    et vous expliquerons la marche à suivre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

                  <RecapItem label="Salaire/Revenu principal" value={loc.salaire ? `${loc.salaire} €` : ""} />

                  {loc.revenusAdditionnels.length > 0 && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-slate-500 mb-1">Revenus additionnels :</p>
                      {loc.revenusAdditionnels.map((rev) => (
                        <p key={rev.id} className="font-medium text-slate-800 ml-4">
                          • {rev.type === "Autre" ? rev.precision : rev.type}: {rev.montant || "Non renseigné"} €
                        </p>
                      ))}
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
            </RecapSection>

            {/*  Affiche la section si l’utilisateur a coché “Oui” OU s’il a quand même saisi des infos complémentaires  */}
            {(veutRemplirRecherche === "oui" || criteresRecherche.informationsComplementaires.trim() !== "") && (
              <RecapSection title="Critères de recherche" onEdit={() => setEtape(getEtapeIndex("recherche"))}>
                {veutRemplirRecherche === "oui" && (
                  <>
                    <RecapItem label="Chambres minimum" value={criteresRecherche.nombreChambres} />
                    <RecapItem label="Loyer maximum" value={criteresRecherche.loyerMax} />
                    <RecapItem label="Secteur" value={criteresRecherche.secteurSouhaite} />
                    <RecapItem label="Rayon" value={criteresRecherche.rayonKm} />
                    <RecapItem label="Date d'emménagement" value={criteresRecherche.dateEmmenagement} />
                    <RecapItem label="Préavis à déposer" value={criteresRecherche.preavisADeposer} />
                    <RecapItem label="Raison déménagement" value={criteresRecherche.raisonDemenagement} />
                  </>
                )}
                {/*  Toujours afficher les informations complémentaires si elles existent  */}
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
                    Veuillez vérifier attentivement toutes les informations ci-dessus. Une fois envoyé, un PDF sera
                    automatiquement généré et transmis à l'agence ALV Immobilier.
                  </p>
                  <p>💡 Vous pouvez revenir aux étapes précédentes pour modifier vos informations si nécessaire.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEtape(Math.max(1, etape - 1))}
            disabled={etape === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
          {etape < totalEtapes ? (
            <Button
              type="button"
              onClick={() => {
                /* bloc validation */
                if (detailsEtape.type === "identite" && typeof detailsEtape.locataireIndex === "number") {
                  if (!validateIdentite(detailsEtape.locataireIndex)) {
                    setShowIdErrors(true)
                    setErrorLocIdx(detailsEtape.locataireIndex)
                    toast.error("Merci de remplir tous les champs obligatoires marqués d’un *")
                    return
                  }
                }
                setShowIdErrors(false)
                setErrorLocIdx(null)
                setEtape(Math.min(totalEtapes, etape + 1))
              }}
              className={cn("flex items-center gap-2 text-white", {
                "bg-blue-600 hover:bg-blue-700": detailsEtape.type !== "bien" || bienConcerne.trim() !== "",
                "bg-blue-400 cursor-not-allowed": detailsEtape.type === "bien" && bienConcerne.trim() === "",
              })}
              disabled={detailsEtape.type === "bien" && bienConcerne.trim() === ""}
            >
              {nextButtonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={ouvrirConfirmation}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma fiche de renseignements"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <DialogTitle className="text-lg">Confirmation d'envoi</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Vous êtes sur le point d'envoyer votre demande de visite à l'agence ALV Immobilier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Cette action va :</p>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              <li>Générer automatiquement un PDF de votre dossier</li>
              <li>L'envoyer directement à notre agence</li>
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
            <p className="text-xs text-blue-600 mt-3">💡 Ces adresses seront utilisées pour vous recontacter.</p>
          </div>
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="confirmation"
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(Boolean(checked))}
              className="mt-1"
            />
            <label htmlFor="confirmation" className="text-sm leading-relaxed cursor-pointer">
              J'atteste sur l'honneur l'exactitude des informations communiquées et j'autorise l'agence ALV
              Immobilier à traiter ces données dans le cadre de ma demande de location.
            </label>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={fermerConfirmation} className="w-full sm:w-auto bg-transparent">
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
  </>
)
}

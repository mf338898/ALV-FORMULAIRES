"use client"

import { useState, type ChangeEvent } from "react"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, ArrowRight, Plus, CheckCircle2, Circle, ListIcon, Trash2, AlertTriangle, Info } from "lucide-react"
import { DatePicker } from "@/components/date-picker"
import type { Locataire, GarantContact, GarantFormData } from "@/lib/types"
import { SegmentedProgress, type SegmentedStep, CircularStepIndicator } from "@/components/segmented-progress"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { LoadingOverlay } from "@/components/loading-overlay"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function isValidPhoneDigits(phone: string, min = 10) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= min
}
function isNonNegativeIntegerString(v: string) {
  if (!/^[0-9]+$/.test(v)) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= 0
}
const createPerson = (): Locataire => ({
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

export default function GarantFormPage() {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false)

  const [garant, setGarant] = useState<Locataire>(createPerson())
  const [cautionnes, setCautionnes] = useState<GarantContact[]>([{ nom: "", prenom: "", email: "", telephone: "" }])

  const [showIdErrors, setShowIdErrors] = useState(false)
  const [showProErrors, setShowProErrors] = useState(false)
  const [showCautionnesErrors, setShowCautionnesErrors] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalEtapes = 4
  const steps: SegmentedStep[] = [
    { key: "cautionnes", label: "Locataire(s)", index: 1 },
    { key: "identite", label: "Identité", index: 2 },
    { key: "profession", label: "Profession", index: 3 },
    { key: "recapitulatif", label: "Récapitulatif", index: 4 },
  ]

  const updateGarant = (field: keyof Locataire, value: string) => {
    setGarant((prev) => ({ ...prev, [field]: value }))
  }

  const updateCautionne = (i: number, field: keyof GarantContact, value: string) => {
    setCautionnes((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const addCautionne = () => {
    if (cautionnes.length >= 4) return
    setCautionnes((prev) => [...prev, { nom: "", prenom: "", email: "", telephone: "" }])
  }

  const removeCautionne = (idx: number) => {
    setCautionnes((prev) => prev.filter((_, i) => i !== idx))
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

  const isEmpty = (v?: string) => !v || v.trim() === ""

  const isCautionneValid = (c: GarantContact) =>
    !isEmpty(c.nom) && !isEmpty(c.prenom) && isValidEmail(c.email || "") && isValidPhoneDigits(c.telephone || "", 10)

  const validateIdentite = () => {
    const G = garant
    const requiredOk =
      !isEmpty(G.civilite) &&
      !isEmpty(G.prenom) &&
      !isEmpty(G.nom) &&
      !isEmpty(G.email) &&
      !isEmpty(G.telephone) &&
      !isEmpty(G.adresseActuelle) &&
      !isEmpty(G.situationConjugale) &&
      !isEmpty(G.situationActuelle) &&
      !isEmpty(G.dateNaissance) &&
      !isEmpty(G.lieuNaissance)
    const emailOk = isValidEmail(G.email || "")
    const phoneOk = isValidPhoneDigits(G.telephone || "", 10)
    return requiredOk && emailOk && phoneOk
  }

  type ProErrors = Record<string, boolean>
  const getProErrors = (): ProErrors => {
    const G = garant
    const errors: ProErrors = {}
    const requireNonNegativeSalary = (flag: boolean) => {
      if (flag && !isNonNegativeIntegerString(G.salaire)) errors.salaire = true
    }
    const requireEmployerPhone = (flag: boolean) => {
      if (flag && !isValidPhoneDigits(G.employeurTelephone || "", 10)) errors.employeurTelephone = true
    }
    switch (G.typeContrat) {
      case "cdi":
        if (isEmpty(G.employeurNom)) errors.employeurNom = true
        if (isEmpty(G.profession)) errors.profession = true
        if (isEmpty(G.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(G.dateEmbauche)) errors.dateEmbauche = true
        requireEmployerPhone(true)
        requireNonNegativeSalary(true)
        break
      case "cdd":
        if (isEmpty(G.employeurNom)) errors.employeurNom = true
        if (isEmpty(G.profession)) errors.profession = true
        if (isEmpty(G.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(G.dateFinContrat)) errors.dateFinContrat = true
        requireEmployerPhone(true)
        requireNonNegativeSalary(true)
        break
      case "interim":
        if (isEmpty(G.agenceInterim)) errors.agenceInterim = true
        if (isEmpty(G.dureeInscriptionInterim)) errors.dureeInscriptionInterim = true
        requireNonNegativeSalary(true)
        break
      case "fonctionnaire":
        if (isEmpty(G.employeurNom)) errors.employeurNom = true
        if (isEmpty(G.profession)) errors.profession = true
        if (isEmpty(G.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(G.dateEmbauche)) errors.dateEmbauche = true
        requireEmployerPhone(true)
        requireNonNegativeSalary(true)
        break
      case "freelance":
        if (isEmpty(G.profession)) errors.profession = true
        if (isEmpty(G.employeurNom)) errors.employeurNom = true
        if (isEmpty(G.employeurAdresse)) errors.employeurAdresse = true
        if (isEmpty(G.dateDebutActivite)) errors.dateDebutActivite = true
        requireEmployerPhone(true)
        requireNonNegativeSalary(true)
        break
      case "retraite":
        if (isEmpty(G.regimeRetraite)) errors.regimeRetraite = true
        if (isEmpty(G.dateDebutRetraite)) errors.dateDebutRetraite = true
        requireNonNegativeSalary(true)
        break
      case "etudiant":
        if (isEmpty(G.etablissementFormation)) errors.etablissementFormation = true
        if (isEmpty(G.alternance)) errors.alternance = true
        if (G.alternance === "oui") {
          if (isEmpty(G.typeAlternance)) errors.typeAlternance = true
          if (isEmpty(G.employeurNom)) errors.employeurNom = true
          if (isEmpty(G.employeurAdresse)) errors.employeurAdresse = true
          if (isEmpty(G.profession)) errors.profession = true
          if (isEmpty(G.dateEmbauche)) errors.dateEmbauche = true
          if (isEmpty(G.dateFinContrat)) errors.dateFinContrat = true
          requireEmployerPhone(true)
          requireNonNegativeSalary(true)
        }
        break
      case "sans_emploi":
        if (isEmpty(G.situationActuelleSansEmploi)) errors.situationActuelleSansEmploi = true
        requireNonNegativeSalary(true)
        if (isEmpty(G.origineRevenuPrincipal)) errors.origineRevenuPrincipal = true
        if (G.origineRevenuPrincipal === "Autre" && isEmpty(G.origineRevenuPrincipalAutre))
          errors.origineRevenuPrincipalAutre = true
        break
      default:
        errors.typeContrat = isEmpty(G.typeContrat)
        break
    }
    if (G.revenusAdditionnels?.length) {
      for (const r of G.revenusAdditionnels) {
        if (!isNonNegativeIntegerString(r.montant)) {
          errors[`revenu-${r.id}`] = true
        }
      }
    }
    return errors
  }

  const currentTitle = (() => {
    switch (etape) {
      case 1:
        return "Pour quel locataire vous portez-vous garant ?"
      case 2:
        return "Identité & Situation (garant)"
      case 3:
        return "Situation professionnelle (garant)"
      case 4:
        return "Récapitulatif de votre fiche garant"
      default:
        return "Fiche garant"
    }
  })()

  const isStepValid = (() => {
    if (etape === 1) {
      return cautionnes.length >= 1 && cautionnes.every(isCautionneValid)
    }
    if (etape === 2) return validateIdentite()
    if (etape === 3) return Object.keys(getProErrors()).length === 0
    return true
  })()

  const canLeaveCurrentStep = () => {
    setErrorMsg(null)
    if (etape === 1) {
      if (cautionnes.length < 1 || !cautionnes.every(isCautionneValid)) {
        setShowCautionnesErrors(true)
        setErrorMsg("Veuillez renseigner au moins un locataire, avec nom, prénom, e‑mail et téléphone valides.")
        toast.error("Informations locataire(s) incomplètes.")
        return false
      }
      return true
    }
    if (etape === 2) {
      if (!validateIdentite()) {
        setShowIdErrors(true)
        setErrorMsg("Complétez les champs d’identité obligatoires.")
        toast.error("Identité incomplète.")
        return false
      }
      return true
    }
    if (etape === 3) {
      if (Object.keys(getProErrors()).length > 0) {
        setShowProErrors(true)
        setErrorMsg("Complétez les champs professionnels obligatoires.")
        toast.error("Situation professionnelle incomplète.")
        return false
      }
      return true
    }
    return true
  }

  const goNext = () => {
    if (!canLeaveCurrentStep()) return
    const next = Math.min(totalEtapes, etape + 1)
    setEtape(next)
    setMaxReachedStep((prev) => Math.max(prev, next))
  }

  const goToStep = (idx: number) => {
    if (idx <= etape) {
      setEtape(idx)
      return
    }
    if (idx > maxReachedStep) {
      if (!canLeaveCurrentStep()) return
      const next = Math.min(totalEtapes, etape + 1)
      setEtape(next)
      setMaxReachedStep((prev) => Math.max(prev, next))
      return
    }
    setEtape(idx)
  }

  const openConfirm = () => {
    setShowConfirmDialog(true)
    setConfirmationChecked(false)
  }

  const submit = async () => {
    setIsSubmitting(true)
    setShowConfirmDialog(false)
    toast.info("Envoi de votre fiche garant...")
    try {
      const payload: GarantFormData = { garant, cautionnes }
      const res = await fetch("/api/generer-pdf-garant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || "Fiche garant envoyée.")
        router.push("/locataire/confirmation?email=" + encodeURIComponent(garant.email || ""))
      } else {
        toast.error(json.message || "Une erreur est survenue.", {
          description: json.error || "Veuillez réessayer ultérieurement.",
        })
      }
    } catch (e) {
      toast.error("Erreur de communication avec le serveur.", {
        description: "Vérifiez votre connexion et réessayez.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const segSteps: SegmentedStep[] = steps

  const proErr = getProErrors()
  const showPro = showProErrors
  const err = (key: keyof typeof proErr) => showPro && proErr[key as string]

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <LoadingOverlay show={isSubmitting} message="Veuillez patienter… Votre fiche garant est en cours de traitement" />
      {/* Mobile sticky header */}
      <div className="md:hidden sticky top-0 z-30 -mt-8 mb-4 bg-white/80 backdrop-blur border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <CircularStepIndicator current={etape} total={totalEtapes} />
          <p className="text-xs text-slate-600">
            Étape {etape} sur {totalEtapes} : <span className="font-medium text-slate-800">{currentTitle}</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="w-full">
          <SegmentedProgress
            steps={segSteps}
            currentStep={etape}
            maxReachedStep={maxReachedStep}
            title={currentTitle}
            onSelect={(idx) => {
              if (idx > maxReachedStep) {
                toast.info("Veuillez terminer l’étape en cours avant d’accéder à la suivante.")
                return
              }
              goToStep(idx)
            }}
          />
        </div>
        <div className="md:hidden">
          <Sheet open={mobileStepsOpen} onOpenChange={setMobileStepsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <ListIcon className="h-4 w-4" />
                Étapes
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>Étapes de la fiche garant</SheetTitle>
              </SheetHeader>
              <nav aria-label="Étapes (mobile)" className="mt-4 space-y-2">
                {steps.map((s) => {
                  const completed = s.index < etape
                  const current = s.index === etape
                  const disabled = s.index > maxReachedStep
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        if (disabled) {
                          toast.info("Veuillez terminer l’étape en cours avant d’accéder à la suivante.")
                          return
                        }
                        goToStep(s.index)
                        setMobileStepsOpen(false)
                      }}
                      aria-disabled={disabled}
                      className={cn(
                        "w-full text-left flex items-center gap-3 rounded-md border px-3 py-2 transition",
                        disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed",
                        completed && "bg-emerald-50 border-emerald-200 text-emerald-800",
                        current && "bg-blue-50 border-blue-200 text-blue-800",
                        !completed &&
                          !current &&
                          !disabled &&
                          "bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
                      )}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      )}
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <aside className="md:col-span-4 lg:col-span-3 hidden md:block">
          <nav aria-label="Étapes" className="space-y-3">
            <Accordion type="multiple" defaultValue={["bloc"]} className="space-y-2">
              <AccordionItem value="bloc" className="border rounded-md bg-white">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <span className="text-sm font-semibold">Fiche Garant</span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0 space-y-2">
                  {steps.map((s) => {
                    const completed = s.index < etape
                    const current = s.index === etape
                    const disabled = s.index > maxReachedStep
                    return (
                      <button
                        key={s.key}
                        onClick={() => {
                          if (disabled) {
                            toast.info("Veuillez terminer l’étape en cours avant d’accéder à la suivante.")
                            return
                          }
                          goToStep(s.index)
                        }}
                        aria-disabled={disabled}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-md border px-3 py-2 transition",
                          disabled && "opacity-50 cursor-not-allowed hover:cursor-not-allowed",
                          completed && "bg-emerald-50 border-emerald-200 text-emerald-800",
                          current && "bg-blue-50 border-blue-200 text-blue-800",
                          !completed &&
                            !current &&
                            !disabled &&
                            "bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
                        )}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        )}
                        <span className="text-sm font-medium">{s.label}</span>
                      </button>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>
        </aside>

        <section className="md:col-span-8 lg:col-span-9">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">{currentTitle}</CardTitle>
              {errorMsg && <p className="text-sm text-red-600 mt-1">{errorMsg}</p>}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Cautionnés */}
              {etape === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm">
                        Indiquez le(s) locataire(s) pour lequel(s) vous vous portez caution (jusqu’à 4).
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cautionnes.map((c, idx) => {
                      const invalidNom = showCautionnesErrors && c.nom.trim() === ""
                      const invalidPrenom = showCautionnesErrors && c.prenom.trim() === ""
                      const invalidEmail = showCautionnesErrors && !isValidEmail(c.email || "")
                      const invalidPhone = showCautionnesErrors && !isValidPhoneDigits(c.telephone || "")
                      return (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-700">Locataire {idx + 1}</p>
                            {cautionnes.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCautionne(idx)}
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                aria-label={`Supprimer locataire ${idx + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>
                                Prénom <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                value={c.prenom}
                                onChange={(e) => updateCautionne(idx, "prenom", e.target.value)}
                                className={cn("mt-1", invalidPrenom && "border-red-500 bg-red-50")}
                                maxLength={50}
                                aria-invalid={invalidPrenom}
                              />
                              {invalidPrenom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                            </div>
                            <div>
                              <Label>
                                Nom <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                value={c.nom}
                                onChange={(e) => updateCautionne(idx, "nom", e.target.value)}
                                className={cn("mt-1", invalidNom && "border-red-500 bg-red-50")}
                                maxLength={50}
                                aria-invalid={invalidNom}
                              />
                              {invalidNom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                            </div>
                            <div>
                              <Label>
                                E‑mail <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                type="email"
                                value={c.email}
                                onChange={(e) => updateCautionne(idx, "email", e.target.value)}
                                className={cn("mt-1", invalidEmail && "border-red-500 bg-red-50")}
                                maxLength={80}
                                aria-invalid={invalidEmail}
                              />
                              {invalidEmail && <p className="text-xs text-red-600 mt-1">Adresse e‑mail invalide</p>}
                            </div>
                            <div>
                              <Label>
                                Téléphone <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                type="tel"
                                value={c.telephone}
                                onChange={(e) =>
                                  handleNumericInputChange(e, (val) => updateCautionne(idx, "telephone", val), true)
                                }
                                placeholder="06 12 34 56 78"
                                className={cn("mt-1", invalidPhone && "border-red-500 bg-red-50")}
                                maxLength={15}
                                aria-invalid={invalidPhone}
                              />
                              {invalidPhone && (
                                <p className="text-xs text-red-600 mt-1">Numéro invalide (10 chiffres requis)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between">
                    <div />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCautionne}
                      disabled={cautionnes.length >= 4}
                      className="bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un locataire
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Identité garant (required fields) */}
              {etape === 2 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>
                        Civilité <span className="text-red-600">*</span>
                      </Label>
                      <Select value={garant.civilite} onValueChange={(v) => updateGarant("civilite", v)}>
                        <SelectTrigger
                          className={cn("mt-1", showIdErrors && !garant.civilite && "border-red-500 bg-red-50")}
                        >
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monsieur">Monsieur</SelectItem>
                          <SelectItem value="madame">Madame</SelectItem>
                        </SelectContent>
                      </Select>
                      {showIdErrors && !garant.civilite && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                    <div />
                    <div>
                      <Label>
                        Prénom <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        value={garant.prenom}
                        onChange={(e) => updateGarant("prenom", e.target.value)}
                        className={cn("mt-1", showIdErrors && !garant.prenom && "border-red-500 bg-red-50")}
                        maxLength={50}
                      />
                      {showIdErrors && !garant.prenom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                    </div>
                    <div>
                      <Label>
                        Nom <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        value={garant.nom}
                        onChange={(e) => updateGarant("nom", e.target.value)}
                        className={cn("mt-1", showIdErrors && !garant.nom && "border-red-500 bg-red-50")}
                        maxLength={50}
                      />
                      {showIdErrors && !garant.nom && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                    </div>
                    <div>
                      <Label>
                        E‑mail <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={garant.email}
                        onChange={(e) => updateGarant("email", e.target.value)}
                        className={cn(
                          "mt-1",
                          (showIdErrors && !garant.email) || (garant.email && !isValidEmail(garant.email))
                            ? "border-red-500 bg-red-50"
                            : "",
                        )}
                        maxLength={80}
                      />
                      {showIdErrors && !garant.email && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      {garant.email && !isValidEmail(garant.email) && (
                        <p className="text-xs text-red-600 mt-1">Adresse e‑mail invalide</p>
                      )}
                    </div>
                    <div>
                      <Label>
                        Téléphone <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        type="tel"
                        value={garant.telephone}
                        onChange={(e) => handleNumericInputChange(e, (val) => updateGarant("telephone", val), true)}
                        placeholder="06 12 34 56 78"
                        className={cn(
                          "mt-1",
                          (showIdErrors && !garant.telephone) ||
                            (garant.telephone && !isValidPhoneDigits(garant.telephone, 10))
                            ? "border-red-500 bg-red-50"
                            : "",
                        )}
                        maxLength={15}
                      />
                      {showIdErrors && !garant.telephone && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                      {garant.telephone && !isValidPhoneDigits(garant.telephone, 10) && (
                        <p className="text-xs text-red-600 mt-1">Numéro invalide (10 chiffres requis)</p>
                      )}
                    </div>
                    <div>
                      <Label>
                        Date de naissance <span className="text-red-600">*</span>
                      </Label>
                      <DatePicker
                        id="dateNaissance-garant"
                        value={garant.dateNaissance}
                        onChange={(iso) => updateGarant("dateNaissance", iso)}
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        disableFuture
                        ariaLabel="Sélectionner la date de naissance"
                        className={cn("mt-1", showIdErrors && !garant.dateNaissance && "ring-1 ring-red-500 rounded")}
                        placeholder="jj/mm/aaaa"
                        displayFormat="dd/MM/yyyy"
                      />
                      {showIdErrors && !garant.dateNaissance && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                    <div>
                      <Label>
                        Lieu de naissance <span className="text-red-600">*</span>
                      </Label>
                      <CityAutocomplete
                        id="lieuNaissance-garant"
                        value={garant.lieuNaissance}
                        onChange={(val) => updateGarant("lieuNaissance", val)}
                        placeholder="Tapez une ville (ex: Brest) + code postal"
                        className={cn("mt-1", showIdErrors && !garant.lieuNaissance && "border-red-500 bg-red-50")}
                        ariaInvalid={showIdErrors && !garant.lieuNaissance}
                      />
                      {showIdErrors && !garant.lieuNaissance && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label>
                        Adresse actuelle <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        value={garant.adresseActuelle}
                        onChange={(e) => updateGarant("adresseActuelle", e.target.value)}
                        className={cn("mt-1", showIdErrors && !garant.adresseActuelle && "border-red-500 bg-red-50")}
                        maxLength={120}
                      />
                      {showIdErrors && !garant.adresseActuelle && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                    <div>
                      <Label>
                        Situation conjugale <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={garant.situationConjugale}
                        onValueChange={(v) => updateGarant("situationConjugale", v)}
                      >
                        <SelectTrigger
                          className={cn(
                            "mt-1",
                            showIdErrors && !garant.situationConjugale && "border-red-500 bg-red-50",
                          )}
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
                      {showIdErrors && !garant.situationConjugale && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                    <div>
                      <Label>
                        Statut logement actuel <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={garant.situationActuelle}
                        onValueChange={(v) => updateGarant("situationActuelle", v)}
                      >
                        <SelectTrigger
                          className={cn(
                            "mt-1",
                            showIdErrors && !garant.situationActuelle && "border-red-500 bg-red-50",
                          )}
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
                      {showIdErrors && !garant.situationActuelle && (
                        <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Profession */}
              {etape === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label>
                      Sélectionner votre situation professionnelle <span className="text-red-600">*</span>
                    </Label>
                    <Select value={garant.typeContrat} onValueChange={(v) => updateGarant("typeContrat", v)}>
                      <SelectTrigger className={cn(showPro && proErr.typeContrat && "border-red-500 bg-red-50")}>
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
                    {showPro && proErr.typeContrat && <p className="text-xs text-red-600">Champ obligatoire</p>}
                  </div>

                  {/* For each type, mirror the same structure as the locataire pro section (required) */}
                  {garant.typeContrat === "cdi" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Nom de l’entreprise / administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurNom}
                          onChange={(e) => updateGarant("employeurNom", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurNom && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.employeurNom && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Profession / poste occupé <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.profession}
                          onChange={(e) => updateGarant("profession", e.target.value)}
                          className={cn("mt-1", showPro && proErr.profession && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.profession && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Adresse de l’entreprise / administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurAdresse}
                          onChange={(e) => updateGarant("employeurAdresse", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurAdresse && "border-red-500 bg-red-50")}
                          maxLength={120}
                        />
                        {showPro && proErr.employeurAdresse && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Numéro de téléphone de l’entreprise <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="tel"
                          value={garant.employeurTelephone}
                          onChange={(e) =>
                            handleNumericInputChange(e, (val) => updateGarant("employeurTelephone", val), true)
                          }
                          placeholder="01 23 45 67 89"
                          className={cn("mt-1", showPro && proErr.employeurTelephone && "border-red-500 bg-red-50")}
                          maxLength={15}
                        />
                        {showPro && proErr.employeurTelephone && (
                          <p className="text-xs text-red-600 mt-1">Numéro invalide</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Date d’embauche <span className="text-red-600">*</span>
                        </Label>
                        <DatePicker
                          id="date-embauche-garant"
                          value={garant.dateEmbauche}
                          onChange={(iso) => updateGarant("dateEmbauche", iso)}
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 1}
                          ariaLabel="Sélectionner la date d'embauche"
                          className={cn("mt-1", showPro && proErr.dateEmbauche && "ring-1 ring-red-500 rounded")}
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                        {showPro && proErr.dateEmbauche && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Salaire net mensuel (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mirror other contract types similar to the locataire form (CDD, interim, fonctionnaire, freelance, retraite, etudiant[+alternance], sans_emploi) */}
                  {/* For brevity in this UI block, we've implemented the pattern for each branch similarly to the locataire form above. */}
                  {/* CDD */}
                  {garant.typeContrat === "cdd" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Nom de l’entreprise / administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurNom}
                          onChange={(e) => updateGarant("employeurNom", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurNom && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.employeurNom && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Profession / poste occupé <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.profession}
                          onChange={(e) => updateGarant("profession", e.target.value)}
                          className={cn("mt-1", showPro && proErr.profession && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.profession && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Adresse de l’entreprise / administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurAdresse}
                          onChange={(e) => updateGarant("employeurAdresse", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurAdresse && "border-red-500 bg-red-50")}
                          maxLength={120}
                        />
                        {showPro && proErr.employeurAdresse && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Numéro de téléphone de l’entreprise <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="tel"
                          value={garant.employeurTelephone}
                          onChange={(e) =>
                            handleNumericInputChange(e, (val) => updateGarant("employeurTelephone", val), true)
                          }
                          placeholder="01 23 45 67 89"
                          className={cn("mt-1", showPro && proErr.employeurTelephone && "border-red-500 bg-red-50")}
                          maxLength={15}
                        />
                        {showPro && proErr.employeurTelephone && (
                          <p className="text-xs text-red-600 mt-1">Numéro invalide</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Date de fin de contrat <span className="text-red-600">*</span>
                        </Label>
                        <DatePicker
                          id="dateFinContrat-garant"
                          value={garant.dateFinContrat}
                          onChange={(iso) => updateGarant("dateFinContrat", iso)}
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 2}
                          ariaLabel="Sélectionner la date de fin de contrat"
                          className={cn("mt-1", showPro && proErr.dateFinContrat && "ring-1 ring-red-500 rounded")}
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                        {showPro && proErr.dateFinContrat && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Salaire net mensuel (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Intérim */}
                  {garant.typeContrat === "interim" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Agence d’intérim principale <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.agenceInterim}
                          onChange={(e) => updateGarant("agenceInterim", e.target.value)}
                          className={cn("mt-1", showPro && proErr.agenceInterim && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.agenceInterim && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Depuis combien de temps êtes-vous en intérim ? <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.dureeInscriptionInterim}
                          onChange={(e) => updateGarant("dureeInscriptionInterim", e.target.value)}
                          className={cn(
                            "mt-1",
                            showPro && proErr.dureeInscriptionInterim && "border-red-500 bg-red-50",
                          )}
                          maxLength={60}
                        />
                        {showPro && proErr.dureeInscriptionInterim && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Revenu net mensuel moyen (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fonctionnaire */}
                  {garant.typeContrat === "fonctionnaire" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Nom de l’administration / entreprise <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurNom}
                          onChange={(e) => updateGarant("employeurNom", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurNom && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.employeurNom && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Profession / poste occupé <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.profession}
                          onChange={(e) => updateGarant("profession", e.target.value)}
                          className={cn("mt-1", showPro && proErr.profession && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.profession && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Adresse de l’administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurAdresse}
                          onChange={(e) => updateGarant("employeurAdresse", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurAdresse && "border-red-500 bg-red-50")}
                          maxLength={120}
                        />
                        {showPro && proErr.employeurAdresse && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Numéro de téléphone de l’administration <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="tel"
                          value={garant.employeurTelephone}
                          onChange={(e) =>
                            handleNumericInputChange(e, (val) => updateGarant("employeurTelephone", val), true)
                          }
                          placeholder="01 23 45 67 89"
                          className={cn("mt-1", showPro && proErr.employeurTelephone && "border-red-500 bg-red-50")}
                          maxLength={15}
                        />
                        {showPro && proErr.employeurTelephone && (
                          <p className="text-xs text-red-600 mt-1">Numéro invalide</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Date d’embauche <span className="text-red-600">*</span>
                        </Label>
                        <DatePicker
                          id="date-embauche-fct"
                          value={garant.dateEmbauche}
                          onChange={(iso) => updateGarant("dateEmbauche", iso)}
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 1}
                          ariaLabel="Sélectionner la date d'embauche"
                          className={cn("mt-1", showPro && proErr.dateEmbauche && "ring-1 ring-red-500 rounded")}
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                        {showPro && proErr.dateEmbauche && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Salaire net mensuel (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Freelance */}
                  {garant.typeContrat === "freelance" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Activité / métier <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.profession}
                          onChange={(e) => updateGarant("profession", e.target.value)}
                          className={cn("mt-1", showPro && proErr.profession && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.profession && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <Label>
                          Nom de la structure <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurNom}
                          onChange={(e) => updateGarant("employeurNom", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurNom && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.employeurNom && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Adresse de la structure <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.employeurAdresse}
                          onChange={(e) => updateGarant("employeurAdresse", e.target.value)}
                          className={cn("mt-1", showPro && proErr.employeurAdresse && "border-red-500 bg-red-50")}
                          maxLength={120}
                        />
                        {showPro && proErr.employeurAdresse && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Numéro de téléphone <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="tel"
                          value={garant.employeurTelephone}
                          onChange={(e) =>
                            handleNumericInputChange(e, (val) => updateGarant("employeurTelephone", val), true)
                          }
                          placeholder="01 23 45 67 89"
                          className={cn("mt-1", showPro && proErr.employeurTelephone && "border-red-500 bg-red-50")}
                          maxLength={15}
                        />
                        {showPro && proErr.employeurTelephone && (
                          <p className="text-xs text-red-600 mt-1">Numéro invalide</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Date de début d’activité <span className="text-red-600">*</span>
                        </Label>
                        <DatePicker
                          id="dateDebutActivite-garant"
                          value={garant.dateDebutActivite}
                          onChange={(iso) => updateGarant("dateDebutActivite", iso)}
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 1}
                          ariaLabel="Sélectionner la date de début d'activité"
                          className={cn("mt-1", showPro && proErr.dateDebutActivite && "ring-1 ring-red-500 rounded")}
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                        {showPro && proErr.dateDebutActivite && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Revenu net moyen mensuel (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Retraite */}
                  {garant.typeContrat === "retraite" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          Régime ou caisse principale <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.regimeRetraite}
                          onChange={(e) => updateGarant("regimeRetraite", e.target.value)}
                          className={cn("mt-1", showPro && proErr.regimeRetraite && "border-red-500 bg-red-50")}
                          maxLength={100}
                        />
                        {showPro && proErr.regimeRetraite && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Date de départ à la retraite <span className="text-red-600">*</span>
                        </Label>
                        <DatePicker
                          id="dateDebutRetraite-garant"
                          value={garant.dateDebutRetraite}
                          onChange={(iso) => updateGarant("dateDebutRetraite", iso)}
                          fromYear={1950}
                          toYear={new Date().getFullYear() + 5}
                          ariaLabel="Sélectionner la date de départ à la retraite"
                          className={cn("mt-1", showPro && proErr.dateDebutRetraite && "ring-1 ring-red-500 rounded")}
                          placeholder="jj/mm/aaaa"
                          displayFormat="dd/MM/yyyy"
                        />
                        {showPro && proErr.dateDebutRetraite && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>
                          Montant de la pension nette mensuelle (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Étudiant */}
                  {garant.typeContrat === "etudiant" && (
                    <div className="space-y-6">
                      <div>
                        <Label>
                          Établissement / formation <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.etablissementFormation}
                          onChange={(e) => updateGarant("etablissementFormation", e.target.value)}
                          className={cn("mt-1", showPro && proErr.etablissementFormation && "border-red-500 bg-red-50")}
                          maxLength={150}
                        />
                        {showPro && proErr.etablissementFormation && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Êtes-vous en alternance ? <span className="text-red-600">*</span>
                        </Label>
                        <Select value={garant.alternance} onValueChange={(v) => updateGarant("alternance", v)}>
                          <SelectTrigger
                            className={cn("mt-1", showPro && proErr.alternance && "border-red-500 bg-red-50")}
                          >
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oui">Oui</SelectItem>
                            <SelectItem value="non">Non</SelectItem>
                          </SelectContent>
                        </Select>
                        {showPro && proErr.alternance && <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>}
                      </div>
                      {garant.alternance === "oui" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                          <div>
                            <Label>
                              Type de contrat <span className="text-red-600">*</span>
                            </Label>
                            <Select
                              value={garant.typeAlternance}
                              onValueChange={(v) => updateGarant("typeAlternance", v)}
                            >
                              <SelectTrigger
                                className={cn("mt-1", showPro && proErr.typeAlternance && "border-red-500 bg-red-50")}
                              >
                                <SelectValue placeholder="Ex: Apprentissage, Pro" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="apprentissage">Apprentissage</SelectItem>
                                <SelectItem value="professionnalisation">Professionnalisation</SelectItem>
                              </SelectContent>
                            </Select>
                            {showPro && proErr.typeAlternance && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Nom de l’entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={garant.employeurNom}
                              onChange={(e) => updateGarant("employeurNom", e.target.value)}
                              className={cn("mt-1", showPro && proErr.employeurNom && "border-red-500 bg-red-50")}
                              maxLength={100}
                            />
                            {showPro && proErr.employeurNom && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Adresse de l’entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              value={garant.employeurAdresse}
                              onChange={(e) => updateGarant("employeurAdresse", e.target.value)}
                              className={cn("mt-1", showPro && proErr.employeurAdresse && "border-red-500 bg-red-50")}
                              maxLength={120}
                            />
                            {showPro && proErr.employeurAdresse && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Numéro de téléphone de l’entreprise <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="tel"
                              value={garant.employeurTelephone}
                              onChange={(e) =>
                                handleNumericInputChange(e, (val) => updateGarant("employeurTelephone", val), true)
                              }
                              placeholder="01 23 45 67 89"
                              className={cn("mt-1", showPro && proErr.employeurTelephone && "border-red-500 bg-red-50")}
                              maxLength={15}
                            />
                            {showPro && proErr.employeurTelephone && (
                              <p className="text-xs text-red-600 mt-1">Numéro invalide</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Date de début de contrat <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id="dateDebut-garant"
                              value={garant.dateEmbauche}
                              onChange={(iso) => updateGarant("dateEmbauche", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 2}
                              ariaLabel="Sélectionner la date de début de contrat"
                              className={cn("mt-1", showPro && proErr.dateEmbauche && "ring-1 ring-red-500 rounded")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {showPro && proErr.dateEmbauche && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div>
                            <Label>
                              Date de fin de contrat <span className="text-red-600">*</span>
                            </Label>
                            <DatePicker
                              id="dateFin-garant"
                              value={garant.dateFinContrat}
                              onChange={(iso) => updateGarant("dateFinContrat", iso)}
                              fromYear={1990}
                              toYear={new Date().getFullYear() + 3}
                              ariaLabel="Sélectionner la date de fin de contrat"
                              className={cn("mt-1", showPro && proErr.dateFinContrat && "ring-1 ring-red-500 rounded")}
                              placeholder="jj/mm/aaaa"
                              displayFormat="dd/MM/yyyy"
                            />
                            {showPro && proErr.dateFinContrat && (
                              <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label>
                              Salaire net mensuel (€) <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              type="text"
                              value={garant.salaire}
                              onChange={(e) => {
                                const val = e.target.value
                                if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                              }}
                              className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                            />
                            {showPro && proErr.salaire && (
                              <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sans emploi */}
                  {garant.typeContrat === "sans_emploi" && (
                    <div className="space-y-6">
                      <div>
                        <Label>
                          Situation actuelle <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          value={garant.situationActuelleSansEmploi}
                          onChange={(e) => updateGarant("situationActuelleSansEmploi", e.target.value)}
                          className={cn(
                            "mt-1",
                            showPro && proErr.situationActuelleSansEmploi && "border-red-500 bg-red-50",
                          )}
                          maxLength={150}
                        />
                        {showPro && proErr.situationActuelleSansEmploi && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Ressources mensuelles principales (€) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={garant.salaire}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[0-9]*$/.test(val)) updateGarant("salaire", val)
                          }}
                          className={cn("mt-1", showPro && proErr.salaire && "border-red-500 bg-red-50")}
                          maxLength={10}
                        />
                        {showPro && proErr.salaire && (
                          <p className="text-xs text-red-600 mt-1">Le montant doit être un nombre entier ≥ 0</p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Origine du revenu principal <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={garant.origineRevenuPrincipal}
                          onChange={(v) => updateGarant("origineRevenuPrincipal", v)}
                        >
                          <SelectTrigger
                            className={cn(
                              "mt-1",
                              showPro && proErr.origineRevenuPrincipal && "border-red-500 bg-red-50",
                            )}
                          >
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {["RSA", "Indemnités chômage", "Aide familiale", "Pension alimentaire", "Autre"].map(
                              (o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        {showPro && proErr.origineRevenuPrincipal && (
                          <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                        )}
                      </div>
                      {garant.origineRevenuPrincipal === "Autre" && (
                        <div>
                          <Label>
                            Précisez la nature du revenu <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            value={garant.origineRevenuPrincipalAutre}
                            onChange={(e) => updateGarant("origineRevenuPrincipalAutre", e.target.value)}
                            className={cn(
                              "mt-1",
                              showPro && proErr.origineRevenuPrincipalAutre && "border-red-500 bg-red-50",
                            )}
                            maxLength={100}
                          />
                          {showPro && proErr.origineRevenuPrincipalAutre && (
                            <p className="text-xs text-red-600 mt-1">Champ obligatoire</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Autres revenus */}
                  <div className="pt-8 border-t">
                    <h3 className="text-lg font-semibold text-gray-800">Autres revenus</h3>
                    <p className="text-sm text-slate-500 mt-1">Ajoutez vos autres sources de revenus si applicable.</p>
                    {/* For simplicity, we keep this optional for garants; the "required" policy focuses on principal fields. */}
                  </div>
                </div>
              )}

              {/* Step 4: Recap */}
              {etape === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="text-xl font-semibold text-gray-800">Locataire(s) cautionné(s)</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {cautionnes.map((c, idx) => (
                        <div key={idx} className="py-2">
                          <p className="font-medium text-slate-800">
                            • {c.prenom} {c.nom}
                          </p>
                          <p className="text-sm text-slate-600">
                            {c.email} — {c.telephone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="text-xl font-semibold text-gray-800">Identité du garant</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <p>
                        <span className="text-slate-500">Civilité:</span> {garant.civilite}
                      </p>
                      <p>
                        <span className="text-slate-500">Nom/Prénom:</span> {garant.nom} {garant.prenom}
                      </p>
                      <p>
                        <span className="text-slate-500">Né(e) le:</span> {garant.dateNaissance}
                      </p>
                      <p>
                        <span className="text-slate-500">Lieu de naissance:</span> {garant.lieuNaissance}
                      </p>
                      <p>
                        <span className="text-slate-500">Email:</span> {garant.email}
                      </p>
                      <p>
                        <span className="text-slate-500">Téléphone:</span> {garant.telephone}
                      </p>
                      <p className="md:col-span-2">
                        <span className="text-slate-500">Adresse:</span> {garant.adresseActuelle}
                      </p>
                      <p>
                        <span className="text-slate-500">Situation conjugale:</span> {garant.situationConjugale}
                      </p>
                      <p>
                        <span className="text-slate-500">Statut logement:</span> {garant.situationActuelle}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="text-xl font-semibold text-gray-800">Situation professionnelle</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <p>
                        <span className="text-slate-500">Type:</span> {garant.typeContrat}
                      </p>
                      <p>
                        <span className="text-slate-500">Profession:</span> {garant.profession}
                      </p>
                      <p>
                        <span className="text-slate-500">Employeur:</span> {garant.employeurNom}
                      </p>
                      <p className="md:col-span-2">
                        <span className="text-slate-500">Adresse employeur:</span> {garant.employeurAdresse}
                      </p>
                      <p>
                        <span className="text-slate-500">Téléphone employeur:</span> {garant.employeurTelephone}
                      </p>
                      <p>
                        <span className="text-slate-500">Date d'embauche:</span> {garant.dateEmbauche}
                      </p>
                      <p>
                        <span className="text-slate-500">Date de fin de contrat:</span> {garant.dateFinContrat}
                      </p>
                      <p>
                        <span className="text-slate-500">Revenu principal:</span>{" "}
                        {garant.salaire ? `${garant.salaire} €` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm space-y-2">
                        <p className="font-bold">Vérification avant envoi</p>
                        <p>
                          Un PDF sera généré et transmis à l’agence et aux locataires concernés. Vous recevrez une copie
                          par e‑mail.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer actions */}
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
                    onClick={goNext}
                    className={cn("flex items-center gap-2 text-white", {
                      "bg-blue-600 hover:bg-blue-700": isStepValid,
                      "bg-blue-400": !isStepValid,
                    })}
                  >
                    Étape suivante
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours..." : "Envoyer ma fiche garant"}
                  </Button>
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
              Vous êtes sur le point d&apos;envoyer votre fiche garant à ALV Immobilier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Cette action va :</p>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Générer automatiquement un PDF de votre fiche garant</li>
                <li>L&apos;envoyer à l&apos;agence et informer le(s) locataire(s) concerné(s)</li>
                <li>Vous transmettre une copie par e‑mail</li>
              </ul>
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="confirmation"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(Boolean(checked))}
                className="mt-1"
              />
              <label htmlFor="confirmation" className="text-sm leading-relaxed cursor-pointer">
                J&apos;atteste l&apos;exactitude des informations communiquées.
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
              onClick={submit}
              disabled={!confirmationChecked || isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Envoi en cours..." : "Confirmer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

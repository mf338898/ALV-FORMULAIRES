export interface RevenuAdditionnel {
  id: string
  type: string
  montant: string
  precision: string
}

export interface Locataire {
  nom: string
  prenom: string
  civilite: string
  situationConjugale: string
  adresseActuelle: string
  telephone: string
  email: string
  dateNaissance: string
  lieuNaissance: string
  situationActuelle: string
  preavisADeposer: string
  dureePreavise: string
  dureePreaviseAutre: string
  hebergeParQui: string
  profession: string
  etablissementFormation: string
  employeurNom: string
  employeurAdresse: string
  employeurTelephone: string
  dateEmbauche: string
  typeContrat: string
  salaire: string
  revenusAdditionnels: RevenuAdditionnel[]
  dateFinContrat: string
  dureeInscriptionInterim: string
  agenceInterim: string
  dateDebutActivite: string
  regimeRetraite: string
  dateDebutRetraite: string
  alternance: string
  typeAlternance: string
  situationActuelleSansEmploi: string
  origineRevenuPrincipal: string
  origineRevenuPrincipalAutre: string
}

export interface CriteresRecherche {
  nombreChambres: string
  secteurSouhaite: string
  rayonKm: string
  dateEmmenagement: string
  preavisADeposer: string
  raisonDemenagement: string
  informationsComplementaires: string
  loyerMax: string
}

export interface GarantContact {
  nom: string
  prenom: string
  email: string
  telephone: string
}

export interface Garanties {
  garantFamilial: "oui" | "non"
  garantieVisale: "oui" | "non"
  precisionGarant: string
  garants: GarantContact[]
}

export interface AppFormData {
  bienConcerne: string
  locataires: Locataire[]
  nombreEnfantsFoyer: number
  criteresRecherche: CriteresRecherche
  garanties: Garanties
  veutRemplirRecherche: "oui" | "non"
  dossierFacileLink: string
}

export interface GarantFormData {
  garant: Locataire
  cautionnes: GarantContact[] // 1 to 4
}

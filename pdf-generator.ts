import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs"
import path from "path"
import type { Locataire, Garanties } from "./types"

/* ------------------------------------------------------------------
  SECTION COMMUNE – CONSTANTES DE STYLE
  -------------------------------------------------------------------*/
const PAGE_MARGIN = 40
const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 105 /* petit rab pour le paragraphe */
const COLUMN_GAP = 18
const LABEL_WIDTH = 110 /* largeur de la col. libellés */
const LINE_HEIGHT = 16
/* — Couleurs agence — */
const COLOR_PRIMARY = rgb(26 / 255, 58 / 255, 110 / 255) /* #1A3A6E  (charte ALV) */
const COLOR_TEXT = rgb(17 / 255, 24 / 255, 39 / 255) /* #111827 – texte principal */
const COLOR_TEXT_ALT = rgb(75 / 255, 85 / 255, 99 / 255) /* #4B5563 – valeurs “modifiées” (placeholder) */
const COLOR_GREY_LIGHT = rgb(156 / 255, 163 / 255, 175 / 255) /* #9CA3AF – “Non renseigné” */
const COLOR_SEPARATOR = rgb(229 / 255, 231 / 255, 235 / 255) /* #E5E7EB – filets */

/* Tailles */
/* +1 pt pour plus de lisibilité */
const SIZE_TITLE = 19
const SIZE_SUBTITLE = 12
const SIZE_NAME = 14
const SIZE_LABEL = 11
const SIZE_VALUE = 12

/* Ombres supprimées (design sobre) */

/* ==================================================================
  V1 – CODE EXISTANT (Gardé en secours)
  renommé generatePdfLegacy
  ================================================================== */
export async function generatePdfLegacy(
  locataires: Locataire[],
  nombreEnfantsFoyer: number,
  garanties: Garanties,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const margin = 50
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  let y = height - margin
  const checkY = (requiredHeight: number) => {
    if (y - requiredHeight < margin) {
      page = pdfDoc.addPage()
      y = height - margin
    }
  }
  const moveDown = (amount = 1) => (y -= 12 * amount)
  const drawTitle = (text: string) => {
    checkY(25)
    page.drawText(text, { x: margin, y, font: helveticaBold, size: 16 })
    y -= 18
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: width - margin, y: y + 2 },
      thickness: 0.5,
    })
    moveDown(1.5)
  }
  const drawField = (label: string, value?: string | null) => {
    if (!value || value.trim() === "") return
    checkY(15)
    page.drawText(`${label}: ${value}`, { x: margin, y, font: helvetica, size: 11 })
    moveDown()
  }
  /* ---------- contenu identique à l’ancienne version ---------- */
  page.drawText("Dossier de Location", {
    x: width / 2 - 100,
    y,
    font: helveticaBold,
    size: 22,
  })
  moveDown(3)
  locataires.forEach((loc, index) => {
    drawTitle(`Identité - Locataire ${index + 1}`)
    drawField("Civilité", loc.civilite)
    drawField("Nom", loc.nom)
    drawField("Prénom", loc.prenom)
    drawField("Date de naissance", loc.dateNaissance)
    drawField("Lieu de naissance", loc.lieuNaissance)
    drawField("Email", loc.email)
    drawField("Téléphone", loc.telephone)
    drawField("Adresse actuelle", loc.adresseActuelle)
    drawField("Situation conjugale", loc.situationConjugale)
    drawField("Statut logement actuel", loc.situationActuelle)
    moveDown()
    drawTitle(`Situation Professionnelle - Locataire ${index + 1}`)
    drawField("Type de contrat", loc.typeContrat)
    drawField("Profession", loc.profession)
    drawField("Employeur", loc.employeurNom)
    drawField("Adresse employeur", loc.employeurAdresse)
    drawField("Date d'embauche", loc.dateEmbauche)
    drawField("Date de fin de contrat", loc.dateFinContrat)
    drawField("Salaire/Revenu principal net mensuel", loc.salaire ? `${loc.salaire} €` : undefined)
    if (loc.revenusAdditionnels.length > 0) {
      checkY(15)
      page.drawText("Revenus additionnels:", { x: margin, y, font: helveticaBold, size: 11 })
      moveDown()
      loc.revenusAdditionnels.forEach((rev) => {
        const revLabel = rev.type === "Autre" ? rev.precision : rev.type
        drawField(`  - ${revLabel}`, rev.montant ? `${rev.montant} €` : "Non renseigné")
      })
    }
    moveDown()
  })
  drawTitle("Composition du foyer")
  drawField("Nombre d'enfants à charge", String(nombreEnfantsFoyer))
  moveDown()
  drawTitle("Garanties")
  drawField("Garant familial", garanties.garantFamilial)
  if (garanties.garantFamilial === "oui") drawField("Précision", garanties.precisionGarant)
  drawField("Garantie Visale", garanties.garantieVisale)
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/* ==================================================================
  V2 – TABLEAU DYNAMIQUE 2 COLONNES / MULTI-LOCATAIRES / PAGINATION
  ================================================================== */
async function generatePdfV2(
  locataires: Locataire[],
  nombreEnfantsFoyer: number,
  garanties: Garanties,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  /* -----------------------------------------------------------------
       LOGO : on tente d’embarquer /public/images/logo.png (optionnel)
    ------------------------------------------------------------------*/
  let logoImg: any = undefined
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png")
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath)
      logoImg = await pdfDoc.embedPng(logoBytes)
    }
  } catch {
    /* pas de logo → on continue sans */
  }

  /* -----------------------------------------------------------------
  wrap()  ➜ renvoie des lignes qui tiennent dans “max” px,
  même si le mot ne contient aucun espace.
  ------------------------------------------------------------------*/
  const wrap = (txt: string | undefined | null, max: number): string[] => {
    if (!txt) return ["–"] /* tiret si valeur vide */
    const pushLine = (arr: string[], l: string) => {
      if (l !== "") arr.push(l)
    }
    const words = txt.replace(/\n/g, " ").split(" ")
    const lines: string[] = []
    let line = ""
    words.forEach((word) => {
      /* taille si on ajoute “ word” (ou juste word si ligne vide) */
      const test = (line ? line + " " : "") + word
      if (fontReg.widthOfTextAtSize(test, SIZE_VALUE) <= max) {
        line = test
        return
      }
      /* le mot fait déborder la ligne courante ----------------- */
      pushLine(lines, line)
      line = ""
      /* si le mot lui-même est plus large que max → on coupe dans le mot */
      let fragment = ""
      for (const char of word) {
        const tentative = fragment + char
        if (fontReg.widthOfTextAtSize(tentative, SIZE_VALUE) > max) {
          pushLine(lines, fragment)
          fragment = char
        } else {
          fragment = tentative
        }
      }
      line = fragment
    })
    pushLine(lines, line)
    return lines.length ? lines : ["–"]
  }

  /* helper : adresse – on laisse wrap() gérer la coupure ;
   on retire tout \n pour éviter l'erreur WinAnsi          */
  const formatAdresse = (a?: string | null) => (a ? a.replace(/\n/g, " ").trim() : "Non renseigné")

  /* ─── première page : on la crée AVANT de connaître width/height */
  let page = pdfDoc.addPage()
  const { width, height } = page.getSize()

  /* ─── 2) fonctions header/footer utilisent width/height déjà fixés */
  /* ------------------------------------------------ HEADER -------------------------------- */
  function drawHeader(p: any) {
    const startY = height - PAGE_MARGIN
    /* ------------------- LOGO ------------------- */
    if (logoImg) {
      const MAX_W = 70 /* largeur cible en px */
      const scale = MAX_W / logoImg.width
      const w = logoImg.width * scale
      const h = logoImg.height * scale
      p.drawImage(logoImg, {
        x: width - PAGE_MARGIN - w /* coin haut-droit */,
        y: startY - h,
        width: w,
        height: h,
      })
    }
    const title = "Fiche de renseignement locataire"
    const tw = fontBold.widthOfTextAtSize(title, SIZE_TITLE)
    p.drawText(title, {
      x: (width - tw) / 2,
      y: startY - 28,
      size: SIZE_TITLE,
      font: fontBold,
      color: COLOR_PRIMARY,
    })

    /* sous-titre ALV Immobilier */
    const sub = "ALV Immobilier"
    const sw = fontBold.widthOfTextAtSize(sub, SIZE_SUBTITLE)
    p.drawText(sub, {
      x: (width - sw) / 2,
      y: startY - 45,
      size: SIZE_SUBTITLE,
      font: fontBold,
      color: COLOR_TEXT,
    })

    /* fin de header */
    p.drawLine({
      start: { x: PAGE_MARGIN, y: startY - HEADER_HEIGHT + 12 },
      end: { x: width - PAGE_MARGIN, y: startY - HEADER_HEIGHT + 12 },
      thickness: 0.5,
      color: COLOR_PRIMARY,
    })
  }

  /* ------------------------------------------------ FOOTER -------------------------------- */
  function drawFooter(p: any) {
    const startY = PAGE_MARGIN
    /* fine separator */
    p.drawLine({
      start: { x: PAGE_MARGIN, y: startY + FOOTER_HEIGHT - 15 },
      end: { x: width - PAGE_MARGIN, y: startY + FOOTER_HEIGHT - 15 },
      thickness: 0.5,
      color: COLOR_PRIMARY,
    })

    const lines = [
      "Ce document synthétise les informations personnelles, professionnelles et financières communiquées via notre formulaire en ligne.",
      "Il permet d'étudier leur profil en amont de l'organisation d'une visite.",
      "Document strictement confidentiel – destiné à un usage locatif",
      "",
      "ALV IMMOBILIER - 19 Place du Général de Gaulle - 29190 PLEYBEN",
      "Tél. : 02 98 26 71 47 | E-mail : contact@alvimmobilier.bzh | Site : www.alvimmobilier.com",
      "Carte Professionnelle n° 2903 2016 000 009 781 - Garantie SOCAF 120 000 € - SAS AU CAPITAL DE 5720 €",
    ]

    let cy = startY + FOOTER_HEIGHT - 28
    lines.forEach((txt) => {
      const size = txt.startsWith("ALV") ? 9 : 8
      const x = (width - fontReg.widthOfTextAtSize(txt, size)) / 2
      p.drawText(txt, { x, y: cy, size, font: fontReg, color: COLOR_TEXT })
      cy -= 11
    })
  }

  /* ─── 3) on dessine header/footer de la PREMIÈRE page */
  drawHeader(page)
  drawFooter(page)

  /* ─── 4) helper pour les pages suivantes (width/height sont connus) */
  const addPage = () => {
    const p = pdfDoc.addPage()
    drawHeader(p)
    drawFooter(p)
    return p
  }

  /* Curseurs et largeurs fixes */
  const colW = (width - PAGE_MARGIN * 2 - COLUMN_GAP - LABEL_WIDTH - 10) / 2
  const COL0_X = PAGE_MARGIN
  const COL1_X = COL0_X + LABEL_WIDTH + 10
  const COL2_X = COL1_X + colW + COLUMN_GAP

  const toText = (v?: string | null) => (v && v.trim() !== "" ? v : "Non renseigné")

  const LABELS_IDENTITE = [
    "Civilité",
    "Nom",
    "Prénom",
    "Date de naissance",
    "Lieu de naissance",
    "Situation conjugale",
    "Adresse actuelle",
    "Téléphone",
    "Email",
  ]
  const LABELS_PRO = [
    "Type de contrat",
    "Profession",
    "Employeur",
    "Adresse employeur",
    "Téléphone employeur",
    "Date d'embauche",
    "Date de fin de contrat",
    "Durée inscription intérim",
    "Agence intérim",
    "Date début activité",
    "Date début retraite",
    "Régime retraite",
    "Situation sans emploi",
    "Alternance",
    "Type alternance",
    "Origine revenu principal",
    "Salaire net mensuel",
    "Revenu additionnel",
  ]

  const valueFor = (loc: Locataire, label: string): string => {
    switch (label) {
      case "Civilité":
        return loc.civilite
      case "Nom":
        return loc.nom.toUpperCase()
      case "Prénom":
        return loc.prenom
      case "Date de naissance": {
        if (!loc.dateNaissance) return ""
        /*  convertit YYYY-MM-DD → DD/MM/YYYY  */
        const [y, m, d] = loc.dateNaissance.split("-")
        return `${d}/${m}/${y}`
      }
      case "Lieu de naissance":
        return loc.lieuNaissance ? `à ${loc.lieuNaissance}` : ""
      case "Situation conjugale":
        return loc.situationConjugale
      case "Adresse actuelle":
        return formatAdresse(loc.adresseActuelle)
      case "Téléphone":
        return loc.telephone
      case "Email":
        return loc.email
      case "Type de contrat":
        return loc.typeContrat
      case "Profession":
        return loc.profession
      case "Employeur":
        return loc.employeurNom
      case "Adresse employeur":
        return loc.employeurAdresse
      case "Téléphone employeur":
        return loc.employeurTelephone
      case "Date d'embauche":
        return loc.dateEmbauche
      case "Salaire net mensuel":
        return loc.salaire ? loc.salaire + " €" : ""
      case "Revenu additionnel":
        if (!loc.revenusAdditionnels?.length) return ""
        return loc.revenusAdditionnels
          .map((r) => `${r.type === "Autre" ? r.precision : r.type} : ${r.montant || "NR"} €`)
          .join(", ")
      case "Date de fin de contrat":
        return loc.dateFinContrat
      case "Durée inscription intérim":
        return loc.dureeInscriptionInterim
      case "Agence intérim":
        return loc.agenceInterim
      case "Date début activité":
        return loc.dateDebutActivite
      case "Date début retraite":
        return loc.dateDebutRetraite
      case "Régime retraite":
        return loc.regimeRetraite
      case "Situation sans emploi":
        return loc.situationActuelleSansEmploi
      case "Alternance":
        return loc.alternance
      case "Type alternance":
        return loc.typeAlternance
      case "Origine revenu principal":
        return loc.origineRevenuPrincipal === "Autre" ? loc.origineRevenuPrincipalAutre : loc.origineRevenuPrincipal
      default:
        return ""
    }
  }

  /* ------------------------------------------------------------
       2)  Ligne de tableau  (retourne nb de lignes réellement posées)
       v2 peut être null  ➜ on n’affiche pas la 2ᵉ colonne du tout
    ------------------------------------------------------------ */
  const drawRow = (label: string, v1: string, v2: string | null, rowY: number): number => {
    const l1 = wrap(v1, colW)
    const l2 = v2 === null ? [] : wrap(v2, colW)
    const nbLines = Math.max(l1.length, l2.length)

    page.drawText(label, {
      x: COL0_X,
      y: rowY,
      size: SIZE_LABEL,
      font: fontBold,
      color: COLOR_TEXT,
    })

    const valFont = (lbl: string, txt: string) =>
      txt === "–" ? fontItal : ["Type de contrat", "Salaire net mensuel"].includes(lbl) ? fontBold : fontReg

    const formatVal = (lbl: string, txt: string) => (lbl === "Type de contrat" ? txt.toUpperCase() : txt)

    l1.forEach((txt, idx) =>
      page.drawText(formatVal(label, txt), {
        x: COL1_X,
        y: rowY - idx * LINE_HEIGHT,
        size: SIZE_VALUE,
        font: valFont(label, txt),
        color: txt === "–" ? COLOR_GREY_LIGHT : COLOR_TEXT,
      }),
    )

    /* 2ᵉ colonne : seulement si elle est demandée */
    l2.forEach((txt, idx) =>
      page.drawText(formatVal(label, txt), {
        x: COL2_X,
        y: rowY - idx * LINE_HEIGHT,
        size: SIZE_VALUE,
        font: valFont(label, txt),
        color: txt === "–" ? COLOR_GREY_LIGHT : COLOR_TEXT,
      }),
    )

    return nbLines
  }

  /* ------------------------------------------------------------
       3)  Boucle de rendu par “paires” de locataires
           (2 colonnes max / page, pagination auto)
    ------------------------------------------------------------ */

  const renderBlocCommuns = (cursorY: number) => {
    let y = cursorY - 20
    /* Écrit une ligne “Label : valeur” avec retour automatique à la ligne */
    const writeC = (lab: string, val: string) => {
      if (!val || val.trim() === "") return
      const full = `${lab} : ${val}`
      /* largeur dispo = page moins les marges */
      const wrapped = wrap(full, width - PAGE_MARGIN * 2)
      wrapped.forEach((txt, idx) => {
        page.drawText(txt, {
          x: PAGE_MARGIN,
          y: y - idx * LINE_HEIGHT,
          size: 11,
          font: fontReg,
          color: COLOR_TEXT,
        })
      })
      y -= LINE_HEIGHT * wrapped.length
    }

    page.drawText("COMPOSITION DU FOYER", {
      x: PAGE_MARGIN,
      y,
      size: 13,
      font: fontBold,
      color: COLOR_PRIMARY,
    })
    y -= 16
    writeC("Nombre d'enfants à charge", String(nombreEnfantsFoyer))

    y -= 6
    page.drawText("GARANTIES", {
      x: PAGE_MARGIN,
      y,
      size: 13,
      font: fontBold,
      color: COLOR_PRIMARY,
    })
    y -= 16
    writeC("Garant familial", garanties.garantFamilial)
    if (garanties.garantFamilial === "oui" && garanties.precisionGarant) writeC("Précision", garanties.precisionGarant)
    writeC("Garantie Visale", garanties.garantieVisale)

    /* Phrase d’avertissement si >2 locataires */
    if (locataires.length > 2) {
      y -= 10
      page.drawText(
        "Si le dossier comporte plus de 2 locataires, veuillez consulter la page suivante pour les informations complémentaires.",
        { x: PAGE_MARGIN, y, size: 10, font: fontReg, color: COLOR_TEXT },
      )
    }
  }

  /* ------------  rendu des pages ------------------------------ */
  for (let i = 0; i < locataires.length; i += 2) {
    if (i > 0) {
      page = addPage()
    }

    let rowY = height - PAGE_MARGIN - HEADER_HEIGHT
    const loc1 = locataires[i]
    const loc2 = locataires[i + 1] ?? null

    const drawSectionTitle = (txt: string) => {
      const titleTxt = txt.toUpperCase()
      const w = fontBold.widthOfTextAtSize(titleTxt, SIZE_NAME)
      page.drawText(titleTxt, {
        x: (width - w) / 2,
        y: rowY,
        size: SIZE_NAME,
        font: fontBold,
        color: COLOR_PRIMARY,
      })
      rowY -= LINE_HEIGHT + 4
      page.drawLine({
        start: { x: PAGE_MARGIN, y: rowY },
        end: { x: width - PAGE_MARGIN, y: rowY },
        thickness: 0.4,
        color: COLOR_SEPARATOR,
      })
      rowY -= LINE_HEIGHT
    }

    /* ---------- IDENTITÉ ------------------------------------ */
    drawSectionTitle("Identité")
    LABELS_IDENTITE.forEach((lab) => {
      const raw1 = valueFor(loc1, lab)
      const raw2 = loc2 ? valueFor(loc2, lab) : ""
      if (!raw1 && !raw2) return /* aucune donnée ⇒ on n’affiche pas la ligne */

      const txt1 = raw1 ? raw1 : "-"
      const txt2 = loc2 ? (raw2 ? raw2 : "-") : null
      const lines = drawRow(lab, txt1, txt2, rowY)
      rowY -= LINE_HEIGHT * lines
    })

    /* ---------- SITUATION PRO -------------------------------- */
    rowY -= 6
    drawSectionTitle("Situation professionnelle")
    LABELS_PRO.forEach((lab) => {
      const raw1 = valueFor(loc1, lab)
      const raw2 = loc2 ? valueFor(loc2, lab) : ""
      if (!raw1 && !raw2) return

      const txt1 = raw1 ? raw1 : "-"
      const txt2 = loc2 ? (raw2 ? raw2 : "-") : null
      const lines = drawRow(lab, txt1, txt2, rowY)
      rowY -= LINE_HEIGHT * lines
    })

    /* ---------- BLOC COMMUNS (uniquement sur la 1ère page) --- */
    if (i === 0) renderBlocCommuns(rowY)
  }

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

/* façade = V2 direct ; garde Legacy pour debug éventuel            */
export const generatePdf = generatePdfV2

import { PDFDocument, StandardFonts, rgb, type RGB, type PDFPage } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { AppFormData, Locataire, RevenuAdditionnel } from "./types"

// Brand and style
const PRIMARY = rgb(0 / 255, 114 / 255, 188 / 255) // #0072BC (brand blue)
const TEXT_INFO = rgb(110 / 255, 110 / 255, 110 / 255) // #6E6E6E (secondary text)
const BLACK = rgb(0, 0, 0)
const SEP_GRAY = rgb(218 / 255, 218 / 255, 218 / 255) // #DADADA separator

// Page and layout (A4) - OPTIMISÉ POUR 1 PAGE ET IMPRESSION
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 35 // Réduit de 48 à 35
const GUTTER = 20 // Réduit de 28 à 20
const LABEL_WIDTH = 120 // Réduit de 138 à 120
const VALUE_INDENT = 4 // Réduit de 6 à 4
const TITLE_SIZE = 17 // Augmenté de 16 à 17 pour l'impression
const SECTION_SIZE = 13 // Augmenté de 12 à 13 pour l'impression
const LABEL_SIZE = 10 // Augmenté de 9 à 10 pour l'impression
const BODY_SIZE = 11 // Augmenté de 10 à 11 pour l'impression
const LINE_HEIGHT = 12 // Augmenté de 11 à 12 pour l'impression
const LONG_LINE_HEIGHT = Math.round(BODY_SIZE * 1.3) // ≈ 14 pour la lisibilité
const BOTTOM_RESERVE = 60 // Réduit de 72 à 60

// Utilities
const nonEmpty = (v?: string | null) => Boolean(v && String(v).trim() !== "")
const dash = "-" // single dash for missing data
const showOrDash = (v?: string | null) => (nonEmpty(v) ? String(v) : dash)

function toTitleCase(s?: string | null) {
  if (!nonEmpty(s)) return ""
  const lower = String(s).toLowerCase()
  return lower.replace(/\p{L}+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1))
}

function normalizeCivilite(c?: string | null) {
  const v = (c || "").toLowerCase().trim()
  if (v.startsWith("m.") || v === "m" || v.startsWith("mr") || v === "homme") return "M."
  if (v.startsWith("mme") || v.includes("madame") || v === "femme" || v.startsWith("mlle") || v.startsWith("mademoiselle")) return "Mme"
  return c || ""
}

// Sanitize text for Helvetica (WinAnsi) to prevent U+202F etc.
function pdfSafe(input?: string) {
  if (!input) return ""
  return input
    .normalize("NFKC")
    .replace(/[\u202F\u00A0\u2009\u2007\u2060]/g, " ") // narrow NBSP, NBSP, thin/figure spaces, word joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
}

// Currency, replacing non-encodable spaces. Missing -> dash
function euro(v?: string | null) {
  if (!nonEmpty(v)) return dash
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."))
  if (!isFinite(n) || Number.isNaN(n)) return dash
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
  return pdfSafe(formatted)
}

// Robust word wrap with long-token breaking
function breakLongTokenByWidth(token: string, font: any, size: number, maxWidth: number): string[] {
  const parts: string[] = []
  let start = 0
  while (start < token.length) {
    let lo = start + 1
    let hi = token.length
    let best = lo
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const slice = token.slice(start, mid)
      const w = font.widthOfTextAtSize(slice, size)
      if (w <= maxWidth || slice.length === 1) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    const piece = token.slice(start, best)
    if (!piece) break
    parts.push(piece)
    start = best
  }
  return parts.length ? parts : [token]
}

function wrapByWidth(text: string, font: any, size: number, maxWidth: number): string[] {
  const t = pdfSafe(text)
  if (!t) return [dash]
  const words = t.split(/\s+/)
  const lines: string[] = []
  let current = ""

  function pushCurrent() {
    if (current) {
      lines.push(current)
      current = ""
    }
  }

  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w
    const candWidth = font.widthOfTextAtSize(candidate, size)
    const wWidth = font.widthOfTextAtSize(w, size)

    // If the single word is too long, break it into chunks
    if (wWidth > maxWidth) {
      pushCurrent()
      const pieces = breakLongTokenByWidth(w, font, size, maxWidth)
      for (const p of pieces) {
        lines.push(p)
      }
      continue
    }

    if (candWidth > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = candidate
    }
  }
  pushCurrent()

  return lines.length ? lines : [dash]
}

// Address splitter: line 1 = street + number; line 2 = CP + City (best effort)
function splitAddressLines(adresse?: string | null): [string, string] {
  const s = (adresse || "").trim()
  if (!s) return [dash, dash]
  // explicit newline first
  const byNl = s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
  if (byNl.length >= 2) return [pdfSafe(byNl[0]), pdfSafe(byNl[1])]
  // detect 5-digit CP
  const cpMatch = s.match(/\b(\d{5})\b/)
  if (cpMatch && cpMatch.index !== undefined) {
    const idx = cpMatch.index
    const line1 = s
      .slice(0, idx)
      .replace(/[,-]\s*$/, "")
      .trim()
    const line2 = s.slice(idx).trim()
    return [pdfSafe(line1 || dash), pdfSafe(line2 || dash)]
  }
  // last comma heuristic
  const lastComma = s.lastIndexOf(",")
  if (lastComma > -1) {
    const line1 = s.slice(0, lastComma).trim()
    const line2 = s.slice(lastComma + 1).trim()
    return [pdfSafe(line1 || dash), pdfSafe(line2 || dash)]
  }
  return [pdfSafe(s), dash]
}

// Birth line: "jj/mm/aaaa, Ville CP" (smart reorder to avoid "CP Ville")
function formatDateFR(input?: string | null) {
  if (!nonEmpty(input)) return ""
  const s = String(input).trim()
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return s // fallback (already formatted)
}

function formatLieuNaissance(input?: string | null) {
  const raw = (input || "").replace(/[/,]/g, " ").replace(/\s+/g, " ").trim()
  if (!raw) return ""
  const m = raw.match(/(\d{5})/)
  if (m && m.index !== undefined) {
    const cp = m[1]
    const before = raw.slice(0, m.index).trim()
    const after = raw.slice(m.index + 5).trim()
    const city = (before || after).trim()
    return `${city} ${cp}`.trim()
  }
  return raw
}

// Type spécial pour les revenus complémentaires avec formatage
type RevenuFormatted = {
  type: 'revenu'
  label: string
  montant: string
}

// Type Row modifié pour supporter le formatage spécial
type Row = { 
  label: string; 
  value: string | string[] | RevenuFormatted[]; 
  highlight?: boolean;
  specialFormat?: 'revenus' // Indicateur pour le formatage spécial
}

// "Sans emploi" precision handling
function contractOrStatus(loc?: Locataire) {
  const base = (loc?.typeContrat || loc?.situationActuelle || "").trim()
  const lower = base.toLowerCase()

  // Precision for "Sans emploi" if present (kept from previous behavior)
  const precisionSansEmploi = (loc as any)?.precisionSansEmploi || (loc as any)?.precisionSituation || ""
  if (lower.includes("sans emploi") && nonEmpty(precisionSansEmploi)) {
    return `${base} (${precisionSansEmploi})`
  }

  // Student alternance detail
  if (lower === "etudiant" || lower === "étudiant" || lower === "etudiant(e)") {
    const alt = (loc as any)?.alternance
    const altType = (loc as any)?.typeAlternance
    if (alt === "oui") {
      const type = nonEmpty(altType) ? ` - ${toTitleCase(String(altType))}` : ""
      return `${base} (Alternance${type})`
    }
  }

  // Mettre en majuscules pour les types de contrat courants
  if (lower === "cdi" || lower === "cdd" || lower === "stage" || lower === "alternance" || lower === "intérim" || lower === "interim") {
    return base.toUpperCase()
  }

  return base || dash
}

function identityRows(l?: Locataire): Row[] {
  const [addr1, addr2] = splitAddressLines(l?.adresseActuelle)
  const date = formatDateFR(l?.dateNaissance)
  const lieu = formatLieuNaissance(l?.lieuNaissance)
  const dateLieu =
    nonEmpty(date) || nonEmpty(lieu)
      ? [nonEmpty(date) ? date : undefined, nonEmpty(lieu) ? lieu : undefined].filter(Boolean).join(", ")
      : dash
  return [
    { label: "Civilité", value: pdfSafe(normalizeCivilite(l?.civilite) || dash) },
    { label: "Nom", value: pdfSafe(toTitleCase(l?.nom) || dash) },
    { label: "Prénom", value: pdfSafe(toTitleCase(l?.prenom) || dash) },
    { label: "Date et lieu de naissance", value: pdfSafe(dateLieu) },
    { label: "Email", value: pdfSafe(showOrDash(l?.email)) },
    { label: "Téléphone", value: pdfSafe(showOrDash(l?.telephone)) },
    { label: "Domicile (ligne 1)", value: pdfSafe(addr1) },
    { label: "Domicile (ligne 2)", value: pdfSafe(addr2) },
    { label: "Situation conjugale", value: pdfSafe(showOrDash(l?.situationConjugale)) },
  ]
}

function revenusAdditionnelsLines(list?: RevenuAdditionnel[]): RevenuFormatted[] {
  if (!list || list.length === 0) return []
  return list
    .filter((r) => nonEmpty(r.type) || nonEmpty(r.montant) || nonEmpty(r.precision))
    .map((r) => {
      const label = r.type === "Autre" ? r.precision || "Autre" : r.type || "Revenu complémentaire"
      const montant = nonEmpty(r.montant) ? r.montant : ""
      return {
        type: 'revenu' as const,
        label: pdfSafe(label),
        montant: montant
      }
    })
    .filter((r) => r.label || r.montant)
}

function proRows(l?: Locataire): Row[] {
  const [empAddr1, empAddr2] = splitAddressLines(l?.employeurAdresse)
  const empAddrValue = [pdfSafe(empAddr1), pdfSafe(empAddr2)]
  return [
    { label: "Type de contrat / statut", value: pdfSafe(contractOrStatus(l)), highlight: true }, // highlight pour le mettre en gras
    { label: "Profession", value: pdfSafe(showOrDash(l?.profession)) },
    { label: "Employeur (nom)", value: pdfSafe(showOrDash(l?.employeurNom)) },
    { label: "Employeur (adresse)", value: empAddrValue },
    { label: "Employeur (téléphone)", value: pdfSafe(showOrDash(l?.employeurTelephone)) },
    { label: "Date d'embauche", value: pdfSafe(showOrDash(l?.dateEmbauche)) },
    { label: "Date de fin de contrat", value: pdfSafe(showOrDash(l?.dateFinContrat)) },
    { label: "Salaire net mensuel (€)", value: euro(l?.salaire), highlight: true },
    { 
      label: "Revenus complémentaires", 
      value: revenusAdditionnelsLines(l?.revenusAdditionnels), 
      specialFormat: 'revenus' 
    },
  ]
}

// Drawing primitives
function drawCenteredText(page: any, text: string, y: number, font: any, size: number, color: RGB) {
  const w = font.widthOfTextAtSize(text, size)
  const x = (PAGE_WIDTH - w) / 2
  page.drawText(text, { x, y, size, font, color })
  return y
}

function drawFooter(page: any, fontReg: any) {
  const text = pdfSafe("Document strictement confidentiel – transmis à titre informatif")
  const size = 9
  const w = fontReg.widthOfTextAtSize(text, size)
  const x = (PAGE_WIDTH - w) / 2
  const y = MARGIN - 24
  page.drawText(text, { x, y, size, font: fontReg, color: TEXT_INFO })
}

// Section header with extra top spacing and 1px separator in #DADADA - OPTIMISÉ
function drawSectionHeader(page: any, title: string, x: number, y: number, fontBold: any) {
  // Add 12px margin above titles (réduit de 16 à 12)
  y -= 12
  const header = pdfSafe(title.toUpperCase())
  page.drawText(header, { x, y, size: SECTION_SIZE, font: fontBold, color: PRIMARY })
  const yy = y - 10 // Réduit de 12 à 10
  page.drawLine({
    start: { x, y: yy },
    end: { x: page.getWidth() - x, y: yy },
    thickness: 1,
    color: SEP_GRAY,
  })
  return yy - 10 // Réduit de 12 à 10
}

// Inline section header with "label: value" on same line - OPTIMISÉ
function drawSectionHeaderWithInlineValue(
  page: any,
  title: string,
  inlineLabel: string,
  inlineValue: string,
  x: number,
  y: number,
  fonts: { reg: any; bold: any },
) {
  // Extra spacing above (12px) - Réduit de 16 à 12
  y -= 12
  const header = pdfSafe(title.toUpperCase())
  page.drawText(header, { x, y, size: SECTION_SIZE, font: fonts.bold, color: PRIMARY })

  // Measure header to place inline label/value
  const headerWidth = fonts.bold.widthOfTextAtSize(header, SECTION_SIZE)
  const gap = 10 // Réduit de 12 à 10
  const xInline = x + headerWidth + gap

  // Inline "Nombre d'enfants à charge : N"
  const labelText = pdfSafe(inlineLabel + " : ")
  const labelWidth = fonts.bold.widthOfTextAtSize(labelText, LABEL_SIZE + 1)
  page.drawText(labelText, { x: xInline, y, size: LABEL_SIZE + 1, font: fonts.bold, color: BLACK })
  page.drawText(pdfSafe(inlineValue || dash), {
    x: xInline + labelWidth,
    y,
    size: BODY_SIZE,
    font: fonts.reg,
    color: BLACK,
  })

  // Separator below full line
  const yy = y - 10 // Réduit de 12 à 10
  page.drawLine({
    start: { x, y: yy },
    end: { x: page.getWidth() - x, y: yy },
    thickness: 1,
    color: SEP_GRAY,
  })
  return yy - 10 // Réduit de 12 à 10
}

// Header on each page: centered logo, centered uppercase title, centered info text - OPTIMISÉ
async function drawHeader(page: any, pdf: PDFDocument, fontBold: any, fontReg: any) {
  const yTop = PAGE_HEIGHT - MARGIN

  // Logo (centered, max-height 30px, margin-bottom 10px) - OPTIMISÉ
  let logoImage: any | null = null
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo-alv.png")
    const logoBytes = await readFile(logoPath)
    logoImage = await pdf.embedPng(logoBytes)
  } catch {
    // ignore if logo not found
  }

  let y = yTop
  if (logoImage) {
    const logoHeight = 30 // Réduit de 36 à 30
    const ratio = logoHeight / logoImage.height
    const logoWidth = logoImage.width * ratio
    const x = (PAGE_WIDTH - logoWidth) / 2
    page.drawImage(logoImage, { x, y: yTop - logoHeight, width: logoWidth, height: logoHeight })
    y = yTop - logoHeight - 10 // Réduit de 14 à 10
  } else {
    y = yTop - 10
  }

  // Title (centered, uppercase, brand blue, margin-top 8px) - OPTIMISÉ
  y -= 8
  drawCenteredText(page, pdfSafe("FICHE DE RENSEIGNEMENT LOCATAIRES"), y, fontBold, TITLE_SIZE, PRIMARY)
  y -= TITLE_SIZE

  // Small centered grey paragraph (BODY_SIZE - 1 pt), line-height ~1.2, max-width ~90%, margin-top 5px - OPTIMISÉ
  y -= 5
  const intro =
    "Document strictement confidentiel – destiné à un usage locatif. " +
    "Ce document synthétise les informations personnelles, professionnelles et financières communiquées via notre formulaire en ligne."
  const maxWidth = PAGE_WIDTH * 0.9
  const paragraphs: string[] = []
  {
    const words = pdfSafe(intro).split(/\s+/)
    let current = ""
    for (const w of words) {
      const cand = current ? `${current} ${w}` : w
      const width = fontReg.widthOfTextAtSize(cand, BODY_SIZE - 1)
      if (width > maxWidth && current) {
        paragraphs.push(current)
        current = w
      } else {
        current = cand
      }
    }
    if (current) paragraphs.push(current)
  }
  for (const line of paragraphs) {
    const w = fontReg.widthOfTextAtSize(line, BODY_SIZE - 1)
    const x = (PAGE_WIDTH - w) / 2
    page.drawText(line, { x, y, size: BODY_SIZE - 1, font: fontReg, color: TEXT_INFO })
    y -= Math.round((BODY_SIZE - 1) * 1.2) // Réduit de 1.3 à 1.2
  }

  return y - 6 // Réduit de 8 à 6
}

// Context for pagination-aware drawing
type Fonts = { reg: any; bold: any }
type DocContext = {
  pdf: PDFDocument
  page: PDFPage
  y: number
  fonts: Fonts
  drawColumnHeadingsNext?: () => void // optional callback to draw column headers after a page break
}

// Ensure enough space; if not, finish current page with footer and create a new page with header
async function ensureSpace(ctx: DocContext, neededHeight: number) {
  if (ctx.y - neededHeight < BOTTOM_RESERVE) {
    // finish current page
    drawFooter(ctx.page, ctx.fonts.reg)
    // new page
    const page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const y = await drawHeader(page, ctx.pdf, ctx.fonts.bold, ctx.fonts.reg)
    ctx.page = page
    ctx.y = y - 6
    // redraw column headings if provided (when we are in a column section)
    if (ctx.drawColumnHeadingsNext) {
      ctx.drawColumnHeadingsNext()
      ctx.drawColumnHeadingsNext = undefined // only once immediately after break
    }
  }
}

// Prepare wrapped lines and measure height per part for a row
type PreparedPart = { lines: string[]; lh: number }
type PreparedRow = { parts: PreparedPart[]; totalHeight: number }

function prepareRowParts(row: Row, font: any, colMaxWidth: number): PreparedRow {
  const maxWidth = colMaxWidth - LABEL_WIDTH - VALUE_INDENT
  
  // Gestion spéciale pour les revenus complémentaires
  if (row.specialFormat === 'revenus' && Array.isArray(row.value) && row.value.length > 0) {
    const revenus = row.value as RevenuFormatted[]
    const parts: PreparedPart[] = []
    
    for (const revenu of revenus) {
      // Pour chaque revenu, créer une ligne avec le label et le montant
      const text = `${revenu.label} : ${revenu.montant} €/mois`
      const lines = wrapByWidth(text, font, BODY_SIZE, maxWidth)
      const lh = lines.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      parts.push({ lines, lh })
      
      // Ajouter un espace entre chaque revenu (saut de ligne)
      if (revenus.indexOf(revenu) < revenus.length - 1) {
        parts.push({ lines: [""], lh: LINE_HEIGHT / 2 }) // Espace réduit entre les revenus
      }
    }
    
    const totalHeight = parts.reduce((acc: number, p: PreparedPart) => acc + p.lines.length * p.lh, 0)
    return { parts, totalHeight }
  }
  
  // Gestion normale pour les autres types (seulement string et string[])
  if (typeof row.value === 'string') {
    const lines = wrapByWidth(row.value || dash, font, BODY_SIZE, maxWidth)
    const lh = lines.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
    const totalHeight = lines.length * lh
    return { parts: [{ lines, lh }], totalHeight }
  }
  
  if (Array.isArray(row.value) && row.value.length > 0) {
    // Filtrer pour ne garder que les chaînes
    const stringValues = row.value.filter(v => typeof v === 'string') as string[]
    if (stringValues.length === 0) {
      const lines = wrapByWidth(dash, font, BODY_SIZE, maxWidth)
      const lh = LINE_HEIGHT
      return { parts: [{ lines, lh }], totalHeight: lh }
    }
    
    const parts: PreparedPart[] = stringValues.map((part) => {
      const lines = wrapByWidth(part, font, BODY_SIZE, maxWidth)
      const lh = lines.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      return { lines, lh }
    })
    const totalHeight = parts.reduce((acc, p) => acc + p.lines.length * p.lh, 0)
    return { parts, totalHeight }
  }
  
  // Fallback pour les cas vides
  const lines = wrapByWidth(dash, font, BODY_SIZE, maxWidth)
  const lh = LINE_HEIGHT
  return { parts: [{ lines, lh }], totalHeight: lh }
}

function drawLabeledRowFromPrepared(ctx: DocContext, row: Row, prepared: PreparedRow, xLabel: number, xValue: number) {
  const valueFont = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
  
  // label at starting y
  ctx.page.drawText(pdfSafe(row.label), { x: xLabel, y: ctx.y, size: LABEL_SIZE, font: ctx.fonts.bold, color: BLACK })
  
  // Gestion spéciale pour les revenus complémentaires
  if (row.specialFormat === 'revenus' && Array.isArray(row.value) && row.value.length > 0) {
    const revenus = row.value as RevenuFormatted[]
    
    // Saut de ligne direct après le label
    let yy = ctx.y - LINE_HEIGHT
    
    for (const revenu of revenus) {
      // Dessiner le label du revenu (même position x que le label principal)
      const labelText = `${revenu.label} : `
      const labelWidth = ctx.fonts.reg.widthOfTextAtSize(labelText, BODY_SIZE)
      
      ctx.page.drawText(labelText, { x: xLabel, y: yy, size: BODY_SIZE, font: ctx.fonts.reg, color: BLACK })
      
      // Dessiner le montant en gras (juste après le label)
      const montantText = `${revenu.montant} €/mois`
      ctx.page.drawText(montantText, { 
        x: xLabel + labelWidth, 
        y: yy, 
        size: BODY_SIZE, 
        font: ctx.fonts.bold, 
        color: BLACK 
      })
      
      yy -= LINE_HEIGHT
      
      // Ajouter un espace entre les revenus (sauf pour le dernier)
      if (revenus.indexOf(revenu) < revenus.length - 1) {
        yy -= LINE_HEIGHT / 2
      }
    }
    
    ctx.y = yy - 2
    return
  }
  
  // Gestion normale pour les autres types
  let yy = ctx.y
  for (const part of prepared.parts) {
    for (let i = 0; i < part.lines.length; i++) {
      const line = part.lines[i]
      // Ignorer les lignes vides (espaces entre revenus)
      if (line.trim() === "") continue
      
      // Première ligne : position normale, lignes suivantes : indentées
      const xPos = i === 0 ? xValue : xValue + 20 // Indentation de 20px pour les lignes de continuation
      ctx.page.drawText(pdfSafe(line), { x: xPos, y: yy, size: BODY_SIZE, font: valueFont, color: BLACK })
      yy -= part.lh
    }
  }
  // update ctx.y to the min end
  ctx.y = Math.min(yy, ctx.y - LINE_HEIGHT) - 2
}

// Column headings helper - OPTIMISÉ avec numérotation dynamique
function drawColumnHeadingsInline(ctx: DocContext, xLeft: number, xRight?: number, leftNumber: number = 1, rightNumber: number = 2) {
  ctx.page.drawText(pdfSafe(`Locataire ${leftNumber}`), { x: xLeft, y: ctx.y, size: 11, font: ctx.fonts.bold, color: PRIMARY }) // Réduit de 12 à 11
  if (typeof xRight === "number") {
    ctx.page.drawText(pdfSafe(`Locataire ${rightNumber}`), { x: xRight, y: ctx.y, size: 11, font: ctx.fonts.bold, color: PRIMARY }) // Réduit de 12 à 11
  }
  ctx.y -= 14 // Réduit de 16 à 14
}

// Two columns, aligned, with pagination - OPTIMISÉ
async function drawTwoColumnsAlignedWithBreaks(ctx: DocContext, left?: Locataire, right?: Locataire, leftNumber: number = 1, rightNumber: number = 2) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xLeft = MARGIN
  const xRight = MARGIN + colWidth + GUTTER

  // Column headings
  await ensureSpace(ctx, 18) // Réduit de 20 à 18
  drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined, leftNumber, rightNumber)

  // Identité
  await ensureSpace(ctx, 28) // Réduit de 32 à 28
  ctx.y = drawSectionHeader(ctx.page, "Identité", MARGIN, ctx.y, ctx.fonts.bold)

  const layout = {
    xLabelL: xLeft,
    xValueL: xLeft + LABEL_WIDTH + VALUE_INDENT,
    xLabelR: xRight,
    xValueR: xRight + LABEL_WIDTH + VALUE_INDENT,
    colWidth,
  }

  const rowsIdL = identityRows(left)
  const rowsIdR = identityRows(right)

  for (let i = 0; i < Math.max(rowsIdL.length, rowsIdR.length); i++) {
    const rL = rowsIdL[i] || { label: rowsIdR[i]?.label || "", value: dash }
    const rR = rowsIdR[i] || { label: rowsIdL[i]?.label || "", value: dash }

    const fontLeft = rL.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const fontRight = rR.highlight ? ctx.fonts.bold : ctx.fonts.reg

    const prepL = prepareRowParts(rL, fontLeft, layout.colWidth)
    const prepR = prepareRowParts(rR, fontRight, layout.colWidth)
    const pairHeight = Math.max(prepL.totalHeight, prepR.totalHeight) + 1 // Réduit de 2 à 1

    // If not enough space, break page and redraw column headings
    ctx.drawColumnHeadingsNext = () => drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined, leftNumber, rightNumber)
    await ensureSpace(ctx, pairHeight)

    // draw both starting at same yStart
    const yStart = ctx.y
    drawLabeledRowFromPrepared(ctx, rL, prepL, layout.xLabelL, layout.xValueL)
    const yAfterLeft = ctx.y
    ctx.y = yStart
    drawLabeledRowFromPrepared(ctx, rR, prepR, layout.xLabelR, layout.xValueR)
    const yAfterRight = ctx.y
    ctx.y = Math.min(yAfterLeft, yAfterRight)
  }

  // Situation professionnelle
  await ensureSpace(ctx, 28) // Réduit de 32 à 28
  ctx.y = drawSectionHeader(ctx.page, "Situation professionnelle", MARGIN, ctx.y, ctx.fonts.bold)

  const rowsProL = proRows(left)
  const rowsProR = proRows(right)

  for (let i = 0; i < Math.max(rowsProL.length, rowsProR.length); i++) {
    const rL = rowsProL[i] || { label: rowsProR[i]?.label || "", value: dash }
    const rR = rowsProR[i] || { label: rowsProL[i]?.label || "", value: dash }

    const fontLeft = rL.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const fontRight = rR.highlight ? ctx.fonts.bold : ctx.fonts.reg

    const prepL = prepareRowParts(rL, fontLeft, colWidth)
    const prepR = prepareRowParts(rR, fontRight, colWidth)
    const pairHeight = Math.max(prepL.totalHeight, prepR.totalHeight) + 1 // Réduit de 2 à 1

    ctx.drawColumnHeadingsNext = () => drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined, leftNumber, rightNumber)
    await ensureSpace(ctx, pairHeight)

    const yStart = ctx.y
    drawLabeledRowFromPrepared(ctx, rL, prepL, layout.xLabelL, layout.xValueL)
    const yAfterLeft = ctx.y
    ctx.y = yStart
    drawLabeledRowFromPrepared(ctx, rR, prepR, layout.xLabelR, layout.xValueR)
    const yAfterRight = ctx.y
    ctx.y = Math.min(yAfterLeft, yAfterRight)
  }
}

// Single, centered column (for 1 tenant), with pagination - OPTIMISÉ
async function drawSingleCenteredColumnWithBreaks(ctx: DocContext, l?: Locataire, locataireNumber: number = 1) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xCenter = MARGIN + (total - colWidth) / 2

  // Heading
  await ensureSpace(ctx, 18) // Réduit de 20 à 18
  ctx.page.drawText(pdfSafe(`Locataire ${locataireNumber}`), { x: xCenter, y: ctx.y, size: 11, font: ctx.fonts.bold, color: PRIMARY }) // Réduit de 12 à 11
  ctx.y -= 14 // Réduit de 16 à 14

  // Identité
  await ensureSpace(ctx, 28) // Réduit de 32 à 28
  ctx.y = drawSectionHeader(ctx.page, "Identité", xCenter, ctx.y, ctx.fonts.bold)
  const xLabel = xCenter
  const xValue = xCenter + LABEL_WIDTH + VALUE_INDENT

  for (const row of identityRows(l)) {
    const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const prep = prepareRowParts(row, fontValue, colWidth)
    await ensureSpace(ctx, prep.totalHeight + 1) // Réduit de 2 à 1
    drawLabeledRowFromPrepared(ctx, row, prep, xLabel, xValue)
  }

  // Situation professionnelle
  await ensureSpace(ctx, 28) // Réduit de 32 à 28
  ctx.y = drawSectionHeader(ctx.page, "Situation professionnelle", xCenter, ctx.y, ctx.fonts.bold)
  for (const row of proRows(l)) {
    const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const prep = prepareRowParts(row, fontValue, colWidth)
    await ensureSpace(ctx, prep.totalHeight + 1) // Réduit de 2 à 1
    drawLabeledRowFromPrepared(ctx, row, prep, xLabel, xValue)
  }
}

// Filename
export function buildLocatairePdfFilename(data: AppFormData): string {
  const names = (data.locataires || [])
    .map((l) => `${toTitleCase(l.nom || "").trim()} ${toTitleCase(l.prenom || "").trim()}`.trim())
    .filter((s) => s && s !== "")
  const safe = names.map((n) => n.replace(/[\\/:*?"<>|\u0000-\u001F]+/g, "").trim()).join(", ")
  return `FR-${safe || "Locataire"}.pdf`
}

// Main generator - OPTIMISÉ POUR 1 PAGE + PAGINATION INTELLIGENTE
export async function generatePdf(data: AppFormData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const locs = data.locataires || []
  
  // STRATÉGIE DE PAGINATION OPTIMISÉE :
  // - Page 1 : Locataires 1-2 (doit tenir sur 1 page)
  // - Page 2 : Locataires 3-4 (si ils existent)
  const page1Locs = locs.slice(0, 2)
  const page2Locs = locs.slice(2, 4)

  // Page 1 - Locataires 1-2 (doit tenir sur 1 page)
  const page1 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y1 = await drawHeader(page1, pdf, fontBold, fontReg)
  y1 -= 4 // Réduit de 6 à 4

  const ctx1: DocContext = {
    pdf,
    page: page1,
    y: y1,
    fonts: { reg: fontReg, bold: fontBold },
  }

  // Dessiner les locataires de la page 1
  if (page1Locs.length === 1) {
    await drawSingleCenteredColumnWithBreaks(ctx1, page1Locs[0], 1) // Locataire 1
  } else if (page1Locs.length === 2) {
    await drawTwoColumnsAlignedWithBreaks(ctx1, page1Locs[0], page1Locs[1], 1, 2) // Locataires 1 et 2
  }

  // Sections communes sur la page 1 (après les locataires)
  await ensureSpace(ctx1, 20) // Réduit de 22 à 20
  ctx1.page.drawLine({
    start: { x: MARGIN, y: ctx1.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx1.y },
    thickness: 1,
    color: SEP_GRAY,
  })
  ctx1.y -= 12 // Réduit de 14 à 12

  // Enfants à charge (sans titre de section)
  const enfants = (data.nombreEnfantsFoyer ?? 0).toString()
  await ensureSpace(ctx1, 26) // Réduit de 30 à 26
  const enfantsText = `Nombre d'enfants à charge : ${enfants}`
  const enfantsWrapped = wrapByWidth(pdfSafe(enfantsText), fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
  for (const line of enfantsWrapped) {
    await ensureSpace(ctx1, LINE_HEIGHT)
    ctx1.page.drawText(line, { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
    ctx1.y -= LINE_HEIGHT
  }

  // Garanties
  await ensureSpace(ctx1, 28) // Réduit de 32 à 28
  ctx1.y = drawSectionHeader(ctx1.page, "Garanties", MARGIN, ctx1.y, fontBold)
  const g = data.garanties
  if (g) {
    // "Garant familial : Oui/Non"
    {
      const txt = pdfSafe(`Garant familial : ${nonEmpty(g.garantFamilial) ? g.garantFamilial : dash}`)
      const wrapped = wrapByWidth(txt, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
      for (const line of wrapped) {
        await ensureSpace(ctx1, LINE_HEIGHT)
        ctx1.page.drawText(line, { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
        ctx1.y -= LINE_HEIGHT
      }
    }

    // Précision (long text allowed)
    {
      const txt = nonEmpty(g.precisionGarant) ? `Précision : ${g.precisionGarant}` : "Précision : -"
      const wrapped = wrapByWidth(pdfSafe(txt), fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 12)
      const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      for (const line of wrapped) {
        await ensureSpace(ctx1, lh)
        ctx1.page.drawText(line, { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
        ctx1.y -= lh
      }
    }

    // Garantie Visale Oui/Non
    {
      const txt = pdfSafe(`Garantie Visale : ${nonEmpty(g.garantieVisale) ? g.garantieVisale : dash}`)
      const wrapped = wrapByWidth(txt, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
      for (const line of wrapped) {
        await ensureSpace(ctx1, LINE_HEIGHT)
        ctx1.page.drawText(line, { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
        ctx1.y -= LINE_HEIGHT
      }
    }

    // Liste des garants en puces (version compacte)
    if (Array.isArray(g.garants) && g.garants.length) {
      await ensureSpace(ctx1, LINE_HEIGHT)
      ctx1.page.drawText(pdfSafe("Garants familiaux déclarés :"), {
        x: MARGIN,
        y: ctx1.y,
        size: BODY_SIZE,
        font: fontBold,
        color: BLACK,
      })
      ctx1.y -= LINE_HEIGHT
      for (const ga of g.garants) {
        const name = [toTitleCase(ga.nom), toTitleCase(ga.prenom)].filter(Boolean).join(" ") || dash
        const line = `${name}${ga.email ? ` – ${ga.email}` : ""}${ga.telephone ? ` – ${ga.telephone}` : ""}`
        const wrapped = wrapByWidth(line, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 12)
        const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
        for (const l of wrapped) {
          await ensureSpace(ctx1, lh)
          ctx1.page.drawText(pdfSafe(`• ${l}`), {
            x: MARGIN + 12,
            y: ctx1.y,
            size: BODY_SIZE,
            font: fontReg,
            color: BLACK,
          })
          ctx1.y -= lh
        }
      }
      ctx1.y -= 1 // Réduit de 2 à 1
    }
  } else {
    await ensureSpace(ctx1, LINE_HEIGHT * 3)
    ctx1.page.drawText("Garant familial : -", { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
    ctx1.y -= LINE_HEIGHT
    ctx1.page.drawText("Précision : -", { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
    ctx1.y -= LINE_HEIGHT
    ctx1.page.drawText("Garantie Visale : -", { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
    ctx1.y -= LINE_HEIGHT
  }

  // DossierFacile (seulement si le locataire transmet son lien)
  if (data.dossierFacileLink && data.dossierFacileLink.trim()) {
    await ensureSpace(ctx1, 28) // Réduit de 32 à 28
    ctx1.y = drawSectionHeader(ctx1.page, "Gagnez du temps avec DossierFacile…", MARGIN, ctx1.y, fontBold)
    const df = pdfSafe((data.dossierFacileLink || "").trim())
    const dfWrapped = wrapByWidth(df, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
    for (const l of dfWrapped) {
      await ensureSpace(ctx1, LINE_HEIGHT)
      ctx1.page.drawText(l, { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
      ctx1.y -= LINE_HEIGHT
    }
  }

  // Footer sur la page 1
  drawFooter(ctx1.page, fontReg)

  // Page 2 - Locataires 3-4 (seulement si ils existent)
  if (page2Locs.length > 0) {
    const page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y2 = await drawHeader(page2, pdf, fontBold, fontReg)
    y2 -= 4

    const ctx2: DocContext = {
      pdf,
      page: page2,
      y: y2,
      fonts: { reg: fontReg, bold: fontBold },
    }

    // Dessiner les locataires de la page 2
    if (page2Locs.length === 1) {
      await drawSingleCenteredColumnWithBreaks(ctx2, page2Locs[0], 3) // Locataire 3
    } else if (page2Locs.length === 2) {
      await drawTwoColumnsAlignedWithBreaks(ctx2, page2Locs[0], page2Locs[1], 3, 4) // Locataires 3 et 4
    }

    // Footer sur la page 2
    drawFooter(ctx2.page, fontReg)
  }

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

import { PDFDocument, StandardFonts, rgb, type RGB, type PDFPage } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { GarantFormData, Locataire, GarantContact } from "./types"

// Brand and style - EXACTEMENT comme pdf-generator.ts
const PRIMARY = rgb(0 / 255, 114 / 255, 188 / 255) // #0072BC (brand blue)
const TEXT_INFO = rgb(110 / 255, 110 / 255, 110 / 255) // #6E6E6E (secondary text)
const BLACK = rgb(0, 0, 0)
const SEP_GRAY = rgb(218 / 255, 218 / 255, 218 / 255) // #DADADA separator

// Page and layout (A4) - OPTIMISÉ POUR LA LISIBILITÉ
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 40 // Augmenté de 35 à 40 pour plus d'espace
const GUTTER = 25 // Augmenté de 20 à 25 pour séparer les colonnes
const LABEL_WIDTH = 130 // Augmenté de 120 à 130 pour les labels
const VALUE_INDENT = 6 // Augmenté de 4 à 6 pour l'espacement
const TITLE_SIZE = 18 // Augmenté de 17 à 18 pour plus de visibilité
const SECTION_SIZE = 14 // Augmenté de 13 à 14 pour les titres de section
const LABEL_SIZE = 11 // Augmenté de 10 à 11 pour les labels
const BODY_SIZE = 12 // Augmenté de 11 à 12 pour le texte principal
const LINE_HEIGHT = 14 // Augmenté de 12 à 14 pour plus d'espacement
const LONG_LINE_HEIGHT = Math.round(BODY_SIZE * 1.4) // ≈ 17 pour la lisibilité
const BOTTOM_RESERVE = 70 // Augmenté de 60 à 70 pour la marge de sécurité

// Utilities - EXACTEMENT comme pdf-generator.ts
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

// Robust word wrap with long-token breaking - EXACTEMENT comme pdf-generator.ts
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
    if (current.trim()) {
      lines.push(current.trim())
      current = ""
    }
  }

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, size)
    if (testWidth <= maxWidth) {
      current = testLine
    } else {
      if (current) {
        pushCurrent()
        current = word
      } else {
        // Long word that needs breaking
        const broken = breakLongTokenByWidth(word, font, size, maxWidth)
        lines.push(...broken)
      }
    }
  }
  pushCurrent()
  return lines.length ? lines : [dash]
}

// Split address into two lines - EXACTEMENT comme pdf-generator.ts
function splitAddressLines(adresse?: string | null): [string, string] {
  if (!adresse) return ["", ""]
  const lines = adresse.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return ["", ""]
  if (lines.length === 1) return [lines[0], ""]
  return [lines[0], lines.slice(1).join(", ")]
}

// Format date - EXACTEMENT comme pdf-generator.ts
function formatDateFR(input?: string | null) {
  if (!input) return ""
  try {
    const date = new Date(input)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

// Format lieu de naissance - EXACTEMENT comme pdf-generator.ts
function formatLieuNaissance(input?: string | null) {
  if (!input) return ""
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  return parts.slice(0, 2).join(", ") // Ville, Département
}

// Type Row - EXACTEMENT comme pdf-generator.ts
type Row = { 
  label: string; 
  value: string | string[]; 
  highlight?: boolean;
}

// Identity rows - EXACTEMENT comme pdf-generator.ts
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

// Drawing primitives - EXACTEMENT comme pdf-generator.ts
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

// Section header - OPTIMISÉ POUR LA LISIBILITÉ
function drawSectionHeader(page: any, title: string, x: number, y: number, fontBold: any) {
  // Add 16px margin above titles (augmenté de 12 à 16)
  y -= 16
  const header = pdfSafe(title.toUpperCase())
  page.drawText(header, { x, y, size: SECTION_SIZE, font: fontBold, color: PRIMARY })
  const yy = y - 12 // Augmenté de 10 à 12
  page.drawLine({
    start: { x, y: yy },
    end: { x: page.getWidth() - x, y: yy },
    thickness: 1,
    color: SEP_GRAY,
  })
  return yy - 12 // Augmenté de 10 à 12
}

// Header drawing - EXACTEMENT comme pdf-generator.ts
async function drawHeader(page: any, pdf: PDFDocument, fontBold: any, fontReg: any) {
  const yTop = PAGE_HEIGHT - MARGIN

  // Logo (centered, max-height 30px, margin-bottom 10px) - EXACTEMENT comme pdf-generator.ts
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
    const logoHeight = 30 // Exactement comme pdf-generator.ts
    const ratio = logoHeight / logoImage.height
    const logoWidth = logoImage.width * ratio
    const x = (PAGE_WIDTH - logoWidth) / 2
    page.drawImage(logoImage, { x, y: yTop - logoHeight, width: logoWidth, height: logoHeight })
    y = yTop - logoHeight - 35 // Augmenté de 20 à 35 pour un espacement généreux
  } else {
    y = yTop - 35
  }

  // Titre principal
  const title = "DOSSIER DE GARANT"
  const titleSize = TITLE_SIZE
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
  const titleX = (PAGE_WIDTH - titleWidth) / 2
  page.drawText(title, { x: titleX, y, size: titleSize, font: fontBold, color: PRIMARY })
  y -= titleSize + 25 // Augmenté de 15 à 25 pour plus d'espace après le titre

  // Sous-titre
  const subtitle = "Formulaire de garant pour location immobilière"
  const subtitleSize = SECTION_SIZE
  const subtitleWidth = fontReg.widthOfTextAtSize(subtitle, subtitleSize)
  const subtitleX = (PAGE_WIDTH - subtitleWidth) / 2
  page.drawText(subtitle, { x: subtitleX, y, size: subtitleSize, font: fontReg, color: TEXT_INFO })
  y -= subtitleSize + 25 // Augmenté de 20 à 25

  return y
}

// Types - EXACTEMENT comme pdf-generator.ts
type Fonts = { reg: any; bold: any }
type DocContext = {
  pdf: PDFDocument
  page: PDFPage
  y: number
  fonts: Fonts
  drawColumnHeadingsNext?: () => void // optional callback to draw column headers after a page break
}

// Ensure space - EXACTEMENT comme pdf-generator.ts
async function ensureSpace(ctx: DocContext, neededHeight: number) {
  if (ctx.y - neededHeight < MARGIN + BOTTOM_RESERVE) {
    const newPage = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let newY = await drawHeader(newPage, ctx.pdf, ctx.fonts.bold, ctx.fonts.reg)
    newY -= 4 // Réduit de 6 à 4
    ctx.page = newPage
    ctx.y = newY
    if (ctx.drawColumnHeadingsNext) {
      ctx.drawColumnHeadingsNext()
    }
  }
}

// Prepare row parts - EXACTEMENT comme pdf-generator.ts
type PreparedPart = { lines: string[]; lh: number }
type PreparedRow = { parts: PreparedPart[]; totalHeight: number }

function prepareRowParts(row: Row, font: any, colMaxWidth: number): PreparedRow {
  const parts: PreparedPart[] = []
  let totalHeight = 0

  if (Array.isArray(row.value)) {
    // Multi-line value (like address)
    for (const line of row.value) {
      if (line) {
        const wrapped = wrapByWidth(line, font, BODY_SIZE, colMaxWidth - LABEL_WIDTH - VALUE_INDENT)
        const lh = wrapped.length > 1 ? LONG_LINE_HEIGHT : LINE_HEIGHT
        parts.push({ lines: wrapped, lh })
        totalHeight += lh * wrapped.length
      }
    }
  } else {
    // Single value
    const wrapped = wrapByWidth(row.value, font, BODY_SIZE, colMaxWidth - LABEL_WIDTH - VALUE_INDENT)
    const lh = wrapped.length > 1 ? LONG_LINE_HEIGHT : LINE_HEIGHT
    parts.push({ lines: wrapped, lh })
    totalHeight += lh * wrapped.length
  }

  return { parts, totalHeight }
}

// Draw labeled row from prepared - EXACTEMENT comme pdf-generator.ts
function drawLabeledRowFromPrepared(ctx: DocContext, row: Row, prepared: PreparedRow, xLabel: number, xValue: number) {
  const labelFont = ctx.fonts.bold
  const valueFont = row.highlight ? ctx.fonts.bold : ctx.fonts.reg

  // Draw label
  const labelText = pdfSafe(row.label)
  const labelWrapped = wrapByWidth(labelText, labelFont, LABEL_SIZE, LABEL_WIDTH)
  let labelY = ctx.y
  for (const line of labelWrapped) {
    ctx.page.drawText(line, { x: xLabel, y: labelY, size: LABEL_SIZE, font: labelFont, color: BLACK })
    labelY -= LINE_HEIGHT
  }

  // Draw value
  let valueY = ctx.y
  for (const part of prepared.parts) {
    for (const line of part.lines) {
      ctx.page.drawText(line, { x: xValue, y: valueY, size: BODY_SIZE, font: valueFont, color: BLACK })
      valueY -= part.lh
    }
  }

  // Update y position to the lowest point
  ctx.y = Math.min(labelY, valueY)
}

// Column headings - OPTIMISÉ POUR LA LISIBILITÉ
function drawColumnHeadingsInline(ctx: DocContext, xLeft: number, xRight?: number, leftNumber: number = 1, rightNumber: number = 2) {
  ctx.page.drawText(pdfSafe(`Garant ${leftNumber}`), { x: xLeft, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY }) // Augmenté de 11 à 12
  if (typeof xRight === "number") {
    ctx.page.drawText(pdfSafe(`Garant ${rightNumber}`), { x: xRight, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY }) // Augmenté de 11 à 12
  }
  ctx.y -= 18 // Augmenté de 14 à 18
}

// Two columns, aligned, with pagination - OPTIMISÉ POUR LA LISIBILITÉ
async function drawTwoColumnsAlignedWithBreaks(ctx: DocContext, left?: Locataire, right?: Locataire, leftNumber: number = 1, rightNumber: number = 2) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xLeft = MARGIN
  const xRight = MARGIN + colWidth + GUTTER

  // Column headings
  await ensureSpace(ctx, 22) // Augmenté de 18 à 22
  drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined, leftNumber, rightNumber)

  // Identité
  await ensureSpace(ctx, 32) // Augmenté de 28 à 32
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
    const pairHeight = Math.max(prepL.totalHeight, prepR.totalHeight) + 2 // Augmenté de 1 à 2

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
}

// Single, centered column (for 1 garant), with pagination - OPTIMISÉ POUR LA LISIBILITÉ
async function drawSingleCenteredColumnWithBreaks(ctx: DocContext, l?: Locataire, garantNumber: number = 1) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xCenter = MARGIN + (total - colWidth) / 2

  // Heading
  await ensureSpace(ctx, 22) // Augmenté de 18 à 22
  ctx.page.drawText(pdfSafe(`Garant ${garantNumber}`), { x: xCenter, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY }) // Augmenté de 11 à 12
  ctx.y -= 18 // Augmenté de 14 à 18

  // Identité
  await ensureSpace(ctx, 32) // Augmenté de 28 à 32
  ctx.y = drawSectionHeader(ctx.page, "Identité", xCenter, ctx.y, ctx.fonts.bold)
  const xLabel = xCenter
  const xValue = xCenter + LABEL_WIDTH + VALUE_INDENT

  for (const row of identityRows(l)) {
    const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const prep = prepareRowParts(row, fontValue, colWidth)
    await ensureSpace(ctx, prep.totalHeight + 2) // Augmenté de 1 à 2
    drawLabeledRowFromPrepared(ctx, row, prep, xLabel, xValue)
  }
}

// Build filename - EXACTEMENT comme pdf-generator.ts
export function buildGarantPdfFilename(data: GarantFormData): string {
  const garant = data.garant
  const nom = garant?.nom || "garant"
  const prenom = garant?.prenom || ""
  const timestamp = new Date().toISOString().split("T")[0]
  return `garant_${prenom}_${nom}_${timestamp}.pdf`
}

// Main function - EXACTEMENT comme pdf-generator.ts
export async function generateGarantPdf(data: GarantFormData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Gérer plusieurs garants
  const garants = data.garants || [data.garant]
  
  // STRATÉGIE DE PAGINATION OPTIMISÉE :
  // - Page 1 : Garants 1-2 (doit tenir sur 1 page)
  // - Page 2 : Garants 3 (si il existe)
  const page1Garants = garants.slice(0, 2)
  const page2Garants = garants.slice(2, 3)

  // Page 1 - Garants 1-2 (doit tenir sur 1 page)
  const page1 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y1 = await drawHeader(page1, pdf, fontBold, fontReg)
  y1 -= 6 // Augmenté de 4 à 6

  const ctx1: DocContext = {
    pdf,
    page: page1,
    y: y1,
    fonts: { reg: fontReg, bold: fontBold },
  }

  // Dessiner les garants de la page 1
  if (page1Garants.length === 1) {
    await drawSingleCenteredColumnWithBreaks(ctx1, page1Garants[0], 1) // Garant 1
  } else if (page1Garants.length === 2) {
    await drawTwoColumnsAlignedWithBreaks(ctx1, page1Garants[0], page1Garants[1], 1, 2) // Garants 1 et 2
  }

  // Sections communes sur la page 1 (après les garants)
  await ensureSpace(ctx1, 24) // Augmenté de 20 à 24
  ctx1.page.drawLine({
    start: { x: MARGIN, y: ctx1.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx1.y },
    thickness: 1,
    color: SEP_GRAY,
  })
  ctx1.y -= 16 // Augmenté de 12 à 16

  // Locataires cautionnés
  await ensureSpace(ctx1, 32) // Augmenté de 28 à 32
  ctx1.y = drawSectionHeader(ctx1.page, "Locataires cautionnés", MARGIN, ctx1.y, ctx1.fonts.bold)
  
  if (data.cautionnes && data.cautionnes.length > 0) {
    for (const cautionne of data.cautionnes) {
      const nom = [toTitleCase(cautionne.nom), toTitleCase(cautionne.prenom)].filter(Boolean).join(" ") || dash
      const line = `${nom}${cautionne.email ? ` – ${cautionne.email}` : ""}${cautionne.telephone ? ` – ${cautionne.telephone}` : ""}`
      const wrapped = wrapByWidth(line, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 16) // Augmenté de 12 à 16
      const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      for (const l of wrapped) {
        await ensureSpace(ctx1, lh)
        ctx1.page.drawText(pdfSafe(`• ${l}`), {
          x: MARGIN + 16, // Augmenté de 12 à 16
          y: ctx1.y,
          size: BODY_SIZE,
          font: fontReg,
          color: BLACK,
        })
        ctx1.y -= lh
      }
    }
  } else {
    await ensureSpace(ctx1, LINE_HEIGHT)
    ctx1.page.drawText("Aucun locataire cautionné", { x: MARGIN, y: ctx1.y, size: BODY_SIZE, font: fontReg, color: BLACK })
    ctx1.y -= LINE_HEIGHT
  }

  // Footer sur la page 1
  drawFooter(ctx1.page, fontReg)

  // Page 2 - Garant 3 (seulement si il existe)
  if (page2Garants.length > 0) {
    const page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y2 = await drawHeader(page2, pdf, fontBold, fontReg)
    y2 -= 6 // Augmenté de 4 à 6

    const ctx2: DocContext = {
      pdf,
      page: page2,
      y: y2,
      fonts: { reg: fontReg, bold: fontBold },
    }

    // Dessiner le garant de la page 2
    await drawSingleCenteredColumnWithBreaks(ctx2, page2Garants[0], 3) // Garant 3

    // Footer sur la page 2
    drawFooter(ctx2.page, fontReg)
  }

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

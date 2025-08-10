import { PDFDocument, StandardFonts, rgb, type RGB, type PDFPage } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { AppFormData } from "./types"

// Brand and style - EXACTEMENT comme pdf-garant-generator.ts
const PRIMARY = rgb(0 / 255, 114 / 255, 188 / 255) // #0072BC (brand blue)
const TEXT_INFO = rgb(110 / 255, 110 / 255, 110 / 255) // #6E6E6E (secondary text)
const BLACK = rgb(0, 0, 0)
const SEP_GRAY = rgb(218 / 255, 218 / 255, 218 / 255) // #DADADA separator

// Page and layout (A4) - OPTIMISÉ POUR LA LISIBILITÉ - EXACTEMENT comme pdf-garant-generator.ts
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 40 // Augmenté de 35 à 40 pour plus d'espace
const GUTTER = 25 // Augmenté de 20 à 25 pour séparer les colonnes
const LABEL_WIDTH = 180 // Augmenté de 130 à 180 pour éviter le chevauchement
const VALUE_INDENT = 12 // Augmenté de 6 à 12 pour plus d'espacement
const TITLE_SIZE = 18 // Augmenté de 17 à 18 pour plus de visibilité
const SECTION_SIZE = 14 // Augmenté de 13 à 14 pour les titres de section
const LABEL_SIZE = 11 // Augmenté de 10 à 11 pour les labels
const BODY_SIZE = 12 // Augmenté de 11 à 12 pour le texte principal
const LINE_HEIGHT = 18 // Augmenté de 14 à 18 pour plus d'espacement entre lignes
const LONG_LINE_HEIGHT = Math.round(BODY_SIZE * 1.6) // ≈ 19 pour la lisibilité avec plus d'espace
const BOTTOM_RESERVE = 70 // Augmenté de 60 à 70 pour la marge de sécurité

// Utilities - EXACTEMENT comme pdf-garant-generator.ts
const nonEmpty = (v?: string | null) => Boolean(v && String(v).trim() !== "")
const dash = "-" // single dash for missing data
const showOrDash = (v?: string | null) => (nonEmpty(v) ? String(v) : dash)

function toTitleCase(s?: string | null) {
  if (!nonEmpty(s)) return ""
  const lower = String(s).toLowerCase()
  return lower.replace(/\p{L}+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1))
}

// Sanitize text for Helvetica (WinAnsi) to prevent U+202F etc.
function pdfSafe(input?: string) {
  if (!input) return ""
  return input
    .normalize("NFKC")
    .replace(/[\u202F\u00A0\u2009\u2007\u2060]/g, " ") // narrow NBSP, NBSP, thin/figure spaces, word joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
}

// Robust word wrap with long-token breaking - EXACTEMENT comme pdf-garant-generator.ts
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
        // Single word too long - break it
        const broken = breakLongTokenByWidth(word, font, size, maxWidth)
        lines.push(...broken)
      }
    }
  }
  pushCurrent()
  return lines.length ? lines : [dash]
}

// Header drawing - EXACTEMENT comme pdf-garant-generator.ts
async function drawHeader(page: any, pdf: PDFDocument, fontBold: any, fontReg: any) {
  const yTop = PAGE_HEIGHT - MARGIN

  // Logo (centered, max-height 30px, margin-bottom 10px) - EXACTEMENT comme pdf-garant-generator.ts
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
    const logoHeight = 30 // Exactement comme pdf-garant-generator.ts
    const ratio = logoHeight / logoImage.height
    const logoWidth = logoImage.width * ratio
    const x = (PAGE_WIDTH - logoWidth) / 2
    page.drawImage(logoImage, { x, y: yTop - logoHeight, width: logoWidth, height: logoHeight })
    y = yTop - logoHeight - 35 // Augmenté de 20 à 35 pour un espacement généreux
  } else {
    y = yTop - 35
  }

  // Titre principal
  const title = "CRITÈRES DE RECHERCHE"
  const titleSize = TITLE_SIZE
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
  const titleX = (PAGE_WIDTH - titleWidth) / 2
  page.drawText(title, { x: titleX, y, size: titleSize, font: fontBold, color: PRIMARY })
  y -= titleSize + 25 // Augmenté de 15 à 25 pour plus d'espace après le titre

  // Sous-titre
  const subtitle = "Formulaire de recherche de logement"
  const subtitleSize = SECTION_SIZE
  const subtitleWidth = fontReg.widthOfTextAtSize(subtitle, subtitleSize)
  const subtitleX = (PAGE_WIDTH - subtitleWidth) / 2
  page.drawText(subtitle, { x: subtitleX, y, size: subtitleSize, font: fontReg, color: TEXT_INFO })
  y -= subtitleSize + 25 // Augmenté de 20 à 25

  return y
}

// Footer drawing - EXACTEMENT comme pdf-garant-generator.ts
function drawFooter(page: any, fontReg: any) {
  const y = MARGIN + BOTTOM_RESERVE
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: SEP_GRAY,
  })

  const footerText = "ALV PLEYBEN IMMOBILIER - 19 Place du Général de Gaulle - 29190 PLEYBEN"
  const footerWidth = fontReg.widthOfTextAtSize(footerText, 9)
  const footerX = (PAGE_WIDTH - footerWidth) / 2
  page.drawText(footerText, { x: footerX, y: y - 12, size: 9, font: fontReg, color: TEXT_INFO })
}

// Section header drawing - EXACTEMENT comme pdf-garant-generator.ts
function drawSectionHeader(page: any, title: string, x: number, y: number, fontBold: any) {
  const titleText = title.toUpperCase()
  const titleWidth = fontBold.widthOfTextAtSize(titleText, SECTION_SIZE)
  const titleX = (PAGE_WIDTH - titleWidth) / 2
  page.drawText(titleText, { x: titleX, y, size: SECTION_SIZE, font: fontBold, color: PRIMARY })
  y -= SECTION_SIZE + 8 // Augmenté de 6 à 8 pour plus d'espace
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.4,
    color: SEP_GRAY,
  })
  y -= LINE_HEIGHT
  return y
}

// Types - EXACTEMENT comme pdf-garant-generator.ts
type Fonts = { reg: any; bold: any }
type DocContext = {
  pdf: PDFDocument
  page: PDFPage
  y: number
  fonts: Fonts
}

// Space management - EXACTEMENT comme pdf-garant-generator.ts
async function ensureSpace(ctx: DocContext, neededHeight: number) {
  if (ctx.y - neededHeight < MARGIN + BOTTOM_RESERVE) {
    const newPage = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    await drawHeader(newPage, ctx.pdf, ctx.fonts.bold, ctx.fonts.reg)
    ctx.page = newPage
    ctx.y = PAGE_HEIGHT - MARGIN - 120 // Position après le header
  }
}

// Row type for criteria - EXACTEMENT comme pdf-garant-generator.ts
type Row = { 
  label: string; 
  value: string | string[]; 
  highlight?: boolean;
}

// Build rows for the "CRITÈRES DU BIEN" section
function getCriteriaRows(c?: AppFormData["criteresRecherche"]): Row[] {
  return [
    { label: "Secteur souhaité", value: showOrDash(c?.secteurSouhaite) },
    { label: "Nombre de chambres minimum", value: showOrDash(c?.nombreChambres) },
    { label: "Loyer maximum souhaité", value: c?.loyerMax ? `${c.loyerMax} € / mois` : dash },
    { label: "Rayon de recherche", value: c?.rayonKm ? `${c.rayonKm} km` : dash },
  ]
}

// Build rows for the "PROJET DE DÉMÉNAGEMENT" section
function getDemenagementRows(c?: AppFormData["criteresRecherche"]): Row[] {
  return [
    { label: "Date souhaitée d'emménagement", value: showOrDash(c?.dateEmmenagement) },
    { label: "Préavis à déposer", value: showOrDash(c?.preavisADeposer) },
  ]
}

// Prepare row parts for drawing - EXACTEMENT comme pdf-garant-generator.ts
type PreparedPart = { lines: string[]; lh: number }
type PreparedRow = { parts: PreparedPart[]; totalHeight: number }

function prepareRowParts(row: Row, font: any, colMaxWidth: number): PreparedRow {
  const parts: PreparedPart[] = []
  let totalHeight = 0

  if (Array.isArray(row.value)) {
    // Multi-line value
    for (const val of row.value) {
      const wrapped = wrapByWidth(val, font, BODY_SIZE, colMaxWidth)
      const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      parts.push({ lines: wrapped, lh })
      totalHeight += wrapped.length * lh
    }
  } else {
    // Single value
    const wrapped = wrapByWidth(row.value, font, BODY_SIZE, colMaxWidth)
    const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
    parts.push({ lines: wrapped, lh })
    totalHeight += wrapped.length * lh
  }

  return { parts, totalHeight }
}

// Draw labeled row from prepared data - EXACTEMENT comme pdf-garant-generator.ts
function drawLabeledRowFromPrepared(ctx: DocContext, row: Row, prepared: PreparedRow, xLabel: number, xValue: number) {
  const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
  
  // Draw label
  ctx.page.drawText(pdfSafe(row.label), { x: xLabel, y: ctx.y, size: LABEL_SIZE, font: ctx.fonts.bold, color: TEXT_INFO })
  
  // Draw value parts
  for (const part of prepared.parts) {
    for (const line of part.lines) {
      ctx.page.drawText(pdfSafe(line), { x: xValue, y: ctx.y, size: BODY_SIZE, font: fontValue, color: BLACK })
      ctx.y -= part.lh
    }
  }
}

// Draw locataires box - EXACTEMENT comme pdf-garant-generator.ts
async function drawLocatairesBox(ctx: DocContext, locataires: any[]) {
  if (!locataires || locataires.length === 0) return

  await ensureSpace(ctx, 40)
  ctx.y = drawSectionHeader(ctx.page, "Locataire(s)", MARGIN, ctx.y, ctx.fonts.bold)

  for (const loc of locataires) {
    const nom = [toTitleCase(loc.nom), toTitleCase(loc.prenom)].filter(Boolean).join(" ") || dash
    const line = `${nom}${loc.email ? ` – ${loc.email}` : ""}${loc.telephone ? ` – ${loc.telephone}` : ""}`
    const wrapped = wrapByWidth(line, ctx.fonts.reg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 16)
    const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
    for (const l of wrapped) {
      await ensureSpace(ctx, lh)
      ctx.page.drawText(pdfSafe(`• ${l}`), {
        x: MARGIN + 16,
        y: ctx.y,
        size: BODY_SIZE,
        font: ctx.fonts.reg,
        color: BLACK,
      })
      ctx.y -= lh
    }
  }
}

// Main function - EXACTEMENT comme pdf-garant-generator.ts
export async function generateRecherchePdf(data: AppFormData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Page 1 - EXACTEMENT comme pdf-garant-generator.ts
  const page1 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y1 = await drawHeader(page1, pdf, fontBold, fontReg)
  y1 -= 6 // Augmenté de 4 à 6

  const ctx1: DocContext = {
    pdf,
    page: page1,
    y: y1,
    fonts: { reg: fontReg, bold: fontBold },
  }

  // Locataires box
  await drawLocatairesBox(ctx1, data.locataires || [])

  // Sections communes sur la page 1 (après les locataires)
  await ensureSpace(ctx1, 24) // Augmenté de 20 à 24
  ctx1.page.drawLine({
    start: { x: MARGIN, y: ctx1.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx1.y },
    thickness: 1,
    color: SEP_GRAY,
  })
  ctx1.y -= 16 // Augmenté de 12 à 16

  // "CRITÈRES DU BIEN" section
  await ensureSpace(ctx1, 40) // Augmenté de 32 à 40 pour plus d'espace
  ctx1.y = drawSectionHeader(ctx1.page, "Critères du bien", MARGIN, ctx1.y, ctx1.fonts.bold)
  
  const totalWidth = PAGE_WIDTH - 2 * MARGIN
  const xLabel = MARGIN
  const xValue = MARGIN + LABEL_WIDTH + VALUE_INDENT
  const valueWidth = totalWidth - LABEL_WIDTH - VALUE_INDENT

  for (const row of getCriteriaRows(data.criteresRecherche)) {
    const prep = prepareRowParts(row, fontReg, valueWidth)
    await ensureSpace(ctx1, prep.totalHeight + 4) // Augmenté de 2 à 4 pour plus d'espace entre lignes
    drawLabeledRowFromPrepared(ctx1, row, prep, xLabel, xValue)
  }

  // "PROJET DE DÉMÉNAGEMENT" section
  await ensureSpace(ctx1, 40) // Augmenté de 32 à 40 pour plus d'espace
  ctx1.y = drawSectionHeader(ctx1.page, "Projet de déménagement", MARGIN, ctx1.y, ctx1.fonts.bold)
  
  for (const row of getDemenagementRows(data.criteresRecherche)) {
    const prep = prepareRowParts(row, fontReg, valueWidth)
    await ensureSpace(ctx1, prep.totalHeight + 4) // Augmenté de 2 à 4 pour plus d'espace entre lignes
    drawLabeledRowFromPrepared(ctx1, row, prep, xLabel, xValue)
  }

  // "INFORMATIONS COMPLÉMENTAIRES" section
  const long1 = showOrDash(data.criteresRecherche?.raisonDemenagement)
  const long2 = showOrDash(data.criteresRecherche?.informationsComplementaires)

  if (long1 !== dash || long2 !== dash) {
    await ensureSpace(ctx1, 32) // Augmenté de 28 à 32
    ctx1.y = drawSectionHeader(ctx1.page, "Informations complémentaires", MARGIN, ctx1.y, ctx1.fonts.bold)

    // Raison du déménagement
    if (long1 !== dash) {
      const wrapped = wrapByWidth(long1, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 16)
      const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      for (const l of wrapped) {
        await ensureSpace(ctx1, lh)
        ctx1.page.drawText(pdfSafe(`• Raison du déménagement : ${l}`), {
          x: MARGIN + 16,
          y: ctx1.y,
          size: BODY_SIZE,
          font: fontReg,
          color: BLACK,
        })
        ctx1.y -= lh
      }
    }

    // Informations complémentaires
    if (long2 !== dash) {
      const wrapped = wrapByWidth(long2, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 16)
      const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
      for (const l of wrapped) {
        await ensureSpace(ctx1, lh)
        ctx1.page.drawText(pdfSafe(`• ${l}`), {
          x: MARGIN + 16,
          y: ctx1.y,
          size: BODY_SIZE,
          font: fontReg,
          color: BLACK,
        })
        ctx1.y -= lh
      }
    }
  }

  // Footer sur la page 1
  drawFooter(ctx1.page, fontReg)

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

// Only include if there is at least one relevant field
export function hasRechercheData(data: AppFormData) {
  const c = data.criteresRecherche
  if (!c) return false
  return Boolean(
    (c.secteurSouhaite && c.secteurSouhaite.trim()) ||
      (c.nombreChambres && c.nombreChambres.trim()) ||
      (c.loyerMax && c.loyerMax.trim()) ||
      (c.rayonKm && c.rayonKm.trim()) ||
      (c.dateEmmenagement && c.dateEmmenagement.trim()) ||
      (c.preavisADeposer && c.preavisADeposer.trim()) ||
      (c.raisonDemenagement && c.raisonDemenagement.trim()) ||
      (c.informationsComplementaires && c.informationsComplementaires.trim()),
  )
}

export function buildRecherchePdfFilename(data: AppFormData): string {
  const firstLoc = data.locataires?.[0]
  const nom = firstLoc?.nom || "locataire"
  const prenom = firstLoc?.prenom || ""
  const base = [prenom, nom].filter(Boolean).join("-").toLowerCase()
  return `criteres-recherche-${base}.pdf`
}

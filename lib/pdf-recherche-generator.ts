import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { AppFormData } from "./types"

// Brand palette and text styles aligned with the main fiche
const PRIMARY = rgb(0 / 255, 114 / 255, 188 / 255) // #0072BC
const TEXT_INFO = rgb(110 / 255, 110 / 255, 110 / 255) // #6E6E6E
const BLACK = rgb(0, 0, 0)
const SEP_GRAY = rgb(218 / 255, 218 / 255, 218 / 255) // #DADADA

// Page layout (A4, pt)
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48

// Typography
const TITLE_SIZE = 18
const SECTION_SIZE = 13
const BODY_SIZE = 11
const LABEL_SIZE = 10

// Line heights
const LH_BODY = 14 // ~1.27 for BODY_SIZE
const LH_TIGHT = 12

// Spacing
const LOGO_MAX_H = 36
const GAP_BELOW_LOGO = 14 // avoid overlap with title
const GAP_BELOW_TITLE = 10
const GAP_ABOVE_SECTION = 16
const GAP_AFTER_SECTION_TITLE = 12
const BLOCK_GAP = 16
const VALUE_INDENT = 6
const COL_GAP = 24

// Box layout
const BOX_PADDING = 12
const BOX_TITLE_GAP = 10
const LABEL_WIDTH_BOX = 84 // labels inside LOCATAIRE(S)
const LABEL_WIDTH_MAIN = 180 // labels inside criteria lines

// Symbols and helpers
const dash = "–"
const nonEmpty = (v?: string | null) => Boolean(v && String(v).trim() !== "")
const showOrDash = (v?: string | null) => (nonEmpty(v) ? String(v) : dash)

function pdfSafe(input?: string) {
  if (!input) return ""
  return input
    .normalize("NFKC")
    .replace(/[\u202F\u00A0\u2009\u2007\u2060]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
}

// Wrap text to a max width; also split very long words to prevent overflow
function wrapByWidth(text: string, font: any, size: number, maxWidth: number): string[] {
  const t = pdfSafe(text)
  if (!t) return [dash]
  const rawWords = t.split(/\s+/).filter(Boolean)

  // Split any "oversized" single words by characters
  const words: string[] = []
  for (const w of rawWords) {
    if (font.widthOfTextAtSize(w, size) <= maxWidth) {
      words.push(w)
      continue
    }
    // Split by characters while keeping width under maxWidth
    let chunk = ""
    for (const ch of Array.from(w)) {
      const candidate = chunk + ch
      if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
        if (chunk.length > 0) {
          words.push(chunk)
          chunk = ch
        } else {
          // Single glyph wider than line (very rare); force push
          words.push(ch)
          chunk = ""
        }
      } else {
        chunk = candidate
      }
    }
    if (chunk) words.push(chunk)
  }

  const lines: string[] = []
  let current = ""
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [dash]
}

function drawCenteredText(page: any, text: string, y: number, font: any, size: number, color: RGB) {
  const w = font.widthOfTextAtSize(text, size)
  const x = (PAGE_WIDTH - w) / 2
  page.drawText(text, { x, y, size, font, color })
  return y
}

async function embedLogo(pdf: PDFDocument) {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo-alv.png")
    const bytes = await readFile(logoPath)
    return await pdf.embedPng(bytes)
  } catch {
    return null
  }
}

function drawFooter(page: any, fontReg: any) {
  const text = pdfSafe("Document strictement confidentiel – destiné à un usage locatif.")
  const size = 10 // BODY_SIZE - 1 (smaller)
  const w = fontReg.widthOfTextAtSize(text, size)
  const x = (PAGE_WIDTH - w) / 2
  const y = MARGIN - 22
  page.drawText(text, { x, y, size, font: fontReg, color: TEXT_INFO })
}

async function drawHeader(page: any, pdf: PDFDocument, fontBold: any) {
  const yTop = PAGE_HEIGHT - MARGIN
  let y = yTop

  // Logo centered, max height
  const logo = await embedLogo(pdf)
  if (logo) {
    const ratio = Math.min(1, LOGO_MAX_H / logo.height)
    const h = logo.height * ratio
    const w = logo.width * ratio
    const x = (PAGE_WIDTH - w) / 2
    page.drawImage(logo, { x, y: yTop - h, width: w, height: h })
    y = yTop - h - GAP_BELOW_LOGO
  } else {
    y = yTop - 14
  }

  // Title in brand color
  drawCenteredText(page, pdfSafe("CRITÈRES DE RECHERCHE"), y - 2, fontBold, TITLE_SIZE, PRIMARY)
  y -= TITLE_SIZE + GAP_BELOW_TITLE
  return y
}

function drawSectionHeader(page: any, title: string, x: number, y: number, fontBold: any) {
  y -= GAP_ABOVE_SECTION
  const textY = y
  page.drawText(pdfSafe(title.toUpperCase()), { x, y: textY, size: SECTION_SIZE, font: fontBold, color: PRIMARY })
  const lineY = textY - 10
  page.drawLine({
    start: { x, y: lineY },
    end: { x: page.getWidth() - x, y: lineY },
    thickness: 1,
    color: SEP_GRAY,
  })
  return lineY - GAP_AFTER_SECTION_TITLE
}

// If not enough space, create a new page; re-draw footer and return new page and y
async function ensureSpaceOrNewPage(
  pdf: PDFDocument,
  page: any,
  y: number,
  needed: number,
  fonts: { reg: any; bold: any },
  roptions?: { onNewPage?: (np: any) => Promise<number> | number },
) {
  if (y - needed < MARGIN + 40) {
    const next = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    drawFooter(next, fonts.reg)
    // redraw header on new page
    let ny = await drawHeader(next, pdf, fonts.bold)
    if (roptions?.onNewPage) {
      const maybe = await roptions.onNewPage(next)
      if (typeof maybe === "number") ny = maybe
    }
    return { page: next, y: ny }
  }
  return { page, y }
}

// Inline "Label : value" with wrapping on value only
function drawInlineRow(
  page: any,
  x: number,
  y: number,
  label: string,
  value: string,
  fonts: { reg: any; bold: any },
  colWidth: number,
  labelWidth: number,
) {
  const labelText = `${label} :`
  page.drawText(pdfSafe(labelText), { x, y, size: LABEL_SIZE, font: fonts.bold, color: TEXT_INFO })

  const valueX = x + labelWidth + VALUE_INDENT
  const maxWidth = colWidth - labelWidth - VALUE_INDENT
  const wrapped = wrapByWidth(value || dash, fonts.reg, BODY_SIZE, maxWidth)

  // First line baseline
  page.drawText(pdfSafe(wrapped[0]), { x: valueX, y, size: BODY_SIZE, font: fonts.reg, color: BLACK })
  let yy = y

  for (let i = 1; i < wrapped.length; i++) {
    yy -= LH_BODY
    page.drawText(pdfSafe(wrapped[i]!), { x: valueX, y: yy, size: BODY_SIZE, font: fonts.reg, color: BLACK })
  }
  yy -= 6
  return yy
}

// Draw long text field that may span multiple pages; when breaking, repeat the section header
async function drawLongTextField({
  pdf,
  page,
  y,
  label,
  value,
  fonts,
  x,
  colWidth,
  labelWidth,
  sectionTitleForContinuation,
}: {
  pdf: PDFDocument
  page: any
  y: number
  label: string
  value: string
  fonts: { reg: any; bold: any }
  x: number
  colWidth: number
  labelWidth: number
  sectionTitleForContinuation: string
}) {
  const labelText = `${label} :`
  const labelWidthPixels = fonts.bold.widthOfTextAtSize(labelText, LABEL_SIZE)
  const valueX = x + labelWidth + VALUE_INDENT
  const maxWidth = colWidth - labelWidth - VALUE_INDENT
  const wrapped = wrapByWidth(value || dash, fonts.reg, BODY_SIZE, maxWidth)

  let currentPage = page
  let yy = y

  // First line with label
  if (yy - (LH_TIGHT + 6) < MARGIN + 40) {
    const ensured = await ensureSpaceOrNewPage(pdf, currentPage, yy, LH_TIGHT + 6, fonts, {
      onNewPage: async (np) =>
        drawSectionHeader(np, sectionTitleForContinuation, MARGIN, PAGE_HEIGHT - MARGIN, fonts.bold),
    })
    currentPage = ensured.page
    yy = ensured.y
  }

  currentPage.drawText(pdfSafe(labelText), { x, y: yy, size: LABEL_SIZE, font: fonts.bold, color: TEXT_INFO })
  currentPage.drawText(pdfSafe(wrapped[0]), {
    x: valueX,
    y: yy,
    size: BODY_SIZE,
    font: fonts.reg,
    color: BLACK,
  })

  // Remaining lines with pagination; soft-limit to ~4 lines per page if plenty of space to improve readability
  let lineOnThisPage = 1
  for (let i = 1; i < wrapped.length; i++) {
    if (yy - LH_BODY < MARGIN + 40 || lineOnThisPage >= 4) {
      const ensured = await ensureSpaceOrNewPage(pdf, currentPage, yy, LH_BODY, fonts, {
        onNewPage: async (np) =>
          drawSectionHeader(np, sectionTitleForContinuation, MARGIN, PAGE_HEIGHT - MARGIN, fonts.bold),
      })
      currentPage = ensured.page
      yy = ensured.y
      lineOnThisPage = 0
      // Re-print an empty label spacer for alignment on continuation
      // optional visual spacer at the start of continuation
    }
    yy -= LH_BODY
    currentPage.drawText(pdfSafe(wrapped[i]!), { x: valueX, y: yy, size: BODY_SIZE, font: fonts.reg, color: BLACK })
    lineOnThisPage++
  }

  yy -= 6
  return { page: currentPage, y: yy, labelWidthPixels }
}

// LOCATAIRE(S) box utilities
type SimpleLoc = {
  civilite?: string | null
  nom?: string | null
  prenom?: string | null
  telephone?: string | null
  email?: string | null
}

function measureLocataireColumnHeight(l: SimpleLoc, fonts: { reg: any; bold: any }, innerWidth: number): number {
  const rows: [string, string][] = [
    ["Civilité", showOrDash(l.civilite)],
    ["Nom", showOrDash(l.nom)],
    ["Prénom", showOrDash(l.prenom)],
    ["Téléphone", showOrDash(l.telephone)],
    ["Email", showOrDash(l.email)],
  ]
  let height = 0
  for (const [, value] of rows) {
    const maxWidth = innerWidth - LABEL_WIDTH_BOX - VALUE_INDENT
    const wrapped = wrapByWidth(value, fonts.reg, BODY_SIZE, maxWidth)
    height += LH_TIGHT + (wrapped.length - 1) * LH_BODY + 6
  }
  return height
}

function drawLocataireColumn(
  page: any,
  l: SimpleLoc,
  x: number,
  y: number,
  fonts: { reg: any; bold: any },
  innerWidth: number,
) {
  const rows: [string, string][] = [
    ["Civilité", showOrDash(l.civilite)],
    ["Nom", showOrDash(l.nom)],
    ["Prénom", showOrDash(l.prenom)],
    ["Téléphone", showOrDash(l.telephone)],
    ["Email", showOrDash(l.email)],
  ]
  let yy = y
  for (const [label, value] of rows) {
    const labelText = `${label} :`
    page.drawText(pdfSafe(labelText), { x, y: yy, size: LABEL_SIZE, font: fonts.bold, color: TEXT_INFO })
    const valueX = x + LABEL_WIDTH_BOX + VALUE_INDENT
    const maxWidth = innerWidth - LABEL_WIDTH_BOX - VALUE_INDENT
    const wrapped = wrapByWidth(value, fonts.reg, BODY_SIZE, maxWidth)
    page.drawText(pdfSafe(wrapped[0]), { x: valueX, y: yy, size: BODY_SIZE, font: fonts.reg, color: BLACK })
    for (let i = 1; i < wrapped.length; i++) {
      yy -= LH_BODY
      page.drawText(pdfSafe(wrapped[i]!), { x: valueX, y: yy, size: BODY_SIZE, font: fonts.reg, color: BLACK })
    }
    yy -= 6 + LH_TIGHT
  }
  return yy
}

async function drawLocatairesBox(
  pdf: PDFDocument,
  page: any,
  y: number,
  fonts: { reg: any; bold: any },
  locataires: SimpleLoc[],
) {
  if (!locataires || locataires.length === 0) return { page, y }

  const contentX = MARGIN
  const contentWidth = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (contentWidth - COL_GAP) / 2
  const innerWidth = colWidth - BOX_PADDING * 2

  let currentPage = page
  let i = 0
  while (i < locataires.length) {
    const left = locataires[i]!
    const right = locataires[i + 1] || undefined

    const leftHeight = measureLocataireColumnHeight(left, fonts, innerWidth)
    const rightHeight = right ? measureLocataireColumnHeight(right, fonts, innerWidth) : 0
    const bodyHeight = Math.max(leftHeight, rightHeight)
    const titleHeight = SECTION_SIZE + 4
    const boxHeight = BOX_PADDING + titleHeight + BOX_TITLE_GAP + bodyHeight + BOX_PADDING

    const ensured = await ensureSpaceOrNewPage(pdf, currentPage, y, boxHeight, fonts)
    if (ensured.page !== currentPage) {
      currentPage = ensured.page
    }
    y = ensured.y

    // Draw box frame
    const boxYTop = y
    currentPage.drawRectangle({
      x: contentX,
      y: boxYTop - boxHeight,
      width: contentWidth,
      height: boxHeight,
      borderColor: SEP_GRAY,
      borderWidth: 1,
    })

    // Title
    currentPage.drawText(pdfSafe("LOCATAIRE(S)"), {
      x: contentX + BOX_PADDING,
      y: boxYTop - BOX_PADDING - SECTION_SIZE,
      size: SECTION_SIZE,
      font: fonts.bold,
      color: PRIMARY,
    })

    // Columns baseline
    const contentTopY = boxYTop - BOX_PADDING - SECTION_SIZE - BOX_TITLE_GAP

    // Left col
    const leftX = contentX + BOX_PADDING
    drawLocataireColumn(currentPage, left, leftX, contentTopY, fonts, innerWidth)

    // Right col
    if (right) {
      const rightX = contentX + colWidth + COL_GAP + BOX_PADDING
      drawLocataireColumn(currentPage, right, rightX, contentTopY, fonts, innerWidth)
    }

    // Move y for next row
    y = contentTopY - bodyHeight - BOX_PADDING - 10
    i += 2
  }

  return { page: currentPage, y }
}

// Format "Ville (CP)" when possible
function formatSecteur(raw?: string | null): string {
  if (!nonEmpty(raw)) return dash
  const s = String(raw).trim()
  // 75001 Paris -> Paris (75001)
  let m = s.match(/^(\d{5})\s+(.+)$/)
  if (m) return `${m[2]} (${m[1]})`
  // Paris 75001 -> Paris (75001)
  m = s.match(/^(.+?)\s+(\d{5})$/)
  if (m) return `${m[1]} (${m[2]})`
  // Paris (75001) -> keep
  m = s.match(/^(.+)\s*$$\s*(\d{5})\s*$$$/)
  if (m) return `${m[1]} (${m[2]})`
  return s
}

// Build rows for the compact "CRITÈRES" section
function getCompactCriteriaRows(c?: AppFormData["criteresRecherche"]) {
  return [
    ["Secteur souhaité", formatSecteur(c?.secteurSouhaite)],
    ["Nombre de chambres minimum", showOrDash(c?.nombreChambres)],
    ["Rayon de recherche (km)", showOrDash(c?.rayonKm)],
    ["Date souhaitée d’emménagement", showOrDash(c?.dateEmmenagement)],
    ["Préavis à déposer", showOrDash(c?.preavisADeposer)],
  ] as [label: string, value: string][]
}

// Public API
export function buildRecherchePdfFilename(data: AppFormData) {
  const l = data.locataires?.[0]
  const tag = l ? `${(l.nom || "Nom").replace(/\s+/g, "_")}_${(l.prenom || "Prenom").replace(/\s+/g, "_")}` : "dossier"
  return `CR-Criteres_de_recherche-${tag}.pdf`
}

export async function generateRecherchePdf(data: AppFormData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  drawFooter(page, fontReg)

  const fonts = { reg: fontReg, bold: fontBold }
  let y = await drawHeader(page, pdf, fontBold)

  // LOCATAIRE(S) box
  const locs: SimpleLoc[] = (data.locataires || []).map((l) => ({
    civilite: l?.civilite,
    nom: l?.nom,
    prenom: l?.prenom,
    telephone: l?.telephone,
    email: l?.email,
  }))
  const box = await drawLocatairesBox(pdf, page, y, fonts, locs)
  page = box.page
  y = box.y - BLOCK_GAP

  // "CRITÈRES" section (compact rows)
  y = drawSectionHeader(page, "Critères", MARGIN, y, fontBold)
  const totalWidth = PAGE_WIDTH - 2 * MARGIN
  const colWidth = totalWidth
  const x = MARGIN

  for (const [label, value] of getCompactCriteriaRows(data.criteresRecherche)) {
    const maxW = colWidth - LABEL_WIDTH_MAIN - VALUE_INDENT
    const wrapped = wrapByWidth(value, fontReg, BODY_SIZE, maxW)
    const needed = LH_TIGHT + (wrapped.length - 1) * LH_BODY + 6
    const ensured = await ensureSpaceOrNewPage(pdf, page, y, needed, fonts, {
      onNewPage: async (np) => drawSectionHeader(np, "Critères", MARGIN, PAGE_HEIGHT - MARGIN, fontBold),
    })
    page = ensured.page
    y = ensured.y
    y = drawInlineRow(page, x, y, label, value, fonts, colWidth, LABEL_WIDTH_MAIN)
  }

  // "INFORMATIONS COMPLÉMENTAIRES" section for long texts
  const long1 = showOrDash(data.criteresRecherche?.raisonDemenagement)
  const long2 = showOrDash(data.criteresRecherche?.informationsComplementaires)

  y = drawSectionHeader(page, "Informations complémentaires", MARGIN, y, fontBold)

  // Raison du déménagement
  {
    const maxW = colWidth - LABEL_WIDTH_MAIN - VALUE_INDENT
    const wrapped = wrapByWidth(long1, fontReg, BODY_SIZE, maxW)
    const approxNeeded = LH_TIGHT + Math.min(wrapped.length - 1, 4) * LH_BODY + 6
    const ensured = await ensureSpaceOrNewPage(pdf, page, y, approxNeeded, fonts, {
      onNewPage: async (np) =>
        drawSectionHeader(np, "Informations complémentaires", MARGIN, PAGE_HEIGHT - MARGIN, fontBold),
    })
    page = ensured.page
    y = ensured.y
    const res = await drawLongTextField({
      pdf,
      page,
      y,
      label: "Raison du déménagement",
      value: long1,
      fonts,
      x,
      colWidth,
      labelWidth: LABEL_WIDTH_MAIN,
      sectionTitleForContinuation: "Informations complémentaires",
    })
    page = res.page
    y = res.y
  }

  // Informations complémentaires
  {
    const maxW = colWidth - LABEL_WIDTH_MAIN - VALUE_INDENT
    const wrapped = wrapByWidth(long2, fontReg, BODY_SIZE, maxW)
    const approxNeeded = LH_TIGHT + Math.min(wrapped.length - 1, 4) * LH_BODY + 6
    const ensured = await ensureSpaceOrNewPage(pdf, page, y, approxNeeded, fonts, {
      onNewPage: async (np) =>
        drawSectionHeader(np, "Informations complémentaires", MARGIN, PAGE_HEIGHT - MARGIN, fontBold),
    })
    page = ensured.page
    y = ensured.y
    const res = await drawLongTextField({
      pdf,
      page,
      y,
      label: "Informations complémentaires",
      value: long2,
      fonts,
      x,
      colWidth,
      labelWidth: LABEL_WIDTH_MAIN,
      sectionTitleForContinuation: "Informations complémentaires",
    })
    page = res.page
    y = res.y
  }

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
      (c.rayonKm && c.rayonKm.trim()) ||
      (c.dateEmmenagement && c.dateEmmenagement.trim()) ||
      (c.preavisADeposer && c.preavisADeposer.trim()) ||
      (c.raisonDemenagement && c.raisonDemenagement.trim()) ||
      (c.informationsComplementaires && c.informationsComplementaires.trim()),
  )
}

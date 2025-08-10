import { PDFDocument, StandardFonts, rgb, type RGB, type PDFPage } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { AppFormData, Locataire, RevenuAdditionnel } from "./types"

// Brand and style
const PRIMARY = rgb(0 / 255, 114 / 255, 188 / 255) // #0072BC (brand blue)
const TEXT_INFO = rgb(110 / 255, 110 / 255, 110 / 255) // #6E6E6E (secondary text)
const BLACK = rgb(0, 0, 0)
const SEP_GRAY = rgb(218 / 255, 218 / 255, 218 / 255) // #DADADA separator

// Page and layout (A4)
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const GUTTER = 28
const LABEL_WIDTH = 138
const VALUE_INDENT = 6
const TITLE_SIZE = 18 // Document main title
const SECTION_SIZE = 13 // Section titles (13–14 pt range)
const LABEL_SIZE = 10
const BODY_SIZE = 11
const LINE_HEIGHT = 12 // ~11pt body -> ~12pt line height
const LONG_LINE_HEIGHT = Math.round(BODY_SIZE * 1.35) // ≈ 15 for readability on long wraps
const BOTTOM_RESERVE = 72 // safe area above footer

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
  if (v.startsWith("m.") || v === "m" || v.startsWith("mr")) return "M."
  if (v.startsWith("mme") || v.includes("madame") || v.startsWith("mlle") || v.startsWith("mademoiselle")) return "Mme"
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

// Data rows
type Row = { label: string; value: string | string[]; highlight?: boolean }

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
    { label: "Adresse (ligne 1)", value: pdfSafe(addr1) },
    { label: "Adresse (ligne 2)", value: pdfSafe(addr2) },
    { label: "Email", value: pdfSafe(showOrDash(l?.email)) },
    { label: "Téléphone", value: pdfSafe(showOrDash(l?.telephone)) },
    { label: "Situation conjugale", value: pdfSafe(showOrDash(l?.situationConjugale)) },
  ]
}

function revenusAdditionnelsLines(list?: RevenuAdditionnel[]) {
  if (!list || list.length === 0) return [dash]
  const items = list
    .filter((r) => nonEmpty(r.type) || nonEmpty(r.montant) || nonEmpty(r.precision))
    .map((r) => {
      const label = r.type === "Autre" ? r.precision || "Autre" : r.type || "Revenu complémentaire"
      const montant = euro(r.montant)
      const name = pdfSafe(label)
      if (!nonEmpty(name) && montant === dash) return ""
      return `${name}${montant !== dash ? ` : ${montant}/mois` : ""}`
    })
    .filter(Boolean)
  return items.length ? items : [dash]
}

function proRows(l?: Locataire): Row[] {
  const [empAddr1, empAddr2] = splitAddressLines(l?.employeurAdresse)
  const empAddrValue = [pdfSafe(empAddr1), pdfSafe(empAddr2)]
  return [
    { label: "Type de contrat / statut", value: pdfSafe(contractOrStatus(l)) },
    { label: "Profession", value: pdfSafe(showOrDash(l?.profession)) },
    { label: "Employeur (nom)", value: pdfSafe(showOrDash(l?.employeurNom)) },
    { label: "Employeur (adresse)", value: empAddrValue },
    { label: "Employeur (téléphone)", value: pdfSafe(showOrDash(l?.employeurTelephone)) },
    { label: "Date d'embauche", value: pdfSafe(showOrDash(l?.dateEmbauche)) },
    { label: "Date de fin de contrat", value: pdfSafe(showOrDash(l?.dateFinContrat)) },
    { label: "Salaire net mensuel (€)", value: euro(l?.salaire), highlight: true },
    { label: "Revenus complémentaires", value: revenusAdditionnelsLines(l?.revenusAdditionnels) },
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

// Section header with extra top spacing and 1px separator in #DADADA
function drawSectionHeader(page: any, title: string, x: number, y: number, fontBold: any) {
  // Add 16px margin above titles (within 14–18 range)
  y -= 16
  const header = pdfSafe(title.toUpperCase())
  page.drawText(header, { x, y, size: SECTION_SIZE, font: fontBold, color: PRIMARY })
  const yy = y - 12
  page.drawLine({
    start: { x, y: yy },
    end: { x: page.getWidth() - x, y: yy },
    thickness: 1,
    color: SEP_GRAY,
  })
  return yy - 12 // uniform gap below header
}

// Inline section header with "label: value" on same line
function drawSectionHeaderWithInlineValue(
  page: any,
  title: string,
  inlineLabel: string,
  inlineValue: string,
  x: number,
  y: number,
  fonts: { reg: any; bold: any },
) {
  // Extra spacing above (16px)
  y -= 16
  const header = pdfSafe(title.toUpperCase())
  page.drawText(header, { x, y, size: SECTION_SIZE, font: fonts.bold, color: PRIMARY })

  // Measure header to place inline label/value
  const headerWidth = fonts.bold.widthOfTextAtSize(header, SECTION_SIZE)
  const gap = 12
  const xInline = x + headerWidth + gap

  // Inline "Nombre d’enfants à charge : N"
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
  const yy = y - 12
  page.drawLine({
    start: { x, y: yy },
    end: { x: page.getWidth() - x, y: yy },
    thickness: 1,
    color: SEP_GRAY,
  })
  return yy - 12
}

// Header on each page: centered logo, centered uppercase title, centered info text
async function drawHeader(page: any, pdf: PDFDocument, fontBold: any, fontReg: any) {
  const yTop = PAGE_HEIGHT - MARGIN

  // Logo (centered, max-height 36px, margin-bottom 14px)
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
    const logoHeight = 36 // within 32–36px
    const ratio = logoHeight / logoImage.height
    const logoWidth = logoImage.width * ratio
    const x = (PAGE_WIDTH - logoWidth) / 2
    page.drawImage(logoImage, { x, y: yTop - logoHeight, width: logoWidth, height: logoHeight })
    y = yTop - logoHeight - 14 // space below logo
  } else {
    y = yTop - 14
  }

  // Title (centered, uppercase, brand blue, margin-top 10px relative to logo block)
  y -= 10
  drawCenteredText(page, pdfSafe("FICHE DE RENSEIGNEMENT LOCATAIRES"), y, fontBold, TITLE_SIZE, PRIMARY)
  y -= TITLE_SIZE

  // Small centered grey paragraph (BODY_SIZE - 1 pt), line-height ~1.3, max-width ~85%, margin-top 7px
  y -= 7
  const intro =
    "Document strictement confidentiel – destiné à un usage locatif. " +
    "Ce document synthétise les informations personnelles, professionnelles et financières communiquées via notre formulaire en ligne. " +
    "Il permet d’étudier le profil du ou des candidats locataires en amont de l’organisation d’une visite."
  const maxWidth = PAGE_WIDTH * 0.85
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
    y -= Math.round((BODY_SIZE - 1) * 1.3)
  }

  return y - 8
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
  const values = Array.isArray(row.value) ? (row.value.length ? row.value : [dash]) : [row.value || dash]
  const parts: PreparedPart[] = values.map((part) => {
    const lines = wrapByWidth(part, font, BODY_SIZE, maxWidth)
    const lh = lines.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
    return { lines, lh }
  })
  const totalHeight = parts.reduce((acc, p) => acc + p.lines.length * p.lh, 0)
  return { parts, totalHeight }
}

function drawLabeledRowFromPrepared(ctx: DocContext, row: Row, prepared: PreparedRow, xLabel: number, xValue: number) {
  const valueFont = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
  // label at starting y
  ctx.page.drawText(pdfSafe(row.label), { x: xLabel, y: ctx.y, size: LABEL_SIZE, font: ctx.fonts.bold, color: BLACK })
  // draw all lines
  let yy = ctx.y
  for (const part of prepared.parts) {
    for (const line of part.lines) {
      ctx.page.drawText(pdfSafe(line), { x: xValue, y: yy, size: BODY_SIZE, font: valueFont, color: BLACK })
      yy -= part.lh
    }
  }
  // update ctx.y to the min end
  ctx.y = Math.min(yy, ctx.y - LINE_HEIGHT) - 2
}

// Column headings helper
function drawColumnHeadingsInline(ctx: DocContext, xLeft: number, xRight?: number) {
  ctx.page.drawText(pdfSafe("Locataire 1"), { x: xLeft, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY })
  if (typeof xRight === "number") {
    ctx.page.drawText(pdfSafe("Locataire 2"), { x: xRight, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY })
  }
  ctx.y -= 16
}

// Two columns, aligned, with pagination
async function drawTwoColumnsAlignedWithBreaks(ctx: DocContext, left?: Locataire, right?: Locataire) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xLeft = MARGIN
  const xRight = MARGIN + colWidth + GUTTER

  // Column headings
  await ensureSpace(ctx, 20)
  drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined)

  // Identité
  await ensureSpace(ctx, 32)
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
    const pairHeight = Math.max(prepL.totalHeight, prepR.totalHeight) + 2

    // If not enough space, break page and redraw column headings
    ctx.drawColumnHeadingsNext = () => drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined)
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
  await ensureSpace(ctx, 32)
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
    const pairHeight = Math.max(prepL.totalHeight, prepR.totalHeight) + 2

    ctx.drawColumnHeadingsNext = () => drawColumnHeadingsInline(ctx, xLeft, right ? xRight : undefined)
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

// Single, centered column (for 1 tenant), with pagination
async function drawSingleCenteredColumnWithBreaks(ctx: DocContext, l?: Locataire) {
  const total = PAGE_WIDTH - 2 * MARGIN
  const colWidth = (total - GUTTER) / 2
  const xCenter = MARGIN + (total - colWidth) / 2

  // Heading
  await ensureSpace(ctx, 20)
  ctx.page.drawText(pdfSafe("Locataire 1"), { x: xCenter, y: ctx.y, size: 12, font: ctx.fonts.bold, color: PRIMARY })
  ctx.y -= 16

  // Identité
  await ensureSpace(ctx, 32)
  ctx.y = drawSectionHeader(ctx.page, "Identité", xCenter, ctx.y, ctx.fonts.bold)
  const xLabel = xCenter
  const xValue = xCenter + LABEL_WIDTH + VALUE_INDENT

  for (const row of identityRows(l)) {
    const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const prep = prepareRowParts(row, fontValue, colWidth)
    await ensureSpace(ctx, prep.totalHeight + 2)
    drawLabeledRowFromPrepared(ctx, row, prep, xLabel, xValue)
  }

  // Situation professionnelle
  await ensureSpace(ctx, 32)
  ctx.y = drawSectionHeader(ctx.page, "Situation professionnelle", xCenter, ctx.y, ctx.fonts.bold)
  for (const row of proRows(l)) {
    const fontValue = row.highlight ? ctx.fonts.bold : ctx.fonts.reg
    const prep = prepareRowParts(row, fontValue, colWidth)
    await ensureSpace(ctx, prep.totalHeight + 2)
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

// Main generator
export async function generatePdf(data: AppFormData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const locs = data.locataires || []
  // Build pairs: [1,2] page 1, [3,4] page 2 ... (we will still paginate within each page as needed)
  const pairs: Array<[Locataire | undefined, Locataire | undefined]> = []
  if (locs.length <= 1) {
    pairs.push([locs[0], undefined])
  } else {
    for (let i = 0; i < locs.length; i += 2) {
      pairs.push([locs[i], locs[i + 1]])
    }
  }

  // Start first page
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = await drawHeader(page, pdf, fontBold, fontReg)
  y -= 6

  const ctx: DocContext = {
    pdf,
    page,
    y,
    fonts: { reg: fontReg, bold: fontBold },
  }

  for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
    const [left, right] = pairs[pairIndex]

    if (right === undefined && left) {
      await drawSingleCenteredColumnWithBreaks(ctx, left)
    } else {
      await drawTwoColumnsAlignedWithBreaks(ctx, left, right)
    }

    // After tenant columns on this (logical) page, add cross-dossier sections
    // Separator before dossier-wide sections
    await ensureSpace(ctx, 22)
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y },
      end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
      thickness: 1,
      color: SEP_GRAY,
    })
    ctx.y -= 14

    // Enfants à charge (inline with title)
    const enfants = (data.nombreEnfantsFoyer ?? 0).toString()
    await ensureSpace(ctx, 30)
    ctx.y = drawSectionHeaderWithInlineValue(
      ctx.page,
      "Composition du foyer",
      "Nombre d'enfants à charge",
      enfants,
      MARGIN,
      ctx.y,
      ctx.fonts,
    )

    // Garanties
    await ensureSpace(ctx, 32)
    ctx.y = drawSectionHeader(ctx.page, "Garanties", MARGIN, ctx.y, fontBold)
    const g = data.garanties
    if (g) {
      // "Garant familial : Oui/Non"
      {
        const txt = pdfSafe(`Garant familial : ${nonEmpty(g.garantFamilial) ? g.garantFamilial : dash}`)
        const wrapped = wrapByWidth(txt, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
        for (const line of wrapped) {
          await ensureSpace(ctx, LINE_HEIGHT)
          ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
          ctx.y -= LINE_HEIGHT
        }
      }

      // Précision (long text allowed)
      {
        const txt = nonEmpty(g.precisionGarant) ? `Précision : ${g.precisionGarant}` : "Précision : -"
        const wrapped = wrapByWidth(pdfSafe(txt), fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 12)
        const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
        for (const line of wrapped) {
          await ensureSpace(ctx, lh)
          ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
          ctx.y -= lh
        }
      }

      // Garantie Visale Oui/Non
      {
        const txt = pdfSafe(`Garantie Visale : ${nonEmpty(g.garantieVisale) ? g.garantieVisale : dash}`)
        const wrapped = wrapByWidth(txt, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
        for (const line of wrapped) {
          await ensureSpace(ctx, LINE_HEIGHT)
          ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
          ctx.y -= LINE_HEIGHT
        }
      }

      // Liste des garants en puces
      if (Array.isArray(g.garants) && g.garants.length) {
        await ensureSpace(ctx, LINE_HEIGHT)
        ctx.page.drawText(pdfSafe("Garants familiaux déclarés :"), {
          x: MARGIN,
          y: ctx.y,
          size: BODY_SIZE,
          font: fontBold,
          color: BLACK,
        })
        ctx.y -= LINE_HEIGHT
        for (const ga of g.garants) {
          const name = [toTitleCase(ga.nom), toTitleCase(ga.prenom)].filter(Boolean).join(" ") || dash
          const line = `${name}${ga.email ? ` – ${ga.email}` : ""}${ga.telephone ? ` – ${ga.telephone}` : ""}`
          const wrapped = wrapByWidth(line, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN - 12)
          const lh = wrapped.length >= 3 ? LONG_LINE_HEIGHT : LINE_HEIGHT
          for (const l of wrapped) {
            await ensureSpace(ctx, lh)
            ctx.page.drawText(pdfSafe(`• ${l}`), {
              x: MARGIN + 12,
              y: ctx.y,
              size: BODY_SIZE,
              font: fontReg,
              color: BLACK,
            })
            ctx.y -= lh
          }
        }
        ctx.y -= 2
      }
    } else {
      await ensureSpace(ctx, LINE_HEIGHT * 3)
      ctx.page.drawText("Garant familial : -", { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
      ctx.y -= LINE_HEIGHT
      ctx.page.drawText("Précision : -", { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
      ctx.y -= LINE_HEIGHT
      ctx.page.drawText("Garantie Visale : -", { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: BLACK })
      ctx.y -= LINE_HEIGHT
    }

    // Gagnez du temps avec DossierFacile…
    await ensureSpace(ctx, 32)
    ctx.y = drawSectionHeader(ctx.page, "Gagnez du temps avec DossierFacile…", MARGIN, ctx.y, fontBold)
    const df = pdfSafe((data.dossierFacileLink || "").trim())
    const dfText = df || "Rien"
    const dfWrapped = wrapByWidth(dfText, fontReg, BODY_SIZE, PAGE_WIDTH - 2 * MARGIN)
    for (const l of dfWrapped) {
      await ensureSpace(ctx, LINE_HEIGHT)
      ctx.page.drawText(l, { x: MARGIN, y: ctx.y, size: BODY_SIZE, font: fontReg, color: df ? BLACK : TEXT_INFO })
      ctx.y -= LINE_HEIGHT
    }

    // Draw footer and, if another pair follows, start a fresh page with header for next pair (to keep pairs page-separated)
    drawFooter(ctx.page, fontReg)
    if (pairIndex < pairs.length - 1) {
      ctx.page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      ctx.y = (await drawHeader(ctx.page, pdf, fontBold, fontReg)) - 6
    }
  }

  // Ensure footer on last page (if not already recently drawn)
  // In the loop we drew footer at each pair end, so nothing else is needed here.

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

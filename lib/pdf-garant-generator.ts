import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { GarantFormData } from "./types"

// Brand colors (align with locataire PDF)
const BRAND_BLUE = hexToRgb("#0072BC") // titles, separators
const TEXT_GRAY = hexToRgb("#555555") // intro or secondary

type RGB = { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB {
  const m = hex.replace("#", "")
  const n = Number.parseInt(
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m,
    16,
  )
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }
}

// Normalize text for WinAnsi (Helvetica) and collapse whitespace
function pdfSafe(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/\u202F|\u00A0|\u2009|\u200A|\u200B/g, " ") // narrow nbsp, nbsp, thin/ hair / zero-width space
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-") // en/em dash to hyphen
    .trim()
}

function shortCivilite(v?: string | null) {
  const s = pdfSafe(v).toLowerCase()
  if (!s) return ""
  if (s.startsWith("mme") || s.startsWith("madame")) return "Mme"
  return "M."
}

function titleCase(input?: string | null) {
  const s = pdfSafe(input).toLowerCase()
  if (!s) return ""
  return s
    .split(/([-\s])/)
    .map((p) => (p.match(/[-\s]/) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("")
}

function nonEmpty(v?: string | null) {
  return !!pdfSafe(v)
}

function fmtOrDash(v?: string | null) {
  const t = pdfSafe(v)
  return t ? t : "-"
}

function joinPhoneEmail(email?: string | null, tel?: string | null) {
  const e = pdfSafe(email)
  const t = pdfSafe(tel)
  return e && t ? `${e} / ${t}` : e || t || "-"
}

function formatDateFR(v?: string | null) {
  if (!v) return ""
  const d = new Date(v)
  if (isNaN(d.getTime())) return ""
  const dd = d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" })
  return pdfSafe(dd)
}

function euroNoNbsp(n?: string | number | null) {
  if (n === null || n === undefined || n === "") return ""
  const num = typeof n === "string" ? Number(n) : n
  if (!isFinite(num)) return ""
  // Drop non-breaking spaces and decimals for compactness
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num),
  )
}

// Simple text wrapper by measuring width
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      line = trial
    } else {
      if (line) lines.push(line)
      // If a single word is too long, hard-break it
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let acc = ""
        for (const ch of w) {
          const t = acc + ch
          if (font.widthOfTextAtSize(t, size) <= maxWidth) acc = t
          else {
            if (acc) lines.push(acc)
            acc = ch
          }
        }
        line = acc
      } else {
        line = w
      }
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function generateGarantPdf(
  data: GarantFormData,
  opts?: { logoBytes?: ArrayBuffer | Uint8Array },
): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage()
  let { width, height } = page.getSize()

  const fontReg = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const margin = 48
  const colGap = 28
  const contentWidth = width - margin * 2
  const lineHeight = 13
  const titleSize = 18
  const headingSize = 13
  const bodySize = 11
  const smallSize = 10

  let y = height - margin

  // Draw logo (if provided), centered top with padding below
  if (opts?.logoBytes) {
    try {
      const logo = await pdf.embedPng(opts.logoBytes)
      const maxW = 160
      const scale = Math.min(maxW / logo.width, 1)
      const wLogo = logo.width * scale
      const hLogo = logo.height * scale
      const xLogo = margin + (contentWidth - wLogo) / 2
      page.drawImage(logo, { x: xLogo, y: y - hLogo, width: wLogo, height: hLogo })
      y -= hLogo + 10 // small padding below logo
    } catch {
      // ignore logo failure
    }
  }

  // Title centered
  const title = "Fiche de renseignement garant"
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
  page.drawText(title, {
    x: margin + (contentWidth - titleWidth) / 2,
    y,
    size: titleSize,
    font: fontBold,
    color: rgb(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b),
  })
  y -= titleSize + 14 // push further to avoid any overlap

  // "Garant pour" banner (cautionnés)
  const cautionnes = (data?.cautionnes || []).filter(Boolean)
  if (cautionnes.length) {
    const entries = cautionnes.map((c) => {
      const civ = shortCivilite((c as any)?.civilite)
      const nom = titleCase((c as any)?.nom)
      const prenom = titleCase((c as any)?.prenom)
      const email = pdfSafe((c as any)?.email)
      const tel = pdfSafe((c as any)?.telephone)
      const contact = [email, tel].filter(Boolean).join(" / ")
      return [civ, [nom, prenom].filter(Boolean).join(" ")].filter(Boolean).join(" ") + (contact ? ` — ${contact}` : "")
    })
    const line = `Garant pour : ${entries.join(", ")}`
    const wrap = wrapText(pdfSafe(line), fontReg, bodySize, contentWidth)
    // Subtle banner background
    const bannerH = wrap.length * (bodySize + 3) + 12
    page.drawRectangle({
      x: margin,
      y: y - bannerH + 4,
      width: contentWidth,
      height: bannerH,
      color: rgb(0.96, 0.98, 1.0),
      opacity: 1,
    })
    let by = y - 10
    wrap.forEach((ln) => {
      page.drawText(ln, { x: margin + 10, y: by, size: bodySize, font: fontReg, color: rgb(0, 0, 0) })
      by -= bodySize + 3
    })
    y -= bannerH + 8
  }

  // Helper to ensure space, add new page if needed (repeat width/height)
  function ensureSpace(h: number) {
    if (y - h < margin) {
      const p = pdf.addPage()
      const s = p.getSize()
      width = s.width
      height = s.height
      y = height - margin
      // Optional: repeat title/logo on next pages if desired
      pageRef = p
      return p
    }
    return pageRef
  }

  let pageRef = page

  function drawSectionTitle(text: string, extraRightText?: string) {
    const p = ensureSpace(headingSize + 10)
    const t = pdfSafe(text).toUpperCase()
    const x = margin
    const titleW = fontBold.widthOfTextAtSize(t, headingSize)
    p.drawText(t, {
      x,
      y,
      size: headingSize,
      font: fontBold,
      color: rgb(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b),
    })

    if (extraRightText) {
      const er = pdfSafe(extraRightText)
      const erW = fontReg.widthOfTextAtSize(er, bodySize)
      const maxErW = contentWidth - titleW - 16
      const finalEr = erW <= maxErW ? er : wrapText(er, fontReg, bodySize, Math.max(80, maxErW)).slice(0, 1).join("") // keep single-line if possible
      p.drawText(finalEr, {
        x: x + titleW + 12,
        y,
        size: bodySize,
        font: fontReg,
        color: rgb(0, 0, 0),
      })
    }

    y -= headingSize + 4
    // Separator
    p.drawLine({
      start: { x: margin, y: y },
      end: { x: margin + contentWidth, y: y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 8
  }

  function drawKV(label: string, value?: string | null, opts?: { boldValue?: boolean; maxWidth?: number }) {
    const p = ensureSpace(lineHeight)
    const v = value && pdfSafe(value) ? pdfSafe(value) : "-"
    const txt = `${label}: ${v}`
    const maxW = opts?.maxWidth ?? contentWidth
    const lines = wrapText(txt, fontReg, bodySize, maxW)
    lines.forEach((ln) => {
      // draw "Label:" in bold if we want subtle emphasis
      const colonIndex = ln.indexOf(":")
      if (colonIndex > 0) {
        const k = ln.slice(0, colonIndex + 1)
        const val = ln.slice(colonIndex + 1).trimStart()
        const kW = fontBold.widthOfTextAtSize(k, bodySize)
        p.drawText(k, { x: margin, y, size: bodySize, font: fontBold, color: rgb(0, 0, 0) })
        p.drawText(val, {
          x: margin + kW + 4,
          y,
          size: bodySize,
          font: opts?.boldValue ? fontBold : fontReg,
          color: rgb(0, 0, 0),
        })
      } else {
        p.drawText(ln, { x: margin, y, size: bodySize, font: fontReg, color: rgb(0, 0, 0) })
      }
      y -= lineHeight
      ensureSpace(lineHeight)
    })
    y -= 2
  }

  function drawList(label: string, items: string[]) {
    const p = ensureSpace(lineHeight)
    p.drawText(`${label}:`, { x: margin, y, size: bodySize, font: fontBold, color: rgb(0, 0, 0) })
    y -= lineHeight
    items.forEach((it) => {
      const lines = wrapText(`• ${pdfSafe(it)}`, fontReg, bodySize, contentWidth - 16)
      lines.forEach((ln) => {
        p.drawText(ln, { x: margin + 12, y, size: bodySize, font: fontReg, color: rgb(0, 0, 0) })
        y -= lineHeight
      })
    })
    y -= 4
  }

  // Data accessors with forgiving keys
  const g: any = data?.garant || {}
  const civilite = shortCivilite(g.civilite)
  const nom = titleCase(g.nom)
  const prenom = titleCase(g.prenom)
  const dateNaissance = formatDateFR(g.dateNaissance)
  const lieuNaissance = pdfSafe(g.lieuNaissance)
  const adresseActuelle = pdfSafe(g.adresseActuelle)
  const telephone = pdfSafe(g.telephone || g.tel || g.mobile)
  const email = pdfSafe(g.email)
  const situationConjugale = pdfSafe(g.situationConjugale)
  const statutLogement = pdfSafe(g.situationActuelle || g.statutLogement)

  const pro = g // handle flat or nested
  const typeContrat = pdfSafe(pro.typeContrat || pro.contrat || pro.statut)
  const profession = pdfSafe(pro.profession)
  const employeurNom = pdfSafe(pro.employeurNom || pro.employeur || pro.societe)
  const employeurAdresse = pdfSafe(pro.employeurAdresse)
  const employeurTelephone = pdfSafe(pro.employeurTelephone)
  const dateEmbauche = formatDateFR(pro.dateEmbauche)
  const dateFinContrat = formatDateFR(pro.dateFinContrat)
  const salaire = euroNoNbsp(pro.salaire || pro.revenuNetMensuel || pro.revenu_mensuel_net)

  const revenusAdditionnels = (Array.isArray(pro.revenusAdditionnels) ? pro.revenusAdditionnels : []) as Array<any>

  const enfantsACharge = g.enfantsACharge ?? g.nbEnfants ?? g.enfantsCharge ?? g.compositionFoyer?.enfantsACharge ?? ""

  // Sections
  // Identité
  drawSectionTitle("Identité")
  drawKV("Nom", [civilite, [nom, prenom].filter(Boolean).join(" ")].filter(Boolean).join(" "))
  drawKV("Date et lieu de naissance", [dateNaissance || "-", lieuNaissance || "-"].filter(Boolean).join(", "))
  // Adresse: try to split in two lines Rue / CP Ville
  if (adresseActuelle) {
    const parts = adresseActuelle.split(",") // heuristic split
    const line1 = pdfSafe(parts[0] || adresseActuelle)
    const line2 = pdfSafe(parts.slice(1).join(", "))
    drawKV("Adresse actuelle", line1)
    if (line2) {
      const p = ensureSpace(lineHeight)
      p.drawText(line2, {
        x: margin + fontBold.widthOfTextAtSize("Adresse actuelle:", bodySize) + 4,
        y,
        size: bodySize,
        font: fontReg,
      })
      y -= lineHeight + 2
    } else {
      y -= 2
    }
  } else {
    drawKV("Adresse actuelle", "-")
  }
  drawKV("Téléphone", telephone || "-")
  drawKV("Email", email || "-")
  drawKV("Situation conjugale", situationConjugale || "-")
  drawKV("Statut logement", statutLogement || "-")

  // Situation professionnelle
  drawSectionTitle("Situation professionnelle")
  drawKV("Type de contrat / statut", typeContrat || "-")
  drawKV("Profession", profession || "-")
  drawKV("Employeur (nom)", employeurNom || "-")
  drawKV("Employeur (adresse)", employeurAdresse || "-")
  drawKV("Employeur (téléphone)", employeurTelephone || "-")
  if (typeContrat && typeContrat.toLowerCase().includes("cdd")) {
    drawKV("Date de fin de contrat", dateFinContrat || "-")
    drawKV("Date d'embauche", dateEmbauche || "-")
  } else {
    drawKV("Date d'embauche", dateEmbauche || "-")
    drawKV("Date de fin de contrat", dateFinContrat || "-")
  }
  drawKV("Salaire net mensuel (€)", salaire || "-", { boldValue: true })
  if (revenusAdditionnels?.length) {
    const items = revenusAdditionnels
      .map((r) => {
        const label = r?.type === "Autre" ? pdfSafe(r?.precision) || "Autre" : pdfSafe(r?.type) || "Autre"
        const montant = euroNoNbsp(r?.montant)
        return `${label}: ${montant || "-"} / mois`
      })
      .filter(Boolean)
    if (items.length) {
      drawList("Revenus complémentaires", items)
    }
  }

  // Garanties (Visale / précisions)
  drawSectionTitle("Garanties")
  const visale = g?.garantieVisale
  const visaleStr = typeof visale === "boolean" ? (visale ? "Oui" : "Non") : pdfSafe(visale) || "-"
  drawKV("Garantie Visale", visaleStr)
  const autresPrecisions = pdfSafe(g?.garantiesPrecision || g?.precision || g?.remarques)
  if (autresPrecisions) {
    drawKV("Précisions", autresPrecisions)
  }

  // Composition du foyer — enfants à charge inline
  const enfantsStr =
    enfantsACharge === "" || enfantsACharge === null || enfantsACharge === undefined ? "-" : String(enfantsACharge)
  drawSectionTitle("Composition du foyer", `Nombre d'enfants à charge : ${enfantsStr}`)

  // Footer note (optional compact)
  const note = "Document strictement confidentiel – transmis à titre informatif"
  const noteW = fontReg.widthOfTextAtSize(note, smallSize)
  pageRef.drawText(note, {
    x: margin + (contentWidth - noteW) / 2,
    y: margin - 24, // slightly below margin
    size: smallSize,
    font: fontReg,
    color: rgb(TEXT_GRAY.r, TEXT_GRAY.g, TEXT_GRAY.b),
  })

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

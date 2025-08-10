import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { CriteresRecherche } from "./types"

export async function generateRecherchePdf(criteres: CriteresRecherche): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const margin = 50

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  /* -----------------------------------------------------------------
  wrapLines() – coupe le texte pour qu’il tienne dans maxWidth px,
  même si le mot ne contient pas d’espaces.
  ------------------------------------------------------------------*/
  const wrapLines = (text: string, maxWidth: number): string[] => {
    if (!text || text.trim() === "") return ["–"]
    const push = (arr: string[], ln: string) => ln && arr.push(ln)
    const words = text.replace(/\n/g, " ").split(" ")
    const lines: string[] = []
    let line = ""
    words.forEach((word) => {
      const test = (line ? line + " " : "") + word
      if (helvetica.widthOfTextAtSize(test, 11) <= maxWidth) {
        line = test
        return
      }
      /* la ligne actuelle déborderait */
      push(lines, line)
      line = ""
      /* mot plus long que maxWidth → on le coupe */
      let frag = ""
      for (const c of word) {
        const tentative = frag + c
        if (helvetica.widthOfTextAtSize(tentative, 11) > maxWidth) {
          push(lines, frag)
          frag = c
        } else {
          frag = tentative
        }
      }
      line = frag
    })
    push(lines, line)
    return lines
  }

  let y = height - margin

  const moveDown = (amount = 1) => {
    y -= 12 * amount // Approximate line height
  }

  const drawTitle = (text: string) => {
    page.drawText(text, {
      x: margin,
      y,
      font: helveticaBold,
      size: 16,
      color: rgb(0, 0, 0),
    })
    y -= 18
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: width - margin, y: y + 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    moveDown(1.5)
  }

  const drawField = (label: string, value: string | number | undefined | null) => {
    if (value === null || value === undefined || String(value).trim() === "") return
    const fullText = `${label}: ${String(value)}`
    const lines = wrapLines(fullText, width - margin * 2)
    lines.forEach((ln, idx) => {
      page.drawText(ln, {
        x: margin,
        y: y - idx * 12,
        font: helvetica,
        size: 11,
        color: rgb(0, 0, 0),
      })
    })
    y -= 12 * lines.length
  }

  // Main Title
  page.drawText("Critères de Recherche", {
    x: width / 2 - 100,
    y,
    font: helveticaBold,
    size: 22,
    color: rgb(0, 0, 0),
  })
  moveDown(3)

  drawTitle("Critères du bien")
  drawField("Nombre de chambres minimum", criteres.nombreChambres)
  drawField("Loyer maximum souhaité", criteres.loyerMax ? `${criteres.loyerMax} € / mois` : undefined)
  drawField("Secteur souhaité", criteres.secteurSouhaite)
  drawField("Rayon de recherche", criteres.rayonKm ? `${criteres.rayonKm} km` : undefined)
  moveDown()

  drawTitle("Projet de déménagement")
  drawField("Date souhaitée d'emménagement", criteres.dateEmmenagement)
  drawField("Préavis à déposer", criteres.preavisADeposer)
  drawField("Raison du déménagement", criteres.raisonDemenagement)
  moveDown()

  drawTitle("Informations complémentaires")
  const infoLines = wrapLines(criteres.informationsComplementaires || "Aucune", width - margin * 2)
  infoLines.forEach((ln, idx) => {
    page.drawText(ln, {
      x: margin,
      y: y - idx * 12,
      font: helvetica,
      size: 11,
      color: rgb(0, 0, 0),
    })
  })
  y -= 12 * infoLines.length

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

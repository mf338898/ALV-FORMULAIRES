import { NextResponse } from "next/server"
import { generatePdf, buildLocatairePdfFilename } from "@/lib/pdf-generator"
import { generateRecherchePdf, hasRechercheData, buildRecherchePdfFilename } from "@/lib/pdf-recherche-generator"
import { sendMail, mailIsConfigured } from "@/lib/mail"
import { logger } from "@/lib/logger"
import type { AppFormData } from "@/lib/types"

// Helpers
function uniqueEmails(emails: (string | undefined | null)[]) {
  return Array.from(new Set(emails.filter((e): e is string => !!e && e.trim().length > 0)))
}
function resolveRecipientEmail() {
  return (
    process.env.RECIPIENT_EMAIL ||
    process.env.PRIMARY_RECIPIENT_EMAIL ||
    process.env.SMTP_RECIPIENT_EMAIL ||
    "Foveau16@gmail.com"
  )
}
function buildSubject(body: AppFormData) {
  const bien = (body.bienConcerne || "Bien non précisé").trim()
  const names = (body.locataires || [])
    .map((l) => [l.civilite, l.nom, l.prenom].filter(Boolean).join(" "))
    .filter((s) => s.length > 0)
    .join(", ")
  return `Nouvelle fiche de renseignement pour ${bien} – ${names || "Locataire non précisé"}`
}
function escapeHtml(input?: string) {
  if (!input) return ""
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
function nonEmpty(s?: string) {
  return !!(s && s.trim().length > 0)
}
function euro(val?: string) {
  if (!val) return undefined
  const n = Number(String(val).replace(/\s/g, "").replace(",", "."))
  if (!isFinite(n) || Number.isNaN(n)) return undefined
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
}
function formatRevenusComplementaires(list?: AppFormData["locataires"][number]["revenusAdditionnels"]) {
  if (!list || list.length === 0) return ""
  const items = list
    .filter((r) => nonEmpty(r.type) || nonEmpty(r.montant) || nonEmpty(r.precision))
    .map((r) => {
      const type = r.type?.trim() || "Revenu complémentaire"
      const precision = r.precision?.trim()
      const montant = euro(r.montant)
      const label = precision ? `${type} — ${precision}` : type
      return `<li>${escapeHtml(label)}${montant ? ` : ${escapeHtml(montant)}/mois` : ""}</li>`
    })
  if (items.length === 0) return ""
  return `<ul style="margin: 0.25rem 0 0.5rem 1.25rem;">${items.join("")}</ul>`
}
function professionalStatus(l: AppFormData["locataires"][number]) {
  const parts: string[] = []
  if (nonEmpty(l.typeContrat)) parts.push(String(l.typeContrat).trim())
  if (nonEmpty(l.situationActuelleSansEmploi) && String(l.situationActuelleSansEmploi).toLowerCase() === "oui") {
    const precision = nonEmpty(l.precisionSansEmploi) ? ` (${String(l.precisionSansEmploi).trim()})` : ""
    parts.push(`Sans emploi${precision}`)
  } else if (nonEmpty(l.situationActuelle)) {
    parts.push(String(l.situationActuelle).trim())
  }
  if (nonEmpty(l.profession)) parts.push(String(l.profession).trim())
  if (nonEmpty(l.employeur)) parts.push(`Employeur: ${String(l.employeur).trim()}`)
  if (nonEmpty(l.dateEmbauche)) parts.push(`Depuis: ${String(l.dateEmbauche).trim()}`)
  if (nonEmpty(l.dateFinContrat)) parts.push(`Jusqu’au: ${String(l.dateFinContrat).trim()}`)
  return parts.join(" — ")
}
function buildEmailHtml(body: AppFormData) {
  const bien = (body.bienConcerne || "Non précisé").trim()
  const enfants = typeof body.nombreEnfantsFoyer === "number" ? body.nombreEnfantsFoyer : undefined
  const garant = body.garanties
  const locBlocks = (body.locataires || [])
    .map((l, idx) => {
      const civNomPrenom = [l.civilite, l.nom, l.prenom].filter(Boolean).join(" ")
      const contact = `Contact : ${escapeHtml(l.email || "Non précisé")} / ${escapeHtml(l.telephone || "Non précisé")}`
      const statut = professionalStatus(l)
      const salaire = euro(l.salaire) || "–"
      const revenus = formatRevenusComplementaires(l.revenusAdditionnels)
      return `
        <p style="margin:0;"><strong>Locataire ${idx + 1} :</strong></p>
        <div>${escapeHtml(civNomPrenom)}</div>
        <div>${contact}</div>
        ${statut ? `<div>Situation professionnelle : ${escapeHtml(statut)}</div>` : ""}
        <div>Revenu net mensuel : ${escapeHtml(salaire)}</div>
        ${revenus ? `<div>Revenus complémentaires :</div>${revenus}` : ""}
      `
    })
    .join(`<p style="margin: 0.5rem 0;">—</p>`)
  const lines: string[] = []
  lines.push(`<p>Bonjour,</p>`)
  lines.push(`<p>Une nouvelle fiche de renseignement locataire a été reçue pour le bien suivant :</p>`)
  lines.push(`<p><strong>Bien concerné</strong><br/>${escapeHtml(bien)}</p>`)
  lines.push(`<p style="margin: 0.75rem 0;">—</p>`)
  lines.push(`<p><strong>Informations des locataires</strong></p>`)
  lines.push(`<div>${locBlocks}</div>`)
  if (typeof enfants === "number" && enfants > 0) {
    lines.push(`<p style="margin: 0.75rem 0;">—</p>`)
    lines.push(`<p><strong>Nombre d’enfants à charge</strong><br/>${enfants}</p>`)
  }
  if (
    garant &&
    (nonEmpty(garant.garantFamilial) || nonEmpty(garant.garantieVisale) || nonEmpty(garant.precisionGarant))
  ) {
    lines.push(`<p style="margin: 0.75rem 0;">—</p>`)
    lines.push(`<p><strong>Garanties</strong></p>`)
    if (nonEmpty(garant.garantFamilial))
      lines.push(`<div>Garant familial : ${escapeHtml(garant.garantFamilial!)}</div>`)
    if (nonEmpty(garant.precisionGarant)) lines.push(`<div>Précision : ${escapeHtml(garant.precisionGarant!)}</div>`)
    if (nonEmpty(garant.garantieVisale))
      lines.push(`<div>Garantie Visale : ${escapeHtml(garant.garantieVisale!)}</div>`)
  }
  lines.push(`<p style="margin: 0.75rem 0;">—</p>`)
  lines.push(
    `<p style="font-size: 0.95rem; line-height: 1.5;">
      Les documents PDF récapitulatifs sont joints à cet e‑mail.<br/>
      Cet e‑mail a été envoyé automatiquement depuis le formulaire de location.<br/>
      Ne pas répondre à cet e‑mail. Pour toute demande, contactez : ${escapeHtml(resolveRecipientEmail())}.
     </p>`,
  )
  return `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #111; line-height: 1.5;">
    ${lines.join("\n")}
  </div>`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AppFormData
    const subject = buildSubject(body)

    // Generate main “Fiche de renseignement” PDF
    const frPdf = await generatePdf(body)
    const frName = buildLocatairePdfFilename(body)

    // Optional "Critères de recherche" PDF (only if toggle is yes and fields present)
    let searchAttachment:
      | {
          filename: string
          content: Buffer
          contentType: string
        }
      | undefined
    if (String(body.veutRemplirRecherche).toLowerCase() === "oui" && hasRechercheData(body)) {
      const searchPdf = await generateRecherchePdf(body)
      searchAttachment = {
        filename: buildRecherchePdfFilename(body),
        content: searchPdf,
        contentType: "application/pdf",
      }
    }

    // Routing: To = RECIPIENT_EMAIL, Cc = all locataire emails
    const to = resolveRecipientEmail()
    const cc = uniqueEmails((body.locataires || []).map((l) => l.email))

    if (!mailIsConfigured()) {
      logger.warn("SMTP non configuré. Simulation d'envoi (locataire).", {
        to,
        cc,
        subject,
        attachments: [frName, searchAttachment?.filename].filter(Boolean),
      })
      return NextResponse.json({
        success: true,
        message: "Dossier envoyé (simulation). Configurez SMTP pour envoyer les emails.",
        debug: { to, cc, subject, attachments: [frName, searchAttachment?.filename].filter(Boolean) },
      })
    }

    const sent = await sendMail({
      to,
      cc,
      subject,
      html: buildEmailHtml(body),
      attachments: [
        {
          filename: frName,
          content: frPdf,
          contentType: "application/pdf",
        },
        ...(searchAttachment ? [searchAttachment] : []),
      ],
      fromName: "ALV Immobilier - noreply",
    })

    if (!sent) {
      logger.error("Échec de l'envoi de l'e-mail (locataire)")
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi du dossier.", error: "Mail non envoyé" },
        { status: 500 },
      )
    }

    logger.info("Email (locataire) envoyé avec To/Cc simplifiés", { to, cc })
    return NextResponse.json({ success: true, message: "Dossier envoyé avec succès !" })
  } catch (error) {
    logger.error("Erreur dans /api/generer-pdf", error)
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur.", error: (error as Error).message },
      { status: 500 },
    )
  }
}

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
    process.env.TEST_EMAIL ||
    process.env.RECIPIENT_EMAIL ||
    process.env.PRIMARY_RECIPIENT_EMAIL ||
    process.env.SMTP_RECIPIENT_EMAIL ||
    "eliottfoveau62@gmail.com"
  )
}
function buildSubject(body: AppFormData) {
  const bien = (body.bienConcerne || "Bien non précisé").trim()
  const names = (body.locataires || [])
    .map((l) => [l.civilite, l.nom, l.prenom].filter(Boolean).join(" "))
    .filter((s) => s.length > 0)
    .join(", ")
  return `🏠 Nouvelle fiche de renseignement – ${bien} – ${names || "Locataire non précisé"}`
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
      return `<li style="margin: 0 0 0.5rem 0; color: #374151;">${escapeHtml(label)}${montant ? ` : <strong>${escapeHtml(montant)}/mois</strong>` : ""}</li>`
    })
  if (items.length === 0) return ""
  return `<ul style="margin: 0.5rem 0 0.5rem 1.5rem; padding: 0; list-style: none;">
    ${items.map((item, idx) => `<li style="margin: 0 0 0.75rem 0; padding: 0.5rem; background-color: #f9fafb; border-radius: 4px; border-left: 3px solid #d1d5db;">${item}</li>`).join("")}
  </ul>`
}
function professionalStatus(l: AppFormData["locataires"][number]) {
  const parts: string[] = []
  if (nonEmpty(l.typeContrat)) parts.push(String(l.typeContrat).trim())
  if (nonEmpty(l.situationActuelleSansEmploi) && String(l.situationActuelleSansEmploi).toLowerCase() === "oui") {
    parts.push(`Sans emploi`)
  } else if (nonEmpty(l.situationActuelle)) {
    parts.push(String(l.situationActuelle).trim())
  }
  if (nonEmpty(l.profession)) parts.push(String(l.profession).trim())
  if (nonEmpty(l.employeurNom)) parts.push(`Employeur: ${String(l.employeurNom).trim()}`)
  if (nonEmpty(l.dateEmbauche)) parts.push(`Depuis: ${String(l.dateEmbauche).trim()}`)
  if (nonEmpty(l.dateFinContrat)) parts.push(`Jusqu’au: ${String(l.dateFinContrat).trim()}`)
  return parts.join(" — ")
}
function buildEmailHtml(body: AppFormData) {
  const bien = (body.bienConcerne || "Non précisé").trim()
  const enfants = typeof body.nombreEnfantsFoyer === "number" ? body.nombreEnfantsFoyer : undefined
  const garant = body.garanties
  
  // Titre principal avec nom du bien et locataires
  const names = (body.locataires || [])
    .map((l) => [l.civilite, l.nom, l.prenom].filter(Boolean).join(" "))
    .filter((s) => s.length > 0)
    .join(", ")
  
  const locBlocks = (body.locataires || [])
    .map((l, idx) => {
      const civNomPrenom = [l.civilite, l.nom, l.prenom].filter(Boolean).join(" ")
      const contact = `Contact : ${escapeHtml(l.email || "Non précisé")} / ${escapeHtml(l.telephone || "Non précisé")}`
      const statut = professionalStatus(l)
      const salaire = euro(l.salaire) || "–"
      const revenus = formatRevenusComplementaires(l.revenusAdditionnels)
      return `
        <div style="margin: 0 0 1.5rem 0;">
          <h3 style="margin: 0 0 0.75rem 0; color: #2563eb; font-size: 16px;">Locataire ${idx + 1}</h3>
          <div style="margin: 0 0 0.5rem 0;"><strong>${escapeHtml(civNomPrenom)}</strong></div>
          <div style="margin: 0 0 0.5rem 0; color: #374151;">${contact}</div>
          ${statut ? `<div style="margin: 0 0 0.5rem 0;"><strong>Situation professionnelle :</strong> ${escapeHtml(statut)}</div>` : ""}
          <div style="margin: 0 0 0.5rem 0;"><strong>Revenu net mensuel :</strong> ${escapeHtml(salaire)}</div>
          ${revenus ? `<div style="margin: 0 0 0.5rem 0;"><strong>Revenus complémentaires :</strong></div>${revenus}` : ""}
        </div>
      `
    })
    .join("")
  
  const lines: string[] = []
  
  // Titre principal
  lines.push(`<h1 style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 20px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem;">
    🏠 Nouvelle fiche de renseignement
  </h1>`)
  
  // Informations du bien
  lines.push(`<h2 style="margin: 0 0 1rem 0; color: #374151; font-size: 18px;">📍 Bien concerné</h2>`)
  lines.push(`<p style="margin: 0 0 1.5rem 0; font-size: 16px; color: #1f2937;"><strong>${escapeHtml(bien)}</strong></p>`)
  
  // Informations des locataires
  lines.push(`<h2 style="margin: 0 0 1rem 0; color: #374151; font-size: 18px;">👥 Informations des locataires</h2>`)
  lines.push(`<div>${locBlocks}</div>`)
  
  // Nombre d'enfants
  if (typeof enfants === "number" && enfants > 0) {
    lines.push(`<h2 style="margin: 1.5rem 0 1rem 0; color: #374151; font-size: 18px;">👶 Composition du foyer</h2>`)
    lines.push(`<p style="margin: 0 0 1.5rem 0; font-size: 16px; color: #1f2937;"><strong>Nombre d'enfants à charge :</strong> ${enfants}</p>`)
  }
  
  // Garanties
  if (
    garant &&
    (nonEmpty(garant.garantFamilial) || nonEmpty(garant.garantieVisale) || nonEmpty(garant.precisionGarant))
  ) {
    lines.push(`<h2 style="margin: 1.5rem 0 1rem 0; color: #374151; font-size: 18px;">🛡️ Garanties</h2>`)
    if (nonEmpty(garant.garantFamilial))
      lines.push(`<div style="margin: 0 0 0.5rem 0;"><strong>Garant familial :</strong> ${escapeHtml(garant.garantFamilial!)}</div>`)
    if (nonEmpty(garant.precisionGarant)) 
      lines.push(`<div style="margin: 0 0 0.5rem 0;"><strong>Précision :</strong> ${escapeHtml(garant.precisionGarant!)}</div>`)
    if (nonEmpty(garant.garantieVisale))
      lines.push(`<div style="margin: 0 0 0.5rem 0;"><strong>Garantie Visale :</strong> ${escapeHtml(garant.garantieVisale!)}</div>`)
  }
  
  // Informations importantes
  lines.push(`<div style="margin: 2rem 0 1.5rem 0; padding: 1rem; background-color: #f3f4f6; border-left: 4px solid #2563eb; border-radius: 0 4px 4px 0;">
    <p style="margin: 0 0 0.5rem 0; font-size: 15px; color: #1f2937;">
      📎 <strong>Les documents PDF récapitulatifs sont joints à cet e-mail.</strong>
    </p>
    <p style="margin: 0 0 0.5rem 0; font-size: 14px; color: #6b7280;">
      Cet e-mail a été envoyé automatiquement depuis le formulaire de location.
    </p>
    <p style="margin: 0 0 0.5rem 0; font-size: 14px; color: #6b7280;">
      <strong>⚠️ Ne pas répondre à cet e-mail.</strong> Pour toute demande, contactez : 
      <strong>${escapeHtml(resolveRecipientEmail())}</strong>.
    </p>
  </div>`)
  
  // Bannière de fin
  lines.push(`<hr style="margin: 2rem 0 1rem 0; border: none; border-top: 1px solid #e5e7eb;">`)
  lines.push(`<p style="margin: 0; text-align: center; font-size: 12px; color: #9ca3af;">
    Cet e-mail est généré automatiquement par <strong>ALV Immobilier</strong>.
  </p>`)
  
  return `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #111; line-height: 1.6; max-width: 600px; margin: 0 auto;">
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

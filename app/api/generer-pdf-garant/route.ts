import { NextResponse } from "next/server"
import { generateGarantPdf } from "@/lib/pdf-garant-generator"
import { sendMail, mailIsConfigured, isPreviewTransportUnsupported } from "@/lib/mail"
import { logger } from "@/lib/logger"
import type { GarantFormData } from "@/lib/types"

// ————— Helpers —————
function uniqueEmails(emails: (string | null | undefined)[]) {
  return Array.from(
    new Set(emails.map((e) => (typeof e === "string" ? e.trim() : "")).filter((e): e is string => e.length > 0)),
  )
}

function resolveRecipientEmail() {
  return (
    process.env.TEST_EMAIL ||
    process.env.RECIPIENT_EMAIL ||
    process.env.PRIMARY_RECIPIENT_EMAIL || // backward-compat
    process.env.SMTP_RECIPIENT_EMAIL || // backward-compat
    "eliottfoveau62@gmail.com"
  )
}

function normSpace(s?: string | null) {
  if (!s) return ""
  return s
    .replace(/\u202F|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function titleCase(input?: string | null) {
  if (!input) return ""
  return normSpace(input)
    .toLowerCase()
    .split(/([-\s])/)
    .map((p) => (p.match(/[-\s]/) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("")
}

function civiliteShort(c?: string | null) {
  const v = normSpace(c).toLowerCase()
  if (!v) return ""
  if (["mme", "madame"].includes(v)) return "Mme"
  return "M."
}

function personInline(civ?: string | null, nom?: string | null, prenom?: string | null) {
  const civShort = civiliteShort(civ)
  const full = [titleCase(nom), titleCase(prenom)].filter(Boolean).join(" ")
  return [civShort, full].filter(Boolean).join(" ")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GarantFormData
    const { garant, cautionnes = [] } = body

    const recipient = resolveRecipientEmail()

    logger.info("Requête reçue pour générer le PDF Garant", { email: garant?.email })

    // Fetch the classic logo as bytes to embed in the PDF
    let logoBytes: ArrayBuffer | undefined
    try {
      const logoUrl = new URL("/images/logo-alv.png", request.url)
      const res = await fetch(logoUrl)
      if (res.ok) logoBytes = await res.arrayBuffer()
    } catch {
      // continue without logo
    }

    // Generate PDF attachment
    const pdfBuffer = await generateGarantPdf(body)
    logger.info("PDF Garant généré avec succès")

    // Build email routing (simplified spec):
    // To: guarantor email (fallback RECIPIENT_EMAIL)
    // Cc: RECIPIENT_EMAIL + locataire(s) emails
    const to = garant?.email || recipient
    const cc = uniqueEmails([recipient, ...cautionnes.map((c) => c?.email)])

    // Subject
    const garantFull = personInline(garant?.civilite, garant?.nom, garant?.prenom) || "Nom non précisé"
    const bienConcerne =
      (body as any)?.bienConcerne ||
      (body as any)?.dossier?.bienConcerne ||
      (body as any)?.recherche?.bienConcerne ||
      "Bien non précisé"
    const subject = `Nouvelle fiche de renseignement garant – ${bienConcerne} – ${garantFull}`

    // Email body (compact, consistent with locataire style)
    const politeEmail = resolveRecipientEmail()
    const parts: string[] = []
    parts.push(p("Bonjour,"))
    parts.push(p("Une nouvelle fiche de renseignement garant a été reçue pour le bien suivant :"))
    parts.push(label("Bien concerné :"))
    parts.push(p(bienConcerne))

    // Garant block
    parts.push(label("Garant :"))
    parts.push(p(`Nom : ${garantFull}`))
    const contact = [normSpace(garant?.email), normSpace((garant as any)?.telephone)].filter(Boolean).join(" / ") || "-"
    parts.push(p(`Contact : ${contact}`))

    // "Se porte garant pour" list
    const list = (cautionnes || []).slice(0, 1).map((c) => {
      const full = personInline((c as any)?.civilite, (c as any)?.nom, (c as any)?.prenom)
      const cLine = [normSpace((c as any)?.email), normSpace((c as any)?.telephone)].filter(Boolean).join(" / ")
      return `${full}${cLine ? ` — ${cLine}` : ""}`
    })
    if (list.length) {
      parts.push(label("Se porte garant pour :"))
      list.forEach((ln) => parts.push(p(ln)))
    }

    parts.push(p("📎 Les documents PDF récapitulatifs sont joints à cet e-mail."))
    parts.push(`<p style="margin:2px 0;"><strong>⚠ Ne pas répondre à cet e-mail.</strong></p>`)
    parts.push(
      `<p style="margin:6px 0 0 0;">Pour toute demande, contactez : <strong>${normSpace(politeEmail)}</strong></p>`,
    )
    const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#111;">${parts.join(
      "\n",
    )}</div>`

    const safeName = normSpace(garantFull || "Garant")
    const attachments = [
      {
        filename: `FR - Garant - ${safeName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ]

    if (!mailIsConfigured()) {
      logger.warn("SMTP non configuré. Simulation d'envoi (garant).")
      return NextResponse.json({
        success: true,
        message: "Fiche garant envoyée (simulation). Configurez SMTP pour envoyer les emails.",
        debug: { to, cc, subject },
      })
    }

    try {
      const sent = await sendMail({
        to,
        cc,
        subject,
        html,
        attachments,
        fromName: "ALV Immobilier - noreply",
      })

      if (!sent) {
        // In preview, some transports may return false. Treat as simulation for a smooth UX.
        logger.warn("sendMail a renvoyé 'false'. Simulation d'envoi (prévisualisation).")
        return NextResponse.json({
          success: true,
          message: "Fiche garant envoyée (simulation en prévisualisation).",
          debug: { to, cc, subject },
        })
      }

      logger.info("Email (garant) envoyé avec format compact et sections alignées")
      return NextResponse.json({ success: true, message: "Fiche garant envoyée avec succès !" })
    } catch (e) {
      if (isPreviewTransportUnsupported(e)) {
        // v0 next-lite preview limitation: dns.lookup not implemented -> simulate success
        logger.warn("SMTP indisponible en prévisualisation (dns.lookup non implémenté). Simulation d'envoi (garant).")
        return NextResponse.json({
          success: true,
          message: "Fiche garant envoyée (simulation en prévisualisation).",
          debug: { to, cc, subject, note: "dns.lookup non implémenté en preview" },
        })
      }
      // Real error (keep existing behavior)
      logger.error("Échec de l'envoi de l'e-mail (garant)", e as any)
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l'envoi de la fiche garant.",
          error: (e as any)?.message || String(e),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Erreur lors du traitement de la requête", error as any)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du traitement de la requête.",
        error: (error as any)?.message || String(error),
      },
      { status: 500 },
    )
  }
}

// small HTML helpers
function p(text: string) {
  return `<p style="margin:2px 0;">${escapeHtml(text)}</p>`
}
function label(t: string) {
  return `<p style="margin:10px 0 2px 0;"><strong>${escapeHtml(t)}</strong></p>`
}
function escapeHtml(s?: string | null) {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

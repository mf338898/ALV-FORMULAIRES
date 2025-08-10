import { NextResponse } from "next/server"
import { sendMail } from "@/lib/mail"
import { generatePdf } from "@/lib/pdf-generator"
import type { FormState } from "@/lib/types"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const body: FormState = await request.json()
    logger.info("Requête reçue pour générer le PDF", { email: body.locataires[0]?.email })

    const pdfBuffer = await generatePdf(body)
    logger.info("PDF généré avec succès")

    const pdfBase64 = pdfBuffer.toString("base64")

    const mailSent = await sendMail({
      to: process.env.SMTP_RECIPIENT_EMAIL || "contact@alvimmobilier.bzh",
      subject: `Nouveau dossier de location pour : ${body.bienConcerne}`,
      html: `<p>Vous avez reçu une nouvelle fiche de renseignements pour le bien : <strong>${
        body.bienConcerne
      }</strong>.</p><p>Candidat principal : ${body.locataires[0].prenom} ${
        body.locataires[0].nom
      }</p><p>Le PDF du dossier est en pièce jointe.</p><p>Email du candidat : <a href="mailto:${
        body.locataires[0].email
      }">${body.locataires[0].email}</a></p><p>Téléphone : ${body.locataires[0].telephone}</p>`,
      attachments: [
        {
          filename: `dossier-location-${body.locataires[0].nom}.pdf`,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    })

    if (mailSent) {
      logger.info("E-mail envoyé avec succès à l'agence")
      // Envoyer un e-mail de confirmation au premier locataire
      try {
        await sendMail({
          to: body.locataires[0].email,
          subject: "Confirmation de votre dossier de location - ALV Immobilier",
          html: `<p>Bonjour ${body.locataires[0].prenom},</p>
                     <p>Nous vous confirmons la bonne réception de votre fiche de renseignements pour le bien "${body.bienConcerne}".</p>
                     <p>Votre dossier est en cours d'étude. Nous reviendrons vers vous dans les meilleurs délais.</p>
                     <p>Cordialement,</p>
                     <p>L'équipe ALV Immobilier</p>`,
        })
        logger.info(`E-mail de confirmation envoyé à ${body.locataires[0].email}`)
      } catch (confirmationError) {
        logger.error("Erreur lors de l'envoi de l'e-mail de confirmation au locataire", {
          error: confirmationError,
        })
        // Ne pas bloquer la réponse principale si l'email de confirmation échoue
      }

      return NextResponse.json({ success: true, message: "Dossier envoyé avec succès !" })
    } else {
      logger.error("Échec de l'envoi de l'e-mail à l'agence")
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi du dossier.", error: "Mail non envoyé" },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Erreur dans la fonction POST de /api/generer-pdf", { error })
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur.", error: (error as Error).message },
      { status: 500 },
    )
  }
}

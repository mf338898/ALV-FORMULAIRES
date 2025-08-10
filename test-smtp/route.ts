import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { Logger } from "@/lib/logger"

export async function GET() {
  Logger.info("Checking SMTP configuration via GET request.")

  const { SMTP_HOST, SMTP_PORT, GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_FROM_NAME, EMAIL_TO } = process.env

  // Prioritize Gmail-specific credentials, consistent with lib/mail.ts
  const user = GMAIL_USER || process.env.SMTP_USER
  const pass = GMAIL_APP_PASSWORD || process.env.SMTP_PASS

  const configDetails = {
    "SMTP Host": SMTP_HOST || "Non configuré",
    "SMTP Port": SMTP_PORT || "Non configuré",
    User: user || "Non configuré",
    "Password Set": pass ? "Oui" : "Non",
    "From Name": SMTP_FROM_NAME || "Non configuré",
    "Default To Email": EMAIL_TO || "Non configuré",
  }

  const isProductionReady = !!(SMTP_HOST && SMTP_PORT && user && pass && SMTP_FROM_NAME && EMAIL_TO)

  Logger.info("Current SMTP Configuration", configDetails)

  if (isProductionReady) {
    return NextResponse.json({
      success: true,
      message: "Toutes les variables d'environnement requises sont configurées.",
      details: "La configuration semble prête pour la production.",
      productionReady: true,
      configStatus: configDetails,
    })
  } else {
    return NextResponse.json({
      success: false,
      message: "Certaines variables d'environnement sont manquantes.",
      details: "Veuillez vérifier votre configuration sur Vercel.",
      productionReady: false,
      configStatus: configDetails,
    })
  }
}

export async function POST(req: Request) {
  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 })
  }

  const { to, subject, message } = body

  if (!to) {
    return NextResponse.json({ success: false, message: "L'email de destination est manquant." }, { status: 400 })
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_FROM_NAME } = process.env

  // Prioritize Gmail-specific credentials, consistent with lib/mail.ts
  const user = GMAIL_USER || SMTP_USER
  const pass = GMAIL_APP_PASSWORD || SMTP_PASS

  const config = {
    SMTP_HOST,
    SMTP_PORT,
    user,
    pass_is_set: !!pass,
    SMTP_FROM_NAME,
  }

  Logger.info("Attempting to send test email via POST", { to, subject: subject || "(default)" })

  if (!SMTP_HOST || !SMTP_PORT || !user || !pass || !SMTP_FROM_NAME) {
    const errorMessage = "SMTP configuration is incomplete."
    Logger.error(errorMessage, config)
    return NextResponse.json({ success: false, message: errorMessage, details: config }, { status: 500 })
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.parseInt(SMTP_PORT, 10),
    secure: Number.parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  try {
    await transporter.verify()
    Logger.success("SMTP server verified successfully.")

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${user}>`,
      to: to,
      subject: subject || "Test SMTP - ALV Immobilier",
      html:
        message ||
        `
        <h1>Connexion SMTP réussie !</h1>
        <p>Votre configuration SMTP fonctionne correctement.</p>
        <p>Ceci est un e-mail de test envoyé depuis votre application.</p>
      `,
    }

    await transporter.sendMail(mailOptions)
    Logger.success(`Test email sent successfully to ${to}.`)

    return NextResponse.json({
      success: true,
      message: `Connexion SMTP réussie et e-mail de test envoyé à ${to}.`,
    })
  } catch (error) {
    Logger.error("SMTP test failed.", error)
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue"
    return NextResponse.json({ success: false, message: "Échec du test SMTP", error: errorMessage }, { status: 500 })
  }
}

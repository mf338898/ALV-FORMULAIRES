import nodemailer from "nodemailer"
import { Logger } from "./logger"

interface Attachment {
  filename: string
  content: Buffer
  contentType: string
}

function validateSmtpConfig(host: string, port: string) {
  const portNumber = Number(port)
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new Error(`Invalid SMTP_PORT: "${port}". It must be a valid number.`)
  }

  // A simple heuristic: host should not be a number, port should be.
  // This catches the common case of swapping them.
  if (!isNaN(Number(host))) {
    throw new Error(
      `Invalid SMTP_HOST: "${host}". It looks like a number. Please check if SMTP_HOST and SMTP_PORT are swapped.`,
    )
  }
}

export async function sendMail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments: Attachment[]
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_FROM_NAME } = process.env

  // Prioritize Gmail-specific credentials if they exist
  const user = GMAIL_USER || SMTP_USER
  const pass = GMAIL_APP_PASSWORD || SMTP_PASS

  if (!SMTP_HOST || !SMTP_PORT || !user || !pass || !SMTP_FROM_NAME) {
    const errorMessage = "SMTP configuration is missing in environment variables."
    Logger.error(errorMessage, {
      SMTP_HOST: !!SMTP_HOST,
      SMTP_PORT: !!SMTP_PORT,
      user: !!user,
      pass_is_set: !!pass,
      SMTP_FROM_NAME: !!SMTP_FROM_NAME,
    })
    throw new Error(errorMessage)
  }

  try {
    validateSmtpConfig(SMTP_HOST, SMTP_PORT)
  } catch (error) {
    const validationError = error instanceof Error ? error.message : "SMTP configuration validation failed."
    Logger.error("SMTP Configuration Validation Error", { error: validationError })
    throw new Error(validationError)
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.parseInt(SMTP_PORT, 10),
    secure: Number.parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
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
    Logger.info("SMTP server is ready to take our messages.")
  } catch (error) {
    Logger.error("Error verifying SMTP server.", error)
    throw new Error("Error verifying SMTP server.")
  }

  const mailOptions = {
    from: `"${SMTP_FROM_NAME}" <${user}>`,
    to,
    subject,
    html,
    attachments,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    Logger.info("Email sent successfully.", { messageId: info.messageId })
    return info
  } catch (error) {
    Logger.error("Error sending email.", error)
    throw new Error("Error sending email.")
  }
}

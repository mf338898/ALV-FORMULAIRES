import nodemailer from "nodemailer"
import { logger } from "./logger"

type Attachment =
  | {
      filename: string
      content: Buffer
      contentType?: string
    }
  | {
      filename: string
      content: string
      encoding: "base64"
      contentType?: string
    }

type ResolvedSmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
}

function mask(s?: string) {
  if (!s) return ""
  const at = s.indexOf("@")
  if (at > 2) {
    return `${s.slice(0, 2)}***${s.slice(at)}`
  }
  return "***"
}

// Try to resolve a usable SMTP config from env, with sensible fallbacks for common providers (Gmail).
function resolveSmtpConfig(): { config?: ResolvedSmtpConfig; missing: string[] } {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_FROM_NAME } = process.env

  const user = SMTP_USER || GMAIL_USER || ""
  const pass = SMTP_PASS || GMAIL_APP_PASSWORD || ""
  let host = SMTP_HOST || ""
  let port: number | undefined = SMTP_PORT ? Number.parseInt(SMTP_PORT, 10) : undefined
  let secure = port === 465
  const fromName = SMTP_FROM_NAME || "ALV Immobilier - noreply"

  // If host/port not provided, try detecting based on email domain
  if ((!host || !port) && user) {
    const lower = user.toLowerCase()
    if (lower.endsWith("@gmail.com") || lower.endsWith("@googlemail.com")) {
      host = "smtp.gmail.com"
      port = 465
      secure = true
    }
    // You can extend more providers here if needed:
    // else if (lower.endsWith("@outlook.com") || lower.endsWith("@live.com") || lower.endsWith("@hotmail.com")) {
    //   host = "smtp.office365.com"
    //   port = 587
    //   secure = false
    // }
    // else if (lower.endsWith("@yahoo.com") || lower.endsWith("@yahoo.fr")) {
    //   host = "smtp.mail.yahoo.com"
    //   port = 465
    //   secure = true
    // }
  }

  const missing: string[] = []
  if (!user) missing.push("SMTP_USER (or GMAIL_USER)")
  if (!pass) missing.push("SMTP_PASS (or GMAIL_APP_PASSWORD)")
  if (!host) missing.push("SMTP_HOST (auto-set for Gmail if SMTP_USER ends with gmail.com)")
  if (!port) missing.push("SMTP_PORT (auto-set for Gmail if SMTP_USER ends with gmail.com)")

  if (missing.length) {
    return { missing }
  }

  return {
    config: {
      host,
      port: port!,
      secure,
      user,
      pass,
      fromName,
    },
    missing,
  }
}

// Public: returns whether SMTP is ready (after resolution).
export function mailIsConfigured() {
  const { config } = resolveSmtpConfig()
  return Boolean(config)
}

// Normalize a string or string[] into a unique, comma-separated list for nodemailer.
function toList(value?: string | string[]) {
  if (!value) return undefined
  const arr = Array.isArray(value) ? value : [value]
  const cleaned = Array.from(
    new Set(
      arr
        .filter(Boolean)
        .map((s) => s!.trim())
        .filter((s) => s.length > 0),
    ),
  )
  return cleaned.length ? cleaned.join(", ") : undefined
}

export async function sendMail(params: {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
  attachments?: Attachment[]
  fromName?: string
}): Promise<boolean> {
  const { config, missing } = resolveSmtpConfig()
  if (!config) {
    logger.warn("sendMail: SMTP not configured", { missing })
    return false
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  })

  try {
    await transporter.verify()
    logger.info("SMTP server ready", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: mask(config.user),
    })
  } catch (error) {
    logger.error("SMTP verify error", error)
    throw new Error("Error verifying SMTP server.")
  }

  const mailOptions = {
    from: `"${params.fromName || config.fromName}" <${config.user}>`,
    to: toList(params.to),
    cc: toList(params.cc),
    subject: params.subject,
    html: params.html,
    attachments: params.attachments as any,
  }

  const info = await transporter.sendMail(mailOptions)
  logger.info("Email sent", { messageId: info.messageId, to: mailOptions.to, cc: mailOptions.cc })
  return true
}

// Export diagnostics to help debug configuration from an API route.
export async function smtpDiagnostics() {
  const { config, missing } = resolveSmtpConfig()
  if (!config) {
    return {
      configured: false,
      missing,
      resolved: null as any,
      verify: { ok: false, error: "Missing configuration" },
    }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  })

  try {
    await transporter.verify()
    return {
      configured: true,
      missing: [],
      resolved: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user, // no password exposed
        fromName: config.fromName,
      },
      verify: { ok: true },
    }
  } catch (e: any) {
    return {
      configured: true,
      missing: [],
      resolved: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromName: config.fromName,
      },
      verify: { ok: false, error: e?.message || String(e) },
    }
  }
}

// Helper function to detect the preview transport limitation
export function isPreviewTransportUnsupported(err: unknown) {
  try {
    const msg =
      (err as any)?.message ||
      (typeof err === "string" ? err : "") ||
      (err && typeof err === "object" ? JSON.stringify(err) : "")
    if (!msg) return false
    return /unenv|dns\.lookup is not implemented/i.test(msg)
  } catch {
    return false
  }
}

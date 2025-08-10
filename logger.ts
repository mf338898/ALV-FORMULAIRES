export class Logger {
  private static log(level: string, message: string, context?: any) {
    const timestamp = new Date().toISOString()
    // Using console.log for Vercel's serverless function logging
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        context: context || null,
      }),
    )
  }

  static info(message: string, context?: any) {
    this.log("info", message, context)
  }

  static warn(message: string, context?: any) {
    this.log("warn", message, context)
  }

  static error(message: string, error?: any) {
    const context = error instanceof Error ? { message: error.message, stack: error.stack } : { details: error }
    this.log("error", message, context)
  }

  static success(message: string, context?: any) {
    this.log("success", message, context)
  }

  static smtpConfig(config: any) {
    const sanitizedConfig = {
      ...config,
      GMAIL_APP_PASSWORD: config.GMAIL_APP_PASSWORD ? "********" : "Non configuré",
    }
    this.log("info", "Vérification de la configuration SMTP", sanitizedConfig)
  }
}

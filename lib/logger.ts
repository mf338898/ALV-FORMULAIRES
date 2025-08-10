export class Logger {
  private static log(level: string, message: string, context?: unknown) {
    const timestamp = new Date().toISOString()
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        context: context ?? null,
      }),
    )
  }

  static info(message: string, context?: unknown) {
    this.log("info", message, context)
  }

  static warn(message: string, context?: unknown) {
    this.log("warn", message, context)
  }

  static error(message: string, error?: unknown) {
    const context = error instanceof Error ? { message: error.message, stack: error.stack } : { details: error ?? null }
    this.log("error", message, context)
  }

  static success(message: string, context?: unknown) {
    this.log("success", message, context)
  }
}

export const logger = {
  info: (m: string, c?: unknown) => Logger.info(m, c),
  warn: (m: string, c?: unknown) => Logger.warn(m, c),
  error: (m: string, e?: unknown) => Logger.error(m, e),
  success: (m: string, c?: unknown) => Logger.success(m, c),
}

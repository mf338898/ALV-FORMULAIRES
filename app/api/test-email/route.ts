import { NextResponse } from "next/server"
import { smtpDiagnostics } from "@/lib/mail"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const diagnostics = await smtpDiagnostics()
    
    logger.info("Test email configuration", diagnostics)
    
    return NextResponse.json({
      success: true,
      diagnostics,
      message: diagnostics.configured 
        ? "Configuration SMTP détectée" 
        : "Configuration SMTP manquante"
    })
  } catch (error) {
    logger.error("Erreur lors du test de configuration email", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du test de configuration",
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { smtpDiagnostics } from "@/lib/mail"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    logger.info('Test email API called', { body })
    
    // Test de diagnostic SMTP
    const diagnostics = await smtpDiagnostics()
    
    return NextResponse.json({
      success: true,
      message: 'Test email API fonctionne',
      diagnostics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Erreur dans test-email API', { error })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du test email',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API test-email - Utilisez POST pour tester',
    endpoints: {
      POST: 'Test de diagnostic SMTP'
    }
  })
} 
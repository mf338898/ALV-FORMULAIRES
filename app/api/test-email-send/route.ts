import { NextResponse } from "next/server"
import { sendMail } from "@/lib/mail"
import { logger } from "@/lib/logger"

export async function POST() {
  try {
    const testEmailSent = await sendMail({
      to: process.env.TEST_EMAIL || "eliottfoveau62@gmail.com",
      subject: "Test Email - ALV Immobilier",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email ALV Immobilier</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .email-container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .content {
              padding: 35px 25px;
            }
            .test-info {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 25px 0;
              border-radius: 0 8px 8px 0;
            }
            .test-info h3 {
              margin: 0 0 15px 0;
              color: #667eea;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #495057;
            }
            .info-value {
              color: #6c757d;
            }
            .success-message {
              background-color: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 25px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px 25px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 5px 0;
              color: #6c757d;
              font-size: 14px;
            }
            .logo {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="content">
              <div style="text-align: center; margin-bottom: 30px;">
                <div class="logo">🏠 ALV Immobilier</div>
                <h1 style="color: #333; margin: 15px 0 10px 0; font-size: 24px;">Test d'envoi d'email</h1>
                <p style="color: #666; margin: 0; font-size: 16px;">Configuration SMTP validée</p>
              </div>
              
              <p>Bonjour,</p>
              
              <p>Cet email confirme que la configuration SMTP de <strong>ALV Immobilier</strong> fonctionne parfaitement.</p>
              
              <div class="test-info">
                <h3>📋 Informations de test</h3>
                <div class="info-row">
                  <span class="info-label">Date d'envoi :</span>
                  <span class="info-value">${new Date().toLocaleString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Serveur SMTP :</span>
                  <span class="info-value">${process.env.GMAIL_USER}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Statut :</span>
                  <span class="info-value">✅ Connecté et opérationnel</span>
                </div>
              </div>
              
              <div class="success-message">
                <strong>🎉 Configuration validée !</strong><br>
                L'envoi d'emails est maintenant opérationnel pour tous les formulaires.
              </div>
              
              <p>Vous pouvez maintenant soumettre des formulaires (locataire ou garant) et ils seront automatiquement envoyés par email.</p>
            </div>
            
            <div class="footer">
              <p><strong>ALV Immobilier</strong></p>
              <p>Service technique - Test d'envoi d'emails</p>
              <p style="font-size: 12px; margin-top: 15px;">
                Cet email a été généré automatiquement pour tester la configuration SMTP.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      fromName: "ALV Immobilier - Test Technique"
    })

    if (testEmailSent) {
      logger.info("Email de test envoyé avec succès")
      return NextResponse.json({
        success: true,
        message: "Email de test envoyé avec succès",
        timestamp: new Date().toISOString()
      })
    } else {
      logger.error("Échec de l'envoi de l'email de test")
      return NextResponse.json(
        {
          success: false,
          message: "Échec de l'envoi de l'email de test"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error("Erreur lors de l'envoi de l'email de test", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'envoi de l'email de test",
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
} 
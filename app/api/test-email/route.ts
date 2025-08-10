import { NextResponse } from "next/server"
import { smtpDiagnostics } from "@/lib/mail"
import { logger } from "@/lib/logger"

export const dynamic = 'force-static'
export const revalidate = false

export async function POST() {
  return new Response('API non disponible en mode statique', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
} 
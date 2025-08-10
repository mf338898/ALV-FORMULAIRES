import { NextResponse } from "next/server"
import { smtpDiagnostics } from "@/lib/mail"

export async function GET() {
  const diag = await smtpDiagnostics()
  // Never include secrets in the response
  return NextResponse.json(diag)
}

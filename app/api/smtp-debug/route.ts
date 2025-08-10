export const dynamic = 'force-static'
export const revalidate = false

export async function GET() {
  return new Response('API non disponible en mode statique', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST() {
  return new Response('API non disponible en mode statique', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

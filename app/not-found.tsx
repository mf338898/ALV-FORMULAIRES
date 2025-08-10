export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Page non trouvée</h2>
      <p className="text-gray-600 mb-4">La page que vous recherchez n'existe pas.</p>
      <a href="/" className="text-blue-600 hover:underline">
        Retour à l'accueil
      </a>
    </div>
  )
} 
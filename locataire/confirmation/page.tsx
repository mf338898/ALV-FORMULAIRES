import React from 'react';
import { useRouter } from 'next/router';

const ConfirmationPage = () => {
const router = useRouter();

return (
  <div className="container mx-auto px-4 py-8">
    {/* rest of code here */}
    <h1 className="text-2xl font-bold mb-4">Confirmation de votre réservation</h1>
    <p className="text-gray-600 mb-8">Votre réservation a été confirmée avec succès.</p>
    <button
      className="bg-blue-500 text-white py-2 px-4 rounded"
      onClick={() => router.push('/')}
    >
      Retourner à l'accueil
    </button>
  </div>
);
};

export default ConfirmationPage;

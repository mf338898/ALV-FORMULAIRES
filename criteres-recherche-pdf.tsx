import type { CriteresRecherche } from "@/lib/types"

const renderValue = (value: any) => (value ? value : <span style={{ color: "#999" }}>Non renseigné</span>)

export const CriteresRecherchePdf = ({ criteres }: { criteres: CriteresRecherche }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <style>{`
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .container { width: 90%; margin: auto; }
          h1 { text-align: center; margin-bottom: 30px; color: #1a3a6e; }
          .section { border: 1px solid #eee; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          p { margin: 10px 0; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Critères de Recherche</h1>
          <div className="section">
            <p>
              <strong>Nombre de chambres minimum:</strong> {renderValue(criteres.nombreChambres)}
            </p>
            <p>
              <strong>Loyer maximum souhaité:</strong> {renderValue(criteres.loyerMax ? `${criteres.loyerMax} €` : "")}
            </p>
            <p>
              <strong>Secteur souhaité:</strong> {renderValue(criteres.secteurSouhaite)}
            </p>
            <p>
              <strong>Rayon de recherche:</strong> {renderValue(criteres.rayonKm ? `${criteres.rayonKm} km` : "")}
            </p>
            <p>
              <strong>Date souhaitée d'emménagement:</strong> {renderValue(criteres.dateEmmenagement)}
            </p>
            <p>
              <strong>Préavis à déposer:</strong> {renderValue(criteres.preavisADeposer)}
            </p>
            <p>
              <strong>Raison du déménagement:</strong> {renderValue(criteres.raisonDemenagement)}
            </p>
            <p>
              <strong>Informations complémentaires:</strong> {renderValue(criteres.informationsComplementaires)}
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

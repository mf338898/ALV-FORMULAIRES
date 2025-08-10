# Configuration de l'envoi d'e-mails via SMTP

Ce projet utilise `nodemailer` pour envoyer des e-mails via un serveur SMTP. Pour que cela fonctionne, vous devez configurer les variables d'environnement nécessaires.

## Variables d'environnement requises

Vous devez définir les variables suivantes dans votre fichier `.env.local` ou directement dans les paramètres de votre environnement d'hébergement (par exemple, Vercel).

### Configuration pour Gmail (Recommandé)

Si vous utilisez Gmail comme serveur SMTP, il est fortement recommandé d'utiliser un **mot de passe d'application**.

1.  **Activez la validation en deux étapes** pour votre compte Google.
2.  **Générez un mot de passe d'application** : [Instructions de Google](https://support.google.com/accounts/answer/185833).
3.  Utilisez les variables d'environnement suivantes :

    -   `SMTP_HOST`: `smtp.gmail.com`
    -   `SMTP_PORT`: `465` (pour SSL) ou `587` (pour TLS)
    -   `GMAIL_USER`: Votre adresse e-mail Gmail complète (ex: `votre.nom@gmail.com`).
    -   `GMAIL_APP_PASSWORD`: Le mot de passe d'application à 16 caractères que vous avez généré.
    -   `EMAIL_TO`: L'adresse e-mail qui recevra les dossiers de location.
    -   `SMTP_FROM_NAME`: Le nom qui apparaîtra comme expéditeur (ex: "Dossiers de Location").

    **Exemple de configuration `.env.local` pour Gmail :**
    \`\`\`
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    GMAIL_USER=votre.adresse@gmail.com
    GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
    EMAIL_TO=destination@exemple.com
    SMTP_FROM_NAME="Dossier Location"
    \`\`\`

### Configuration SMTP Générique

Si vous n'utilisez pas Gmail, vous pouvez utiliser les variables SMTP génériques :

-   `SMTP_HOST`: L'adresse de votre serveur SMTP.
-   `SMTP_PORT`: Le port de votre serveur SMTP.
-   `SMTP_USER`: Votre nom d'utilisateur SMTP.
-   `SMTP_PASS`: Votre mot de passe SMTP.
-   `EMAIL_TO`: L'adresse e-mail qui recevra les dossiers de location.
-   `SMTP_FROM_NAME`: Le nom qui apparaîtra comme expéditeur.

**Note :** Le système utilisera en priorité les variables `GMAIL_USER` et `GMAIL_APP_PASSWORD` si elles sont définies. Sinon, il se rabattra sur `SMTP_USER` et `SMTP_PASS`.

## Tester la configuration

Une fois vos variables d'environnement configurées, vous pouvez tester la connexion au serveur SMTP en visitant la page `/test-smtp` de votre application déployée. Cela vous aidera à diagnostiquer les problèmes de connexion ou d'authentification.

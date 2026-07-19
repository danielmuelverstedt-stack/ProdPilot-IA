# Configuration Google Workspace et Gmail

## Périmètre

ProdPilot IA utilise le flux OAuth 2.0 existant côté serveur avec `googleapis`. Cette procédure prépare un environnement local sans modifier le flux OAuth ni l’architecture Mails.

Les portées restent limitées à l’identité du compte, à la lecture et au classement Gmail, ainsi qu’à la création de brouillons :

```text
openid
email
profile
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.modify
```

La portée `gmail.modify` permet d’ajouter ou retirer des libellés Gmail, d’archiver et de marquer lu/non lu. La portée `gmail.send` n’est pas demandée : ProdPilot IA ne peut toujours pas envoyer un message.

## 1. Créer le projet Google Cloud

1. Ouvrir la console Google Cloud.
2. Créer un projet ou sélectionner un projet dédié à ProdPilot IA.
3. Vérifier que le bon projet est actif avant de poursuivre.

> Capture à ajouter : sélection du projet Google Cloud.

## 2. Activer Gmail API

1. Ouvrir **API et services → Bibliothèque**.
2. Rechercher **Gmail API**.
3. Ouvrir la fiche puis cliquer sur **Activer**.

> Capture à ajouter : Gmail API activée.

## 3. Configurer OAuth

1. Ouvrir **Google Auth Platform**.
2. Dans **Branding**, renseigner le nom de l’application, l’adresse d’assistance et le contact développeur.
3. Choisir une audience interne à l’organisation Workspace ou une audience externe en mode test.
4. Pour une audience externe en test, ajouter l’adresse définie par `GOOGLE_ALLOWED_EMAIL` comme utilisateur test.
5. Déclarer uniquement les portées listées dans la section Périmètre.

> Capture à ajouter : audience et utilisateurs test OAuth.

## 4. Créer le client OAuth

1. Créer un client OAuth de type **Application Web**.
2. Ajouter exactement l’origine JavaScript autorisée :

   ```text
   http://localhost:3000
   ```

3. Ajouter exactement l’URI de redirection autorisée :

   ```text
   http://localhost:3000/api/auth/google/callback
   ```

4. Copier l’identifiant et le secret du client dans `.env.local` uniquement.

> Capture à ajouter : origine et URI de redirection du client OAuth.

## 5. Créer `.env.local`

À la racine du dépôt, copier `.env.example` vers `.env.local`, puis compléter les valeurs :

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_ALLOWED_EMAIL=
```

- `GOOGLE_CLIENT_ID` : identifiant du client OAuth **Application Web**, généralement terminé par `.apps.googleusercontent.com`.
- `GOOGLE_CLIENT_SECRET` : secret associé au client ; il ne doit jamais être copié dans du code client ou un fichier suivi par Git.
- `GOOGLE_REDIRECT_URI` : valeur locale imposée pour cette version. Toute différence produit une erreur de configuration explicite.
- `GOOGLE_ALLOWED_EMAIL` : adresse e-mail unique autorisée à terminer la connexion Google.

Les quatre variables sont obligatoires. Au démarrage, une valeur manquante ou invalide est signalée dans la sortie serveur sans interrompre le mode démonstration. La même erreur est affichée dans **Réglages → Connexions → Messagerie**. Aucune valeur sensible n’est incluse dans le message.

## 6. Lancer l’application

```powershell
npm run dev
```

Si la configuration est incomplète, corriger la variable nommée dans le message, puis redémarrer le serveur afin que Next.js recharge `.env.local`.

## 7. Connecter le compte

1. Ouvrir `http://localhost:3000/reglages/connexions/messagerie`.
2. Vérifier qu’aucune erreur de configuration Google n’est affichée.
3. Cliquer sur **Connecter Google Workspace**.
4. Choisir exactement le compte déclaré dans `GOOGLE_ALLOWED_EMAIL`.
5. Accepter les portées demandées.
6. Vérifier le retour vers l’application, l’adresse connectée et l’état de connexion.
7. Utiliser **Tester** avant de consulter les messages.

### Compte connecté avant l’ajout de `gmail.modify`

Un jeton déjà enregistré ne gagne jamais une nouvelle portée automatiquement. Si l’écran Mails indique **Autorisation Gmail à renouveler**, cliquer sur **Reconnecter Google**, sélectionner le même compte et accepter le nouvel écran de consentement. ProdPilot IA demande `access_type=offline`, `prompt=consent` et `include_granted_scopes=true` afin de conserver les autorisations existantes et de solliciter un nouveau jeton de renouvellement.

La reconnexion est volontairement interactive : l’application ne supprime pas le jeton existant et ne modifie aucun mail avant que Google ait confirmé `gmail.modify`. Si Google refuse cette portée, la lecture et les brouillons restent disponibles, mais toutes les commandes de classement restent désactivées avec une erreur `403` explicite.

## Sécurité et stockage des jetons

Les variables Google sont lues exclusivement par des modules marqués `server-only`. Elles ne portent pas le préfixe `NEXT_PUBLIC_` et ne sont pas transmises aux composants client. Les réponses API ne contiennent ni secret ni jeton, et les journaux de configuration n’affichent que le nom d’une variable ou une règle de validation.

Le dépôt local de développement écrit les jetons dans `.local-data/google-mail-tokens.json`, exclu de Git et désactivé en production. Avant tout déploiement partagé, il doit être remplacé par un stockage chiffré en base, lié à un utilisateur authentifié et à son entreprise, avec rotation, révocation, rétention et audit des accès.

## Limites connues et préparation de la production

- L’URI de redirection est volontairement limitée à `localhost` dans cette version. Une URI HTTPS de production nécessitera une évolution explicitement validée de la règle de configuration et du client Google Cloud.
- Le stockage local des jetons est réservé au développement individuel.
- L’authentification applicative et l’isolation serveur par entreprise doivent être en place avant une utilisation partagée.
- Microsoft Graph n’est pas implémenté.
- Les pièces jointes restent limitées à leurs métadonnées et le HTML non fiable n’est jamais exécuté.
- La création d’un brouillon reste distincte de tout envoi ; aucune fonctionnalité d’envoi n’est disponible.
- Les libellés de workflow sont créés à la demande après confirmation : `ProdPilot/À traiter`, `ProdPilot/En attente`, `ProdPilot/Traités` et `ProdPilot/Archivé par IA`.
- Une action appliquée à un fil modifie les messages actuellement présents dans ce fil. Gmail n’applique pas automatiquement ce changement aux futurs messages reçus dans le même fil.

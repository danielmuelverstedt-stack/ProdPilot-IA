# Configuration Google Workspace et Gmail

## Périmètre de cette version

ProdPilot IA utilise un flux OAuth 2.0 « application Web » côté serveur avec la bibliothèque officielle `googleapis`. La première version autorise uniquement `daniel.muelverstedt@tkmi.be`, lit les messages reçus depuis la veille et crée des brouillons Gmail après confirmation explicite.

Aucun e-mail n’est envoyé. L’archivage n’est pas disponible, car la portée `gmail.modify` n’est pas demandée. Microsoft Graph reste hors périmètre.

## Configuration Google Cloud requise

1. Ouvrir la [console Google Cloud](https://console.cloud.google.com/) et sélectionner ou créer un projet dédié à ProdPilot IA.
2. Ouvrir **API et services → Bibliothèque**, rechercher **Gmail API**, puis cliquer sur **Activer**.
3. Ouvrir **Google Auth Platform → Branding** et renseigner au minimum :
   - nom de l’application : `ProdPilot IA` ;
   - adresse d’assistance utilisateur ;
   - adresse de contact développeur.
4. Dans **Audience** :
   - choisir **Interne** si le projet appartient à l’organisation Google Workspace TKMI et que l’application reste strictement interne ;
   - sinon choisir **Externe**, conserver le statut **Test** et ajouter `daniel.muelverstedt@tkmi.be` comme utilisateur test.
5. Dans **Accès aux données**, ajouter exactement les portées décrites ci-dessous.
6. Dans **Clients**, créer un client OAuth de type **Application Web**.
7. Ajouter exactement cette URI de redirection autorisée :

   ```text
   http://localhost:3000/api/auth/google/callback
   ```

8. Copier l’identifiant client et le secret client dans `.env.local`. Ne pas télécharger ni placer un fichier de secrets dans le dépôt.

L’URI doit correspondre exactement, y compris le protocole, le port, le chemin et l’absence de barre finale. L’origine JavaScript autorisée n’est pas nécessaire pour ce flux entièrement côté serveur.

## Portées demandées

```text
openid
email
profile
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
```

- `openid`, `email` et `profile` servent à vérifier l’identité du compte connecté.
- `gmail.readonly` permet de lister et lire les messages.
- `gmail.compose` permet de créer les brouillons.
- `gmail.send` et `gmail.modify` ne sont pas demandées.

Google classe actuellement `gmail.readonly` et `gmail.compose` comme portées restreintes. Une application publique peut nécessiter une validation OAuth et, si les données concernées sont stockées ou transmises par un serveur, une évaluation de sécurité. Une application interne à une organisation Google Workspace peut relever d’un parcours différent défini par l’administrateur du domaine. Références : [portées Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes) et [OAuth pour applications serveur](https://developers.google.com/identity/protocols/oauth2/web-server).

## Variables d’environnement

Créer un fichier `.env.local` à la racine :

```dotenv
GOOGLE_CLIENT_ID=identifiant_du_client_web
GOOGLE_CLIENT_SECRET=secret_du_client_web
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_ALLOWED_EMAIL=daniel.muelverstedt@tkmi.be
```

Les quatre variables sont obligatoires et exclusivement serveur. Les deux dernières valeurs sont contrôlées par l’application et doivent rester exactement celles indiquées.

Le fichier `.env.local` est exclu de Git. `.env.example` contient uniquement les noms et valeurs non secrètes attendues.

## Test local

1. Installer les dépendances avec `npm install`.
2. Créer `.env.local` avec les quatre variables.
3. Démarrer l’application avec `npm run dev`.
4. Ouvrir `http://localhost:3000/reglages/connexions/messagerie`.
5. Cliquer sur **Connecter Google Workspace**.
6. Choisir `daniel.muelverstedt@tkmi.be` et accepter les portées affichées.
7. Vérifier le retour vers les réglages, l’adresse connectée et l’état de synchronisation.
8. Ouvrir **Mon Espace → Mails** et vérifier les messages reçus depuis la veille.
9. Ouvrir un message, choisir **Préparer une réponse**, vérifier les trois champs, cocher la confirmation puis créer le brouillon.
10. Vérifier dans Gmail que le brouillon existe et qu’aucun message n’a été envoyé.
11. Tester **Déconnecter** et vérifier que l’accès local est supprimé.

Si le projet OAuth externe reste en mode Test, Google limite les utilisateurs autorisés et les autorisations comprenant des portées Gmail peuvent expirer après sept jours. Le compte doit alors être reconnecté.

## Stockage local des jetons

Le dépôt `GoogleTokenRepository` isole la persistance de l’adaptateur Gmail. Son implémentation actuelle écrit un fichier serveur dans :

```text
.local-data/google-mail-tokens.json
```

Ce dossier est exclu de Git et l’écriture est désactivée lorsque `NODE_ENV=production`. Les jetons ne sont jamais retournés par les routes API ni transmis aux composants React.

Avant toute mise en production, remplacer ce dépôt local par un stockage en base de données :

- chiffré au repos avec une clé gérée séparément ;
- associé à l’utilisateur et à l’entreprise ;
- protégé par des contrôles d’autorisation serveur ;
- doté d’une rotation, d’une révocation et d’une politique de rétention ;
- audité sans journaliser les jetons ni le contenu des messages.

## Limitations connues

- Un seul compte autorisé, contrôlé par `GOOGLE_ALLOWED_EMAIL`.
- Stockage de jetons uniquement adapté au développement local et à un seul processus.
- Pas d’authentification applicative ni de gestion multi-entreprise.
- Messages limités à la veille et au jour courant, avec un maximum configurable entre 1 et 100 par appel API.
- Le HTML des e-mails n’est jamais rendu : il est converti en texte sûr si aucune partie `text/plain` n’existe.
- Les pièces jointes sont listées comme métadonnées mais ne sont pas téléchargées.
- Pas de pagination d’interface, recherche utilisateur, archivage, envoi, résumé IA ou Microsoft Graph.
- Le fallback de démonstration doit être activé explicitement depuis l’état vide ou l’état d’erreur.

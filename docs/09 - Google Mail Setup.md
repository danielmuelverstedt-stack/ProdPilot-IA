# Configuration Google Workspace et Gmail

## Périmètre

ProdPilot IA utilise un flux OAuth 2.0 serveur avec `googleapis`. Plusieurs comptes Google peuvent être enregistrés ; chaque jeton est associé à une clé composée du contexte utilisateur local, du contexte entreprise local, du fournisseur et de l’`accountId`. L’état OAuth signé expire après dix minutes et est vérifié avec un nonce `HttpOnly`.

La version lit les messages reçus depuis la veille et crée des brouillons après confirmation explicite. Elle ne demande ni `gmail.send` ni `gmail.modify` : aucun e-mail n’est envoyé et aucun message n’est archivé.

## Configuration Google Cloud

1. Créer ou sélectionner un projet dans Google Cloud.
2. Activer **Gmail API** dans **API et services → Bibliothèque**.
3. Configurer **Google Auth Platform → Branding** avec le nom `ProdPilot IA`, une adresse d’assistance et un contact développeur.
4. Choisir une audience interne à l’organisation Workspace, ou une audience externe en mode Test et ajouter chaque adresse autorisée comme utilisateur test.
5. Ajouter les portées :

   ```text
   openid
   email
   profile
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.compose
   ```

6. Créer un client OAuth **Application Web**.
7. Ajouter exactement l’URI de redirection :

   ```text
   http://localhost:3000/api/auth/google/callback
   ```

8. Copier l’identifiant et le secret uniquement dans `.env.local`.

## Variables serveur

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_ALLOWED_EMAILS=daniel.muelverstedt@tkmi.be,autre@tkmi.be
GOOGLE_ALLOWED_DOMAINS=tkmi.be
```

`GOOGLE_ALLOWED_EMAILS` et `GOOGLE_ALLOWED_DOMAINS` sont des listes séparées par des virgules. Une adresse est acceptée si elle apparaît dans la liste des adresses ou si son domaine est autorisé. En développement local uniquement, laisser les deux listes vides autorise les utilisateurs test du projet OAuth. En production, au moins une des deux politiques est obligatoire.

Toutes ces variables restent côté serveur. `.env.local` est exclu de Git et aucun jeton n’est retourné par une API.

## Test local

1. Créer `.env.local` avec les variables ci-dessus.
2. Lancer `npm run dev`.
3. Ouvrir `/reglages/connexions/messagerie`.
4. Cliquer sur **Connecter Google Workspace** et accepter les portées.
5. Vérifier le retour, l’adresse, l’état actif et **Tester**.
6. Connecter un second compte autorisé, alterner le compte actif et vérifier que Mails affiche uniquement le compte actif.
7. Tester **Reconnecter** puis **Déconnecter** sur un seul compte ; les autres comptes doivent rester intacts.
8. Créer un brouillon après avoir coché la confirmation ; vérifier qu’aucun e-mail n’est envoyé.

## Stockage des jetons et limites

Le dépôt local écrit `.local-data/google-mail-tokens.json`, exclu de Git et désactivé en production. Il préserve le jeton de renouvellement lors d’un rafraîchissement et supprime uniquement la clé du compte déconnecté.

Avant la production, il faut : authentifier l’utilisateur ; dériver utilisateur et entreprise depuis la session ; chiffrer les jetons en base ; appliquer les autorisations serveur ; auditer les accès sans contenu ni secret ; traiter rotation, révocation et rétention. Les pièces jointes restent des métadonnées, le HTML non fiable n’est jamais rendu, l’interface n’a pas de pagination et Microsoft Graph n’est pas implémenté.

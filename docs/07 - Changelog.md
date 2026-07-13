# Journal des modifications

Ce journal suit les changements significatifs du projet. Il n’annonce comme terminées que les capacités effectivement présentes dans le dépôt.

## [Non publié]

### Ajouté — 13/07/2026

- Page d’accueil « Mon Espace » avec navigation responsive, en-tête, six cartes métier et zone assistant temporaire.
- Pages « Module en préparation » pour le Planning, les OF, les Réunions, les Actions, le QRQC et le Parc Machines.
- Espace Mails responsive avec messages récents, urgents, à répondre, informatifs et à convertir en action.
- Actions de démonstration pour ouvrir, préparer une réponse, créer une action et ignorer un message, sans capacité d’envoi.
- Données de démonstration Google Workspace et emplacement réservé à Microsoft 365.
- Instructions opérationnelles `AGENTS.md` pour encadrer les changements, contrôles qualité, règles produit et exigences de sécurité.
- Architecture de messagerie indépendante du fournisseur avec types communs, interface `MailProvider` et factory.
- Fournisseur Google Workspace simulé couvrant les opérations communes de messagerie.
- Fournisseur Microsoft 365 temporaire, prêt à accueillir Microsoft Graph sans modifier l’interface métier.
- Écran responsive « Réglages → Connexions → Messagerie » avec états de connexion et actions simulées.
- Route serveur générique pour consulter, connecter et déconnecter les fournisseurs simulés.

### Modifié — 13/07/2026

- Contrat `MailProvider` recentré sur la connexion, la lecture, la recherche, les brouillons et l’archivage ; toute méthode d’envoi simulé a été retirée.
- Fournisseur Google Workspace simulé et adaptateur Microsoft 365 temporaire sélectionnés par la factory commune.
- App Router déplacé sous `src/app` et alias TypeScript aligné sur `src/`.
- Documentation produit et technique alignée sur la prise en charge de Google Workspace et Microsoft 365.

### Ajouté — 12/07/2026

- Documentation initiale en français : vision, feuille de route, architecture, modules, règles IA, backlog et journal des modifications.

## [Initialisation] — 12/07/2026

### Ajouté

- Projet créé avec Next.js, TypeScript et Tailwind CSS via Create Next App.
- Dépôt Git initialisé.
- Dépôt GitHub privé connecté comme dépôt distant.
- Extension Codex configurée pour accompagner le développement.
- Dossier `docs` créé.

### État fonctionnel lors de l’initialisation

- Le projet est encore au stade du socle technique et affiche l’écran de démarrage Next.js.
- Aucun module métier, connexion Gmail, import ERP ou planning n’est déclaré comme livré.

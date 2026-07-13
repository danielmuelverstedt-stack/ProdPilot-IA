# Journal des modifications

Ce journal suit les changements significatifs du projet. Il n’annonce comme terminées que les capacités effectivement présentes dans le dépôt.

## [Non publié]

### Démonstration métier complète — 13/07/2026

- Navigation centralisée vers onze modules et contrôle de visibilité/lecture selon le rôle de développement actif.
- Dépôt mock unique et typé pour les actions, OF, opérations, planning, machines, maintenances, réunions, demandes, qualité ERP et notifications, avec persistance et réinitialisation locales.
- Mon Espace alimenté par les compteurs partagés et assistant local déterministe sans appel OpenAI.
- Modules Actions et OF avec recherche, filtres, détail, historique, mutations locales et liens croisés.
- Planning par machine ou département, vues jour/semaine, déplacements confirmés, changement de machine/date, conflits de maintenance, surcharge et impression configurable.
- Workflows QRQC et Réunion Production avec progression, minuteur, notes, parking lot, compte rendu et création d’actions globales.
- Centre de demandes avec création, affectation, statuts, commentaires, chronologie et conversion en action.
- Parc Machines et maintenance légère reliés aux avertissements du planning et de Mon Espace.
- Qualité ERP avec filtres, score, e-mail mock copiable, résolution et création d’action, sans écriture ERP ni envoi réel.
- Analyses décisionnelles sans dépendance graphique externe.
- Centre de réglages complété avec Connexions, ERP, Notifications et réinitialisation des données de démonstration.
- Guides de données de démonstration, de recette utilisateur et des intégrations restantes.

### Stabilisé — 13/07/2026

- Validation structurelle complète et limitation de taille des sauvegardes de réglages avant import, avec gestion des erreurs de lecture.
- Repli sécurisé vers les réglages par défaut lorsqu’une valeur persistée est corrompue ou incompatible.
- Neutralisation des retours à la ligne dans les métadonnées MIME de réponse afin d’éviter toute injection d’en-tête.
- Protection de même origine et réponses non mises en cache appliquées à la route générique de connexion messagerie.
- Suppression du fournisseur Gmail simulé devenu inutilisé et des ressources SVG de démarrage non référencées.
- Libellés de Mon Espace et du centre de réglages alignés sur la coexistence des données locales et de la connexion Gmail réelle.
- README remplacé par des instructions opérationnelles propres au projet et un rappel des prérequis avant déploiement partagé.
- Routes principales et états sans identifiants Google vérifiés ; lint, TypeScript et build de production relancés en fin de session.

### Ajouté — 13/07/2026

- Registre local multi-comptes avec plusieurs comptes Google Workspace, Microsoft 365 ou Mock par utilisateur et invariant d’un compte actif unique.
- Gestion des comptes dans Réglages avec ajout, renommage, activation, test et déconnexion, sans lancement d’un flux OAuth réel.
- Adaptateur Mock lié au compte, capable de fournir immédiatement des messages isolés par `accountId` pour les trois fournisseurs de démonstration.
- Point d’entrée serveur `getActiveMailContext` utilisé par les listes, détails, brouillons et compteurs de Mon Espace afin que le changement de compte reste transparent pour les consommateurs et les futures fonctions IA.
- États et libellés du workspace Mails enrichis avec le nom, l’adresse et le fournisseur du compte actif.

- Flux Google OAuth 2.0 côté serveur avec contrôle d’état, restriction du compte autorisé, renouvellement des jetons et déconnexion.
- Routes serveur pour l’état Gmail, la liste, le détail des messages et la création confirmée de brouillons.
- Lecture des messages Gmail reçus depuis la veille avec expéditeur, destinataires, corps texte sûr, état de lecture et métadonnées de pièces jointes.
- Dépôt de jetons abstrait avec stockage local réservé au développement et exclu de Git.
- États de chargement, connexion requise, erreur, liste vide et fallback de démonstration explicite dans l’espace Mails.
- Guide `docs/09 - Google Mail Setup.md` pour la configuration Google Cloud et les tests locaux.

- Audit complet du prototype historique et plan de migration dans `docs/08 - Legacy Migration.md`.
- Centre de réglages en dix catégories avec navigation détaillée de Personnalisation.
- Designers configurables du menu principal et des cartes de Mon Espace.
- Identité société avec logo local, thème centralisé et aperçu immédiat des couleurs.
- Gestion locale des machines et référentiels de production, sans écriture ERP.
- Utilisateurs, huit rôles, matrice complète de droits par module et sélecteur de rôle de démonstration.
- Réglages d’impression A4/A3, portrait/paysage, seize colonnes ordonnables et aperçu.
- Sauvegarde, restauration, réinitialisation et journal local des réglages.
- Service TypeScript centralisé, versionné et migrable pour les réglages persistés dans `localStorage`.

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

- Fournisseur Google Workspace simulé remplacé par l’adaptateur Gmail API officiel, sans modifier le contrat fournisseur ni le placeholder Microsoft 365.
- Écran des connexions enrichi avec l’adresse connectée, la dernière synchronisation et les erreurs de connexion.
- Préparation de réponse reliée à la création d’un brouillon Gmail après validation explicite ; aucun envoi direct ajouté.

- Identité visuelle alignée sur le prototype historique : sidebar bleu nuit, surfaces claires, cartes compactes et tokens de thème.
- Shell applicatif rendu configurable, repliable et adapté aux écrans mobiles.
- Mon Espace rendu dynamique à partir de la configuration locale tout en conservant les indicateurs de messagerie simulés.
- Navigation étendue aux onze modules cibles avec placeholders propres pour les écrans non migrés.
- Référence legacy exclue du lint applicatif ; elle reste disponible uniquement pour l’audit.

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

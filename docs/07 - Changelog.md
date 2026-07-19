# Journal des modifications

Ce journal suit les changements significatifs du projet. Il n’annonce comme terminées que les capacités effectivement présentes dans le dépôt.

## [Non publié]

### Planning ERP opérationnel — 19/07/2026

- Ajout du moteur d’import contrôlé des exports Top et Details : reconnaissance automatique, validation des 33 colonnes, limite de taille, signature XLSX, empreintes SHA-256, anti-doublon et archivage immuable.
- Ajout d’une projection versionnée reliant 3 284 lignes Top, 3 004 OF uniques et 23 558 opérations, sans supprimer les lignes de commande multiples, opérations orphelines ou doublons détectés.
- Ajout du cockpit Planning sans temps de fabrication avec tableau de bord, pagination serveur, recherche différée, filtres, vues triées, édition rapide, glisser-déposer, détail OF et calcul du retard.
- Ajout des ajustements locaux conservés entre imports, des correspondances apprenantes machine ERP vers machine ProdPilot et de la catégorie OF sans machine.
- Extension du référentiel machine avec code ERP, suppression logique, favorite, capacité future et commentaires ; raccordement des modules Parc Machines et Qualité ERP aux données importées réelles.
- Ajout des contrôles qualité ERP, du score de vigilance transparent et du refus d’inventer les libellés des codes de statut absents des exports.
- Ajout de `read-excel-file@9.3.2` sous licence MIT, audit des alternatives et références dans `THIRD_PARTY_NOTICES.md`.

### Moteur de raisonnement local Mail — 15/07/2026

- Ajout d’un moteur typé et déterministe qui croise messages, réponses, brouillons, suivis, engagements, décisions, réunions, actions et sessions de la mémoire locale.
- Ajout des détections proactives de risques, attentes, recommandations, conflits, opportunités et chaînes de dépendance, avec faits sources, confiance, sévérité et action suggérée.
- Ajout des cartes « Assistant Recommendations » au centre de commande, sans appel payant au chargement et sans exécution automatique.
- Ajout d’une trace d’exécution locale ou cache/IA, de l’estimation de jetons et du verrou de consentement avant toute escalade IA.

### Mémoire métier locale de l’Assistant mails — 15/07/2026

- Ajout d’une base IndexedDB versionnée et de dépôts typés remplaçables, strictement isolés par compte, fournisseur, utilisateur, entreprise et mode.
- Ajout de l’index Mail local, de la persistance des sessions, des liens sources Gmail centralisés, de la recherche déterministe et de l’orchestration IA à trois niveaux.
- Ajout des décisions confirmées, demandes de réunion préparées, suivis Mail locaux et préférences de contact exclusivement confirmées.
- Ajout des Réglages Mails → Mémoire locale, des sauvegardes versionnées, de la rétention et des effacements avec confirmation.
- Interdiction technique des pièces jointes binaires, secrets, jetons, audio et HTML brut dans IndexedDB et les sauvegardes.
- Passage de `npm run dev` à Webpack par défaut, sans modifier le build de production.

### Ajustement de l’expérience de l’Assistant mails — 15/07/2026

- Remplacement du spinner technique de l’analyse par une progression visuelle douce, porteuse de sens et compatible avec la réduction des mouvements.

### Expérience focalisée de l’Assistant mails — 14/07/2026

- Remplacement du shell applicatif complet par une navigation de session minimale, sans modifier la navigation générale ni la liste Mail traditionnelle.
- Recomposition du parcours en accueil centré, séquence d’analyse calme, brief décisionnel, vue un-par-un par défaut, cartes de réponse sobres, conversation persistante et écran de fin dédié.
- Ajout du panneau accessible du message original, du groupe replié des messages sans action, de la navigation précédent/suivant et d’animations courtes compatibles avec la réduction des mouvements.
- Ajout de la validation conversationnelle de la proposition courante sur « OK » et de la validation des deux propositions sur instruction explicite, sans ajouter d’envoi.

### Assistant mails conversationnel — 14/07/2026

- Ajout de `/mails/assistant` avec démarrage explicite, brief déterministe, conversation, groupes expliqués, propositions versionnées et résumé de fin.
- Ajout d’une couche de commandes strictement typée, d’un résolveur de références naturelles et d’un moteur d’approbation séparant « OK » de l’intention explicite « Envoie ».
- Création de brouillons réels via le fournisseur actif ou simulés en démonstration, avec contrôle du compte, idempotence, synthèse partielle et garantie qu’aucun message n’est envoyé.
- Ajout de la dictée navigateur déclenchée par l’utilisateur, modifiable avant soumission et dégradée proprement lorsqu’elle est indisponible.
- Documentation des parcours, commandes, approbations, voix, recette, limites et protections de coût/confidentialité.

### Correctif du rendu de Mon Espace — 14/07/2026

- Correction du transport HTTP Gmail pendant le rendu Server Component : utilisation explicite du `fetch` serveur sans cache, évitant le chargement dynamique de `node-fetch` qui interrompait le flux RSC avec une erreur de clonage d’`ArrayBuffer`.
- Vérification de la page d’accueil avec le compte Google actif, sans modification du layout, des providers React, des écrans IA ou du comportement fonctionnel.

### Configuration, budget et diagnostic OpenAI — 14/07/2026

- Centralisation de la politique de budget IA avec limites mensuelles, quotidiennes, par utilisateur, par message et par brouillon ; dépassement administrateur désactivé par défaut et jamais automatique.
- Ajout d’un registre de prix administrable, vide par défaut, et d’estimations explicites par opération, période et cache uniquement lorsqu’un tarif officiel a été validé.
- Ajout du tableau Utilisation et budget avec filtres, jetons, appels, blocages, cache, états visuels et alertes internes.
- Ajout d’un diagnostic sans secret, d’une checklist de première utilisation et d’un test de connexion OpenAI minimal exécuté côté serveur.
- Journalisation centralisée de métadonnées sûres, blocage avant fournisseur et repli déterministe quand la configuration ou le budget ne permet pas l’appel.
- Documentation de la configuration OpenAI, de la séparation avec ChatGPT, de la facturation externe et des limites du stockage local de développement.
- Maintien forcé de l’analyse automatique, de la création automatique de brouillons et de l’envoi automatique à l’état désactivé.

### Configuration Google Workspace sécurisée — 14/07/2026

- Remplacement des anciennes listes d’autorisation Google par la variable serveur unique et obligatoire `GOOGLE_ALLOWED_EMAIL`.
- Validation centralisée de l’identifiant client, du secret, de l’URI de rappel locale et de l’adresse autorisée, avec messages précis sans valeur sensible.
- Ajout d’un contrôle non bloquant au démarrage du serveur et affichage de l’erreur de configuration dans Réglages → Connexions → Messagerie.
- Mise à jour de `.env.example`, de la règle Git pour les fichiers d’environnement et du guide de configuration Google Cloud pas à pas.

### Architecture Mails consolidée — 13/07/2026

- Découpage de l’espace Mails en barre de recherche et filtres, carte de message, pièces jointes, brouillon et états de chargement, vide, erreur ou connexion requise.
- Ajout d’une recherche typée couvrant contenu, correspondants, pièces jointes, dates, lecture, importance, indicateurs, compte, fournisseur, labels, tags, priorité et catégories.
- Extension et migration compatible des préférences par compte : affichage, lecture, conversation, signature, réponses, synchronisation, filtres, notifications et architecture des brouillons.
- Catalogue central des fournisseurs avec Google Workspace, Microsoft 365, IMAP futur et démonstration ; remplacement du placeholder Microsoft dupliqué par un adaptateur indisponible générique.
- Création des contrats déterministes de synthèse, classification, suggestion de réponse, priorité, détection d’action, extraction d’entités et conversation, sans appel OpenAI.
- Préparation typée des pièces jointes, révisions de brouillons, conversations et notifications sans téléchargement, OCR, envoi ni intégration externe supplémentaire.
- Séparation du dépôt local de comptes et de sa migration version 3 ; conservation des comptes et rejet des propriétés inconnues.
- Documentation complète dans `docs/18 - Mail Architecture.md`, avec composants, services, dépôts, UX, réglages, fournisseurs, IA, recette et intégrations futures.

### Gestion des comptes de messagerie enrichie — 13/07/2026

- Remplacement de la table des connexions par des cartes responsive affichant fournisseur, compte actif, type réel ou démonstration, état, dernières synchronisation et vérification.
- Ajout d’un choix clair entre Google Workspace, Microsoft 365 annoncé comme bientôt disponible et compte de démonstration, sans afficher le terme technique « Mock » à l’utilisateur.
- Ajout d’un résumé du compte actif et des services qui l’utilisent, y compris les futures fonctions IA.
- Centralisation par compte du nom affiché, de la langue, du ton de réponse, de la période de synchronisation, du volume, des filtres et des préférences de brouillons et pièces jointes.
- Migration compatible du registre local de comptes vers sa version 2, avec valeurs par défaut uniques et possibilité d’associer ultérieurement une organisation.
- Synchronisation manuelle limitée aux comptes Google réellement connectés, dialogues accessibles, confirmation de déconnexion et maintien garanti d’un compte de démonstration de repli.
- Envoi d’e-mails maintenu indisponible ; Microsoft Graph et toute connexion Microsoft réelle restent hors périmètre.

### Constitution produit — 13/07/2026

- Création de `docs/specifications` comme source fonctionnelle de référence pour tous les développements futurs.
- Formalisation de la vision, des dix principes fondamentaux, de l’architecture fonctionnelle, des règles produit, de la philosophie des Réglages, de l’expérience quotidienne, des règles de construction et de la gouvernance des évolutions.
- Définition d’une IA explicable qui assiste et propose sans décider ni déclencher d’action irréversible.
- Réalignement de la feuille de route sur l’ordre Assistant Mails, Conversation IA, Import ERP, Planning, Actions, Réunions, Parc Machines, Maintenance et Analyses.
- Clarification du positionnement : ERP, messagerie, planning et maintenance sont des sources ou contextes ; ProdPilot IA reste un assistant de pilotage et de décision.
- Ajout de l’obligation de lecture dans `AGENTS.md` et de références constitutionnelles dans la documentation existante, avec clarification des documents historiques et des sources de données de démonstration.

### Planning entièrement configurable — 13/07/2026

- Passage des Réglages en version 4 avec départements, capacités, priorités, statuts d’opération et de maintenance, types de tâches et types de maintenance typés, ordonnables, activables et colorables.
- Ajout des capacités par département ou machine, jours travaillés et exceptions datées, avec calcul de charge et de surcharge alimenté uniquement par la configuration.
- Machines, onglets de départements, légende, cartes, priorités et dialogues du Planning reliés à la projection centralisée des Réglages.
- Modèle d’impression extrait dans un service typé ; logo, identité, papier, orientation, colonnes visibles et ordre proviennent de Personnalisation → Impression.
- Migration automatique des anciennes listes de chaînes et de l’ancien jeu de quatre machines, en conservant les configurations personnalisées.
- Suppression des standards société auparavant présents dans les composants Planning ; les valeurs initiales sont définies une seule fois dans la configuration par défaut.

### Planning historique migré — 13/07/2026

- Audit de la référence historique et plan de migration détaillé dans `docs/17 - Legacy Planning Migration.md`.
- Remplacement de la liste de cartes du Planning par la grille mensuelle historique : machines en lignes, jours ouvrés et semaines en colonnes, charges journalières et période, colonne machine figée et défilement horizontal responsive.
- Restauration de la hiérarchie des filtres, de la légende et des couleurs d’état En cours, Planifiée, Bloquée, Maintenance et Divers.
- Déplacement par glisser-déposer ou dialogue explicite, changement de machine/date, réordonnancement confirmé, contrôle des conflits maintenance et persistance dans le dépôt mock partagé.
- Ajout d’OF compatibles depuis une cellule et planification de maintenances ou tâches libres, sans dupliquer les données de démonstration.
- Impression globale ou par machine reliée à l’identité société, aux colonnes et aux droits configurés dans les réglages.
- Référentiel Production complété avec les 28 machines historiques dans leur ordre d’affichage : 9 tours, 17 fraiseuses et 2 machines de découpe fil.
- Migration de l’ancien jeu initial de quatre machines vers le référentiel complet, tout en conservant les modifications locales et les listes volontairement personnalisées.
- Planning, filtres, onglets et impressions alimentés directement par les machines actives des Réglages ; ajout, modification, désactivation ou suppression pris en compte sans changement dans le Planning.
- Route `/planning` vérifiée localement ; TypeScript, ESLint et build de production validés.

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
## [Optimisation IA Mail] — 14/07/2026

### Ajouté

- Fournisseur OpenAI serveur avec API Responses, sorties JSON strictes et repli déterministe si la configuration manque.
- Analyse à la demande, génération/réécriture, éditeur avec historique et confirmation complète avant brouillon Gmail.
- Budgets, réduction de contexte, cache, déduplication en vol, limites quotidiennes et métriques sans corps d’e-mail.
- Réglages IA, neuf fixtures synthétiques, tests de régression et documentation dédiée (documents 20 à 24).

### Sécurité

- Aucun appel OpenAI automatique, aucune pièce jointe binaire, aucun secret côté client et aucune fonction d’envoi.
- Création Gmail étendue à À/Cc/Cci avec validation serveur et confirmation explicite séparée.

## [Brief de démarrage Mail local-first] — 15/07/2026

### Ajouté

- Brief visuel et parlé couvrant nouveaux messages, tâches locales, boîte à jour et indisponibilité Gmail.
- Synthèse vocale native avec indicateur, pause, arrêt, relecture et message de compatibilité.
- Statuts Mail typés, métriques locales isolées par compte et réglages de session/voix.
- Tests comportementaux des états boîte à jour, attentes locales, urgence, indisponibilité Gmail et démonstration, avec exclusion des doublons de la session courante.

### Sécurité et coûts

- Les briefs simples sont exclusivement déterministes et ne déclenchent aucun appel OpenAI.
- Aucun changement OAuth Gmail, aucune fonction d’envoi automatique et aucun fournisseur vocal externe.

## [Interaction vocale Mail] — 15/07/2026

### Ajouté

- Microphone visible avec clic, maintien du raccourci configurable, durée, transcription partielle/finale, annulation et erreurs de permission accessibles.
- Modes push-to-talk, clic et conversation continue explicitement activable, coupée à la perte de focus selon le réglage.
- Catalogue asynchrone des voix système, prévisualisation, style original « Assistant britannique » et diagnostic local.
- Contrat TTS remplaçable ; navigateur gratuit actif, fournisseurs premium déclarés mais non configurés.

### Garanties

- Aucun audio stocké, aucun appel TTS payant automatique, aucun changement OAuth Gmail et aucun envoi automatique.

## [Diagnostic microphone et voix système] — 15/07/2026

### Ajouté

- Sélection des entrées audio après permission explicite, diagnostic Windows-like et mesure locale du signal avec seuils centralisés.
- Enregistrement temporaire en mémoire pour réécoute unique, avec arrêt des pistes, fermeture AudioContext et révocation de l’URL.
- Chargement différé des voix, `voiceschanged`, retry, déduplication par URI, filtres, prévisualisation exclusive et repli stable.

### Confidentialité

- Aucun audio téléversé ou persisté ; seules les préférences de périphérique et de voix sont conservées.

## [Centre de commande de l’Assistant Mail] — 15/07/2026

### Modifié

- Accueil transformé en veille exécutive sombre : brief local, grands compteurs, travail préparé et attentes, sans chat ni saisie.
- Session active réorganisée autour des validations et d’une timeline d’exécution ; conversation compacte et repliable.
- Fin de session orientée résultats avec retour explicite à la veille.

### Coûts et sécurité

- Le rendu initial consulte uniquement la mémoire locale et les modèles déterministes. Aucun appel OpenAI, envoi ou mutation externe au chargement.

## [Fiabilisation du statut Gmail] — 19/07/2026

### Corrigé

- Le registre local des comptes Mail coordonne désormais toutes ses lectures et mutations dans une même file, puis remplace son JSON atomiquement avec des fichiers temporaires uniques.
- Le remplacement prend en charge les verrous de partage transitoires de Windows sans supprimer préalablement le fichier cible et nettoie systématiquement ses temporaires en cas d’échec.
- Une synchronisation Gmail réussie remet le compte à l’état `connected`, actualise la date de synchronisation et efface l’ancienne erreur ; la callback OAuth répare de la même façon un compte existant sans le dupliquer.
- La route des messages tente encore Gmail lorsqu’un compte OAuth conserve un ancien état d’erreur, puis renvoie des erreurs structurées `401`, `403`, `500` ou `502` au lieu d’un succès vide.
- L’interface distingue reconnexion, autorisation Gmail, stockage local et indisponibilité du fournisseur.

### Validation

- Le compte local a été réparé sans manipulation directe des jetons Google ni modification de la configuration OAuth.
- Validation runtime : `/api/mail/connection` répond `200` avec un compte connecté et `/api/mail/messages` répond `200` avec des messages Gmail réels.
- Tests automatisés : 83 réussites ; TypeScript, ESLint et build Next.js validés.

## [Gestion opérationnelle Gmail] — 19/07/2026

### Ajouté

- Portée OAuth `gmail.modify` avec détection du scope réellement enregistré, bannière de reconnexion et maintien de `gmail.readonly`/`gmail.compose`.
- Service de gestion séparant proposition, confirmation, exécution Gmail, relecture, journal d’activité et annulation exacte des anciens libellés.
- Quatre libellés Gmail idempotents : `ProdPilot/À traiter`, `ProdPilot/En attente`, `ProdPilot/Traités` et `ProdPilot/Archivé par IA`.
- Vues de workflow avec compteurs/non lus, actions de fil, lots `batchModify`, annulation sur la carte et historique explicable.
- Règles utilisateur isolées par compte, date de dernière utilisation, classification locale stricte et assistant de migration limité à 25 mails.
- Documentation d’architecture, guide OAuth actualisé et `THIRD_PARTY_NOTICES.md` avec révisions et licences auditées.

### Sécurité et fiabilité

- Aucune mutation n’est simulée dans React : Gmail est relu avant succès et une compensation restaure les instantanés en cas d’échec partiel.
- Questions, échéances, pièces jointes, importance et termes métier protégés empêchent l’archivage proposé.
- Les mutations automatiques sans confirmation précise restent désactivées conformément à la Constitution produit; aucun envoi ni suppression n’a été ajouté.
- Aucun secret, jeton ou corps intégral de mail n’est ajouté au journal; aucun code tiers n’a été copié ou adapté.

### Validation

- 95 tests réussis, TypeScript strict, ESLint, build Next.js et `git diff --check` validés.
- Runtime réel : compte Gmail connecté, 17 messages chargés en `200`, gestion accessible en `200`, ancien jeton sans `gmail.modify` et bootstrap correctement refusé en `403` jusqu’à reconnexion.
- L’URL OAuth locale vérifiée demande `gmail.modify`, `gmail.readonly`, `gmail.compose`, `access_type=offline`, `prompt=consent` et `include_granted_scopes=true`.

## [Planning ERP personnalisable et cache local] — 19/07/2026

### Ajouté

- Vues personnelles versionnées et isolées par entreprise locale, site et utilisateur actif, avec sauvegarde automatique derrière un dépôt navigateur.
- Ordre, largeur, visibilité et figement des colonnes, déplacement par glisser-déposer ou commandes clavier, zoom, filtres, tri et regroupements mémorisés.
- Regroupements article, OF, machine, atelier, client, famille, priorité, statut et date, avec ouverture et fermeture locale des groupes.
- Moteur déterministe d’articles identiques comptant les OF distincts, badges accessibles, couleurs stables, compteurs globaux et filtres multiples/uniques.
- Colonne Commentaires reliée aux ajustements locaux existants, sans écriture dans l’ERP.

### Optimisé

- La projection JSON et les lignes dérivées sont partagées dans le processus local et invalidées après import, ajustement ou correspondance.
- Les filtres Planning ne rechargent plus la synthèse des imports.
- Les réponses paginées transportent un résumé d’OF ; le détail complet n’est demandé qu’à l’ouverture de l’OF.
- Les changements purement visuels ne déclenchent aucune requête Planning.

### Mesures et validation

- Réponse de 100 lignes : 147 191 → 84 961 octets, soit environ 42 % de réduction.
- Requête chaude avec `Invoke-WebRequest` : environ 139–161 ms → 71–78 ms ; `curl` mesure 16–20 ms hors surcoût PowerShell.
- Pic après dix requêtes : environ 553 → 321 Mo ; mémoire stabilisée : environ 238 → 263 Mo en contrepartie du cache.
- Analyse de 23 558 opérations pour les articles identiques : 2,7 ms en médiane.
- Première requête froide encore à environ 1,2 s, à traiter par le futur dépôt indexé.
- 105 tests réussis ; TypeScript strict, ESLint et build Next.js 16.2.10 validés. Aucune dépendance ajoutée.

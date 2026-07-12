# Feuille de route — ProdPilot IA

## Légende des statuts

- **À faire** : travail non commencé.
- **En cours** : travail commencé mais non validé dans son ensemble.
- **Terminé** : critères d’acceptation satisfaits.
- **Bloqué** : dépendance ou décision empêche la progression.

## État actuel

Le dépôt contient le socle généré par Create Next App avec Next.js 16.2.10, React 19, TypeScript en mode strict et Tailwind CSS 4. Git et le dépôt distant sont configurés. La documentation produit et technique initiale est créée. L’application affiche encore l’écran de démarrage : aucun module métier, aucune authentification et aucune intégration ne sont considérés comme livrés.

| Phase | Statut | Résultat attendu |
|---|---|---|
| 0 — Fondations techniques | En cours | Socle fiable, conventions, qualité et sécurité minimales |
| 1 — Mon Espace | À faire | Poste de pilotage quotidien et navigation |
| 2 — Gmail | À faire | Consultation, résumé et brouillons confirmés |
| 3 — Import ERP | À faire | Import CSV/Excel contrôlé et données nettoyées |
| 4 — Planning | À faire | Planning machines issu des données ERP |
| 5 — Actions et réunions | À faire | Suivi coordonné des décisions et rituels |
| 6 — Parc machines | À faire | Vision machines et maintenance future |
| 7 — IA avancée | À faire | Assistant transversal, explicable et contrôlé |

Les phases indiquent l’ordre de priorité, pas des échéances calendaires. Les dates seront définies à partir de la capacité de l’équipe, des retours pilotes et des dépendances externes.

## Phase 0 — Fondations techniques

**Statut : En cours**

Objectif : disposer d’un cadre stable avant le développement métier.

Travaux : documentation, structure par fonctionnalités, conventions, contrôles TypeScript/ESLint/build, gestion des variables d’environnement, stratégie d’erreurs, premiers composants d’interface et préparation de l’authentification.

Critères d’acceptation :

- Les sept documents de référence sont cohérents et relus.
- Les commandes TypeScript, ESLint et build sont identifiées et exécutables.
- Les secrets restent exclusivement côté serveur et hors du dépôt.
- La structure cible et les règles de contribution sont documentées.
- Le socle responsive et accessible peut accueillir les premiers écrans.

## Phase 1 — Mon Espace

**Statut : À faire**

Objectif : créer l’écran d’accueil qui répond à la promesse centrale.

Travaux : shell applicatif, barre latérale, navigation responsive, blocs « Aujourd’hui », actions, alertes et intégrations simulées, états vide/chargement/erreur.

Critères d’acceptation :

- L’utilisateur accède à une vue « Mon Espace » claire sur ordinateur et mobile.
- La navigation permet d’atteindre les modules disponibles sans lien mort trompeur.
- Les priorités, actions et alertes sont hiérarchisées et leur source est visible.
- Les données simulées sont explicitement identifiées comme telles.
- Les principaux parcours sont utilisables au clavier.

## Phase 2 — Gmail

**Statut : À faire**

Objectif : traiter les messages importants depuis ProdPilot IA sans perdre le contrôle des envois.

Travaux : Google OAuth, connexion/déconnexion, liste des messages récents, détail, synthèse par IA, proposition d’action et génération de brouillon.

Critères d’acceptation :

- L’utilisateur autorise Gmail par OAuth avec les droits minimaux nécessaires.
- Les jetons sont protégés côté serveur et leur expiration est gérée.
- Les messages récents sont listés avec des états de chargement et d’erreur compréhensibles.
- Un résumé distingue clairement le contenu source du texte généré.
- Un brouillon peut être généré, relu et modifié.
- Aucun e-mail n’est envoyé sans confirmation explicite de l’utilisateur.

## Phase 3 — Import ERP

**Statut : À faire**

Objectif : obtenir des données ERP exploitables sans modifier la source.

Travaux : import CSV puis Excel, aperçu, mappage des colonnes, validation, stockage brut, nettoyage, rapport qualité et création d’OF nettoyés.

Critères d’acceptation :

- Un fichier supporté est importé sans écriture dans l’ERP.
- L’utilisateur mappe les colonnes et peut réutiliser une configuration validée.
- Chaque import conserve le fichier, la source, la date, l’entreprise et un historique d’exécution.
- Les données brutes sont immuables et séparées des données nettoyées.
- Les lignes rejetées et anomalies sont expliquées et téléchargeables.
- Un nouvel import ne remplace pas silencieusement des données validées.

## Phase 4 — Planning

**Statut : À faire**

Objectif : construire un planning machines actionnable à partir des OF nettoyés.

Travaux : calcul initial, vue par machine et période, dépendances de gamme, capacité, conflits, ajustements manuels et impression.

Critères d’acceptation :

- Seules les données nettoyées alimentent le planning opérationnel.
- Les OF sont positionnés selon leur gamme, leur durée et les contraintes disponibles.
- Les conflits, retards et données manquantes sont visibles.
- Les modifications manuelles sont tracées et ne modifient pas l’ERP source.
- Un planning lisible peut être imprimé par machine.

## Phase 5 — Actions et réunions

**Statut : À faire**

Objectif : relier les actions aux QRQC et réunions de production.

Travaux : création, attribution, échéance, statut et relance des actions ; préparation, conduite et compte rendu des rituels ; liens vers OF, e-mails et machines.

Critères d’acceptation :

- Chaque action possède un responsable, un statut et, si nécessaire, une échéance.
- Une action peut provenir d’un e-mail, d’un QRQC ou d’une réunion sans duplication.
- Les actions en retard ou sans responsable sont signalées.
- Les décisions et changements disposent d’un historique.
- La réunion produit un compte rendu et une liste d’actions traçables.

## Phase 6 — Parc machines

**Statut : À faire**

Objectif : centraliser les informations utiles sur les machines et préparer la maintenance.

Travaux : fiches machines, état, documents, événements, besoins futurs de maintenance et effets sur la capacité.

Critères d’acceptation :

- Les machines disposent d’une fiche et d’un état opérationnel compréhensible.
- Les arrêts ou maintenances planifiés peuvent affecter la capacité du planning.
- Les documents et événements sont accessibles selon les permissions.
- Le périmètre reste un suivi opérationnel léger et non une GMAO complète.

## Phase 7 — IA avancée

**Statut : À faire**

Objectif : permettre une interaction transversale et explicable avec les données autorisées.

Travaux : commandes en langage naturel, recherche contextuelle, synthèses multi-sources, suggestions d’arbitrage et préparation d’actions.

Critères d’acceptation :

- Les réponses indiquent leurs sources et signalent les informations manquantes.
- Les permissions et l’entreprise active limitent strictement le contexte accessible.
- Les actions engageantes nécessitent une confirmation explicite.
- Les requêtes, erreurs et validations utiles sont auditables sans journaliser inutilement des secrets.
- L’assistant refuse ou nuance une recommandation lorsque les données sont insuffisantes.

## Définition du MVP

Le MVP couvre les phases 0 à 4 dans un parcours cohérent : Mon Espace, connexion Gmail, consultation et synthèse de messages, brouillons confirmés, import ERP CSV/Excel avec mappage et qualité, OF nettoyés, planning par machine et impression. Les actions simples nécessaires à « Mon Espace » peuvent être incluses ; les réunions avancées, le parc machines complet et l’IA transversale restent hors MVP.

## Jalons

| Jalon | Contenu | Condition de validation |
|---|---|---|
| J0 — Socle prêt | Phase 0 | Contrôles qualité et règles de sécurité opérationnels |
| J1 — Poste de pilotage | Phase 1 | Mon Espace validé sur desktop et mobile |
| J2 — E-mails assistés | Phase 2 | OAuth, lecture, résumé et brouillon confirmés |
| J3 — Données fiables | Phase 3 | Import réel testé, anomalies tracées, OF nettoyés |
| J4 — MVP pilotable | Phase 4 | Planning machines généré, ajusté et imprimé |
| J5 — Boucle d’exécution | Phase 5 | Actions et réunions reliées et suivies |
| J6 — Capacité enrichie | Phase 6 | Machines et maintenances influencent le planning |
| J7 — Copilote transversal | Phase 7 | IA multi-sources sécurisée et explicable |

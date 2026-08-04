# Backlog — ProdPilot IA

La [Constitution produit](specifications/00%20-%20Vision.md) gouverne ce backlog. L’ordre des nouveaux développements suit [09 - Product Roadmap.md](specifications/09%20-%20Product%20Roadmap.md) : Assistant Mails, Conversation IA, Import ERP, Planning, Actions, Réunions, Parc Machines, Maintenance, puis Analyses.

Les cases cochées correspondent uniquement à un travail effectivement présent et relu dans le dépôt au 13/07/2026. L’ordre à l’intérieur de chaque section indique la priorité pratique ; il ne constitue pas un calendrier.

## Maintenant

- [x] Créer la Constitution produit complète dans `docs/specifications` et aligner Roadmap, Architecture, Modules et backlog sur cette référence.

- [x] Créer le registre multi-comptes de messagerie avec Google Workspace, Microsoft 365 et Mock, plusieurs comptes par fournisseur et un compte actif unique.
- [x] Faire dépendre Mon Espace, Mails et le futur contexte IA uniquement du compte de messagerie actif.
- [x] Stabiliser le socle existant : audit global, validation stricte des sauvegardes de réglages, nettoyage du code mort et contrôles qualité complets.
- [x] Auditer le prototype historique et documenter la stratégie de migration dans `docs/08 - Legacy Migration.md`.
- [x] Migrer l’identité visuelle historique vers un shell responsive avec menu configurable, en-tête, profil et notifications.
- [x] Moderniser les fondations visuelles du shell (typographie Geist, ombres, rayons, transitions) sans toucher aux couleurs configurables par l’entreprise dans Réglages.
- [x] Remplacer les pictogrammes maison par une bibliothèque d’icônes professionnelle (lucide-react) et rafraîchir la palette par défaut, en conservant le mécanisme de personnalisation par Réglages.
- [x] Rendre les cartes de Mon Espace configurables : ordre, visibilité, libellé, icône, couleur et taille.
- [x] Créer le centre de réglages local avec identité société, thème, production, utilisateurs, rôles, impression, sauvegardes et journal.
- [x] Centraliser les réglages dans un service TypeScript versionné basé sur `localStorage` et remplaçable par Supabase.
- [x] Créer les dépôts mock centralisés pour actions, OF, opérations, planning, machines, maintenance, réunions, demandes, qualité ERP et notifications.
- [x] Créer les routes fonctionnelles Actions, OF, Planning, Réunions, Suivi, Parc Machines, Qualité ERP et Analyses.
- [x] Relier les actions créées depuis les réunions, demandes et anomalies ERP au dépôt Actions global.
- [x] Ajouter l’impression configurable du planning, les confirmations de déplacement et les alertes de conflits.
- [x] Reproduire le Planning mensuel historique avec grille machines/jours, charges, filtres, déplacements, tâches libres et impression par machine.
- [x] Alimenter le Planning et son impression avec les 28 machines actives du référentiel centralisé des Réglages.
- [x] Piloter le Planning par les départements, capacités, priorités, statuts, types de tâches, types de maintenance, couleurs et modèle d’impression configurables.
- [x] Faire respecter la visibilité et le droit de lecture du rôle de développement dans le shell et sur les routes rendues.
- [x] Ajouter la réinitialisation des données métier de démonstration depuis Réglages.

- [x] Finaliser la documentation initiale du projet.
- [x] Créer les instructions opérationnelles de contribution dans `AGENTS.md`.
- [x] Créer le shell de « Mon Espace » avec ses états vide, chargement et erreur.
- [x] Créer la barre latérale et la navigation responsive et accessible.
- [x] Créer la première vue fonctionnelle de « Mon Espace » avec six cartes métier, des placeholders et une zone assistant.
- [x] Créer l’abstraction de messagerie indépendante du fournisseur et sa factory.
- [x] Créer l’écran Réglages → Connexions → Messagerie avec Google Workspace et Microsoft 365.
- [x] Créer le fournisseur Gmail simulé et l’emplacement Microsoft Graph.
- [x] Remplacer le fournisseur Gmail simulé par l’intégration Google Workspace côté serveur.
- [x] Créer une interface simulée pour les e-mails, clairement signalée comme telle.
- [x] Implémenter Google OAuth côté serveur avec les portées minimales et la restriction du compte autorisé.
- [x] Centraliser et valider au démarrage les quatre variables Google serveur, avec erreur explicite et configuration locale documentée.
- [x] Lister les messages Gmail reçus depuis la veille avec leur contenu texte et leurs métadonnées.
- [ ] Créer les résumés d’e-mails avec l’IA et afficher leur provenance.
- [x] Créer des brouillons Gmail modifiables après confirmation explicite, sans fonctionnalité d’envoi.
- [ ] Remplacer le dépôt local de jetons Google par un stockage chiffré associé à l’utilisateur et à l’entreprise.
- [x] Raccorder Google OAuth au registre multi-comptes avec des jetons strictement associés à chaque `accountId`.
- [x] Transformer Réglages → Connexions → Messagerie en cartes responsive avec résumé du compte actif, synchronisation, test et préférences centralisées par compte.
- [x] Structurer la recherche, les filtres, les pièces jointes, brouillons, conversations, notifications et services IA déterministes du domaine Mails derrière des contrats indépendants des fournisseurs.
- [x] Découper l’espace Mails en composants focalisés et documenter son architecture complète dans `docs/18 - Mail Architecture.md`.
- [ ] Implémenter Microsoft OAuth et Microsoft Graph.
- [ ] Ajouter l’authentification applicative avant tout déploiement partagé de l’intégration Gmail.
- [ ] Protéger toutes les routes de messagerie par une session applicative et une autorisation liée à l’entreprise.
- [ ] Ajouter des tests automatisés ciblés pour les réglages, le parseur Gmail, la génération MIME et les Route Handlers.
- [ ] Ajouter des tests automatisés de migration des Réglages et de projection du Planning, notamment pour les capacités exceptionnelles et les références désactivées.

## Ensuite

- [ ] Réduire le nombre d’appels Gmail nécessaires au compteur de Mon Espace et mettre en place une stratégie de synchronisation/cache maîtrisée.
- [ ] Étendre la compression côté client (`src/lib/image-file.ts`, déjà utilisée pour la photo machine) et, si besoin, un stockage dédié hors `localStorage` au logo société dans `IdentityThemeSettings.tsx`, seul autre écran à stocker une image en data URL dans les Réglages.
- [ ] Remplacer la persistance locale des réglages par un dépôt Supabase après validation de l’authentification et du modèle multi-entreprise.
- [ ] Faire respecter chaque droit créer/modifier/supprimer/imprimer/exporter côté serveur après ajout de l’authentification.
- [ ] Remplacer les dépôts mock par des dépôts Supabase après validation fonctionnelle.

- [ ] Valider le besoin puis intégrer Supabase pour l’authentification et/ou la persistance.
- [ ] Créer l’import ERP CSV/Excel sécurisé.
- [ ] Créer le mappage interactif des colonnes et les modèles réutilisables.
- [ ] Conserver les imports bruts, immuables et traçables.
- [ ] Créer les contrôles de qualité et le rapport d’anomalies.
- [ ] Transformer les imports validés en OF nettoyés liés à leur source.
- [x] Générer un planning machines de démonstration à partir du modèle canonique mock.
- [x] Détecter les conflits de démonstration et permettre des ajustements locaux confirmés.
- [x] Créer les plannings imprimables par machine avec identité, date et colonnes configurables.

## Plus tard

- [ ] Améliorer le QRQC et l’analyse des problèmes récurrents.
- [x] Structurer les réunions de production et leurs comptes rendus en mode démonstration.
- [x] Développer le suivi des machines et la planification légère de maintenance en mode démonstration.
- [x] Créer le centre de demandes internes en mode démonstration.
- [ ] Ajouter des commandes IA avancées, multi-sources et confirmées.
- [ ] Préparer puis déployer le mode SaaS multi-entreprise avec isolation vérifiée.
# Mise à jour IA Mail — 14/07/2026

- [x] Créer l’analyse structurée et les réponses assistées avec provenance, consentement et appels exclusivement explicites.
- [x] Centraliser les budgets, réduire le contexte, dédupliquer les appels, mettre les analyses en cache et afficher des métriques sûres.
- [x] Ajouter les limites internes mensuelles, quotidiennes et par opération, désactivables uniquement par un dépassement administrateur explicitement autorisé.
- [x] Ajouter le tableau d’usage, les alertes internes, le registre de prix vide par défaut, le diagnostic sûr et le test de connexion OpenAI.
- [x] Documenter l’activation, la séparation ChatGPT/API, le budget prudent et les limites des estimations internes.
- [x] Corriger le transport Gmail utilisé par Mon Espace afin d’éviter l’échec de clonage binaire pendant le rendu Server Component.
- [ ] Remplacer cache, métriques et coordination IA locaux par des dépôts distribués, chiffrés, transactionnels et multi-tenant avant production.
- [ ] Ajouter l’authentification applicative et l’autorisation administrateur serveur avant un déploiement partagé.
- [ ] Valider les prix officiels des modèles choisis avant d’activer les seuils monétaires.
- [ ] Ajouter des évaluations opt-in des modèles sur les fixtures synthétiques.

## Assistant mails conversationnel — 14/07/2026

- [x] Ajouter la session conversationnelle explicitement démarrée, le brief, les groupes, les références numérotées et les propositions de réponse.
- [x] Ajouter les commandes typées, les trois niveaux d’approbation, la création contrôlée de brouillons et l’interdiction d’envoyer sur « OK ».
- [x] Ajouter la dictée navigateur, le mode démonstration, l’audit sûr, les lots idempotents et le résumé de fin de session.
- [ ] Raccorder les actions, QRQC et réunions à leurs services centraux après validation explicite de ces domaines.
- [ ] Remplacer le dépôt de session mémoire par une persistance durable, chiffrée et multi-instance avant production.
- [ ] Concevoir séparément un éventuel envoi réel avec portée OAuth et relecture dédiée ; aucun envoi n’est disponible actuellement.
- [x] Recomposer `/mails/assistant` en expérience premium centrée sur les décisions : accueil minimal, analyse progressive, vue un-par-un, informations repliées, saisie persistante et écran de fin.

## Mémoire métier locale Mail — 15/07/2026

- [x] Ajouter une base IndexedDB versionnée, un adaptateur remplaçable et un dépôt typé isolé par compte, utilisateur, entreprise et mode.
- [x] Indexer localement les messages et sessions autorisés, avec empreintes, texte nettoyé configurable, liens sources et métadonnées de pièces jointes sans aucun contenu binaire.
- [x] Ajouter la recherche déterministe, les niveaux d’orchestration locale/cache/IA, la liste Mail « À faire », les décisions confirmées et les demandes de réunion préparées.
- [x] Ajouter les réglages de mémoire, la sauvegarde versionnée, les effacements sélectifs et les politiques de rétention.
- [ ] Remplacer ou synchroniser IndexedDB avec un stockage serveur chiffré, authentifié, multi-utilisateur et multi-instance avant production.
- [ ] Ajouter la reprise transactionnelle complète d’une session active après redémarrage du serveur et la synchronisation de conflits entre appareils.

## Brief de démarrage Mail — 15/07/2026

- [x] Toujours afficher un brief utile : nouveaux mails, travail local en attente, boîte à jour ou synchronisation indisponible.
- [x] Ajouter la lecture vocale navigateur automatique avec pause, arrêt, relecture et repli visuel.
- [x] Centraliser les statuts de workflow Mail et rendre les messages sans statut visibles dans le brief.
- [x] Ajouter les réglages de démarrage, de contenu, de voix et d’activation explicite du microphone.
- [x] Corriger le Morning Brief (écran de veille) qui ne parlait jamais : la lecture vocale automatique n’était câblée que dans une session déjà active, jamais à l’ouverture quotidienne.
- [x] Faire annoncer par la voix les mails déjà traités et classés sans action nécessaire depuis la mémoire locale, en plus des éléments en attente de validation ou de réponse.
- [ ] Valider manuellement les voix et la reconnaissance vocale sur les navigateurs cibles.

## Interaction vocale principale — 15/07/2026

- [x] Ajouter le clic pour parler, le push-to-talk configurable et les états visuels complets du microphone.
- [x] Ajouter la transcription intermédiaire/finale, l’annulation, la relecture et l’envoi automatique optionnel.
- [x] Centraliser la synthèse vocale derrière un fournisseur remplaçable et conserver les fournisseurs premium désactivés.
- [x] Exposer les réglages « Conversation mains libres » et « Envoyer automatiquement » : le champ `continuousConversation` existait déjà dans le modèle mais n’avait aucun contrôle dans Réglages, rendant la conversation vocale continue impossible à activer.

## Alignement visuel de la session mail — 19/07/2026

- [x] Remplacer le shell minimal et sombre de `/mails/assistant` par le shell applicatif standard (menu latéral, en-tête) partagé avec le reste de ProdPilot IA.
- [x] Recolorer l’ensemble de la session (veille, travail actif, timeline, fin de session) sur le thème clair et la couleur d’accent configurable de l’entreprise, au lieu de la palette sombre vert sarcelle / citron propre à ce module.
- [x] Supprimer `MailSessionShell`, devenu inutile après le passage à l’AppShell standard.
- [x] Ajouter le style original « Assistant britannique », le chargement asynchrone des voix système et leur prévisualisation.
- [ ] Valider les permissions, raccourcis réservés par le système et voix disponibles sur Edge et Chrome cibles.

## Diagnostic microphone et sélecteur vocal — 15/07/2026

- [x] Ajouter l’énumération explicite des microphones, leur sélection persistante et l’explication des libellés masqués avant autorisation.
- [x] Ajouter un test local limité dans le temps, un vumètre accessible, le pic, la qualité du signal et la réécoute temporaire.
- [x] Garantir l’arrêt des pistes, la fermeture Web Audio et la suppression de l’URL audio temporaire.
- [x] Fiabiliser le chargement, la déduplication, le filtrage, la prévisualisation et le repli des voix système.
- [ ] Recetter le niveau d’entrée et les périphériques réels sur Edge et Chrome sous Windows.

## Centre de commande Mail — 15/07/2026

- [x] Séparer veille, démarrage conversationnel, travail actif et synthèse de fin.
- [x] Remplacer l’accueil de type chatbot par un brief local sombre centré sur le travail déjà préparé.
- [x] Ajouter les grands compteurs, résultats exécutés, validations et timeline d’exécution.
- [x] Rendre la conversation secondaire sans retirer les commandes, la voix, les brouillons ou la mémoire.
- [ ] Recetter le rendu sombre, les transitions et la hiérarchie responsive avec les captures de référence sur mobile et grand écran.

## Moteur de raisonnement Mail — 15/07/2026

- [x] Ajouter un moteur déterministe dédié qui transforme la mémoire locale en risques, opportunités, recommandations, dépendances, blocages, attentes, conflits, échéances, engagements et impacts de décision.
- [x] Expliquer chaque détection par ses faits sources, sa confiance, sa sévérité et une action recommandée sans exécution automatique.
- [x] Ajouter les recommandations au centre de commande et journaliser le mode local, la raison, l’appel IA et l’estimation de jetons.
- [x] Couvrir les risques, attentes, recommandations, dépendances, conflits, opportunités et règles d’escalade IA par des tests ciblés.
- [ ] Ajouter une synthèse IA distante uniquement pour les cas complexes, après consentement explicite et affichage de l’estimation de coût.

## Fiabilité du statut Gmail — 19/07/2026

- [x] Sérialiser toutes les lectures et mutations du registre local des comptes Mail.
- [x] Remplacer atomiquement le registre avec reprise bornée des verrous de partage Windows et nettoyage des fichiers temporaires.
- [x] Réparer automatiquement le statut et l’erreur du compte après une synchronisation Gmail réussie ou une nouvelle callback OAuth.
- [x] Propager les échecs Gmail avec des statuts HTTP et des codes d’erreur structurés, sans les transformer en liste vide.
- [x] Couvrir concurrence, atomicité, récupération, callback, route et absence de manipulation des jetons par des tests ciblés.

## Gestion opérationnelle Gmail — 19/07/2026

- [x] Ajouter `gmail.modify`, détecter les anciens jetons en lecture seule et présenter une reconnexion explicite sans supprimer les jetons.
- [x] Centraliser les libellés, mutations unitaires/groupées, fils, relecture Gmail, journal local et annulation compensée.
- [x] Ajouter les vues Nouveaux, À traiter, En attente, Traités et Archivés par IA avec compteurs, actions unitaires et groupées.
- [x] Ajouter une classification stricte, des règles utilisateur visibles, des garde-fous métier et une migration bornée avec confirmation.
- [x] Auditer les références open source et documenter les licences sans reprendre de code tiers.
- [x] Vérifier qu’aucune référence à l’ancienne intégration audio retirée ne subsiste dans le projet suivi.
- [ ] Reconnecter manuellement le compte Google pour accorder `gmail.modify`, puis recetter les mutations réelles et leur annulation dans Gmail.
- [ ] Remplacer les journaux et règles locaux par un stockage chiffré, transactionnel et multi-tenant avant production partagée.
- [ ] Concevoir une automatisation éventuelle compatible avec la Constitution produit; les mutations sans confirmation précise restent désactivées.

## Planning ERP opérationnel — 19/07/2026

- [x] Reconnaître et valider les deux exports `REQ_MacroGamme_Top.xlsx` et `REQ_MacroGamme_Details.xlsx` à partir des fichiers réels.
- [x] Archiver les sources immuables, refuser un couple déjà importé, conserver l’historique et séparer les ajustements manuels.
- [x] Rapprocher Top, OF et opérations tout en conservant les lignes Top multiples, les opérations orphelines et les doublons exacts.
- [x] Ajouter le cockpit paginé sans temps de fabrication, les filtres, tris, recherche, édition rapide, glisser-déposer et détail d’un OF.
- [x] Ajouter les correspondances machines apprenantes, les machines non définies et la suppression logique du référentiel machine.
- [x] Relier les modules Qualité ERP et Parc Machines à la projection importée réelle.
- [x] Auditer les bibliothèques et projets de référence, intégrer uniquement `read-excel-file` sous MIT et documenter toutes les décisions.
- [ ] Confirmer avec le propriétaire ERP la sémantique de `Macro_Gamme_Pe` et le dictionnaire des codes `IDOperation_Status` 1 à 5.
- [ ] Ajouter les facteurs de priorité non disponibles dans les exports : client important, blocage assemblage, qualité produit et commande urgente.
- [ ] Centraliser les Réglages côté serveur avec authentification, autorisation, entreprise active, chiffrement et stockage multi-tenant avant production partagée.
- [ ] Évaluer une grille virtualisée uniquement si les mesures réelles dépassent les performances de la pagination serveur.

## Planning ERP personnalisable — 19/07/2026

- [x] Isoler les vues par entreprise locale, site et utilisateur actif derrière un dépôt de préférences versionné.
- [x] Enregistrer automatiquement plusieurs vues avec colonnes ordonnées, visibles, figées, redimensionnées, regroupement, tri, filtres et zoom.
- [x] Permettre le déplacement des colonnes par glisser-déposer et par commandes clavier, sans requête Planning.
- [x] Détecter les articles présents dans plusieurs OF avec un moteur déterministe testé, un badge, une couleur accessible et deux filtres rapides.
- [x] Ajouter les regroupements disponibles dans les sources : article, OF, machine, atelier, client, famille, priorité, statut et date.
- [x] Mettre en cache la projection et sa vue dérivée dans le processus local, avec invalidation après import, ajustement ou correspondance.
- [x] Empêcher les changements de filtres de recalculer la synthèse ERP et alléger les lignes de la réponse paginée.
- [ ] Remplacer la persistance navigateur des vues par un dépôt serveur authentifié, multi-appareil et multi-tenant avant production partagée.
- [ ] Virtualiser les lignes et colonnes après un prototype mesuré sur les volumes cibles ; la page reste actuellement limitée à 100 lignes.
- [ ] Ajouter le déplacement groupé transactionnel après création du moteur de décisions et d’un aperçu de confirmation complet.
- [ ] Ajouter les recommandations IA acceptées, ignorées ou reportées après définition des contraintes de regroupement et des sources autorisées.
- [ ] Définir et valider la formule de l’économie potentielle de changements de série avant d’afficher un pourcentage.

## Fiabilisation complète du module Mail — 19/07/2026

- [x] Remplacer la fenêtre Gmail limitée et filtrée par une pagination complète de `INBOX`, avec comparaison au total Gmail et cache serveur borné.
- [x] Ajouter `/mails/diagnostic` avec OAuth, comptes, volumes, date/durée, erreurs, OpenAI, quota, TTS, STT, micro, haut-parleurs et statut Plaud non fictif.
- [x] Relier la conversation naturelle explicitement déclenchée à OpenAI, conserver le contexte multi-tour et partager les sessions entre les bundles Next locaux.
- [x] Supprimer les délais artificiels de la conversation, ajouter l’annulation et séparer les préférences de réponse écrite et vocale.
- [x] Garantir le repli texte et un avertissement non bloquant quand la synthèse vocale échoue.
- [x] Valider TypeScript, lint, les tests Mail ciblés, la suite automatisée et les routes HTTP locales.
- [ ] Recetter manuellement TTS, STT, micro, haut-parleurs, alternance voix/clavier et interruption dans Edge et Chrome ; le navigateur intégré n’était pas exposé lors de la validation automatisée.
- [ ] Recetter la déconnexion/reconnexion OAuth, le changement de compte réel et la création de brouillons Gmail avec confirmation explicite.
- [ ] Remplacer le cache et les sessions en mémoire par un stockage chiffré multi-instance avant tout déploiement partagé.

## Registre unique d’actions — 20/07/2026

- [x] Remplacer le modèle `ProductionAction` (titre, département, priorité, statuts à quatre valeurs, commentaires, historique) par le modèle minimal demandé : `dateEncodage`, `introduitPar`, `origine`, `contextLink` (lien contexte cliquable), `description`, `responsable`, `échéance`, statut à trois valeurs fixes (À faire / Fait / Reporté), `dateCloture` et `remarque`.
- [x] Migrer automatiquement les données de démonstration existantes du modèle v1 vers le modèle v2 lors du prochain chargement, sans perte des actions déjà présentes en `localStorage`.
- [x] Rendre les origines et les colonnes du registre configurables dans Réglages → Actions (ajout, renommage, suppression et réordonnancement des origines ; affichage et ordre des colonnes) ; les trois statuts restent volontairement non configurables.
- [x] Créer un service central unique (`src/features/actions/services/action-service.ts`) et une fenêtre de saisie unique (`ActionFormDialog`) qui remplace les quatre formulaires ad hoc existants et est réutilisée par QRQC, Réunion de production, Centre de demandes, Parc machines, fiches OF et Qualité ERP, avec origine et lien contexte pré-remplis.
- [x] Ajouter les boutons de création d’action manquants sur les fiches Machine et OF, qui n’en possédaient aucun.
- [x] Ajouter les trois regroupements (par personne avec retards en premier, par origine, par échéance) et les filtres (statut, origine, responsable, recherche texte) sur la page Actions.
- [x] Ajouter l’étape 1 obligatoire des réunions QRQC et Production : revue des actions « À faire » de cette origine avec actions rapides Fait / Reporté / Réassigner, avant les nouveaux sujets ; le compte rendu de clôture affiche désormais le résultat de cette revue.
- [x] Relier la carte « Actions ouvertes » de Mon Espace au registre réel (ouvertes, en retard) au lieu de l’ancien comptage par priorité supprimé.
- [x] Remplacer la copie locale non persistée `session.actionsCreated` de l’assistant Mail par des brouillons d’action appliqués au registre réel côté client, avec origine « Mail » et lien vers le message d’origine.
- [x] Ajouter la revue des actions en langage naturel dans l’assistant de Mon Espace (revue, actions d’une personne, retards, création, fait / reporte / réassigne / remarque) avec reformulation et confirmation explicite avant toute mutation ; entièrement local et déterministe, sans appel IA payant.
- [x] Ajouter l’origine « Tournée atelier » à la liste configurable, en préparation du futur module correspondant.
- [ ] Construire le module Tournée atelier lui-même ; il n’existe aujourd’hui que dans `legacy-reference/` et n’a pas été repris dans ce chantier, à la demande explicite de l’utilisateur.
- [ ] Ajouter des tests automatisés ciblés pour le regroupement des actions (`action-grouping.ts`) et l’interprète de commandes de la revue IA (`action-assistant-interpreter.ts`), non couverts par la suite existante.
- [ ] Recetter manuellement dans le navigateur : revue IA conversationnelle, revue de réunion, création d’action depuis chaque module et rendu mobile du tableau du registre.
## Priorité — durabilité des décisions utilisateur

- [x] Séparer les décisions Planning des imports ERP et migrer automatiquement les ajustements locaux existants.
- [x] Ajouter identité stable, journal historique, réconciliation, états ambigu/orphelin, undo/redo événementiel et sauvegarde automatique locale.
- [ ] Exposer dans l’interface l’historique, les rapports d’import et les commandes Undo/Redo après recette utilisateur.
- [ ] Livrer l’export/import global de ProdPilot et une restauration testée couvrant Réglages, vues, décisions et tous les domaines.
- [ ] Remplacer le stockage local par un dépôt serveur transactionnel, chiffré, authentifié et sauvegardé avant tout déploiement industriel partagé.

## Orchestrateur central ProdPilot IA — 20/07/2026

- [x] Créer les contrats transversaux de capacités, outils, contexte, plan, résultat et trace d’exécution.
- [x] Ajouter un registre d’outils et un orchestrateur central sans logique métier Mail.
- [x] Faire passer les commandes de la session Mail existante par l’orchestrateur sans dupliquer les services et règles d’approbation.
- [ ] Remplacer les identités locales temporaires par le contexte d’authentification entreprise/utilisateur.
- [ ] Extraire progressivement les contrats centraux de mémoire conversationnelle, préférences et apprentissage avec migration des stores Mail existants.
- [ ] Raccorder les outils Planning, ERP, OF, Machines et Documents au fur et à mesure des besoins validés.
- [ ] Ajouter un transport de streaming générique lorsque le premier parcours utilisateur le nécessite.

## Correctif critique Assistant Mail voix — 20/07/2026

- [x] Corriger l’arrêt de `SpeechRecognition` provoqué par les rendus React pendant la transcription.
- [x] Stabiliser la lecture TTS et l’écoute automatique, sans réutiliser un même jeton de démarrage.
- [x] Migrer le raccourci initial `Ctrl+Espace` vers `F8` et privilégier le clic persistant afin d’éviter le conflit Plaud.
- [x] Ajouter le diagnostic intégré et conserver les anciens tours sous forme condensée pour les conversations longues.
- [ ] Recetter matériellement les scénarios de `docs/30 - Mail Assistant User Testing.md` dans Edge et Chrome.
- [ ] Ajouter le streaming réel des réponses ; le diagnostic l’annonce actuellement comme non activé.

## Mail Copilot — rédaction assistée et envoi manuel — 20/07/2026

- [x] Ajouter l’intention `compose_new_mail` (rédaction d’un mail neuf, pas seulement une réponse) au moteur de commandes Mail existant, raccordée à l’orchestrateur central (capacité `writing`, risque `prepare`) sans dupliquer de logique.
- [x] Résoudre le contexte de production (OF, client, échéance, statut) depuis le texte libre côté client, puis le transmettre au serveur — aucun accès direct du serveur au dépôt de démonstration client.
- [x] Ajouter `AiProvider.composeMail` (OpenAI structuré + démonstration déterministe) qui ne peut jamais inventer une adresse destinataire : une information manquante est signalée dans `missingInformation`, jamais devinée.
- [x] Ajouter les modèles de mails configurables dans Réglages → Mails (ajout, édition, suppression, réordonnancement), seedés avec trois exemples modifiables (relance client, relance fournisseur, notification qualité) au lieu d’une valeur en dur.
- [x] Implémenter l’envoi Gmail réel (`sendDraft`, `gmail.users.drafts.send`) strictement derrière un réglage de compte explicite (`sendingEnabled`, désactivé par défaut) et un bouton « Envoyer » dédié, hors du champ de conversation : l’IA ne peut jamais l’atteindre, seul un clic humain déclenche un envoi.
- [x] Ajouter la carte de relecture du brouillon (destinataire, objet, corps complets) avant tout clic d’envoi, avec gestion d’erreur claire (réglage désactivé, quota, authentification, hors ligne).
- [x] Relier la revue Mon Espace/Accueil : une demande de rédaction détectée y redirige vers le Mail Copilot avec l’instruction transmise, sans dupliquer le moteur de conversation dans le panneau local des Actions.
- [x] Réutiliser le pont Mail → Actions existant pour créer une action de suivi depuis un mail composé, uniquement sur demande explicite dans la conversation.
- [ ] Construire un sélecteur de modèle dans l’interface du Mail Copilot ; le modèle est aujourd’hui reconnu seulement s’il est cité par son nom dans la commande.
- [ ] Recetter manuellement un envoi réel après activation du réglage sur un compte Google Workspace connecté ; seul le chemin brouillon a été vérifié automatiquement.
- [ ] Ajouter des tests d’exécution réels (pas seulement statiques) pour `composeActiveMail` une fois qu’un harnais de test serveur Next.js sera disponible dans le dépôt.

## Calendrier Google réel dans Mon Espace — 21/07/2026

- [x] Créer un connecteur Google Calendar complet (`src/features/calendar/`) : types, contrat `CalendarProvider`, implémentation Google (`events.list`/`events.insert`) et démonstration, dépôt de compte, service de connexions — sur le modèle exact de Mail, sans dupliquer sa logique métier.
- [x] Connecter le Calendrier séparément de Mail (OAuth, jeton et scope propres, `calendar.events` uniquement) au lieu d’élargir silencieusement les droits accordés en connectant la messagerie — conforme à la règle du moindre privilège. Nécessite une nouvelle variable serveur `GOOGLE_CALENDAR_REDIRECT_URI` et une URI de rappel à déclarer dans Google Cloud (voir `.env.example`).
- [x] Ajouter Réglages → Connexions → Calendrier (connecter/activer/tester/déconnecter), sur le modèle simplifié de Connexions → Messagerie.
- [x] Afficher l’agenda du jour dans Mon Espace (nouvelle carte pleine largeur `TodayAgendaCard`), alimenté par le compte Calendrier actif ; état vide explicite si aucun événement ou compte non connecté.
- [x] Étendre l’assistant local de Mon Espace (déjà utilisé pour les Actions et la redirection Mail) : résumé de l’agenda du jour et proposition de planification d’un événement, toujours reformulée et soumise à confirmation explicite avant tout appel réseau — aucune heure ni adresse participant n’est inventée, seulement extraite du texte de la demande.
- [x] Ne toucher à aucun fichier du module Mail existant : le connecteur Calendrier duplique délibérément le petit mécanisme OAuth générique (client, état signé, échange de code, rafraîchissement) plutôt que de refactoriser le code Google Mail actif et réellement utilisé par l’utilisateur — préserve strictement le comportement Mail existant.
- [ ] Construire un sélecteur/vue de participants et un formulaire de création d’événement dans l’interface (aujourd’hui uniquement via la commande en langage naturel de l’assistant).
- [ ] Étendre l’agenda au-delà d’aujourd’hui (vue semaine) si le besoin est confirmé — hors périmètre de cette itération.
- [ ] Recetter manuellement une connexion Google Calendar réelle (nécessite de déclarer `GOOGLE_CALENDAR_REDIRECT_URI` dans Google Cloud puis `.env.local`) : agenda du jour, résumé par l’assistant, création d’un événement de test avec confirmation.

## Grosse phase d'optimisation Planning — 24/07/2026

Audité par un agent de recherche en lecture seule avant toute modification, puis un second passage d'analyse pour valider le design retenu. Objectif : rendre l'application plus fluide, en particulier le Planning Atelier et le Cockpit ERP qui manipulent environ 23 500 opérations (16,7 Mo).

- [x] Remplacer le rechargement complet du jeu de données après chaque mutation ponctuelle (priorité, machine, date, statut, commentaire) par une mise à jour optimiste de la seule ligne concernée (`applyOperationPatchLocally`), avec restauration automatique en cas d'échec du PATCH réel envoyé en arrière-plan. Auparavant, modifier une seule priorité désactivait et re-rendait toutes les lignes de toutes les machines pendant tout le temps d'un aller-retour réseau et d'un retraitement de 16,7 Mo.
- [x] Extraire `priorityScore`/`rowIssueLabels`/`collectIssueCategories` du service serveur (`erp-planning-service.ts`, `server-only`) vers un module partagé client-safe (`operation-quality-scoring.ts`), pour que la mise à jour optimiste et l'enrichissement serveur ne puissent jamais diverger.
- [x] Étendre les mutations groupées (glisser-déposer, Renuméroter) au même principe : patch optimiste en un seul passage, PATCH envoyés en parallèle (`Promise.allSettled`) plutôt qu'en boucle séquentielle, seules les lignes réellement en échec sont restaurées.
- [x] Ajouter `React.memo` aux lignes chaudes (`WorkshopOperationRow`, `OperationRow` du Cockpit ERP), et stabiliser (`useCallback`, lecture par ref) les fonctions qui leur sont passées en props — sans quoi la mémoïsation est neutralisée silencieusement par des callbacks recréés à chaque rendu.
- [x] Partager le fetch de `/api/erp/planning?scope=workbench&pageSize=50000` entre l'Atelier/Capacité/OF et le Cockpit ERP (`erp-planning-rows-fetch-cache.ts`) : le Workspace Planning garde ses trois onglets montés une fois visités, ce qui chargeait deux fois les mêmes 17 Mo dès que l'Atelier et le Cockpit ERP étaient tous deux ouverts dans la même session.
- [ ] Éclater le contexte Réglages en plusieurs stores pour réduire le rayon d'impact d'un changement de réglage sans rapport (aujourd'hui, `updateSettingsSnapshot` clone tout l'arbre `AppSettings` et un seul contexte React est utilisé par 33 fichiers) — changement structurant à l'échelle de toute l'application, volontairement hors périmètre de cette passe ; le `React.memo` ajouté neutralise déjà l'essentiel du symptôme.
- [ ] Virtualiser les lignes de l'Atelier (`rowsPerMachine` ne limite aujourd'hui que la hauteur CSS du cadre défilant, pas le nombre de lignes réellement montées dans le DOM) — pas de mesure réelle disponible pour confirmer que c'est nécessaire aujourd'hui ; à ne faire qu'après mesure, comme déjà noté ailleurs dans ce backlog.
- [ ] Recetter manuellement dans le navigateur : modifier une priorité/machine et confirmer que seule la ligne concernée se met à jour sans figer le reste de l'écran, que le Cockpit ERP reflète une modification faite depuis l'Atelier (et inversement), et qu'ouvrir les deux onglets ne déclenche qu'une seule requête réseau vers `/api/erp/planning`.

## Optimisation de performance — 22/07/2026

- [x] Corriger `ErpImportRepository.findDuplicate()` qui contournait le cache de projection ERP (16,7 Mo / 23 558 opérations) et relisait/reparsait le fichier entier à chaque tentative d’import.
- [x] Mémoriser le résultat filtré/trié des lignes de Planning ERP par signature de filtres, pour éviter de refiltrer/retrier les 23 558 lignes à chaque page ou tri identique.
- [x] Mémoriser (`useMemo`) les cartes et métriques dérivées de Mon Espace (`WorkspaceDashboard`), recalculées auparavant à chaque rendu même sur un changement de réglage sans rapport.
- [x] Éviter de refiltrer la liste des machines actives à chaque ligne du tableau Planning ERP (`ErpPlanningOperations`) ; filtrage effectué une seule fois par rendu.
- [x] Repasser `npm run dev` de Webpack à Turbopack (comportement par défaut de Next 16) après validation manuelle des routes principales — le build de production utilisait déjà Turbopack, seul le confort de développement change.
- [x] Ajouter un cache en mémoire avec invalidation à l’écriture directement dans `SerializedAtomicJsonFile` (aujourd’hui chaque dépôt qui l’utilise doit réimplémenter son propre cache ; la plupart ne le font pas). Bénéficie automatiquement aux 6 dépôts consommateurs, tous des singletons au niveau module.
- [ ] Vérifier manuellement le flux micro/voix de l’Assistant mails sous Turbopack (permissions, enregistrement temporaire, lecture) : les tests automatisés et la navigation par requêtes HTTP ne couvrent pas les API navigateur `getUserMedia`/audio.

## Fondation de synchronisation ERP — 22/07/2026

- [x] Isoler la construction de l'identité métier dans `OperationIdentityService`.
- [x] Centraliser la fusion quotidienne dans `SynchronizationService` sans écriture dans les données ERP source.
- [x] Conserver les opérations absentes avec `erpStatus = Removed` et les exclure du Planning actif.
- [x] Formaliser `PlanningDecision` avec priorité, ordre manuel, machine, commentaire, visibilité et verrouillage.
- [x] Générer et conserver les 100 derniers rapports de synchronisation, avec zéro décision perdue par construction.
- [ ] Valider un cycle réel avec deux exports ERP de jours consécutifs représentatifs ; aucun second jeu réel n'est fourni.

## Modèle métier OperationView — 22/07/2026

- [x] Créer `OperationView` comme contrat commun des modules Planning, IA, Dashboard et ERP Explorer.
- [x] Centraliser les règles de fusion machine, priorité, visibilité, commentaire et ordre manuel dans `OperationViewService`.
- [x] Exposer les indicateurs communs et préparer sans calcul les propriétés métier futures.
- [x] Migrer le Planning et ses regroupements vers `OperationView`, sans accès aux structures `ErpOperation` ou `PlanningDecision` dans les composants.
- [x] Conserver les opérations retirées dans les vues tout en les excluant du Planning actif.

## Vues de travail et filtres — 22/07/2026

- [x] Créer `FilterEngine`, indépendant de React, avec combinaison des catégories de filtres.
- [x] Générer toutes les options depuis `OperationView`, sans clients, machines ou statuts codés en dur.
- [x] Charger une fois le plan de travail complet puis rechercher, filtrer et paginer sans appel réseau.
- [x] Ajouter le panneau latéral repliable, les sélections multiples, le compteur et l'effacement global.
- [x] Migrer et persister les vues de travail version 2 dans le dépôt navigateur existant.
- [ ] Enrichir `OperationView.department` lorsqu'une source ERP ou un référentiel machine serveur faisant autorité sera disponible ; aucune valeur n'est inventée actuellement.
- [ ] Recetter visuellement le panneau de filtres dans Chrome et Edge ; aucun navigateur intégré n'était disponible pendant cette session.

## Correctif du déclenchement d'import ERP — 22/07/2026

- [x] Rendre « Contrôler et importer » cliquable avant toute sélection et lui faire ouvrir le sélecteur `.xlsx`.
- [x] Transmettre automatiquement la sélection à `importFiles`, afficher le chargement et conserver les erreurs visibles.
- [x] Réinitialiser la valeur native du sélecteur afin d'accepter deux sélections identiques successives.
- [ ] Recetter physiquement le sélecteur natif dans Chrome et Edge ; aucun navigateur intégré n'était disponible pendant la validation automatisée.

## Correctif du profil machine Details — 22/07/2026

- [x] Autoriser explicitement `CODE_MACH_INT` et `DESCRIPTION_MACHINE` comme colonnes optionnelles du fichier Details.
- [x] Projeter le code et le libellé machine vers l'opération ERP, avec `null` pour les cellules vides.
- [x] Normaliser sans correspondance floue la casse, les espaces, le BOM et les caractères invisibles des en-têtes.
- [x] Conserver le refus des colonnes réellement inconnues et valider l'import réel des 23 935 opérations.
## Réinitialisation locale des imports ERP — 22/07/2026

- [x] Retirer de l’état actif les imports ERP, la projection des OF et opérations, les ajustements, correspondances machines, rapports de synchronisation et décisions Planning associés.
- [x] Vérifier après redémarrage que les API ERP exposent zéro import, zéro OF et zéro opération.
## Fiabilisation des correspondances machines ERP — 22/07/2026

- [x] Supprimer le fallback qui utilisait directement `CODE_MACH_INT` comme identifiant machine ProdPilot.
- [x] Normaliser centralement les codes ERP lors de la lecture, de l’écriture, de la résolution et de l’overview, avec compatibilité des anciens mappings.
- [x] Enrichir l’interface existante avec description, volume, identifiant interne, statuts, recherche, filtre, modification et suppression.
- [x] Documenter les dépendances aux identifiants actuels et la numérotation métier future sans modifier les IDs.
- [x] Couvrir les cas mappé, non mappé, vide, supprimé, inactif, absent, normalisé, partagé et prioritaire par tests ciblés.
- [ ] Concevoir et faire valider une migration transactionnelle complète avant tout remplacement de `TOU-01`, `FRA-01`, `FIL-01`, etc. par la numérotation métier future.

## Photos machine hors quota Réglages — 23/07/2026

- [x] Sortir les photos machine de `MachineSettings`/`localStorage` vers un dépôt IndexedDB dédié (`machine-photo-indexeddb-adapter.ts`), pour lever la limite de quelques mégaoctets propre aux Réglages.
- [x] Migrer automatiquement les photos déjà enregistrées, une fois par session, et forcer une sauvegarde des Réglages pour purger l'ancien JSON.
- [x] Rebrancher fiche machine, cartes du Parc Machines et import groupé sur le nouveau store (`useMachinePhotos`/`setMachinePhoto`).
- [ ] Recetter manuellement dans le navigateur : migration automatique d'une photo existante, ajout/changement de photo sur la fiche, import groupé complet des 27 photos réelles, et confirmer que les Réglages exportés/sauvegardés ne contiennent plus de `photoDataUrl`.

## Import groupé des photos du parc — 22/07/2026

- [x] Ajouter un import de photos en masse par dossier sur `/machines`, avec association automatique par nom de fichier (nom technique, nom affiché ou identifiant), strictement sans correspondance approximative.
- [x] Vérifier la correspondance des 27 photos réelles du parc (`OneDrive - TKMI/Images`) contre le référentiel `default-settings.ts` : 27/27 associées sans ambiguïté après renommage de 4 fichiers (espacement de modèle, mot manquant, coquille et confusion de modèle).
- [ ] Recetter manuellement l'import dans le navigateur (l'exécution effective de l'import et l'écriture en `localStorage` n'ont pas été faites dans cette session).

## Fiabilisation de l'ajout de photo machine — 22/07/2026

- [x] Diagnostiquer et corriger l'échec silencieux à l'ajout de certaines photos : dépassement du quota `localStorage` non détecté, cache en mémoire laissé incohérent, aucun message affiché.
- [x] Compresser les photos côté client avant stockage (`src/lib/image-file.ts`) pour réduire fortement le risque de dépassement de quota.
- [x] Faire remonter une erreur explicite depuis `SettingsRepository.save()`/`updateSettingsSnapshot()` et l'afficher sur la fiche machine.
- [ ] Recetter manuellement l'ajout d'une photo volumineuse réelle (plusieurs Mo, issue d'un smartphone) dans le navigateur.

## Fiche machine unique et photo du parc — 22/07/2026

- [x] Rendre la fiche machine (`/machines/[id]`) accessible pour toutes les machines du référentiel, pas seulement les 4 machines de démonstration.
- [x] Faire de la fiche machine l'unique écran d'édition riche (identité, fiche technique, favori, suppression/restauration), en réduisant Réglages → Production → Machines à la liste, la création minimale et le réordonnancement.
- [x] Ajouter l'upload et l'affichage d'une photo par machine sur la fiche et sur les cartes du Parc Machines.
- [x] Rendre éditables depuis la fiche les champs techniques déjà affichés mais jusque-là non modifiables (fabricant, modèle, année, n° de série, robot, statut opérationnel), via le dépôt de démonstration existant.
- [x] Retirer le champ mort `Machine.photoUrl` du dépôt de démonstration, doublon dormant de `MachineSettings.photoDataUrl`.
- [ ] Recetter manuellement dans le navigateur : accès fiche pour une machine réelle sans entrée démo, édition de tous les champs, upload photo, suppression/restauration, création depuis Réglages.
- [ ] Ajouter des tests automatisés ciblés pour `machineSettingsService.updateIdentity/setPhoto/softDelete/restore` et `machineTechnicalService`, non couverts par la suite existante.

## Statut métier et visibilité des machines ERP — 22/07/2026

- [x] Faire de `MachineSettings.active` et `MachineSettings.visible` la source unique des états métier et d’affichage.
- [x] Limiter `ErpMachineMapping` à `erpMachineCode`, `machineId` et `updatedAt`.
- [x] Migrer automatiquement les anciens états ERP vers les fiches machines avant de nettoyer les mappings.
- [x] Modifier les états depuis la fiche machine via `MachineSettingsService` et les afficher uniquement en lecture dans l’ERP.
- [x] Utiliser activité et visibilité issues des réglages dans le Planning et les sélecteurs d’affectation.
- [x] Couvrir migration, transitions, filtres ERP, Planning, sauvegarde et anciens imports par des tests ciblés.

## Planning Atelier — 23/07/2026

- [x] Ajouter la vue « Atelier » au Workspace Planning (départements puis machines, panneaux repliables à l'état mémorisé), sans remplacer ni modifier le Planning capacité.
- [x] Faire consommer à l'Atelier exactement les mêmes sources que le Cockpit ERP (`OperationView`, `MachineSettings`, `DepartmentSettings`) via les mêmes services (`filterEngine`, `groupErpPlanningRows`), sans deuxième source de données.
- [x] Ajouter les colonnes personnalisables et les filtres (machines actives/inactives/masquées/sans OF, départements, recherche) demandés, avec préférences persistées par entreprise/site/utilisateur.
- [x] Afficher explicitement « Non disponible » pour le temps de fabrication et la charge machine plutôt que d'inventer une valeur, `OperationView` ne portant aucun champ de durée à ce stade.
- [x] Garantir qu'un changement d'onglet Cockpit ERP / Planning capacité / Atelier n'entraîne aucun rechargement réseau.
- [x] Dimensionner l'affichage de chaque machine sur un cadre défilant (réglage 10/25/50/Toutes lignes visibles, en-tête collant) sans jamais masquer d'opération.
- [x] Rendre les colonnes réordonnables par glisser-déposer des en-têtes, comme dans le Cockpit ERP.
- [x] Rendre la priorité modifiable dans l'Atelier et la synchroniser avec le Cockpit ERP via un signal partagé (`erp-planning-data-bus`), sans dupliquer la mutation existante.
- [x] Déplacer les filtres au-dessus du contenu (barre horizontale repliable) et distinguer visuellement les en-têtes de département.
- [x] Rendre la machine modifiable par ligne (sélecteur avec recherche par nom et vignette photo issue du Parc Machines), avec bascule immédiate dans le panneau de la nouvelle machine.
- [x] Ajouter le glisser-déposer des opérations à l'intérieur d'une même machine, avec recalcul automatique des priorités concernées.
- [x] Ajouter le tri croissant/décroissant de la colonne Priorité (bouton dans l'en-tête, cycle none/décroissant/croissant), persisté par préférence utilisateur.
- [x] Ajouter la colonne Retard, avec les mêmes seuils et libellés que le Cockpit ERP.
- [x] Généraliser le tri à une colonne active parmi Priorité/Retard (au lieu d'un tri dédié à la seule priorité), avec migration silencieuse de l'ancien réglage déjà enregistré.
- [x] Ajouter le badge « article présent dans plusieurs OF en cours » et le filtre Articles (tous / plusieurs OF / un seul OF) dans l'Atelier, en réutilisant `articleWorkOrderCount`/`articleColor` déjà calculés pour le Cockpit ERP, sans dupliquer la règle ni les libellés.
- [x] Ajouter un bouton « Renuméroter » au-dessus de chaque machine, qui réattribue la priorité de toutes ses opérations selon l'ordre actuellement affiché (recherche, tri et filtres compris) en réutilisant la même mutation que le glisser-déposer de réordonnancement, sans dupliquer de logique.
- [x] Rendre les colonnes du tableau redimensionnables à la souris (glisser le bord droit d'un en-tête), avec largeur persistée par colonne et par utilisateur/site/entreprise, pour lire un texte jusque-là coupé dans certains champs.
- [x] Corriger le bouton Renuméroter : il ne renumérotait visiblement que la première ligne. Deux causes distinctes corrigées : la numérotation réutilisait le schéma décroissant du glisser-déposer (999, 998…) au lieu d'une suite lisible 1, 2, 3… ; et le champ Priorité (non contrôlé) ne se remettait jamais à jour après une mutation groupée, quelle que soit l'opération concernée.
- [ ] Recetter manuellement dans le navigateur : bascule des trois onglets, persistance des colonnes/lignes affichées/tri priorité ou retard/largeurs de colonnes/panneaux repliés après rechargement, chaque filtre dont Articles, la modification de priorité/machine reflétée dans le Cockpit ERP, le glisser-déposer de réordonnancement et de redimensionnement, le bouton Renuméroter, et le rendu avec plusieurs milliers d'opérations réelles.
- [ ] Ajouter le temps de fabrication réel dès qu'une source ERP fiable existera, puis activer les colonnes/indicateurs de charge déjà préparés pour l'accueillir.
- [ ] Ajouter la modification de dates, les commentaires et l'ouverture réelle de l'OF — l'architecture est préparée mais ces fonctions ne sont pas implémentées.

## Planning capacité en phase avec l'ERP — 23/07/2026

- [x] Faire lire à Planning capacité les mêmes opérations ERP que l'Atelier (`useWorkshopOperations`), affichées au jour/machine de `plannedDate`/`machineId`, dès qu'un import ERP est actif (`useErpImportActive`).
- [x] Masquer les OF de démonstration dès qu'un import ERP existe ; les réafficher automatiquement tant qu'aucun import n'est présent (mode démonstration préservé).
- [x] Rendre les OF ERP déplaçables par glisser-déposer vers une autre machine/jour, écriture combinée `{ machineId, plannedDate }` via la même route PATCH que l'Atelier, reflétée immédiatement dans l'Atelier et le Cockpit ERP par le bus de synchronisation existant.
- [x] Rendre `durationHours` nullable sur tous les blocs de planning et adapter les sommes de charge/heures pour ne jamais fabriquer une valeur pour un OF ERP (compteur séparé « N op. ERP · temps n.d. »).
- [x] Extraire la table de statut ERP partagée entre l'Atelier et Planning capacité (`erp-operation-status-presentation.ts`), pas de duplication.
- [ ] Recetter manuellement dans le navigateur : bascule démonstration/ERP selon la présence d'un import réel, déplacement d'un OF ERP entre machines/jours, cohérence immédiate avec l'Atelier, aperçu et impression avec des blocs ERP.
- [ ] Ajouter l'affectation à une case d'un OF ERP jamais encore placé (aucune machine/date) — seul le déplacement d'un OF déjà placé est couvert actuellement.
- [ ] Ajouter le réordonnancement intra-cellule des blocs ERP (actuellement réservé aux OF de démonstration).

## Ordre des machines par glisser-déposer — 24/07/2026

- [x] Ajouter `machineSettingsService.moveMachine` : glisse une machine visible juste avant une autre, réassigne un ordre séquentiel à toutes les machines, et conserve la position relative des machines masquées (non concernées par ce glisser-déposer).
- [x] Rendre les cartes du Parc Machines (`/machines`) glissables-déposables pour réordonner selon le flux de travail, au lieu du seul tri par favoris puis ordre.
- [x] Retirer l'épinglage « favorites toujours en premier » de cette page, à la demande explicite de l'utilisateur : l'ordre affiché est désormais exactement celui du glisser-déposer, du début à la fin.
- [ ] Recetter manuellement dans le navigateur : glisser-déposer réel de plusieurs cartes, persistance après rechargement, cohérence avec Réglages → Production → Machines (même champ `order` partagé, fléches ↑/↓ toujours disponibles là-bas).

## Filtre par catégorie de tâche ERP — 24/07/2026

- [x] Créer le dictionnaire des 41 catégories de tâche ERP (`Code_Tâche`, fourni par l'utilisateur) dans `task-category-dictionary.ts`, avec un libellé générique « Catégorie inconnue » pour tout code non confirmé (dont les codes 1 et 2, dont la signification sera précisée plus tard) plutôt que d'inventer un texte.
- [x] Ajouter le réglage partagé `visibleTaskCategoryCodes` (vide par défaut : toutes les catégories masquées tant que l'utilisateur n'en démasque pas explicitement), pour découvrir les catégories une par une plutôt que tout afficher d'un coup.
- [x] Ajouter un contrôle compact « Catégories (X/41 visibles) » (recherche + case à cocher par catégorie, replié par défaut) partagé entre le Planning Atelier et le Cockpit ERP — un seul réglage, cohérent partout.
- [x] Appliquer le masquage aux deux seuls points de chargement client des opérations ERP (`useWorkshopOperations`, `ErpPlanningWorkspace`), pour qu'il s'applique cohéremment à l'Atelier, Planning capacité, le module OF et le Cockpit ERP sans dupliquer la règle.
- [ ] Ajouter la signification des codes 1 et 2 au dictionnaire dès qu'elle sera connue.
- [ ] Recetter manuellement dans le navigateur : démasquer progressivement des catégories depuis l'Atelier et depuis le Cockpit ERP, confirmer que l'effet est immédiat et identique dans les quatre vues (Atelier, Capacité, OF, Cockpit ERP).
- [x] Déplacer les filtres du Cockpit ERP d'une colonne latérale toujours dépliée vers une barre horizontale repliable au-dessus du tableau, sur le modèle du Planning Atelier (recherche, catégories et compteur toujours visibles ; le détail se déplie à la demande).

## Édition et création de machine centralisées — 24/07/2026

- [x] Ajouter le champ « Nom technique » aux paramètres modifiables de la fiche machine (`MachineIdentityPanel`, bouton « Modifier » déjà existant) ; il n'était éditable qu'à la création, jamais après.
- [x] Créer `machineSettingsService.createMachine` : point d'entrée unique de création (valeurs par défaut, refus d'un champ obligatoire manquant, refus d'un identifiant déjà utilisé) partagé par les deux écrans qui créent une machine.
- [x] Ajouter une fenêtre `MachineCreateDialog` partagée (sur le modèle d'`ActionFormDialog`/`PlanningDialogShell`) et un bouton « Ajouter une machine » directement sur le Parc Machines (`/machines`), en plus de Réglages → Production → Machines qui gardait déjà ce bouton.
- [x] Retirer l'ancien formulaire de création dupliqué dans Réglages → Production → Machines au profit de la fenêtre partagée, sans changement de comportement pour l'utilisateur.
- [x] Générer automatiquement l'identifiant de la nouvelle machine (`machineSettingsService.suggestMachineId`), sur le modèle de la numérotation déjà en place par département (TOU-01…, FRA-01…) : l'utilisateur n'a plus à le saisir, le champ Identifiant s'affiche en lecture seule dans la fenêtre de création.
- [ ] Recetter manuellement dans le navigateur : création d'une machine depuis le Parc Machines et depuis Réglages avec l'identifiant proposé automatiquement, changement de département recalculant bien l'identifiant, modification du nom technique depuis la fiche machine.

## Module OF en phase avec l'ERP — 23/07/2026

- [x] Faire lire à `/of` et `/of/[id]` les mêmes opérations ERP que l'Atelier (`useWorkshopOperations`), regroupées par OF via `groupErpPlanningRows`, dès qu'un import ERP est actif ; repli automatique sur les OF de démonstration sinon, strictement inchangés.
- [x] Ajouter le service testable `erp-work-order-summary.ts` (résumé, statut dérivé, filtres) pour ne pas loger cette logique dans les composants.
- [x] Retrouver les mêmes filtres qu'en démonstration (recherche, statut, machine, département, retard) alimentés par les données réelles ; pas de catégorie de priorité textuelle inventée pour l'ERP.
- [x] Unifier la fiche OF : le Cockpit ERP renvoie vers `/of/[id]` au lieu d'ouvrir sa propre fenêtre dupliquée (`WorkOrderDialog`, supprimée).
- [x] Étendre la table partagée de retard (`erp-operation-status-presentation.ts`) à la fiche OF, en plus de l'Atelier.
- [x] Relier le bouton « Ouvrir l'OF » de l'Atelier (jusqu'ici désactivé) vers `/of/[id]`.
- [ ] Recetter manuellement dans le navigateur : bascule démonstration/ERP sur `/of`, chaque filtre, ouverture d'une fiche OF réelle (dont une orpheline sans fichier Top), navigation depuis l'Atelier et le Cockpit ERP.
- [ ] Ajouter l'affectation d'une action liée à une opération ERP précise, si le besoin est confirmé (aujourd'hui l'action est liée à l'OF entier, comme en démonstration).

## Import/export CSV du Parc Machines — 24/07/2026

- [x] Ajouter l'export CSV du parc machine complet (identité `MachineSettings` + fiche technique `Machine` de démonstration, jointes par identifiant) depuis le Parc Machines, en réutilisant le même schéma de téléchargement (`Blob` + `<a download>`) que l'export des Réglages existant.
- [x] Ajouter l'import CSV : nouveau service pur et testable `machine-csv-service.ts` (délimiteur `;`, BOM UTF-8 pour Excel en locale française, guillemets/échappement conformes) sans dépendance ajoutée — décision explicite de l'utilisateur de rester en CSV plutôt qu'un vrai `.xlsx`, aucune bibliothèque d'écriture Excel n'existant aujourd'hui dans le projet.
- [x] Import strictement additif (décision explicite de l'utilisateur) : un identifiant déjà présent dans le parc est ignoré et signalé, jamais mis à jour ; réutilise `machineSettingsService.createMachine`/`updateIdentity`/`setInactive`/`setHidden` et `machineTechnicalService.updateTechnicalDetails`, sans dupliquer de logique de création.
- [ ] Recetter manuellement dans le navigateur : exporter le parc réel, l'éditer dans Excel (accents, valeurs vides, nouvelles lignes), réimporter, confirmer le rapport (créées/ignorées/erreurs) et l'apparition des nouvelles machines dans le Parc Machines et Réglages.
- [ ] Ajouter la mise à jour des machines existantes depuis l'import, si le besoin s'en confirme (explicitement hors périmètre de cette première version : les identifiants déjà connus sont ignorés, pas fusionnés).

## Catégorisation des machines par catégorie de tâche — 24/07/2026

- [x] Ajouter `MachineSettings.taskCategoryCode` (nullable) pour lier chaque machine à l'une des ~40 catégories de tâche ERP (Tournage, Fraisage, Affûtage, Rectification cylindrique…), assignable depuis la fiche machine (« Modifier » → nouveau champ Catégorie).
- [x] Déplacer le dictionnaire des catégories (`TASK_CATEGORY_LABELS`/`TASK_CATEGORY_CODES`, jusque-là dans `erp-import/config/`) vers `src/lib/task-category-dictionary.ts`, réutilisé tel quel par le Cockpit ERP/Atelier (visibilité des opérations) et par le Parc Machines (catégorisation des machines), sans dépendance croisée entre les deux features ni duplication de la liste.
- [x] Pré-catégoriser les machines du référentiel de démonstration selon leur département/type déjà curatés (Tournage → « Tournage », Fraisage → « Fraisage », Découpe fil → « Découpe fil », machines combinées Tournage/Fraisage → catégorie combinée dédiée) ; les machines créées ensuite (manuellement ou par import CSV) restent non catégorisées tant que l'utilisateur ne l'assigne pas lui-même.
- [x] Ajouter un filtre « Catégorie » au Parc Machines (grille inchangée, uniquement les catégories réellement utilisées apparaissent dans la liste, plus « Non catégorisées » si besoin), et afficher la catégorie de chaque machine sur sa carte.
- [ ] Recetter manuellement dans le navigateur : assigner une catégorie depuis la fiche machine, filtrer le Parc Machines par catégorie, confirmer que les machines de démonstration affichent bien leur catégorie pré-remplie.
- [ ] Ajouter la catégorie de tâche aux colonnes de l'import/export CSV, si le besoin se confirme (non incluse dans la première version du CSV, livrée avant cette fonctionnalité).

## Correction du faux Code ERP de la fiche machine — 24/07/2026

- [x] Supprimer `MachineSettings.erpCode` (texte libre saisi sur la fiche machine) : un audit a confirmé qu'il n'était jamais lu par le pipeline d'import ERP et n'avait donc aucun effet réel, malgré son nom — retiré du type, du service de réglages, de la migration du dépôt, du tableau Réglages → Production → Machines, de la carte du Parc Machines et des colonnes d'import/export CSV.
- [x] Afficher à la place, en lecture seule sur la fiche machine, le ou les vrais codes ERP mappés à cette machine (`ErpPlanningOverview.machineCodes`, la même source que le compteur « Codes ERP non mappés » du Parc Machines), avec un lien vers le panneau Correspondances ERP existant (`/planning`) pour les gérer — décision explicite de l'utilisateur plutôt que de dupliquer l'édition sur la fiche machine.

## Tri au clic + réorganisation des colonnes sur les tableaux de données — 24/07/2026

- [x] Créer une base commune réutilisable (`src/lib/table-columns.ts` : `cycleColumnSort`/`moveColumnId`/`sortRows`, purs et testés ; `src/lib/use-table-columns.ts` : persistance `localStorage` ; `src/components/ui/SortableColumnHeader.tsx` : glisser-déposer + bouton de tri), généralisée à partir du mécanisme déjà en place dans l'Atelier — c'est cette base que les futurs tableaux devront réutiliser plutôt qu'une nouvelle implémentation locale.
- [x] Ajouter le tri au clic + le glisser-déposer de colonnes au tableau Parc Machines (Réglages → Production → Machines) et au tableau Correspondances ERP (`ErpMachineMappingsPanel.tsx`) : deux tableaux qui n'avaient jusqu'ici aucun des deux. Sur le Parc Machines, le tri d'affichage est indépendant du champ métier `machine.order` ; les boutons ↑/↓ existants se désactivent pendant qu'un tri d'affichage est actif, pour ne jamais mélanger les deux mécanismes.
- [x] Ajouter le tri au clic au Cockpit ERP (`ErpPlanningOperations.tsx`) : le glisser-déposer de colonnes existait déjà, mais **aucune UI n'existait pour changer le tri des opérations** (`activeView.sort` était figé sur « priorité » sans aucun contrôle) — un vrai manque comblé, pas seulement une amélioration. Le clic sur les en-têtes Score/OF/Client/Article/Date/Machine sélectionne le mode de tri déjà existant ; un second clic sur la colonne déjà active inverse le résultat déjà trié (nouveau champ `sortDirection`), sans réécrire les comparateurs métier finement ajustés (tie-breaks par client/OF/machine/article).
- [x] Ajouter le tri au clic (sans glisser-déposer, décision explicite de l'utilisateur) au tableau Actions : l'ordre/la visibilité des colonnes restent pilotés par Réglages → Actions, seul le tri des lignes de chaque groupe est nouveau.
- [x] Exclu explicitement (décisions validées avec l'utilisateur) : la grille Planning (Gantt, pas une liste), les vues d'impression, les tableaux à lignes fixes (Qualité ERP, Notifications, matrice des permissions) et le tableau « Gamme complète » d'une fiche OF (l'ordre affiché est la gamme de fabrication réelle).
- [x] Déduplication associée, sans changement de comportement : `nextSortState` (Atelier) et `moveWorkshopColumn`/`moveErpPlanningColumn` délèguent désormais à `cycleColumnSort`/`moveColumnId`, au lieu de trois implémentations quasi identiques.
- [ ] Recetter manuellement dans le navigateur : sur chacun des 4 tableaux, trier par différentes colonnes, vérifier le cycle décroissant/croissant/aucun tri, glisser une colonne et confirmer que l'ordre persiste après rechargement de la page.

## Planning organisé par catégorie de tâche + postes de travail — 25/07/2026

- [x] Ajouter le contrôle de catégories (déjà partagé Atelier/Cockpit ERP) à Planning capacité, qui n'en disposait pas alors que ses opérations ERP étaient déjà silencieusement filtrées par ce même réglage partagé (`visibleTaskCategoryCodes`) dès qu'un import ERP est actif.
- [x] Regrouper les machines de Planning capacité en sections dépliables par catégorie de tâche (`groupMachinesByTaskCategory`, `src/lib/task-category-grouping.ts`), activées/désactivées via ce même réglage partagé : une catégorie cochée affiche une section repliable/dépliable avec ses machines, une catégorie décochée la masque entièrement — Planning capacité n'affiche donc plus aucune machine tant qu'aucune catégorie n'a été activée au moins une fois, comme l'Atelier et le Cockpit ERP aujourd'hui.
- [x] Ajouter à l'Atelier un sélecteur « Regrouper par : Département / Catégorie » (`WorkshopViewState.groupBy`, nouveau champ additif, défaut `department` : aucun changement pour l'existant tant qu'on ne bascule pas) qui réutilise le même moteur de regroupement partagé (`buildWorkshopCategories`, miroir de `buildWorkshopDepartments`) et les sections/écrans déjà existants sans aucune modification.
- [x] Ajouter les « postes de travail » : une catégorie sans machine physique (ex. Ébavurage) peut désormais recevoir un ou plusieurs postes créés depuis la fenêtre « Ajouter une machine » (case à cocher dédiée), qui sont de simples `MachineSettings` avec `kind: "poste"` — donc planifiables immédiatement (capacité, glisser-déposer, Atelier) sans aucune plomberie nouvelle, et visibles dans le Parc Machines avec un badge « Poste » les distinguant des machines physiques.
- [x] Ajouter l'entrée « Non catégorisées » au contrôle de catégories partagé (`TaskCategoryVisibilityControl`), pour pouvoir aussi afficher/masquer explicitement les machines et postes sans catégorie assignée dans les sections dépliables.
- [x] Hors périmètre explicite (validé avec l'utilisateur) : le Cockpit ERP garde son tableau ERP plat existant (paginé/volumineux, 23 500+ lignes) — seule la cohérence du réglage partagé de catégories compte, déjà assurée ; pas de colonne CSV pour `kind` (les postes se créent uniquement via la fenêtre de création, pas via import CSV) ; aucun changement aux onglets de la fiche machine pour un poste (mêmes onglets qu'une machine, champs non pertinents affichés « À compléter »).
- [ ] Recetter manuellement dans le navigateur : créer un poste « Ébavurage », l'assigner à la catégorie Ébavurage, activer/désactiver des catégories dans les 3 vues (Cockpit ERP, Planning capacité, Atelier) et vérifier la cohérence du même réglage partagé, glisser-déposer une opération sur un poste, replier/déplier une section de catégorie dans Planning capacité, confirmer l'absence de régression sur le Cockpit ERP.

## Atelier : navigation par onglets de département + catégories à l'intérieur — 25/07/2026

- [x] Remplacer le sélecteur « Regrouper par : Département / Catégorie » (ajouté puis retiré dans la même session, jamais publié) par une navigation par onglets de département en haut de l'Atelier (`WorkshopDepartmentTabs.tsx`) : un seul département affiché à la fois, sans onglet « Tous » (décision explicite de l'utilisateur).
- [x] À l'intérieur de chaque onglet de département, regrouper les machines/postes en sections dépliables par catégorie de tâche (`buildWorkshopCategories`, désormais scopée à un département via un nouveau paramètre optionnel), sur le même réglage partagé « Catégories » que Planning capacité et le Cockpit ERP : une catégorie activée affiche ses machines de ce département, une catégorie désactivée les masque.
- [x] Retirer le filtre « Départements » à cases à cocher du panneau Filtres, devenu redondant avec les onglets (un seul département visible à la fois).
- [x] Persister l'onglet de département actif (`WorkshopViewState.selectedDepartmentId`, additif, `null` par défaut ⇒ repli sur le premier département actif) dans les mêmes préférences navigateur déjà utilisées pour les colonnes/filtres/tri de l'Atelier ; conservé par `resetWorkshopView`, comme les sections repliées.
- [x] `buildWorkshopDepartments` (regroupement par département, sans catégories) reste dans le code et ses tests, réutilisable plus tard, mais n'est plus appelé par l'Atelier — remplacé par `buildWorkshopCategories` scopée au département de l'onglet actif.
- [ ] Étendre la même structure (onglets département + catégories) à Planning capacité, si le besoin se confirme — explicitement prévu par l'utilisateur pour une prochaine itération, hors périmètre de ce chantier.
- [ ] Recetter manuellement dans le navigateur : naviguer d'un onglet de département à l'autre, confirmer que les catégories activées (réglage partagé) restent les mêmes d'un onglet à l'autre mais montrent des machines différentes selon le département, glisser-déposer une opération dans une section de catégorie, confirmer que l'onglet actif survit à un rechargement de page.

## Départements paramétrables (Atelier) — catégories/machines liées, indépendant du département physique — 25/07/2026

- [x] Rendre le contenu d'un onglet département entièrement piloté par une configuration explicite (`DepartmentSettings.linkedCategoryCodes`/`linkedMachineIds`, nouveaux champs additifs) au lieu du département physique de la machine (`MachineSettings.departmentId`, inchangé partout ailleurs) : une machine peut désormais apparaître dans l'onglet Qualité pour une opération catégorie 20, même si elle reste physiquement en Fraisage. Corrige le vrai problème derrière la demande initiale : les onglets Qualité et Maintenance étaient structurellement vides faute de machine physiquement rattachée.
- [x] Les 5 départements de démonstration reçoivent un mapping par défaut cohérent (Tournage→catégorie 5, Fraisage→27, Découpe fil→39, Qualité→20, Maintenance→23), rétro-rempli automatiquement pour les installations existantes via la fusion générique déjà en place (`migrateStandards`), sans bump de version des Réglages.
- [x] Créer `department-settings-service.ts` (miroir de `machine-settings-service.ts`) : `createDepartment`/`updateDepartmentLinks`/`deleteDepartment`, ce dernier avec une garde absente de l'éditeur générique existant (Réglages → Production → Départements, qui supprime aujourd'hui sans aucune vérification) — refuse de supprimer un département encore physiquement rattaché à des machines.
- [x] Ajouter à l'Atelier un onglet « ＋ » (création) et une icône « ✎ » réservée à l'onglet actif (édition), ouvrant une modale `DepartmentLinksDialog` : nom, catégories liées (recherche debouncée, nombre de machines par catégorie), machines individuelles (recherche debouncée, machines déjà incluses via une catégorie cochée grisées/non modifiables, machines non catégorisées incluses), aperçu en direct « → X machines · Y OF », suppression avec confirmation explicite.
- [x] Chaque onglet affiche désormais un compteur d'OF, calculé via un index précalculé machine→nombre d'OF (`buildMachineOperationCountIndex`/`countDepartmentOperations`) plutôt que de reparcourir toutes les opérations par département.
- [x] `buildWorkshopCategories` gagne une section « Machines liées directement » (badge du même nom sur la machine, réutilisant `StatusPill` comme le badge de statut déjà existant) pour les machines rattachées individuellement à un département sans être déjà couvertes par une catégorie visible.
- [x] Le dropdown « Catégories » reste le réglage partagé/persisté construit précédemment (pas de reset par onglet, décision explicite de l'utilisateur) : sélectionner un onglet écrase ce réglage avec les catégories liées du département, ajustable ensuite librement.
- [ ] Étendre l'éditeur générique de Réglages → Production → Départements pour exposer aussi ces nouveaux champs liés, si le besoin se confirme (aujourd'hui gérables uniquement depuis la modale de l'Atelier, décision explicite pour limiter le périmètre de ce chantier).
- [ ] Recetter manuellement dans le navigateur : créer un département avec 2 catégories, ajouter une machine individuelle non catégorisée, éditer, supprimer avec et sans garde (machine encore physiquement rattachée), recharger la page (persistance), premier chargement sans configuration existante (migration), département vide (message dédié), compteurs d'OF par onglet avec un jeu de données réel.
- [x] Correctif signalé par l'utilisateur : les OF d'une catégorie visible mais sans machine assignée n'apparaissaient nulle part dans l'Atelier. Ajout d'une section finale « Opérations sans machine » dans `buildWorkshopCategories`, filtrée par le code catégorie propre à chaque opération.
- [x] Correctif signalé par l'utilisateur (suite) : après avoir mappé ses machines Découpe fil au bon code ERP, leurs OF restaient invisibles. Cause : la fiche machine (`taskCategoryCode`) n'était jamais mise à jour automatiquement par un import CSV, alors que l'Atelier n'affichait une machine dans une catégorie que si sa fiche portait ce tag. `buildWorkshopCategories` affiche désormais aussi une machine dès qu'elle porte une opération de la catégorie visible, tag de fiche ou non. Ordre demandé : Opérations sans machine toujours en premier, puis les catégories, puis les machines liées directement.
- [x] Optimisation signalée par l'utilisateur : changer d'onglet de département était lent et les autres onglets affichaient 0 OF jusqu'au clic. Séparé la réconciliation machine (rare) du filtrage par catégorie (à chaque clic) dans `useWorkshopOperations` (`allRows`/`rows`), et indexé les machines par id (`Map`) dans `reconcileOperationViewMachineCatalog` au lieu d'un `.find()` par opération. Les compteurs par onglet utilisent désormais `allRows`, toujours exacts sans attendre un clic.
- [x] Correctif signalé par l'utilisateur : créer un département avec plusieurs catégories liées n'affichait pas ses OF immédiatement. Cause : fermeture React obsolète (`activeDepartments` pas encore à jour juste après `updateSettings`). `handleCreateDepartment` applique désormais directement `input.linkedCategoryCodes` au lieu de relire une liste de départements pas encore rafraîchie.
- [x] Optimisation (suite) signalée par l'utilisateur : le changement d'onglet restait lent malgré la première optimisation. Cause racine : chaque clic appelait `updateSettings`, qui clone/réécrit tout l'arbre `AppSettings` et recalcule les 30+ écrans qui le lisent, juste pour changer le réglage « catégories visibles ». Sorti ce réglage vers son propre store dédié (`src/lib/visible-task-categories-store.ts`), confirmé avec l'utilisateur avant de le faire (changement structurant). Migration automatique depuis l'ancien emplacement. `AppSettings.production.visibleTaskCategoryCodes` marqué `@deprecated`, conservé uniquement pour la compatibilité des anciennes sauvegardes.
- [x] Optimisation (suite 2) signalée par l'utilisateur : l'Atelier restait lent malgré les deux optimisations précédentes. Cause : le Cockpit ERP, gardé monté en arrière-plan par le Workspace Planning, redéclenchait sa propre réconciliation complète (~23 000 lignes) à chaque changement du réglage partagé « catégories visibles » — y compris déclenché depuis l'Atelier. `ErpPlanningWorkspace.tsx` reçoit la même scission réconciliation/filtrage que `useWorkshopOperations`. Index catégorie→machine de `buildWorkshopCategories` construit une seule fois plutôt qu'une fois par catégorie visible.
- [x] Correctif signalé par l'utilisateur : l'onglet Qualité affichait 0 OF alors que des OF existaient bien dans ce département. Cause : `countDepartmentOperations` (compteur par onglet) et l'aperçu de `DepartmentLinksDialog` appliquaient une règle plus étroite que `buildWorkshopCategories` (l'affichage réel) — ils ignoraient les machines non taguées mais porteuses d'une opération de la catégorie liée, ainsi que les OF sans machine assignée, ce qui pouvait descendre à 0 pour un département sans machine physiquement taguée. Unifié les deux autour d'un même index partagé (`buildDepartmentOperationIndex`/`resolveDepartmentMachineIds`/`countDepartmentOperations`, dans `workshop-view-service.ts`), qui remplace l'ancien `buildMachineOperationCountIndex`.
- [x] Optimisation (suite 3) signalée par l'utilisateur : recherche encore saccadée sur un département chargé. La recherche texte du panneau Filtres (`WorkshopFilters.tsx`) refiltrait/re-rendait tout le département à chaque frappe. Ajout d'un débounce ~250 ms : le champ affiche la saisie instantanément, mais le filtrage réel (`patch({ search })`) n'est déclenché qu'une fois la frappe interrompue.
- [x] Optimisation (suite 4) signalée par l'utilisateur, mesurée cette fois (« 10 secondes » pour changer d'onglet) : cause racine identifiée dans `WorkshopMachinePanel.tsx` — le réglage « Lignes par machine » (10 par défaut) ne limitait que la hauteur CSS du cadre défilant, pas le nombre réel de `<tr>` montés dans le DOM ; chaque changement d'onglet montait d'un coup toutes les opérations de toutes les machines du département, potentiellement des milliers. Ajout d'un fenêtrage (`computeVirtualRowRange`, `src/features/planning/services/virtual-rows.ts`, fonction pure testée) : seules les lignes proches de la position de défilement sont réellement montées, le reste est représenté par deux lignes d'espacement de la bonne hauteur — aucune opération n'est masquée (le test existant qui l'interdit reste vert), tout reste atteignable en faisant défiler le cadre, mais le DOM initial d'un onglet reste borné à quelques dizaines de lignes au lieu de plusieurs milliers.
- [x] Correctif de fond demandé par l'utilisateur : « si je ne mets pas de machine tout se met dans un même planning, hors que c'est plusieurs postes de travail ». Cause : les OF d'une catégorie visible sans machine assignée atterrissaient tous dans un panier unique `unassigned` partagé par **toutes** les catégories visibles à la fois — un département avec plusieurs catégories mais aucune machine/poste encore rattaché voyait donc ses OF de catégories différentes mélangés dans un seul planning. `buildWorkshopCategories` (`workshop-view-service.ts`) répartit désormais ces OF par leur propre code catégorie : chaque catégorie visible reste son propre planning (sa propre section, avec une ligne « Machine non définie » en premier), même tant qu'aucune machine/poste ne lui est encore rattaché. Rappel pour l'utilisateur : une fois un poste de travail créé (Parc Machines → Ajouter une machine) et mappé au bon code ERP (Cockpit ERP → Import → Correspondances machines), ses OF rejoignent automatiquement ce poste au lieu de rester dans « Machine non définie » — mais cela suppose que l'export ERP distingue déjà les postes par un code machine/ressource propre à chacun.
- [x] Impression de la fiche machine demandée par l'utilisateur (« je dois pouvoir dire combien de lignes je veux imprimer »), confirmée par 3 questions de cadrage : Atelier (pas Planning capacité, qui a déjà son propre aperçu par semaine), choix du nombre de lignes dans une petite fenêtre juste avant l'impression, une machine à la fois. Nouveau bouton « Imprimer » sur chaque panneau machine de l'Atelier → `WorkshopMachinePrintDialog.tsx` (paliers 10/25/50/Toutes + nombre précis, borné au total réellement affiché) → `WorkshopMachinePrintView.tsx` (fiche plein écran, mêmes colonnes que celles actuellement visibles à l'écran pour cette machine, même papier/logo/société que l'impression déjà existante du Planning capacité via `settings.print`). Les lignes imprimées suivent l'ordre/tri affiché à l'écran mais ne sont jamais limitées par le fenêtrage DOM ajouté pour la fluidité (`computeVirtualRowRange`) : impression et affichage restent deux préoccupations séparées.
- [x] Présentation de la fiche machine imprimée rendue « plus professionnelle et plus propre » à la demande explicite de l'utilisateur : en-tête type courrier officiel (logo, société en couleur de thème, titre « Fiche de production — Atelier » séparé par un filet de couleur), bloc d'informations clé encadré (machine, code, département, type machine/poste, nombre imprimé sur le total), tableau à en-tête répété sur chaque page imprimée et lignes jamais coupées entre deux pages, alignement à droite des colonnes numériques (priorité, retard), pied de page avec ligne de visa/date pour un usage atelier. Couleurs issues du thème configurable de l'entreprise (`var(--app-primary)`), pas de couleur en dur.

## Départements de production basés sur le département physique de la machine — 26/07/2026

- [x] Correctif de fond demandé par l'utilisateur, après deux échanges de clarification (une machine tourno-fraiseuse comme l'Integrex 300 apparaissait sous Fraisage en plus de Tournage, dès qu'elle portait une opération codée Fraisage) : nouveau `DepartmentSettings.membershipMode?: "physical" | "linked"`. En mode `"physical"` (Tournage, Fraisage, Découpe fil par défaut), le contenu d'un onglet vient uniquement des machines dont la fiche indique ce département (`MachineSettings.departmentId`, déjà modifiable depuis Parc Machines → la machine → Identité → Département) — une machine n'apparaît plus jamais que dans son propre département physique, quelle que soit la catégorie de ses opérations. Qualité et Maintenance restent en mode `"linked"` (comportement inchangé, catégories/machines liées) : elles n'ont structurellement aucune machine physiquement rattachée, c'est ce qui les faisait exister comme onglets non vides dès le départ de ce chantier.
- [x] Avant d'implémenter, deux allers-retours de clarification avec l'utilisateur : d'abord un changement global proposé puis refusé une fois le risque signalé (Qualité/Maintenance redeviendraient vides), avant d'aboutir à la portée retenue ci-dessus, conforme à AGENTS.md sur les changements architecturaux.
- [x] `resolveDepartmentMachineIds`/`countDepartmentOperations` (`workshop-view-service.ts`) branchent sur `membershipMode` : mode physique = `machine.departmentId === department.id`, sans aucune règle de catégorie ; les OF sans machine (aucun département physique connu) n'y comptent jamais. Mode lié = règles inchangées.
- [x] `PlanningWorkshopView.tsx` réutilise `buildWorkshopDepartments` (déjà présent, testé, jusque-là inutilisé par l'Atelier) pour les onglets en mode physique, à partir de `allRows` (pas `rows`, filtrées par le réglage partagé « Catégories ») — sans quoi une opération codée différemment de la catégorie actuellement visible aurait disparu du planning au lieu de rester dans son département physique. Cliquer sur un onglet physique n'écrase plus le réglage partagé « Catégories visibles » (devenu sans effet pour ces onglets).
- [x] `DepartmentLinksDialog.tsx` (✎) : pour un département en mode physique, les sections « Catégories liées »/« Machines individuelles » sont remplacées par un message explicatif et une liste en lecture seule des machines actuellement rattachées (avec lien vers chaque fiche) — rien à cocher, tout se règle depuis la fiche machine.
- [ ] Recetter manuellement dans le navigateur : ouvrir Tournage/Fraisage/Découpe fil et confirmer qu'une machine tourno-fraiseuse (Integrex) n'apparaît que dans son département physique même avec des opérations mixtes ; ouvrir Qualité/Maintenance et confirmer l'absence de régression ; changer le département physique d'une machine depuis sa fiche et confirmer qu'elle change bien d'onglet dans l'Atelier ; ouvrir la fenêtre ✎ d'un département physique et confirmer le message informatif + la liste en lecture seule.

## Fiche technique, contacts SAV, consommables et impression machine — 25/07/2026

- [x] Remplir l'onglet « Fiche technique » de la fiche machine avec trois sections structurées (Identification, Caractéristiques techniques, Raccordements), sur le modèle libellé/valeur déjà utilisé par la Vue générale, sans créer de nouvel onglet. Champs non renseignés affichés « À compléter ».
- [x] Pré-remplir les caractéristiques techniques connues avec certitude raisonnable pour 3 des 4 machines de démonstration (type d'usinage, commande numérique, cône outil), marquées « Pré-rempli — à vérifier » tant qu'un utilisateur ne les a pas confirmées/modifiées (`Machine.unverifiedFields`) ; laissées vides partout ailleurs en cas de doute sur la variante exacte de machine (Mitsubishi FA30S notamment). Aucune donnée propre à l'atelier (n° de série, emplacement, dates, raccordements réels) n'est inventée.
- [x] Ajouter les sections Contacts SAV et Consommables sous le contenu Maintenance déjà existant de la fiche machine (jamais touché), sans nouvel onglet : contacts SAV illimités par machine (société, contact, téléphone, e-mail, contrat, échéance, remarques) et tableau consommables (catégorie avec badge, désignation, référence, fournisseur, fréquence, stockage, remarques) avec recherche en direct, filtre par catégorie et CRUD complet.
- [x] Précharger 5 consommables d'exemple (filtres, huile, liquide de coupe, graisse) sur la machine TOU-01, marqués `isExample` et affichés « (exemple) » dans le tableau.
- [x] Ajouter le bouton « Imprimer la fiche machine » (en-tête de la fiche) qui bascule vers une vue d'impression dédiée (`MachinePrintView`) : en-tête (nom, code, photo, statut), Identification, Caractéristiques techniques, Raccordements, Contacts SAV, tableau Consommables — masque navigation/onglets/formulaires via `print:hidden` et `@media print`, sections non coupées en pleine page (`page-break-inside: avoid`), lisible en noir et blanc (aucune information portée uniquement par la couleur).
- [x] Étendre `DemoData` (`savContacts`, `consumables`) avec migration rétrocompatible des données déjà stockées en `localStorage` (`demo-data-migration.ts`), sans perte des données existantes.
- [x] Couvrir par des tests ciblés : conservation/levée du marquage « à vérifier » selon modification réelle de la valeur, CRUD contacts SAV et consommables, liste des catégories, câblage du bouton d'impression et des nouvelles sections Maintenance, absence de nouvel onglet.
- [ ] Recetter manuellement dans le navigateur : édition de chaque section de la Fiche technique, confirmation qu'une modification manuelle retire bien le marquage « à vérifier », ajout/modification/suppression d'un contact SAV et d'un consommable, recherche et filtre par catégorie, impression réelle (aperçu navigateur) sur une machine avec et sans photo.
- [ ] La maquette visuelle fournie par l'utilisateur (`Fiche_Machine_ProdPilot_Proposition.html`) n'était pas présente dans le dépôt au moment du chantier ; à la demande explicite de l'utilisateur, le rendu reprend exclusivement les conventions visuelles déjà en place dans l'application (aucune maquette utilisée).

## Refonte visuelle de Mon Espace — 26/07/2026

- [x] Redessiner « Mon Espace » à partir d'une maquette visuelle fournie par l'utilisateur (bannière d'accueil + tuiles de lancement rapide, puis deux rangées de 3 widgets d'indicateurs), le contenu exact des widgets étant laissé libre à ce stade (« on optimisera plus tard », décision explicite de l'utilisateur).
- [x] Remplacer les grandes cartes descriptives de la section « Vue d'ensemble » par des tuiles de lancement rapide compactes (icône + libellé + pastille de compteur) dans `WorkspaceCard.tsx`, sans toucher au modèle de données ni à l'écran de personnalisation existant (Réglages → Interface → Mon Espace conserve son CRUD complet : nom, icône, couleur, ordre, visibilité).
- [x] Ajouter `WorkspaceWelcomeBanner.tsx` (bannière d'accueil dégradée sur les couleurs de thème configurables, pas de couleur en dur) et `DashboardWidgets.tsx` (`WidgetCard` générique + widgets Indisponibilités machines, Suivi des OF, Charge par département, OF à planifier), tous alimentés par les données de démonstration existantes (`useDemoData`), sans nouvelle dépendance de graphique (mini-graphiques en SVG/CSS pur, `MiniAreaChart`/`MiniBarChart` dans `src/components/ui/`, réutilisables ailleurs).
- [x] Créer `workspace-dashboard-metrics.ts`, fonctions pures et testées calculant : machines indisponibles les plus proches d'un événement de maintenance, taux d'occupation hebdomadaire des machines et par département (déduits des opérations planifiées), quantités prévues/réalisées des OF, OF restant à lancer ou bloqués.
- [x] Adapter `TodayAgendaCard.tsx` au même gabarit de widget compact (`WidgetCard`), pour s'intégrer à la nouvelle grille sans dupliquer son habillage.
- [x] Ajouter 4 icônes manquantes à `AppIcon.tsx` (clé, alerte, tendance, jauge, presse-papiers), disponibles aussi dans les sélecteurs d'icônes de Réglages.
- [ ] Recetter manuellement dans le navigateur : lisibilité et repli responsive de la grille (mobile/tablette/desktop), cohérence des couleurs avec un thème personnalisé dans Réglages, exactitude des liens « Voir tout » de chaque widget, comportement de la bascule de rôle de démonstration sur les nouvelles tuiles.
- [ ] Contenu des widgets à affiner avec l'utilisateur dans une prochaine itération (métriques actuellement dérivées des données de démonstration existantes, à mettre en cohérence avec les besoins réels une fois validés).

## Actions : onglet « À planifier » pour les idées/tâches d'amélioration — 26/07/2026

- [x] Demandé par l'utilisateur : « j'aimerais ajouter un onglet pour y mettre toutes les actions/tâches d'amélioration à planifier pour pas oublier et une fois validé cela passe dans l'onglet des actions actuelles ». Nouveau statut `ActionStatus` : `"À planifier"` (idée/amélioration mise de côté, sans responsable ni échéance réels), en plus des 3 statuts existants (`À faire`/`Fait`/`Reporté`).
- [x] `ActionsModule.tsx` gagne deux onglets : « Actions » (comportement inchangé, exclut désormais toujours les idées quel que soit le filtre de statut choisi) et « À planifier » (pastille avec le nombre d'idées en attente, filtres simplifiés à la recherche et l'origine). Le bouton de création s'adapte : « + Nouvelle idée » ouvre `ActionFormDialog` en mode `backlog` (description seule requise, pas de responsable/échéance à saisir tout de suite).
- [x] Nouveau `planAction(id, responsable, echeance)` dans `action-service.ts` : fait passer une idée de `À planifier` à `À faire` avec un vrai responsable et une vraie échéance — c'est la validation demandée par l'utilisateur, qui fait rejoindre l'onglet Actions. Bouton « Planifier » disponible à la fois dans le tableau (`ActionRow.tsx`, variante `backlog` : Planifier/Supprimer au lieu de Fait/Reporter) et sur la fiche détail d'une idée (`ActionDetail.tsx`).
- [x] Correctif de cohérence trouvé en implémentant : la règle « en retard » (`echeance < aujourd'hui`) était dupliquée trois fois (`ActionRow.tsx`, `action-grouping.ts`, `action-assistant-interpreter.ts`) et aurait laissé une idée sans échéance réelle apparaître comme « en retard » dans les regroupements et les revues de l'assistant. Extrait dans un nouveau fichier partagé `action-status.ts` (`isActionOverdue`, `actionStatusTone`), qui exclut explicitement `À planifier` du calcul de retard ; les 3 anciens points d'appel réutilisent désormais cette seule source. L'assistant Actions (revue, recherche par personne) exclut aussi les idées de son périmètre : elles n'ont pas encore de responsable/échéance à revoir.
- [x] Couvert par des tests ciblés : `isActionOverdue`/`actionStatusTone` (logique pure, testée en exécution réelle), défaut `createAction`/nouveau `planAction` (garde de texte source, même limitation structurelle que le reste de ce module — `action-service.ts` importe `demo-repository.ts`, qui utilise l'alias `@/...` non résolu par `node:test`), câblage des onglets dans `ActionsModule.tsx`, variante backlog de `ActionRow.tsx`, mode backlog de `ActionFormDialog.tsx`.
- [ ] Recetter manuellement dans le navigateur : ajouter une idée depuis l'onglet « À planifier », confirmer qu'elle n'apparaît jamais dans l'onglet Actions ni dans les regroupements « en retard » malgré une échéance placeholder ancienne, la planifier (responsable + échéance) depuis le tableau puis depuis sa fiche détail, confirmer qu'elle rejoint alors l'onglet Actions comme une action normale, supprimer une idée non retenue.

## Parc Machines : import/export regroupés derrière un bouton « Options » — 26/07/2026

- [x] Demandé par l'utilisateur : « dans l'onglet parc machine je trouve que les options tels que import et export prennent trop de place, j'aimerais que ce soit un bouton où je peux ouvrir, exemple Options ». Les deux cartes toujours visibles (« Importer / exporter le parc en CSV », « Importer des photos en masse ») sont retirées du corps de la page.
- [x] Nouveau bouton « Options » dans l'en-tête du Parc Machines, à côté de « Ajouter une machine », qui ouvre `MachineOptionsDialog.tsx` (fenêtre modale générique `PlanningDialogShell`, déjà utilisée ailleurs dans l'app). La fenêtre réutilise telles quelles `MachineCsvTools`/`MachinePhotoBulkImport` (aucune logique dupliquée, aucun changement de comportement interne) — seul leur emplacement change.
- [x] Couvert par un test ciblé : les deux composants ont bien disparu du corps de `MachinesModule.tsx` et sont bien réutilisés dans la nouvelle fenêtre.
- [ ] Recetter manuellement dans le navigateur : ouvrir/fermer la fenêtre Options, importer un CSV et des photos depuis cette fenêtre, confirmer que la page Parc Machines est visuellement plus compacte qu'avant.

## Diagnostic : département physique vide malgré des machines affichées avec le bon libellé — 26/07/2026

- [x] Signalé par l'utilisateur suite au chantier « départements basés sur le département physique » : « dans le planning fraisage je ne retrouve plus aucune machine pourtant dans le parc machine le département est bien défini en fraisage ». Cause la plus probable identifiée par lecture de code (aucun accès aux données réelles de l'utilisateur pour la confirmer directement) : le Parc Machines affiche `department?.label` (résolu via `machine.departmentId`) **ou, en repli, `machine.department`** (texte libre figé au dernier enregistrement) — une machine peut donc afficher « Fraisage » alors que son `departmentId` réel ne pointe plus vers aucun département existant, typiquement après une suppression puis recréation du département « Fraisage » (même nom, nouvel identifiant) via l'éditeur générique de Réglages → Production → Départements, qui ne vérifie pas les machines encore rattachées avant de supprimer. Ce décalage était invisible avant ce chantier (l'ancien système catégoriel ne dépendait pas de `departmentId`) ; le nouveau mode `"physical"` le rend visible.
- [x] Nouveau `findMachinesWithMismatchedDepartmentLabel(machines, department)` (`workshop-view-service.ts`) : détecte les machines dont `machine.department` correspond (insensible à la casse) au libellé du département actif mais dont `machine.departmentId` ne correspond plus à son identifiant réel. Quand un département physique est vide, l'Atelier affiche désormais un message nommant précisément les machines concernées et expliquant la manipulation de récupération (rouvrir leur fiche, resélectionner le département), au lieu du message générique « aucune machine n'indique ce département ».
- [x] Couvert par un test ciblé sur la fonction de détection et le câblage du message dans `PlanningWorkshopView.tsx`.
- [ ] À confirmer avec l'utilisateur : ouvrir une machine Fraisage concernée (Parc Machines → la machine → Modifier) et vérifier si le champ « Département » affiche bien « Fraisage » sélectionné, ou revient sur un autre département/le premier de la liste — ce qui confirmerait l'hypothèse d'un identifiant de département orphelin. Si confirmé, resélectionner « Fraisage » dans chaque fiche concernée corrige durablement le lien.

## Départements physiques : les catégories liées restent nécessaires pour les OF sans machine — 26/07/2026

- [x] Suite directe du chantier « départements basés sur le département physique » : l'utilisateur a signalé, en rouvrant le ✎ d'un département physique, l'absence du choix de catégories, avec l'argument déterminant « sans cela tu ne sais pas savoir quelle opération sont liées à quelle catégorie » — une opération qui n'a pas encore de machine assignée n'a pas de `departmentId` à lire (aucune machine dessus), donc pas d'autre moyen que sa propre catégorie ERP pour savoir dans quel département physique elle doit apparaître.
- [x] `DepartmentLinksDialog.tsx` (✎ de Tournage/Fraisage/Découpe fil) retrouve la liste à cocher « Catégories liées » (identique à Qualité/Maintenance), avec un sous-titre « (pour les OF sans machine assignée) » et un texte explicatif clarifiant que ces cases ne pilotent plus l'appartenance des machines (toujours régie par la fiche machine), seulement les OF orphelins. La liste en lecture seule des machines déjà rattachées, ajoutée précédemment, reste affichée à côté.
- [x] Nouveau `buildUnassignedOperationsSection(rows, machines, department, filters, sort)` (`workshop-view-service.ts`) : construit la section « Opérations sans machine » d'un département physique à partir de ses catégories liées, sur le même principe que la section homonyme des départements en mode lié — toujours affichée en premier dans l'onglet. `countDepartmentOperations` compte désormais ces OF dans les deux modes (la restriction ajoutée par erreur au mode physique lors du chantier précédent a été retirée).
- [x] Couvert par des tests ciblés : routage correct par catégorie liée (et absence de section sans catégorie liée ou sans correspondance), câblage dans `PlanningWorkshopView.tsx` et `DepartmentLinksDialog.tsx`.
- [ ] Recetter manuellement dans le navigateur : lier la catégorie Fraisage (27) au département Fraisage, confirmer qu'un OF de catégorie 27 sans machine assignée apparaît bien en premier dans l'onglet Fraisage, et qu'il disparaît si la catégorie est déliée.

## Atelier : menu Filtres unique + diagnostic élargi aux machines isolées manquantes — 26/07/2026

- [x] Demandé par l'utilisateur : « tout les filtres et les catégories visibles sont toujours là, mets les dans le même menu ». Le bouton séparé « Catégories (X/41 visibles) » disparaît de l'Atelier ; ses champs (recherche, tout afficher/masquer, liste à cocher, non catégorisées) rejoignent le volet dépliable « Filtres » existant, sous les groupes Machines et Articles. Extraction de `TaskCategoryVisibilityFields` (champs seuls) hors de `TaskCategoryVisibilityControl` (qui garde son bouton/popover pour Cockpit ERP et Planning capacité, non modifiés) — une seule liste des 41 catégories, jamais dupliquée.
- [x] Signalé par l'utilisateur : une machine précise (Akira Seiki, Fraisage) restait introuvable dans son onglet alors que d'autres machines du même département s'affichaient normalement. Le diagnostic « machine dont la fiche affiche encore le bon libellé mais dont le lien réel est rompu » (`findMachinesWithMismatchedDepartmentLabel`), ajouté précédemment mais uniquement visible quand l'onglet entier était vide, est désormais calculé pour tout l'onglet et affiché dans un bandeau permanent au-dessus des sections — une seule machine orpheline au milieu d'autres correctement rattachées reste donc signalée nommément, au lieu de disparaître silencieusement.
- [x] Couvert par des tests ciblés : câblage du menu unique dans `WorkshopFilters.tsx` (et absence du bouton séparé), calcul non conditionnel du diagnostic et bandeau permanent dans `PlanningWorkshopView.tsx`.
- [ ] Recetter manuellement dans le navigateur : ouvrir le menu « Filtres » de l'Atelier et confirmer que machines, articles et catégories visibles y sont réunis ; confirmer que Cockpit ERP et Planning capacité gardent leur bouton « Catégories » séparé, inchangé. Vérifier l'apparition du bandeau si une machine réelle du parc a un lien de département rompu (ex. Akira Seiki signalé par l'utilisateur).

## Correctif racine : un filtre « départements » retiré de l'interface pouvait vider un département physique entier — 26/07/2026

- [x] Signalé par l'utilisateur : après avoir vérifié que « Fraisage » est bien coché dans la fenêtre ✎ et que la liste des machines rattachées y est correcte (Akira Seiki y figurait bel et bien), l'onglet Fraisage n'affichait toujours que la section « Opérations sans machine », aucune machine. Cause racine trouvée : `buildWorkshopDepartments` vérifie encore `filters.departments` (l'ancien filtre à cases à cocher « Départements », retiré de l'interface de l'Atelier plus tôt dans ce chantier car redondant avec les onglets). Un utilisateur ayant coché des départements avant ce retrait garde cette valeur dans ses préférences déjà enregistrées (aucune UI ne permet plus de la modifier) — et dès que cette valeur ne contient pas l'onglet actif, `buildWorkshopDepartments` l'exclut entièrement en silence, alors que `buildUnassignedOperationsSection` (nouvelle section « Opérations sans machine ») n'a jamais eu ce filtre et continue, elle, de s'afficher normalement — d'où le symptôme exact rapporté.
- [x] Neutralisé au point d'appel dans `PlanningWorkshopView.tsx` (`physicalFilters = { ...preferences.state.filters, departments: [] }`), sans toucher `buildWorkshopDepartments` elle-même (toujours documentée/testée avec son comportement d'origine, potentiellement réutile ailleurs). Corrige tous les départements physiques (Tournage/Fraisage/Découpe fil) d'un coup, sans action requise de l'utilisateur.
- [x] Nouveau test de régression reproduisant exactement le scénario signalé (valeur figée du filtre → département vide) puis la correction (valeur neutralisée → machines réapparues).
- [ ] Recetter manuellement dans le navigateur : confirmer que Fraisage affiche désormais ses machines (Akira Seiki comprise) en plus de la section « Opérations sans machine ».

## Parc Machines : onglets par département + onglet « Tous » — 26/07/2026

- [x] Demandé par l'utilisateur : « j'aimerais des onglets avec les départements et un onglet avec tout ». Nouveau `MachineDepartmentTabs` (même style de pilules que `WorkshopDepartmentTabs` de l'Atelier, sans les icônes ＋/✎ propres à l'Atelier) : un onglet « Tous » puis un onglet par département actif (`settings.production.departments`, même source que l'Atelier), chacun avec un compteur de machines.
- [x] Le filtre « Catégorie » existant (menu déroulant) est conservé comme filtre secondaire, désormais appliqué **à l'intérieur** de l'onglet département actif : ses options ne listent que les catégories réellement présentes dans cet onglet (pas tout le parc), et changer d'onglet réinitialise ce filtre pour ne jamais garder une sélection devenue invisible/incohérente.
- [x] Les compteurs globaux (Machines actives/supprimées, Codes ERP non mappés) restent basés sur le parc complet, inchangés — seule la grille de cartes affichée dépend de l'onglet + du filtre Catégorie.
- [x] Couvert par un test ciblé sur le câblage (onglets, filtrage combiné, réinitialisation du filtre Catégorie au changement d'onglet).
- [ ] Recetter manuellement dans le navigateur : naviguer d'un onglet département à l'autre, confirmer les compteurs par onglet, confirmer que le filtre Catégorie se réinitialise au changement d'onglet, confirmer que « Tous » retrouve bien l'ensemble du parc.

## Atelier : catégories visibles retirées du menu Filtres, uniquement gérées via le crayon (✎) de département — 26/07/2026

- [x] Demandé par l'utilisateur, en diagnostiquant une machine « Peinture » nouvellement créée sans aucune opération visible (ni sous la machine, ni en « Machine non définie ») : la cause identifiée était le réglage partagé « Catégories visibles », qui masque tout ce qui n'est pas explicitement coché (`applyTaskCategoryVisibility`) et pouvait diverger des catégories liées au département (cochées via le crayon ✎) puisque deux écrans permettaient de les régler séparément — le menu « Filtres » de l'Atelier et la fenêtre ✎ de chaque département. L'utilisateur a jugé ces deux réglages redondants (« 2 endroits qui n'ont pas lieu d'être ») et a demandé de n'en garder qu'un.
- [x] Retiré du menu « Filtres » de l'Atelier (`WorkshopFilters.tsx`) : plus de bloc « Catégories visibles » (recherche, tout afficher/masquer, liste à cocher), plus de compteur « X/41 catégories visibles » dans le libellé du bouton (redevenu simplement « Filtres »/« Fermer les filtres »). Le réglage partagé (`visibleTaskCategoryCodes`) reste piloté uniquement par la sélection/l'édition d'un département (`handleSelectDepartment`/`handleUpdateDepartment`/`handleCreateDepartment` dans `PlanningWorkshopView.tsx`, inchangés) — le crayon (✎) de chaque département devient l'unique endroit, dans l'Atelier, pour choisir les catégories.
- [x] Cockpit ERP et Planning capacité gardent leur propre bouton « Catégories » séparé (`TaskCategoryVisibilityControl`), inchangé — hors périmètre de cette demande.
- [x] Tests mis à jour : `WorkshopFilters.tsx` ne référence plus `TaskCategoryVisibilityFields` ni `visibleTaskCategoryCodes`.
- [ ] Recetter manuellement dans le navigateur : ouvrir le menu « Filtres » de l'Atelier et confirmer l'absence de tout réglage catégories ; confirmer que cocher/décocher une catégorie dans le crayon (✎) d'un département reste la seule façon de la rendre visible, et que ça se répercute immédiatement sur les OF affichés dans cet onglet.

## Uniformisation de l'app — Volet A (corrections mécaniques bornées) — 27/07/2026

- [x] Demandé par l'utilisateur : « fais une grosse analyse du projet et améliore/uniformise tous les modules », avec autorisation explicite à agir sans redemander confirmation à chaque changement. Avant d'exécuter, analyse du code par 3 agents (UI, services/données, tests/modules sous-développés) : pas de dette massive, mais une dizaine de divergences concrètes et localisées accumulées au fil des chantiers. Plan retenu : un Volet A borné et exécuté tout de suite (ci-dessous), un Volet B documenté plus bas mais volontairement non exécuté (chantiers plus lourds, à traiter séparément avec du recul).
- [x] **Bandeau d'erreur partagé** : nouveau `ErrorBanner` dans `src/components/ui/ModuleUi.tsx`, remplace le `<p role="alert" className="rounded-xl border border-red-200 bg-red-50...">` dupliqué à l'identique (ou presque) dans `WorkOrderDetail.tsx`, `ErpPlanningWorkspace.tsx`, `PlanningWorkshopView.tsx`, `ErpQualityModule.tsx` et `MailDiagnosticsScreen.tsx`. Les variantes compactes utilisées dans des contextes différents (cartes de compte mail/calendrier, upload photo) n'ont pas été touchées : les forcer dans le même composant aurait changé leur apparence (taille/marges pensées pour un espace réduit), donc un vrai risque de régression visuelle pour un gain cosmétique marginal.
- [x] **Réglages ↔ ModuleUi.tsx** : `SettingsUi.tsx` redéfinissait localement `inputClass`/`buttonClass`, quasi-duplicats de `fieldClass`/`secondaryButton` mais qui avaient dérivé (`disabled:opacity-40` au lieu de `45`, `disabled:cursor-not-allowed` manquant — un vrai bug visuel mineur sur les boutons désactivés de tout le module Réglages). Les deux constantes reposent désormais sur les primitives partagées (mêmes noms exportés, donc migration transparente pour les ~9 fichiers consommateurs). `EmptySettings` n'était pas un doublon d'`EmptyState` (compose déjà `SettingsPanel` avec un texte spécifique « pas encore relié ») : laissé tel quel.
- [x] **Icônes** : remplacement des glyphes unicode `✕` par `AppIcon name="close"` (déjà dans le registre partagé) dans `PlanningDialogShell.tsx` et `MachinePhotoUploader.tsx`. Les glyphes `↑`/`↓` de `ActionsSettingsPanel.tsx` n'ont pas été touchés : les ajouter au registre `AppIcon` les ferait aussi apparaître dans le sélecteur d'icônes des cartes de Mon Espace (`InterfaceDesigners.tsx`, qui réutilise le même registre) — effet de bord hors sujet, à traiter séparément si besoin (voir Volet B).
- [x] **`MachinePhotoUploader`** : lightbox et placeholder « Aucune photo » vérifiés vis-à-vis de `PlanningDialogShell`/`EmptyState` et volontairement laissés tels quels — `PlanningDialogShell` impose un pied de page d'actions obligatoire et un cadre de carte blanche inadaptés à une visionneuse plein cadre, et `EmptyState` est dimensionné pour un grand bloc « aucune donnée » (padding vertical important, section centrée) alors que ce placeholder est une petite case compacte à côté du bouton d'upload : le réutiliser aurait cassé la mise en page plutôt que l'uniformiser. Même constat pour le texte inline « Aucune action » de `MeetingActionReview.tsx`, pensé pour rester léger au milieu d'un flux de réunion, pas comme un grand bloc vide.
- [x] **`action-service.ts`** : `completeAction`/`postponeAction`/`planAction`/`reassignAction`/`setRemark`/`reopenAction`/`deleteAction` retournent désormais `boolean` (id trouvé et modifié, ou non) au lieu de `void`, alignées sur la convention déjà utilisée par `machineSettingsService` (ex. `setActive`) pour ce type d'opération. Corrige un vrai risque côté `AssistantPanel.tsx` (assistant IA de Mon Espace) : si l'id d'action interprété par l'assistant ne correspond plus à une action réelle, le message annonçait quand même un succès (« ACT-042 est marquée Fait. ») alors que rien n'avait changé — l'assistant relaie maintenant honnêtement l'échec. Les appels depuis `ActionRow.tsx`/`ActionDetail.tsx`/`MeetingActionReview.tsx` n'ont pas été instrumentés pour lire ce booléen : l'id y provient toujours de l'élément affiché à l'écran, un échec y est structurellement impossible, donc rien à gérer.
- [x] Vérifié à chaque étape (`npx tsc --noEmit`, `npm run lint`, `npm test`), build complet à la fin.

## Uniformisation de l'app — Volet B (backlog, non exécuté dans cette passe) — 27/07/2026

Issu de la même analyse que le Volet A ci-dessus, mais chaque point représente un chantier à part entière (plusieurs modules touchés, changement de comportement visible, ou volume de tests important) plutôt qu'une correction mécanique — à prévoir comme chantiers dédiés :

- [ ] **Trois architectures de filtre différentes** : Atelier/Cockpit ERP (panneau repliable + recherche debouncée) vs Parc Machines (onglets département + un seul select) vs Actions/OF (grille de champs toujours dépliée, sans debounce). Les converger changerait l'UX de plusieurs modules ; prévoir une validation visuelle avant généralisation.
- [ ] **Couverture de tests très faible sur les gros modules** : `ai` (33 fichiers, 1 seul testé), `calendar` (23 fichiers, 1 test qui ne fait que du regex sur le source), `mail`/`mail-assistant` (86 fichiers à eux deux, couverture partielle). Travail de fond, pas une correction mécanique.
- [ ] **Audit plus large des formes de retour des services** au-delà d'`action-service.ts` (ex. `mail-management-service.ts` qui lève des exceptions plutôt que de retourner un résultat) — à confirmer au cas par cas que ce n'est pas un choix délibéré avant d'aligner.
- [ ] **Convention de logging/erreurs** : une dizaine de `.catch(() => undefined)` qui avalent silencieusement une erreur, mêlant des cas « best-effort volontaire » et des échecs potentiellement accidentels — nécessite de lire l'intention de chaque site un par un.
- [ ] Modules à petite couverture de tests mais sans dette réelle (`erp-quality`, `requests`, `meetings`, `analytics`) : fonctionnels, juste jamais testés — bons candidats pour un futur chantier « tests » ciblé, pas urgent.
- [ ] Registre d'icônes `AppIcon` : envisager de séparer « icônes disponibles pour le rendu » de « icônes proposées dans le sélecteur de Mon Espace » si de nouvelles icônes purement fonctionnelles (tri, etc.) doivent être ajoutées sans polluer ce sélecteur.

## Atelier : colonnes Client et Quantité commandée — 27/07/2026

- [x] Demandé par l'utilisateur : « j'aimerais pouvoir masquer et démasquer les colonnes que je ne veux pas et j'aimerais que tu rajoutes d'une part le client (Nom du tableau Macrogamme_Top) pour chaque opération et la quantité qui représente (Qté_Cdée dans le tableau de l'export) ». Vérifié avant tout code : le masquage/démasquage de colonnes existait déjà (`WorkshopColumnSelector.tsx`, aucune colonne forcée-visible) — rien à corriger sur ce point, les deux nouvelles colonnes en héritent automatiquement.
- [x] Ni `Nom` ni `Qté_Cdée` ne nécessitaient un nouveau parseur : `REQ_MacroGamme_Top.xlsx` (le fichier que l'utilisateur appelle « Macrogamme_Top ») est déjà entièrement importé et alimente déjà `ErpWorkOrder.customerName`/`ErpWorkOrder.quantity`. Seul `quantity` manquait au trajet jusqu'à l'Atelier : la route utilisée par l'Atelier (`/api/erp/planning?scope=workbench`) réduit chaque `workOrder` à `ErpPlanningWorkOrderSummary` (`toPlanningListRow` dans `erp-planning-service.ts`), qui ne le portait pas encore — ajouté au `Pick<...>` et à l'objet reconstruit.
- [x] Deux nouvelles colonnes `client`/`quantity` dans `WORKSHOP_COLUMN_IDS`/`WORKSHOP_COLUMN_LABELS`, placées entre Article et Désignation. Câblées dans les quatre points nécessaires : `WorkshopOperationRow.tsx` (cellule écran + panneau détail), `WorkshopMachinePanel.tsx` (largeur par défaut), `WorkshopMachinePrintView.tsx` (cellule impression + alignement numérique de la quantité) — sans ce dernier câblage, ces colonnes se seraient imprimées silencieusement avec le nom de la machine, seule branche par défaut de `printCellValue`.
- [x] Nouveau test ciblé verrouillant les branches `client`/`quantity` (écran et impression) et le trajet `quantity` jusqu'à l'Atelier, en plus de la mise à jour du test des colonnes par défaut.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (352/352), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : ouvrir l'Atelier, confirmer que Client et Quantité affichent les mêmes valeurs que la fiche OF correspondante, les masquer/démasquer via le sélecteur de colonnes, imprimer une fiche machine avec ces colonnes visibles et vérifier l'alignement à droite de la quantité.

## Correctif racine : un onglet en mode lié déjà sélectionné au chargement de la page n'appliquait pas ses catégories liées — 27/07/2026

- [x] Signalé par l'utilisateur : dans le département « Traitement de surface », le poste créé pour la Peinture affiche bien sa section de planning, mais aucune opération catégorie 18 (Peinture) n'y apparaît.
- [x] Cause racine trouvée dans `PlanningWorkshopView.tsx` : le réglage partagé « Catégories visibles » (qui masque tout ce qui n'est pas explicitement listé, `applyTaskCategoryVisibility`) n'était resynchronisé sur les catégories liées du département qu'au **clic** sur son onglet (`handleSelectDepartment`), à sa **création** (`handleCreateDepartment`) ou à l'**édition** du département actuellement affiché (`handleUpdateDepartment`). Aucun mécanisme ne le faisait au premier rendu si l'onglet était déjà sélectionné avant même ce rendu (préférence restaurée depuis une session précédente, ou retour depuis le Parc Machines après avoir créé le poste) — le réglage partagé gardait alors sa dernière valeur (venant par ex. du Cockpit ERP ou d'un autre département visité plus tôt), qui pouvait ne pas inclure la catégorie 18. La section du planning apparaît quand même (une machine/poste taguée sur cette catégorie suffit à la créer), mais reste vide, sans aucun message d'erreur.
- [x] Nouveau `useEffect` dans `PlanningWorkshopView.tsx` : resynchronise le réglage partagé sur les catégories liées du département affiché à chaque fois que celui-ci change (y compris au tout premier rendu), pour les départements en mode lié. Les trois synchronisations existantes (clic, création, édition) restent en place, désormais redondantes mais inoffensives dans ces cas précis ; l'effet couvre en plus le cas manquant.
- [x] Nouveau test de régression verrouillant cet effet.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (353/353), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : recharger la page (ou y revenir depuis un autre module) avec un département en mode lié déjà sélectionné, confirmer que ses opérations apparaissent immédiatement sans avoir à recliquer sur l'onglet.

## Atelier : une catégorie n'ayant qu'une seule machine candidate absorbe directement ses OF sans machine assignée — 27/07/2026

- [x] Demandé par l'utilisateur, après avoir compris le mécanisme catégorie/machine expliqué au point précédent : « je devrais mettre une machine à toutes les étapes peinture. Est-ce que tu peux mettre quelque part si j'ai créé une machine pour la peinture et qu'il y a qu'une seule machine, toutes les opérations se mettent à la machine et ne restent pas dans machine à définir ».
- [x] `buildWorkshopCategories` (`workshop-view-service.ts`) : quand une catégorie n'a plus qu'une seule machine/poste candidate (taguée sur cette catégorie, ou déjà porteuse d'une de ses opérations), les OF de cette catégorie sans machine assignée rejoignent directement le panneau de cette machine au lieu d'une ligne « Machine non définie » distincte — puisqu'aucune autre machine ne pourrait de toute façon les recevoir. Dès qu'une deuxième machine devient candidate, la ligne séparée réapparaît automatiquement (impossible de deviner laquelle des deux devrait recevoir l'OF).
- [x] Affichage uniquement, aucune écriture : l'opération reste sans machine réellement assignée dans les données (son propre sélecteur Machine dans le tableau continue de la montrer non assignée) — seule sa place dans la liste change. Pas de mutation silencieuse en masse sur des dizaines/centaines d'OF.
- [x] Un test existant (« place les OF sans machine en premier... ») adapté pour continuer à porter sur le cas à deux machines candidates (son objet réel : l'ordre d'affichage), plus deux nouveaux tests dédiés au cas à une seule candidate et à la bascule à deux candidates.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (355/355), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : dans le département « Traitement de surface », confirmer que les OF catégorie 18 (Peinture) apparaissent désormais directement sur le poste Peinture plutôt que dans « Machine non définie ».

## Assignation automatique et permanente d'une catégorie à sa machine unique, partout dans l'app — 27/07/2026

- [x] Demandé par l'utilisateur, en allant plus loin que le regroupement d'affichage du point précédent : « je veux mettre la machine dans tous les OF de la catégorie peinture sur la machine de peinture automatiquement, à chaque fois automatiquement. Je veux qu'un champ se mette dans la machine pour lier la machine à une catégorie constamment. » Ce champ existe déjà (`MachineSettings.taskCategoryCode`, fiche machine → Identité → Catégorie) — il manquait seulement la vraie assignation automatique qui s'appuie dessus, visible partout et pas seulement dans l'Atelier.
- [x] Exploré avant tout code : l'assignation manuelle écrit une `PlanningDecision` (journal d'événements par opération, `erp-decision-repository.ts`), pensé pour des choix ponctuels, pas pour une règle globale par catégorie — l'appliquer en masse (un événement par OF) aurait en plus exigé de l'accrocher à la réconciliation d'import pour couvrir les OF futurs. Choix retenu à la place : étendre `reconcileOperationViewMachineCatalog` (`erp-machine-mapping-status.ts`), déjà appelée à chaque affichage par l'Atelier, Planning capacité, le module OF (via `useWorkshopOperations.ts`) et le Cockpit ERP (`ErpPlanningWorkspace.tsx`) — une seule fonction à modifier pour couvrir tous ces écrans d'un coup, sans nouvelle table de règles ni migration.
- [x] `reconcileOperationViewMachineCatalog` assigne désormais automatiquement un OF sans machine réellement assignée à l'unique machine (ou poste) dont la fiche est taguée sur la même catégorie de tâche. Calculé à chaque lecture (pas une écriture) : couvre automatiquement les nouveaux OF de futurs imports sans aucune action, et une assignation manuelle explicite garde toujours la priorité (la fonction ne touche jamais une ligne dont `machineId` pointe déjà vers une machine réelle). Réversible sans purge : si une deuxième machine est taguée sur la même catégorie, la règle cesse de s'appliquer au rendu suivant et les OF concernés redeviennent « sans machine », puisque rien n'avait jamais été écrit pour eux.
- [x] Limite documentée pour l'utilisateur : le tableau de bord « Qualité des données ERP » (métrique OF sans machine) est calculé côté serveur sans accès aux Réglages (les machines vivent uniquement dans le navigateur) — cette règle n'y change rien, cette métrique reste une mesure différente (complétude du mapping code ERP → machine).
- [x] Nouveaux tests dans `tests/erp-planning.test.mjs` : assignation automatique à la machine unique, non-écrasement d'une assignation manuelle réelle, retour à « sans machine » dès qu'une deuxième machine candidate apparaît.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (356/356), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : confirmer que les OF catégorie 18 apparaissent sur la machine Peinture dans l'Atelier ET dans le Cockpit ERP/module OF ; taguer une deuxième machine sur la catégorie 18 et confirmer que les OF concernés redeviennent visibles comme « sans machine » sans perte de données.

## Masquer les opérations terminées du planning + suivi des OF clôturés/nouveaux dans le module OF — 27/07/2026

- [x] Demandé par l'utilisateur : « si plus tard dans les exports [une opération] se termine je veux plus la voir dans le planning, mais je veux voir dans le module OF les OF clôturés de la journée précédente et les nouvelles OF qui ont été importées ». Clarifié par 4 questions avant tout code : masquage par opération (pas seulement OF entier) dans l'Atelier **et** Planning capacité ; période de clôture choisie à l'écran (pas une fenêtre automatique fixe) ; « nouvelles OF » = apparues lors du tout dernier import ERP spécifiquement (pas juste une date récente déjà présente dans l'export).
- [x] **Masquage des opérations terminées** : `groupOperationsByMachineId` (`workshop-view-service.ts`, point d'entrée commun aux trois regroupements de l'Atelier — départements physiques, liés, OF sans machine) et `buildErpOperationBlocks` (`planning-view.ts`, Planning capacité) excluent désormais toute opération `effectiveStatus === "completed"`. `buildDepartmentOperationIndex` fait de même pour que les compteurs par onglet restent cohérents avec ce qui est réellement listé. Le module OF et le Cockpit ERP, qui ne passent par aucune de ces fonctions, continuent de tout afficher — c'était le point exact de la demande.
- [x] **Filtre « Clôturées depuis » (module OF)** : nouveau champ `closedAt` sur chaque résumé d'OF (`erp-work-order-summary.ts`), la plus récente `actualEndAt` de ses opérations quand l'OF est entièrement terminé — aucune nouvelle donnée, dérivé de ce qui est déjà importé. Nouveau filtre déroulant (Toutes / 7 derniers jours / 30 derniers jours) dans `WorkOrdersModule.tsx`.
- [x] **Filtre « Nouvelles depuis le dernier import » (module OF)** : contrairement à la date de clôture, cette information n'existait nulle part (`ErpSynchronizationReport.newWorkOrders` n'était qu'un compteur, jamais la liste des OF). Nouveau champ persisté `ErpWorkOrder.firstSeenImportId`, renseigné une seule fois par OF dans `synchronizationService.synchronize` (jamais réécrit ensuite pour un OF déjà connu) — changement structurant du pipeline de synchronisation, présenté explicitement dans le plan avant exécution. Reporté jusqu'à l'écran via `ErpPlanningWorkOrderSummary`/`toPlanningListRow`, comme la quantité au chantier précédent. Nouvelle case à cocher dans `WorkOrdersModule.tsx`, comparée à l'import actif (récupéré via `/api/erp/imports`, même point d'accès que `ErpQualityModule.tsx`/`MachineDetail.tsx`).
- [x] Effet transitoire assumé : juste après ce déploiement, aucun OF déjà importé n'a de `firstSeenImportId` — la case « Nouvelles depuis le dernier import » n'affichera rien tant qu'un nouvel import réel n'aura pas eu lieu. Comportement correct, pas un bug.
- [x] Nouveaux tests dans `tests/planning-workshop.test.mjs` (exclusion des opérations terminées, Atelier/Planning capacité/compteurs), `tests/work-orders.test.mjs` (`closedAt`, `firstSeenImportId`, les deux nouveaux filtres) et `tests/erp-planning.test.mjs` (`firstSeenImportId` figé au premier import, jamais réécrit).
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (363/363), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : marquer une opération terminée dans un import de test et confirmer sa disparition de l'Atelier et de Planning capacité (mais pas du module OF) ; utiliser le filtre « Clôturées depuis » ; réimporter avec une OF réellement nouvelle et confirmer qu'elle seule coche « Nouvelles depuis le dernier import ».

## Module OF : « Clôturées depuis » et « Nouvelles depuis le dernier import » en onglets, pas en filtre déroulant — 27/07/2026

- [x] Demandé par l'utilisateur juste après la livraison du point précédent : « je préfère des onglets comme les départements et non un filtre » — précisé sur clarification : uniquement ces deux vues (clôturées / nouvelles), pas le filtre Statut existant.
- [x] `WorkOrdersModule.tsx` : le menu déroulant « Clôturées depuis » et la case à cocher « Nouvelles depuis le dernier import » sont remplacés par une barre de 3 onglets (Tous / Clôturées récemment / Nouvelles depuis le dernier import), même gabarit que `MachineDepartmentTabs` (Parc Machines) — pastille comptée, un seul onglet actif à la fois. Le choix de période (7/30 jours) reste disponible, sous forme de petits boutons secondaires visibles uniquement quand l'onglet « Clôturées récemment » est actif, pour ne pas perdre le réglage explicitement demandé au tour précédent. Les filtres existants (recherche, statut, machine, département, retard) restent inchangés, à côté des onglets.
- [x] `matchesErpWorkOrderFilters`/`summarizeErpWorkOrder` inchangés (seule la présentation change) — les compteurs par onglet sont calculés indépendamment des autres filtres actifs, comme les onglets de département de l'Atelier.
- [x] Nouveau test de câblage dans `tests/work-orders.test.mjs` verrouillant les 3 onglets et l'absence de la case à cocher retirée.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (364/364), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : confirmer que les 3 onglets fonctionnent, que le sélecteur 7/30 jours n'apparaît que sur l'onglet « Clôturées récemment », et que les compteurs affichés sur chaque onglet sont corrects.

## Statut « En attente » éditable, dans l'Atelier et la fiche OF, avec remarque et onglet dédié — 27/07/2026

- [x] Demandé par l'utilisateur, clarifié par 3 questions avant tout code : pouvoir changer le statut d'une opération à la fois dans l'Atelier et depuis la fiche OF ; « En attente » comme statut à part entière (pas un indicateur cumulable) ; un 4ᵉ onglet « En attente » dans le module OF, à côté de Clôturées/Nouvelles, permettant d'y associer une remarque.
- [x] Exploré avant tout code : le statut manuel et la remarque (`comment`) existaient déjà entièrement côté données (`PlanningDecision.planningStatus`/`comment`) et côté API (`/api/erp/operations/[id]` validait déjà `status`/`comment`) — seule l'interface manquait, aucun changement serveur nécessaire. `applyOperationPatchLocally` gérait déjà ces deux champs en mise à jour locale optimiste, réutilisée telle quelle.
- [x] Nouveau statut `waiting` (« En attente ») ajouté à `ErpOperationStatus` et répercuté aux 6 endroits distincts où ce vocabulaire est référencé (repérés un par un, pas de définition centrale unique) : le type, les libellés/tons partagés, un `Record` dupliqué dans le regroupement par statut du Cockpit ERP, la liste déroulante d'édition du Cockpit ERP, la liste blanche de validation de la route PATCH, et la priorité `deriveErpWorkOrderStatus`/« opération courante » (dupliquée entre `erp-work-order-summary.ts` et `WorkOrderDetail.tsx`) — retenue **bloquée > en attente > en cours > terminée (toutes) > à faire**.
- [x] **Atelier** : la colonne Statut, jusque-là un badge en lecture seule, devient un menu déroulant modifiable directement dans le tableau — nouveau `updateStatus` dans `useWorkshopOperations.ts` (même mécanisme PATCH optimiste que `updateMachine`/`updatePriority`), propagé à travers les 4 couches de composants jusqu'à `WorkshopOperationRow.tsx`.
- [x] **Fiche OF** : même statut modifiable sur chaque opération de la gamme, plus un nouveau champ « remarque » éditable (sauvegarde au `onBlur`) — c'est ici que la remarque demandée se saisit, sur l'opération concernée. La fiche garde son fetch actuel (détail complet du bon de commande) plutôt que de basculer sur `useWorkshopOperations` ; la mise à jour optimiste réutilise directement `applyOperationPatchLocally`.
- [x] **Module OF** : 4ᵉ onglet « En attente », même gabarit que les 3 onglets précédents. Nouveau `ErpWorkOrderSummary.hasWaitingOperation`, calculé indépendamment du statut global affiché — une OF avec une opération bloquée ET une en attente affiche « Bloquée » comme statut principal mais reste repérée dans cet onglet, pour n'en perdre aucune.
- [x] Les trois exclusions déjà en place pour `"completed"` (Atelier, Planning capacité, compteurs) ne sont volontairement pas étendues à `"waiting"` : une opération en attente reste visible dans le planning au jour le jour, seul le nouvel onglet sert à toutes les retrouver d'un coup.
- [x] Nouveaux tests dans `tests/erp-planning.test.mjs` (les 6 emplacements du statut), `tests/work-orders.test.mjs` (priorité, `hasWaitingOperation`, filtre d'onglet, câblage fiche OF) et `tests/planning-workshop.test.mjs` (câblage `updateStatus` dans l'Atelier).
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (370/370), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : changer le statut d'une opération en « En attente » dans l'Atelier, confirmer qu'elle reste visible dans le planning ; ouvrir sa fiche OF, y ajouter une remarque ; confirmer son apparition dans l'onglet « En attente » du module OF ; changer son statut ailleurs et confirmer qu'elle en sort.

## Planification équipe dans le module Actions — 28/07/2026

- [x] Demandé par l'utilisateur via un prompt détaillé (planification de la charge des personnes du bureau, distincte de Planning capacité qui planifie des machines) : un onglet « Liste des actions » enrichi (responsable/charge/période/priorité éditables, bandeau d'alerte, compteur) et un onglet « Planification équipe » (grille personnes × semaines/mois, glisser-déposer, réordonnancement, bascule semaine/mois, gestion d'équipe), visuellement calqué sur Planning capacité sans le modifier ni y ajouter de dépendance externe.
- [x] Exploré avant tout code (3 agents) : le prompt fourni décrivait l'app comme un monopage HTML/CSS/JS, inexact (Next.js/TypeScript/Tailwind réels) — adapté à la stack réelle. Collision de vocabulaire résolue par interprétation signalée : le statut existant `ActionStatus = "À planifier"` (idées de backlog sans responsable/échéance) est sémantiquement l'inverse du panneau demandé pour les actions sans période — renommé **« Non planifiées »** dans toute l'implémentation.
- [x] Modèle de données (`src/features/demo/types/demo.ts`) : nouveau `TeamMember { id, name, weeklyCapacityHours, order }`, `DemoData.people: TeamMember[]`, et 5 champs ajoutés à `ProductionAction` (`priority`, `responsableId` — référence toujours la personne par id, jamais par nom —, `estimatedHours`, `plannedWeek` au format ISO 8601 `« AAAA-Www »`, `planningOrder`). Le champ texte libre `responsable` existant est conservé pour tout le reste de l'app ; les mutateurs le synchronisent automatiquement à chaque changement de `responsableId`.
- [x] Migration (`demo-data-migration.ts`) : backfill `people: []` et les 5 nouveaux champs à `null` sur les payloads déjà sauvegardés localement, sur les deux chemins v1 (legacy) et v2 — sans ce backfill, les données existantes d'un utilisateur auraient échoué la validation et auraient été réinitialisées.
- [x] Nouveau `src/features/actions/services/iso-week.ts` : utilitaires de semaines ISO 8601 autonomes (clé, lundi, navigation, libellé, regroupement par mois), volontairement indépendants de `planning-view.ts` dont le calcul de semaine est couplé à la fenêtre glissante de jours du planning machines.
- [x] Nouveau `src/features/actions/services/team-planning-service.ts` : mutateurs (`assignAction`, `unassignAction`, `reorderWithinCell`, `moveToMonth` — dépose la carte sur la première semaine du mois non surchargée pour cette personne, sinon la première du mois —, gestion d'équipe) et un index de performance `buildTeamPlanningIndex` (`Map` personne+semaine → actions triées et charge totale), construit une seule fois par rendu (`useMemo`) plutôt que refiltré à chaque case.
- [x] Suppression d'une personne (`deleteTeamMember`) : ses actions gardent `responsableId` (aucune perte de charge/historique) mais perdent `plannedWeek`/`planningOrder`, donc réapparaissent dans « Non planifiées ».
- [x] Interface : colonnes Réglages `estimatedHours`/`plannedWeek` ajoutées par défaut ; `ActionRow.tsx` rend le responsable en liste déroulante de personnes (plus un texte libre) et ajoute les cellules éditables priorité/charge/période ; bandeau d'alerte + compteur dans l'onglet « Liste des actions » (`ActionsModule.tsx`).
- [x] Nouveau CSS module `TeamPlanning.module.css`, copie adaptée de `Planning.module.css` (pas d'import cross-feature de l'interne de Planning), pour un rendu visuellement identique sans coupler les deux fonctionnalités.
- [x] Nouveaux composants : `TeamCapacityCard.tsx` (carte glissable, glisser-déposer HTML5 natif comme Planning capacité, aucune dépendance ajoutée), `MoveActionMenu.tsx` (repli clic « Déplacer vers… » : personne + semaine, pour rester utilisable sans glisser-déposer), `UnscheduledActionsPanel.tsx` (panneau « Non planifiées », cible de dépose), `TeamCapacityGrid.tsx` (grille personnes × semaines/mois, bascule, réordonnancement en case, ligne « Total équipe », couleurs de charge reprises telles quelles des Réglages Production → Planning `loadWarningPercent`/`loadCriticalPercent`/`loadColors`, jamais de seuil réinventé), `TeamManagementDialog.tsx` (ajout/édition/suppression de personne, via la coquille générique `PlanningDialogShell`), `TeamPlanningTab.tsx` (assemblage, état de glisser-déposer partagé entre le panneau et la grille).
- [x] Non-régression : aucun fichier de `src/features/planning/` modifié (seule la coquille UI générique `PlanningDialogShell` est importée, jamais la logique métier de Planning capacité) ; onglets/statuts/colonnes Actions existants inchangés — vérifié par un test de câblage dédié.
- [x] Nouveaux tests dans `tests/team-planning.test.mjs` (22 tests) : semaines ISO dont la bascule d'année à 53 semaines (2026 → 2027, y compris le repli des derniers jours de décembre sur la semaine 1 de l'année suivante), migration `DemoData` sans perte, et gardes de texte source pour les mutateurs de `team-planning-service.ts` (même limitation déjà documentée pour `action-service.ts` : import via l'alias `@/...`, non résolu par `node --test` natif, donc non important directement).
- [x] `npx tsc --noEmit`, `npm run lint` (1 erreur JSX corrigée : apostrophe non échappée), `npm test` (392/392), `npm run build` tous verts. Page `/actions` vérifiée servie et rendue côté serveur (colonnes, onglet, bandeau présents dans le HTML réel) — aucun outil de navigateur interactif disponible dans cet environnement pour recetter le glisser-déposer, le réordonnancement en case ou les dialogues au clic.
- [ ] Recetter manuellement dans le navigateur (non fait faute d'outil de navigateur automatisé) : créer une action, la glisser depuis « Non planifiées » vers une case, la déplacer entre personnes, réordonner dans une case et confirmer la persistance après rechargement, basculer Semaine/Mois dans les deux sens, déposer sur un mois, constater qu'une surcharge colore la case en rouge sans jamais bloquer le dépôt, vérifier qu'une action « Fait » reste visible grisée et exclue du total, supprimer une personne ayant des actions planifiées et confirmer leur retour en « Non planifiées » sans perte, et le premier chargement sans aucune donnée.
- [ ] Limite héritée, non corrigée dans ce chantier (touche une fonction partagée sensible, hors périmètre) : les nouvelles colonnes par défaut (`priority`/`estimatedHours`/`plannedWeek`) n'apparaîtront pas automatiquement dans les Réglages déjà sauvegardés d'un utilisateur existant — la migration des Réglages ne fait que compléter les entrées déjà présentes, jamais en ajouter de nouvelles (limitation déjà partagée par toutes les autres listes configurables : départements, machines, etc.).

## Resserrement visuel du tableau Atelier — 31/07/2026

- [x] Demandé par l'utilisateur : « tout les tableau planning » plus petit, dimensions de colonnes/lignes. Clarifié par 2 questions avant tout code : périmètre limité à l'Atelier (pas Planning capacité machines, pas Planification équipe Actions, pas le Cockpit ERP/module OF) ; ampleur « resserrement marqué » (texte réduit en plus des paddings/largeurs, pas seulement un resserrement léger).
- [x] `WorkshopMachinePanel.tsx` : `ROW_HEIGHT_PX` 52→30, `HEADER_HEIGHT_PX` 40→26, `ACTIONS_COLUMN_WIDTH_PX` 220→175, chaque largeur par défaut de `DEFAULT_COLUMN_WIDTH_PX` réduite d'environ 25-30 % (ex. priorité 90→64, description 220→160) ; padding des en-têtes et de la barre de titre machine resserrés (`p-3`→`p-1.5`, `px-4 py-3`→`px-3 py-1.5`) ; boutons Renuméroter/Imprimer et texte d'aide réduits d'un cran.
- [x] `WorkshopOperationRow.tsx` : cellules `p-3 text-sm`→`p-1.5 text-xs`, champ Priorité et menu Statut réellement réduits (`min-h-0 h-6`, sinon la hauteur minimale partagée `fieldClass`/`min-h-10` aurait empêché toute réduction visuelle malgré `h-8`/`h-6`). Les 3 boutons d'action par ligne (ouvrir/fermer le détail, fiche machine, ouvrir l'OF) sont réduits et leur libellé raccourci (« Ouvrir l'opération »/« Fiche machine »/« Ouvrir l'OF » → « Détails »/« Fiche »/« OF », texte complet conservé en infobulle) pour tenir sur une seule ligne dans la colonne Actions resserrée.
- [x] `WorkshopMachinePicker.tsx` (sélecteur de machine intégré à la colonne Machine) : bouton déclencheur et liste déroulante resserrés, vignette photo réduite (32px→20px).
- [x] `WorkshopDepartmentSection.tsx` : bandeau de titre de département resserré, en cohérence visuelle avec le tableau qu'il surmonte.
- [x] `WORKSHOP_COLUMN_MIN_WIDTH_PX` (borne de redimensionnement manuel à la souris) abaissée de 80 à 60px, pour que les nouvelles largeurs par défaut (dont certaines descendent sous 80px) restent atteignables/reproductibles en glissant le bord d'une colonne, et pas seulement au premier chargement.
- [x] `ROW_HEIGHT_PX`/`HEADER_HEIGHT_PX` gardent leur seul rôle : le calcul de la fenêtre de lignes réellement montées dans le DOM (`computeVirtualRowRange`, non modifié) tolère une estimation approximative grâce à sa marge de sécurité (overscan) déjà en place — pas besoin d'une correspondance pixel-perfekt avec la hauteur réellement rendue.
- [x] Tests existants mis à jour dans `tests/planning-workshop.test.mjs` (2 assertions sur l'ancien minimum 80px, 1 assertion sur l'ancienne classe du menu Statut) pour refléter les nouvelles valeurs ; aucun nouveau test ajouté (changement purement visuel, déjà couvert par les tests de câblage/comportement existants qui restent valides).
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392), `npm run build` tous verts. Les nouvelles classes compactes ont été retrouvées dans le bundle client réellement construit (`.next/static/chunks/`), preuve que le code compacté est bien celui qui serait servi — mais faute d'outil de navigateur interactif dans cet environnement, l'onglet Atelier n'a pas pu être ouvert et capturé visuellement (il n'est monté côté client qu'après un premier clic sur l'onglet, jamais au premier rendu serveur de `/planning`).
- [ ] Recetter manuellement dans le navigateur (non fait faute d'outil de navigateur automatisé) : ouvrir l'onglet Atelier et juger si le resserrement est suffisant/pas trop agressif, vérifier qu'aucun texte des colonnes Article/Client/Désignation ne devient illisible aux nouvelles largeurs, tester le redimensionnement manuel d'une colonne jusqu'à son nouveau minimum (60px), et confirmer que les 3 boutons d'action tiennent bien sur une seule ligne à la largeur d'écran habituelle.

## Correctifs de resserrement Atelier (padding/hauteurs inégales) et colonne Retard — 04/08/2026

- [x] Corrigé racine : le padding `px-1`/`px-1.5` du resserrement du 31/07 restait sans effet (conflit d'ordre de génération Tailwind v4 avec `px-3` de `fieldClass`/`secondaryButton`) — classes autonomes (`compactFieldClass`/`compactButtonClass`) dans `WorkshopOperationRow.tsx` et `WorkshopMachinePicker.tsx`.
- [x] Corrigé : cadres machine à hauteur inégale (`maxHeight` au lieu d'une hauteur fixe) dans `WorkshopMachinePanel.tsx`.
- [x] Ajouté : variante `size="sm"` sur `StatusPill` (partagé), utilisée par la colonne Retard de l'Atelier ; taille par défaut inchangée ailleurs.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : confirmer que la colonne Priorité est lisible, que les boutons d'action tiennent sur une ligne, que les cadres machine ont désormais tous la même hauteur à réglage égal, et que la colonne Retard n'est plus disproportionnée par rapport au reste du tableau.

## Étape « OF planifiés par machine » dans la réunion de production — 04/08/2026

- [x] Demandé par l'utilisateur : revoir, machine par machine, les 5 OF planifiés avec leur désignation, et pouvoir créer une action liée à l'OF pendant la revue.
- [x] Nouveau service testé `meeting-machine-review.ts` (`buildErpMachineReview`/`buildDemoMachineReview`), nouveau composant `MeetingMachineReview.tsx` basculant ERP réel/démonstration comme `WorkOrderDetail.tsx`, nouvelle étape dans `productionSteps` (`MeetingWorkflow.tsx`), bouton « + Action » par OF ouvrant `ActionFormDialog` avec `contextLink` vers l'OF précis et `origine` = « Réunion de production ».
- [x] Réunion QRQC volontairement non modifiée (demande limitée à la réunion de production).
- [x] 6 nouveaux tests (`tests/meeting-machine-review.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (398/398), `npm run build` tous verts.
- [x] Ajouté le client, le code article et la quantité commandée sur chaque ligne d'OF (demande de suivi immédiate), en mode ERP réel comme en mode démonstration, avec tests étendus (399/399).
- [x] Signalé par l'utilisateur : l'ancienne étape « Vue planning » faisait doublon avec cette nouvelle étape — supprimée, « OF planifiés par machine » prend directement sa place (les étapes suivantes de la réunion Production se décalent d'un cran).
- [x] Demandé par l'utilisateur : présentation plus professionnelle, avec la photo de la machine en petit format comme sur sa fiche. Nouveau composant partagé `MachineThumbnail.tsx`, réutilisé par le sélecteur de machine de l'Atelier (qui avait sa propre copie locale jusque-là) ; carte machine avec bandeau photo/nom/nombre d'OF, lignes numérotées. Tests étendus (400/400).
- [ ] Recetter manuellement dans le navigateur : parcourir la réunion de production jusqu'à l'étape « OF planifiés par machine », vérifier l'affichage par machine (photo, désignation, client, article, quantité) en mode ERP réel et en mode démonstration (sans import actif), confirmer que la photo affichée correspond bien à celle de la fiche machine, créer une action depuis un OF et confirmer qu'elle apparaît bien sur la fiche de cet OF puis dans la revue des actions d'une prochaine réunion.

## Navigation par onglets entre les étapes de réunion — 04/08/2026

- [x] Demandé par l'utilisateur : pouvoir revenir et sauter directement entre les étapes depuis le haut de l'écran, comme des onglets, au lieu de seulement Précédent/Suivant. Nouveau `StepTabs` (`MeetingWorkflow.tsx`), même style que les onglets de vue d'Actions, appliqué à QRQC et Production. Boutons Précédent/Suivant/Clôturer conservés en complément ; onglets désactivés une fois la réunion clôturée.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` (401/401), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : cliquer un onglet non adjacent (ex. de l'étape 1 à l'étape 6) et confirmer que le contenu affiché correspond bien, sur les deux types de réunion, et que les onglets se replient proprement sur petit écran.

## Uniformisation de la revue des actions en réunion avec le module Actions — 04/08/2026

- [x] Demandé par l'utilisateur : garder la même mise en page entre l'étape « Revue des actions » des réunions et le module Actions, pour une meilleure compréhension entre les deux écrans.
- [x] `MeetingActionReview.tsx` réutilise directement `ActionGroupedList`/`ActionRow` (mêmes colonnes configurées dans Réglages → Actions, même regroupement, mêmes actions rapides) au lieu de cartes ad hoc ; toute la logique de mutation dupliquée disparaît du composant. Réassignation désormais via la colonne Responsable éditable, comme dans le module Actions.
- [x] 4 nouveaux tests (`tests/meeting-action-review.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (405/405), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : vérifier que la revue des actions en réunion (QRQC et Production) ressemble bien au tableau du module Actions, tester Fait/Reporter, la réassignation via la colonne Responsable et le changement de regroupement (Par personne/Par échéance).
- [x] Demandé par l'utilisateur, en suite directe : déplacer le bouton « + Nouvelle action » de la réunion (jusqu'ici isolé au milieu de la page) dans le `ModuleHeader`, même emplacement/style que le module Actions. Fonctionnalité inchangée. Grille Note rapide/Parking lot passée de 3 à 2 colonnes. Test étendu (406/406).
- [ ] Recetter manuellement dans le navigateur : confirmer que le bouton « + Nouvelle action » du `ModuleHeader` de la réunion ouvre bien la fenêtre avec l'origine et le lien vers la réunion pré-remplis, sur les deux types de réunion.
- [ ] Étendre éventuellement cette étape à la réunion QRQC, si le besoin est confirmé (hors périmètre de cette demande).

## Sous-actions dans la fiche d'une action — 04/08/2026

- [x] Demandé par l'utilisateur : pouvoir ouvrir une action et y ajouter des sous-actions. Nouveau champ `ProductionAction.parentActionId` (aucun second modèle de données : une sous-action est une action normale, avec sa propre fiche et ses propres mutations), migration des données locales existantes.
- [x] `ActionDetail.tsx` gagne une section « Sous-actions » (bouton « + Sous-action », liste réutilisant `ActionGroupedList` comme le reste du module, lien vers l'action parente si la fiche ouverte en est une). `deleteAction` supprime les sous-actions avec leur parent (confirmation explicite).
- [x] Sous-actions exclues du registre Actions, de la Planification équipe et de la revue des actions en réunion (nouvelle fonction partagée `isSubAction`), pour ne jamais apparaître en double hors du contexte de leur parent.
- [x] 9 nouveaux tests (`tests/action-subactions.test.mjs`), 1 assertion mise à jour (`tests/team-planning.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (415/415), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : ouvrir une action, créer plusieurs sous-actions, confirmer qu'elles n'apparaissent pas dans le registre Actions ni la Planification équipe, les marquer Fait/Reporter/réassigner depuis la fiche parente, ouvrir la fiche d'une sous-action et vérifier le lien vers son parent, puis supprimer une action ayant des sous-actions et confirmer qu'elles disparaissent avec elle.
- [ ] Décision de portée non tranchée : profondeur illimitée non empêchée techniquement (une sous-action pourrait recevoir sa propre sous-action) — jamais testée ni recommandée ; à clarifier si le besoin apparaît.

## Module Contacts — annuaire d'entreprise centralisé — 04/08/2026

- [x] Demandé par l'utilisateur : un module Contacts pour centraliser toutes les personnes avec qui l'entreprise travaille (collaborateurs, fournisseurs, sous-traitants…), avec type (interne/externe), catégories multiples configurables, fiche complète (photo, coordonnées, notes), recherche/filtres, ajout/modification/suppression.
- [x] Nouveau domaine `Contact` (`DemoData.contacts`), catégories configurables dans Réglages → Contacts (16 catégories demandées, `OrderedStandardSettings`, mêmes mécanismes que les origines d'actions/départements), photo en IndexedDB séparée (`prodpilot-contact-photos`), écrans `/contacts` et `/contacts/[id]`, entrée de navigation « Contacts ».
- [x] `MachineThumbnail`/`MachinePhotoUploader` (déjà génériques, seulement mal nommés) déplacés vers `src/components/ui/PhotoThumbnail.tsx`/`PhotoUploader.tsx` et réutilisés par Contacts en plus de leurs appelants machine existants — pas de troisième quasi-copie.
- [x] 16 nouveaux tests (`tests/contacts.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (431/431), `npm run build` tous verts.
- [ ] **Décision à prendre par l'utilisateur** : `DemoData.people` (`TeamMember`, Planification équipe d'Actions) et `MachineSavContact` (contact SAV d'une machine) sont deux annuaires de personnes préexistants, distincts de Contacts et non fusionnés avec lui dans ce chantier (changement architectural majeur, hors périmètre d'une demande de module autonome). À clarifier explicitement si l'utilisateur souhaite les unifier.
- [ ] **Non fait, explicitement présenté comme un objectif futur par l'utilisateur** : intégration de Contacts dans les autres modules (assigner une action à un contact, appeler/e-mailer en un clic depuis un autre écran, sélection automatique lors d'une demande de sous-traitance/achat). Seule la fiche contact elle-même propose des liens tel:/mailto:/site cliquables.
- [ ] Recetter manuellement dans le navigateur : créer/modifier/supprimer un contact, tester recherche et filtres (nom, société, type, catégorie), ajouter une photo, vérifier les liens tel:/mailto:/site, gérer les catégories depuis Réglages → Contacts, et confirmer l'affichage correct de l'entrée de navigation pour un rôle non-administrateur.
- [ ] Étendre le CSV import/export (déjà existant pour le Parc Machines) aux Contacts, si le volume de saisie manuelle le justifie — non demandé pour ce chantier.

## E-mail/téléphone sur la fiche récap Contacts, et recadrage de photo — 04/08/2026

- [x] Demandé par l'utilisateur : voir l'e-mail et le téléphone directement sur la carte récapitulative de chaque contact ; pouvoir zoomer/déplacer une photo pour mieux la centrer/rogner, plutôt qu'un centrage automatique subi.
- [x] Cartes Contacts affichent e-mail/téléphone. Nouveau `ImageCropperDialog.tsx` (zoom + déplacement, canvas, sans dépendance externe) et module pur testé `image-crop-math.ts`, intégrés dans `PhotoUploader.tsx` (partagé Machines/Contacts) : recadrage à l'ajout d'une photo, et bouton « Recadrer » pour ajuster une photo déjà enregistrée.
- [x] 8 nouveaux tests (`tests/image-crop-math.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (439/439), `npm run build` tous verts.
- [ ] Recetter manuellement dans le navigateur : glisser-déposer et zoom du recadrage sur desktop et tactile (souris, pavé tactile, écran tactile), confirmer l'absence d'espace vide aux valeurs extrêmes de zoom, vérifier le rendu final sur la fiche machine et la fiche Contacts.
- [x] Demandé par l'utilisateur, en suite directe : activer le recadrage en cliquant directement sur la photo plutôt que via un bouton séparé. Ancienne fenêtre d'agrandissement passive (lecture seule) supprimée, remplacée par le recadrage (déplacement + zoom) déjà en place. Test étendu (439/439).
- [ ] Recetter manuellement dans le navigateur : confirmer que cliquer sur une photo déjà enregistrée (fiche machine, fiche Contacts) ouvre bien le recadrage, avec déplacement et zoom fonctionnels.
- [x] Demandé par l'utilisateur : photo pas assez visible sur la fiche Contacts. `PhotoUploader.tsx` gagne un prop `size` (`md` gabarit historique inchangé, `lg` nouveau carré 288px) ; `ContactDetail.tsx` utilise `size="lg"`, `MachineDetail.tsx` inchangé. Test étendu (440/440).
- [ ] Recetter manuellement dans le navigateur : confirmer que la photo de la fiche Contacts est bien plus grande et lisible, sans casser la mise en page de la colonne « Photo ».

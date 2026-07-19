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
- [ ] Signaler proprement à l’utilisateur un dépassement du quota `localStorage`, notamment pour les logos et photos de machines.
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

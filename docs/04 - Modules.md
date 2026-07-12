# Modules fonctionnels — ProdPilot IA

## Lecture du document

Tous les modules ci-dessous sont planifiés. La présence d’une description ne signifie pas qu’ils sont déjà développés. Le MVP produit global est défini dans la feuille de route ; le « périmètre MVP » de chaque module décrit sa première version utile.

## Mon Espace

- **Objectif** : donner une vue immédiate des priorités, alertes et prochaines actions de la journée.
- **Utilisateurs principaux** : responsables de production et planificateurs.
- **Écrans principaux** : tableau de bord du jour, détail d’une priorité, préférences d’affichage.
- **Fonctions clés** : agrégation, priorisation, filtres, accès rapide et indication de la source/fraîcheur.
- **Liens** : Mails, Actions, Planning, OF, QRQC, Réunion de production, Parc machines et Assistant IA.
- **Périmètre MVP** : shell, navigation et cartes alimentées par données simulées puis par Gmail, actions et planning.
- **Périmètre futur** : personnalisation par rôle, suggestions proactives et indicateurs prédictifs.

## Gmail / Mails

- **Objectif** : repérer et traiter les messages importants sans quitter le contexte de production.
- **Utilisateurs principaux** : responsables de production et planificateurs.
- **Écrans principaux** : connexion Gmail, boîte récente, détail, résumé et éditeur de brouillon.
- **Fonctions clés** : OAuth, lecture, recherche/filtres, synthèse IA, création d’action et brouillon avec confirmation.
- **Liens** : Mon Espace, Actions, OF, Demandes internes et Assistant IA.
- **Périmètre MVP** : connexion, messages récents, résumé, proposition de réponse et confirmation avant envoi.
- **Périmètre futur** : catégorisation avancée, rattachement suggéré aux objets métier et règles personnalisées.

## Actions

- **Objectif** : garantir qu’une décision ou demande possède un suivi clair.
- **Utilisateurs principaux** : toute personne assignée ou responsable d’un suivi.
- **Écrans principaux** : liste, détail, création/édition et vue « mes actions ».
- **Fonctions clés** : responsable, échéance, priorité, statut, commentaires, pièces jointes et historique.
- **Liens** : Mon Espace, Mails, QRQC, Réunion de production, OF, Machines et Demandes internes.
- **Périmètre MVP** : création, attribution, statuts, échéances et signalement des retards.
- **Périmètre futur** : dépendances, récurrence, automatisations confirmées et indicateurs d’efficacité.

## Planning

- **Objectif** : organiser les opérations de production par machine et rendre les conflits visibles.
- **Utilisateurs principaux** : planificateurs et responsables de production.
- **Écrans principaux** : planning par machine/période, file des OF, conflits et version imprimable.
- **Fonctions clés** : calcul initial, glisser-déposer, contraintes, capacité, versions et publication.
- **Liens** : OF, Import ERP, Qualité ERP, Parc machines, Maintenance, Impression et Mon Espace.
- **Périmètre MVP** : planning issu des données nettoyées, ajustements tracés, alertes et impression par machine.
- **Périmètre futur** : scénarios, optimisation multi-contrainte, simulation et comparaison charge/capacité.

## Ordres de fabrication / OF

- **Objectif** : fournir une vue canonique des OF et de leurs gammes complètes.
- **Utilisateurs principaux** : responsables de production, planificateurs et chefs d’équipe.
- **Écrans principaux** : liste, détail OF, opérations/gamme et alertes de complétude.
- **Fonctions clés** : recherche, statuts, dates, quantités, opérations, machines, liens source et anomalies.
- **Liens** : Import ERP, Qualité ERP, Planning, Actions, Mails et Analytics.
- **Périmètre MVP** : consultation des OF nettoyés et de leur provenance, sans écriture dans l’ERP.
- **Périmètre futur** : suivi d’avancement enrichi et synchronisation ERP en lecture via SQL/API.

## Import ERP

- **Objectif** : intégrer des données ERP hétérogènes de manière sûre et répétable.
- **Utilisateurs principaux** : administrateurs métier, planificateurs et référents données.
- **Écrans principaux** : dépôt, aperçu, mappage, exécution et historique des imports.
- **Fonctions clés** : CSV/Excel, détection des colonnes, modèles de mappage, version et traçabilité.
- **Liens** : Qualité ERP, OF, Planning, Paramètres et Analytics.
- **Périmètre MVP** : import manuel CSV/Excel, mappage et conservation immuable des données brutes.
- **Périmètre futur** : imports planifiés et connecteurs ERP SQL/API en lecture.

## Qualité des données ERP

- **Objectif** : détecter et expliquer les données qui empêchent un pilotage fiable.
- **Utilisateurs principaux** : référents données, planificateurs et responsables de production.
- **Écrans principaux** : synthèse qualité, liste d’anomalies, détail d’une ligne et validation de correction.
- **Fonctions clés** : règles de format et métier, doublons, références manquantes, score et rapport exportable.
- **Liens** : Import ERP, OF, Planning et Analytics.
- **Périmètre MVP** : contrôles bloquants/non bloquants et promotion explicite vers les données nettoyées.
- **Périmètre futur** : règles configurables, tendances qualité et suggestions de correction en lot.

## QRQC

- **Objectif** : structurer la réaction rapide aux problèmes de qualité, coût, délai et sécurité.
- **Utilisateurs principaux** : responsables de production, qualité et chefs d’équipe.
- **Écrans principaux** : tableau QRQC, fiche problème, analyse et revue des actions.
- **Fonctions clés** : signalement, criticité, causes, contre-mesures, responsables et preuves de clôture.
- **Liens** : Actions, Réunion de production, OF, Machines et Analytics.
- **Périmètre MVP** : fiche problème simple et actions reliées.
- **Périmètre futur** : méthodes d’analyse approfondies, escalade et tendances récurrentes.

## Réunion de production

- **Objectif** : préparer, conduire et tracer les décisions des rituels de production.
- **Utilisateurs principaux** : responsables de production, planificateurs, qualité et maintenance.
- **Écrans principaux** : ordre du jour, mode réunion, compte rendu et historique.
- **Fonctions clés** : agrégation des alertes, décisions, actions, participants et suivi des points précédents.
- **Liens** : Mon Espace, Actions, Planning, QRQC, Machines et Analytics.
- **Périmètre MVP** : ordre du jour, notes, décisions et création d’actions.
- **Périmètre futur** : synthèse IA, modèles de réunion et comparaison entre périodes.

## Parc machines

- **Objectif** : centraliser l’état et les informations opérationnelles des équipements.
- **Utilisateurs principaux** : production, maintenance et méthodes.
- **Écrans principaux** : liste, fiche machine, état, documents et historique.
- **Fonctions clés** : identité, capacité, disponibilité, événements, documents et contacts.
- **Liens** : Planning, Maintenance, Actions, QRQC et Analytics.
- **Périmètre MVP** : référentiel machine et disponibilité utile au planning.
- **Périmètre futur** : compteurs, capteurs, historique détaillé et analyse de performance, sans devenir une GMAO complète.

## Planning de maintenance

- **Objectif** : anticiper les indisponibilités machines qui influencent la production.
- **Utilisateurs principaux** : maintenance, responsables de production et planificateurs.
- **Écrans principaux** : calendrier, intervention, charge et alertes à venir.
- **Fonctions clés** : planification, durée, responsable, statut et impact sur capacité.
- **Liens** : Parc machines, Planning, Actions et Mon Espace.
- **Périmètre MVP** : indisponibilités planifiées visibles dans le planning.
- **Périmètre futur** : récurrence, compteurs et intégration avec une GMAO existante.

## Demandes internes

- **Objectif** : centraliser et orienter les demandes adressées à la production.
- **Utilisateurs principaux** : demandeurs internes, production, qualité, maintenance et méthodes.
- **Écrans principaux** : centre de demandes, formulaire, détail et file de traitement.
- **Fonctions clés** : catégorie, urgence, responsable, statut, commentaires et conversion en action.
- **Liens** : Actions, Mails, Mon Espace et Analytics.
- **Périmètre MVP** : saisie, affectation et suivi simple.
- **Périmètre futur** : formulaires par type, engagements de délai et portail élargi.

## Analytics

- **Objectif** : fournir des indicateurs fiables pour comprendre l’activité et les dérives.
- **Utilisateurs principaux** : responsables de production, direction industrielle et référents métier.
- **Écrans principaux** : tableaux de bord, détail d’indicateur et exports.
- **Fonctions clés** : filtres, période, provenance, définitions et tendances.
- **Liens** : tous les modules métier, notamment OF, Planning, Actions, QRQC et Machines.
- **Périmètre MVP** : quelques indicateurs opérationnels définis, datés et reliés à leur source.
- **Périmètre futur** : analyses comparatives, prévisions et alertes configurables.

## Utilisateurs et permissions

- **Objectif** : donner à chacun uniquement les accès nécessaires dans son entreprise.
- **Utilisateurs principaux** : administrateurs et responsables d’entreprise.
- **Écrans principaux** : utilisateurs, invitations, rôles et accès par entreprise.
- **Fonctions clés** : activation, attribution de rôle, révocation, audit et changement de contexte autorisé.
- **Liens** : tous les modules et toutes les intégrations.
- **Périmètre MVP** : authentification, rôles simples et contrôles serveur.
- **Périmètre futur** : permissions fines, plusieurs entreprises par utilisateur et délégations temporaires.

## Paramètres

- **Objectif** : administrer les préférences de l’entreprise, des utilisateurs et des intégrations.
- **Utilisateurs principaux** : administrateurs et utilisateurs pour leurs préférences personnelles.
- **Écrans principaux** : entreprise, profil, intégrations, calendriers, mappages et notifications.
- **Fonctions clés** : configuration, test de connexion, historique des changements et valeurs par défaut.
- **Liens** : Gmail, Import ERP, Planning, Utilisateurs et Impression.
- **Périmètre MVP** : profil, préférences essentielles et état des connexions.
- **Périmètre futur** : politiques d’entreprise, modèles partagés et paramétrage avancé.

## Impression

- **Objectif** : produire des supports terrain lisibles lorsque l’écran n’est pas adapté.
- **Utilisateurs principaux** : planificateurs, responsables de production et chefs d’équipe.
- **Écrans principaux** : aperçu avant impression et paramètres de mise en page.
- **Fonctions clés** : format européen, sélection machine/période, en-tête, date de génération et version.
- **Liens** : Planning, OF, Réunion de production et Analytics.
- **Périmètre MVP** : planning imprimable par machine avec source et horodatage.
- **Périmètre futur** : modèles personnalisables, lots et codes QR vers les vues numériques.

## Assistant IA

- **Objectif** : expliquer, synthétiser et préparer des actions à partir des données autorisées.
- **Utilisateurs principaux** : responsables de production et planificateurs, puis autres rôles selon permissions.
- **Écrans principaux** : panneau assistant, conversation, sources et confirmation d’action.
- **Fonctions clés** : questions/réponses, synthèses, brouillons, recherche contextuelle et suggestions.
- **Liens** : Mon Espace et tous les modules dont l’accès est autorisé.
- **Périmètre MVP** : résumés et brouillons Gmail clairement identifiés comme générés.
- **Périmètre futur** : commandes multi-modules, scénarios de planning et préparation de réunions.

L’assistant ne contourne jamais les permissions, ne reçoit jamais de secret côté navigateur et ne déclenche pas d’action engageante sans confirmation explicite.

# Feuille de route — ProdPilot IA

## Référence produit

La vision, les principes immuables et l’ordre produit sont définis dans la [Constitution produit](specifications/00%20-%20Vision.md), en particulier dans [09 - Product Roadmap.md](specifications/09%20-%20Product%20Roadmap.md). Le présent document suit l’avancement opérationnel du dépôt ; il ne peut pas modifier les priorités constitutionnelles.

ProdPilot IA est un assistant pour les responsables de planification, de production et de flux. ERP, messagerie, planning et maintenance sont des sources ou domaines d’information. Leur reproduction sous forme de logiciels spécialisés n’est pas l’objectif.

## État actuel

La démonstration couvre Mon Espace, Mails, Actions, OF, Planning, Réunions, Suivi, Parc Machines, Qualité ERP, Analyses et Réglages. Ces écrans permettent de valider des parcours et des contrats communs ; ils ne signifient pas que toutes les intégrations, persistances ou fonctions d’IA sont prêtes pour la production.

Le connecteur Google Workspace fonctionne localement lorsque les identifiants autorisés sont configurés. Microsoft 365, OpenAI, l’import ERP réel, l’authentification applicative et la persistance multi-entreprise restent à réaliser. Aucun e-mail n’est envoyé par l’application et aucune donnée ERP n’est modifiée.

## Fondations transversales

Ces exigences accompagnent toutes les étapes :

- Constitution produit lue et respectée avant chaque développement ;
- configuration centralisée et aucune norme d’entreprise codée en dur ;
- source de vérité unique et services centraux entre domaines ;
- connecteurs remplaçables et mode démonstration ;
- permissions serveur, isolation par entreprise et secrets protégés ;
- recommandations explicables et actions engageantes confirmées ;
- parcours accessibles, responsive et en français ;
- documentation, tests et contrôles qualité alignés sur l’état livré.

## 1 — Assistant Mails

**État : en cours**

Déjà disponible : architecture multi-fournisseurs, plusieurs comptes, compte actif, mode Mock, OAuth Google local, lecture des messages et création confirmée de brouillons.

Prochain résultat : synthèses IA sourcées, classement utile au travail de production, rattachement prudent au contexte métier et stockage sécurisé des jetons avant déploiement partagé.

## 2 — Conversation IA

**État : démonstration locale limitée**

L’assistant actuel répond de manière déterministe sur les données de démonstration. La prochaine étape doit permettre une conversation explicable, limitée par les permissions, capable de citer ses sources, signaler l’incertitude et préparer des actions sans les exécuter seule.

## 3 — Import ERP

**État : à faire**

Construire l’import contrôlé CSV/Excel, le mappage configurable, la conservation des données brutes, les contrôles qualité et la promotion explicite vers des données nettoyées. L’ERP reste en lecture seule.

## 4 — Planning

**État : fonctionnel en mode démonstration**

La grille, les charges, les déplacements, les tâches et l’impression sont disponibles avec des données locales et des standards configurables. La prochaine étape dépend des données ERP nettoyées et doit renforcer l’explication des risques et options sans transformer ProdPilot IA en logiciel de planning généraliste.

## 5 — Actions

**État : fonctionnel en mode démonstration**

La source locale commune relie déjà les actions aux autres domaines. La suite doit consolider provenance, permissions, persistance partagée, notifications utiles et suivi sans duplication.

## 6 — Réunions

**État : fonctionnel en mode démonstration**

QRQC et réunion de production permettent notes, décisions et création d’actions. La suite doit utiliser des modèles configurables et préparer des synthèses relues par l’utilisateur.

## 7 — Parc Machines

**État : fonctionnel en mode démonstration**

Les machines disposent d’un référentiel central, d’une vue opérationnelle et de liens vers le planning. La suite doit se limiter aux informations utiles aux décisions de production et rester interopérable avec les systèmes spécialisés.

## 8 — Maintenance

**État : démonstration légère**

Les événements peuvent influencer la capacité du planning. La suite doit améliorer anticipation, responsabilités et alertes, sans recréer une GMAO.

## 9 — Analyses

**État : fonctionnel en mode démonstration**

Les indicateurs actuels valident la présentation. La suite ne doit introduire que des analyses reliées à une décision, avec définition, période, source et limites visibles.

## Prochains jalons

| Jalon | Résultat attendu | Condition principale |
|---|---|---|
| C0 — Constitution adoptée | Référence fonctionnelle unique | Documentation alignée et relue |
| M1 — Mails assistés | Synthèses et brouillons explicables | Sources visibles, confirmation humaine |
| A1 — Conversation contrôlée | Questions multi-sources autorisées | Permissions et incertitudes traitées |
| E1 — Données ERP fiables | Import et nettoyage traçables | Aucune écriture ERP |
| P1 — Aide au planning réelle | Risques et options issus de données fiables | Arbitrages expliqués et confirmés |
| S1 — Suivi coordonné | Actions et réunions sans duplication | Source unique et historique |
| R1 — Ressources contextualisées | Machines et maintenance éclairent les décisions | Périmètre non-GMAO respecté |
| D1 — Analyses décisionnelles | Indicateurs utiles et sourcés | Décision associée explicitement |

Les jalons ne constituent pas des dates. Leur ordre ne change qu’après une décision produit explicite et une mise à jour de la Constitution.

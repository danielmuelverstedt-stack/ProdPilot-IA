# Constitution produit — Architecture fonctionnelle globale

## Finalité

L’architecture fonctionnelle garantit qu’une même information reste cohérente dans tout le produit, que les règles d’entreprise sont configurables et que les sources externes peuvent évoluer sans perturber l’expérience utilisateur.

## Chaîne de responsabilité

```text
Réglages
   ↓
Référentiels et dépôts
   ↓
Services
   ↓
Logique métier
   ↓
Interface utilisateur
```

### Réglages

Les Réglages décrivent les choix de l’entreprise et des utilisateurs : vocabulaire, référentiels, droits, seuils, modèles, préférences et comportements configurables. Ils ne sont pas redéfinis localement par les modules.

### Référentiels et dépôts

Un référentiel ou dépôt constitue le point d’accès unique à une catégorie de données. Il masque le lieu où elles sont conservées et permet de remplacer une persistance locale, une base ou une source externe sans changer les consommateurs.

### Services

Les services combinent les données autorisées, appliquent les règles communes et exposent des opérations compréhensibles par le métier. Ils contrôlent la provenance, la cohérence et les droits nécessaires.

### Logique métier

La logique métier interprète les informations selon les objectifs du produit : détecter un risque, évaluer une priorité, préparer un choix ou proposer une action. Elle ne dépend pas de la forme d’un écran ni des particularités d’un fournisseur.

### Interface utilisateur

L’interface rend la situation compréhensible, présente les sources et permet à l’utilisateur d’agir. Elle n’invente pas de règle métier et ne contourne pas les services.

## Communication entre domaines

Les modules ne communiquent jamais directement entre eux. Un module ne lit pas le stockage, l’état interne ou les composants d’un autre module. Lorsqu’une information doit être partagée, elle provient du dépôt qui en est responsable et passe par un service central.

Exemple fonctionnel : un e-mail peut suggérer une action, mais le module Mails ne conserve pas une copie d’action. Après confirmation, le service des actions crée l’objet dans sa source de vérité et conserve la référence vers l’e-mail d’origine.

## Sources externes

ERP, messageries, outils de planning, maintenance, fichiers et autres systèmes sont des sources. Chaque source est isolée derrière un connecteur remplaçable. Les données sont normalisées avant d’alimenter les services métier.

Une indisponibilité externe doit être visible et ne doit pas rendre l’ensemble du produit inutilisable. Le produit distingue toujours :

- la donnée source ;
- la donnée interprétée ou nettoyée ;
- la recommandation produite ;
- l’action confirmée par l’utilisateur.

## Configuration et données métier

La configuration décrit comment l’entreprise souhaite travailler. Les données métier décrivent ce qui se passe réellement. Les deux sont centralisées, versionnées et consultées par des services ; elles ne sont pas mélangées dans les composants.

## Principes de remplacement

- Remplacer un fournisseur de messagerie ne change pas l’espace de traitement des e-mails.
- Remplacer le stockage ne change pas les règles ni les écrans métier.
- Ajouter un ERP ne crée pas un second modèle d’OF.
- Ajouter un service d’IA ne lui donne pas un accès direct et illimité aux sources.
- Modifier un réglage se propage à tous les consommateurs concernés.

## Responsabilité des modules

Un module est une vue cohérente sur un besoin utilisateur, pas un silo de données. Il peut réunir plusieurs sources à travers des services, mais ne devient jamais propriétaire d’une copie locale de leurs objets.

## Mémoire locale de travail

ProdPilot IA peut maintenir une mémoire locale structurée afin de rechercher des informations synchronisées, réutiliser une analyse et continuer un travail hors ligne. Cette mémoire est une projection sourcée : elle ne remplace jamais le fournisseur externe comme source officielle.

L’accès suit la chaîne `interface → services d’application → services de mémoire → dépôts typés → adaptateur de stockage`. Les composants n’accèdent pas directement au stockage. Chaque enregistrement est isolé par entreprise, utilisateur, compte, fournisseur et mode réel ou démonstration.

IndexedDB est l’adaptateur local initial. Il doit pouvoir être remplacé ou synchronisé avec un stockage serveur chiffré et multi-utilisateur sans changer les contrats métier.

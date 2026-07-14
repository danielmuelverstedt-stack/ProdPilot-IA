# Constitution produit — Règles produit

## Source unique et absence de duplication

- Un objet métier ne possède qu’une source de vérité.
- Un même référentiel ne peut pas être recréé pour les besoins d’un module.
- Une règle métier commune ne peut pas être recopiée dans plusieurs fonctionnalités.
- Une donnée dérivée est recalculée ou mise en cache de manière contrôlée ; elle ne devient pas une vérité concurrente.
- Les relations entre objets utilisent des références stables et conservent leur provenance.

## Configuration d’entreprise

Il est interdit de coder en dur dans une fonctionnalité :

- machines, départements, équipes ou capacités ;
- couleurs de statut ou de priorité ;
- statuts, priorités et vocabulaire métier ;
- catégories, types de tâches ou types de maintenance ;
- modèles de réunion, d’e-mail, de document ou d’impression ;
- seuils, horaires, calendriers et règles de notification ;
- ordre d’affichage ou colonnes propres à une entreprise.

Ces éléments proviennent des Réglages et de référentiels typés. Les valeurs initiales éventuelles existent dans une seule configuration centrale et restent modifiables.

## Frontières des modules

- Aucun module ne lit directement le stockage d’un autre module.
- Aucun module ne possède ses propres réglages lorsqu’un réglage central peut répondre au besoin.
- Aucun composant d’interface ne contacte directement un fournisseur externe.
- Les modules échangent par des services centraux et des contrats partagés.
- Une action créée depuis un e-mail, une réunion ou une anomalie rejoint le même référentiel d’actions.

## Persistance

- Les accès à une technologie de stockage sont regroupés dans des dépôts.
- Les appels dispersés à `localStorage` ou à tout autre mécanisme de persistance sont interdits.
- Changer de technologie de stockage ne doit pas imposer de réécrire l’interface ou les règles métier.
- Une donnée importée conserve sa source et son historique ; elle n’écrase pas silencieusement une donnée validée.

## Sources externes

- Un connecteur ne définit pas le modèle métier du produit.
- Les droits demandés sont limités au strict nécessaire.
- Une erreur de connexion produit un état explicite et récupérable.
- Les données ERP sont traitées en lecture seule dans les premières versions.
- Aucun fournisseur ne peut imposer sa terminologie à l’interface commune.

## Intelligence artificielle

- Le contenu généré est distingué du contenu source.
- Toute recommandation importante indique les éléments qui la motivent.
- Une information manquante ou incertaine est signalée.
- Toute action externe ou irréversible exige une confirmation humaine dédiée.
- L’IA respecte les mêmes permissions et frontières de données que l’utilisateur.

## Expérience produit

- Toute fonctionnalité expose clairement son utilité dans la journée de l’utilisateur.
- Les parcours principaux restent courts, lisibles et utilisables sur mobile.
- Les états de chargement, vide, erreur, indisponibilité et accès refusé sont prévus.
- Les formats de date, d’heure et de nombre sont européens et cohérents.
- Le mode démonstration est identifiable et n’imite jamais une connexion réelle.

## Interdictions structurantes

- Aucun second dépôt pour contourner un contrat existant.
- Aucun réglage caché dans un composant.
- Aucun envoi automatique d’e-mail.
- Aucune modification directe de l’ERP dans les premières versions.
- Aucune décision irréversible prise par l’IA.
- Aucune dépendance fonctionnelle directe entre deux interfaces de modules.

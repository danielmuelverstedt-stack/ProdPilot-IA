# Constitution produit — Philosophie des Réglages

## Rôle des Réglages

Les Réglages sont le contrat de fonctionnement de l’entreprise dans ProdPilot IA. Ils permettent d’adapter le produit sans intervention sur le code source et garantissent qu’une modification se propage à tous les usages concernés.

Tout nouvel élément variable doit être rattaché à une catégorie de Réglages existante ou à une nouvelle catégorie explicitement conçue. Il ne peut pas être ajouté uniquement dans le module qui l’utilise.

## Niveaux de configuration

- **Entreprise** : identité, référentiels, vocabulaire, politiques et modèles communs.
- **Site ou unité** : calendriers, capacités et pratiques locales lorsque plusieurs sites existent.
- **Rôle** : accès, visibilité et possibilités d’action.
- **Utilisateur** : préférences personnelles qui ne modifient pas les règles de l’entreprise.

Le niveau applicable doit toujours être explicite. Une préférence utilisateur ne peut pas contourner une politique d’entreprise ou une permission.

## Éléments configurables

### Identité et organisation

- identité de l’entreprise, coordonnées et logo ;
- sites, départements, équipes et calendriers ;
- utilisateurs, rôles, permissions et délégations ;
- langue, formats et préférences autorisées.

### Production et ressources

- machines, noms affichés, départements, ordre, état actif et couleurs ;
- capacités générales, par département ou par machine ;
- jours travaillés, horaires et capacités exceptionnelles ;
- statuts, priorités, seuils et vocabulaire métier ;
- types d’OF, de tâches, d’événements et de maintenance.

### Planning et pilotage

- horizon, calendrier, seuils de charge et règles d’affichage ;
- paramètres de calcul ou d’alerte validés par le métier ;
- vues, filtres proposés et conventions de publication ;
- colonnes et ordre des informations visibles.

### Communication et réunions

- modèles d’e-mails, ton, signatures et règles de préparation ;
- modèles de réunions, ordres du jour, questions et comptes rendus ;
- catégories de demandes, d’actions et règles de suivi ;
- destinataires, fréquences et règles de notification.

### Documents et impression

- modèles d’impression et de documents ;
- format du papier, orientation, identité, colonnes et ordre ;
- pied de page, mentions, cases et règles de regroupement.

### Connecteurs

- comptes et fournisseurs autorisés ;
- état des connexions et fréquence de synchronisation ;
- nom affiché, langue, ton de réponse, volume et filtres de synchronisation propres à chaque compte ;
- métadonnées de pièces jointes et préparation automatique de brouillons, désactivée par défaut ;
- mappages d’import et politiques de lecture ;
- règles d’accès propres à l’entreprise, sans jamais exposer de secret dans l’interface.

La messagerie présente chaque compte sous forme de carte responsive et maintient un seul compte actif pour Mails et les fonctions IA. Google Workspace utilise OAuth côté serveur. Microsoft 365 reste annoncé comme bientôt disponible tant que Microsoft Graph n’est pas implémenté. Les comptes de démonstration sont identifiés comme tels dans l’interface et ne représentent jamais une connexion externe. Un identifiant d’entreprise ou d’organisation peut être associé au modèle de compte sans imposer de valeur propre à une société.

### Intelligence artificielle

- fonctions d’IA autorisées ;
- sources accessibles et limites de contexte ;
- ton, niveau de détail et formats de réponse ;
- règles de recommandation, seuils de confiance et confirmations ;
- politiques de conservation, confidentialité et audit.

### Mémoire locale

- activation, indexation des messages et conservation optionnelle du texte nettoyé ;
- conservation des liens sources, analyses, sessions, décisions et préférences confirmées ;
- durées de rétention, nettoyage automatique, taille maximale et accès hors ligne ;
- priorité aux résultats locaux, politique d’escalade IA et confirmation avant les appels coûteux ;
- sauvegarde, restauration et effacements sélectifs avec confirmation.

Ces réglages ne peuvent jamais autoriser le stockage de secrets, de jetons, d’audio ou du contenu binaire des pièces jointes. Les décisions confirmées ne sont pas supprimées silencieusement par une politique de rétention.

## Cycle de vie d’un réglage

Chaque réglage possède une définition compréhensible, une valeur initiale centralisée, un niveau d’application, une validation et un comportement de repli. Les changements importants sont traçables. Les suppressions et désactivations préservent la cohérence des objets historiques.

## Valeurs par défaut

Une valeur par défaut facilite la découverte et le mode démonstration ; elle ne constitue pas une règle universelle. Elle est définie une seule fois, visible dans Réglages et modifiable par un administrateur autorisé.

## Propagation

Lorsqu’un administrateur renomme, réordonne, recolore, active ou désactive un élément, tous les modules concernés utilisent la nouvelle configuration sans changement de code. Une incohérence de configuration doit être signalée clairement, jamais compensée par une valeur métier cachée dans l’interface.

## Évolution

Avant d’ajouter une constante métier, un modèle, une liste ou un seuil, il faut déterminer qui doit pouvoir le modifier, à quel niveau et avec quelles conséquences. Si la réponse dépend de l’entreprise ou de l’usage, l’élément appartient aux Réglages.

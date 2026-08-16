# Audit architecture et interface — 08/08/2026

## Périmètre

Audit statique de l'ensemble de `src/`, complété par les contrôles TypeScript, ESLint, tests, build et une recette visuelle ciblée des réunions. La Constitution produit reste prioritaire : source unique, configuration centrale, services entre domaines et validation humaine avant tout envoi.

## Base commune confirmée

- `AppShell` fournit déjà un header, une navigation desktop/mobile et une zone de contenu uniques à toutes les routes métier.
- Les couleurs, rayons, ombres, transitions, focus et réduction des animations sont centralisés dans `globals.css`.
- `ModuleUi` centralise les en-têtes, états vides, erreurs, statuts, boutons, champs et formats de date ; un fil d'Ariane réutilisable complète désormais cette base.
- `PlanningDialogShell` est la fenêtre modale partagée par les parcours métier inspectés.
- Actions, Contacts, Machines et OF conservent leurs sources de vérité ; les réunions ne stockent que des références et leurs propres données de déroulement.

## Corrections réalisées

- Le parcours e-mail de réunion ne dépend plus de la réussite de `/api/mail/connection` pour produire un résultat.
- « Générer l'e-mail » construit toujours un aperçu complet avec destinataires, sujet et corps, même sans Gmail.
- L'utilisateur peut copier cet e-mail ou l'ouvrir dans sa messagerie via `mailto:` ; aucun envoi automatique n'est déclenché.
- Gmail OAuth reste disponible comme canal optionnel avec création de brouillon puis confirmation d'envoi séparée.
- Un échec du connecteur quitte maintenant l'état de chargement et affiche un repli explicite.
- Les réunions et leur historique affichent un fil d'Ariane ; la barre de cycle de vie et les onglets d'étape restent visibles dans le workflow.
- La préparation et le compte rendu utilisent le même composant d'e-mail et les mêmes règles de destinataires.

## Dette identifiée, non mélangée à cette correction

- `AssistantPanel.tsx` dépasse 300 lignes et combine plusieurs orchestrations (Actions, Planning, Calendrier, Contacts). Son découpage nécessite une évolution dédiée des contrats de l'assistant, pas une extraction cosmétique.
- `ProductionSettings.tsx` approche 300 lignes et doit être découpé par responsabilité lors de la prochaine évolution de Réglages.
- Plusieurs tableaux spécialisés ont des structures différentes parce que leurs usages diffèrent ; une primitive de tableau universelle serait prématurée. Les comportements communs (tri, états, styles) doivent continuer à être mutualisés progressivement.
- Les connecteurs Outlook et SMTP sont prévus comme futurs adaptateurs. Ils ne sont pas simulés : le repli local garantit aujourd'hui un e-mail exploitable sans prétendre qu'un envoi externe a eu lieu.

## Règles pour les développements suivants

1. Réutiliser `AppShell`, `ModuleHeader`, `ModuleBreadcrumbs`, les classes de boutons/champs et `PlanningDialogShell`.
2. Garder les composants sous 250 lignes lorsque possible ; découper avant 300 lignes par responsabilité réelle.
3. Ne créer aucun registre local concurrent pour Contacts, Actions, Machines, OF, Planning ou Qualité.
4. Toute communication externe doit d'abord produire un contenu relisible, puis exiger une confirmation explicite de l'action précise.
5. Prévoir systématiquement mobile, clavier, états vide/chargement/erreur et réduction des animations.

## Refonte transverse — lot 1 validé le 09/08/2026

Le premier lot architectural a été explicitement confirmé avant développement. Il étend la fondation existante, sans nouveau paquet et sans créer un second système UI.

- `ModuleUi` expose désormais les primitives communes `PageHeader`, `Button`, `IconButton`, `Card`, `MetricCard`, `Input`, `Textarea`, `Select`, `SearchInput`, `FilterBar`, `Tabs`, `StatusBadge`, `EntityLink`, `LoadingState`, `EmptyState` et `Toast`, tout en conservant les anciens exports pendant la migration progressive.
- `OverlayUi` centralise les modales et panneaux latéraux, y compris fermeture au clic extérieur et avec Échap. `PlanningDialogShell` conserve son contrat public mais délègue son rendu à cette fondation.
- Actions, Contacts, Parc Machines et Maintenance constituent les quatre modules pilotes : mêmes contrôles principaux, recherche effaçable, filtres, métriques et états vides, sans modification des services ni des règles métier.
- La migration des autres écrans demeure progressive. Une primitive universelle de tableau et un gestionnaire global de notifications ne seront ajoutés qu’à partir de plusieurs besoins réellement comparables.
- La recette visuelle automatique n’a pas pu être exécutée le 09/08/2026, aucun navigateur n’étant connecté à l’environnement. Elle reste à effectuer manuellement sur PC et tablette avant généralisation.

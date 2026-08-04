# Journal des modifications

Ce journal suit les changements significatifs du projet. Il n’annonce comme terminées que les capacités effectivement présentes dans le dépôt.

## [Non publié]

### Ajout : module Contacts — annuaire d'entreprise centralisé — 04/08/2026

- Demandé par l'utilisateur : un module Contacts servant de base centralisée pour toutes les personnes avec qui l'entreprise travaille (collaborateurs, fournisseurs, sous-traitants…), avec fiche complète, type (interne/externe), catégories configurables multiples, recherche/filtres, et vocation à être utilisé plus tard par les autres modules (Actions, Mails…) — cette dernière partie explicitement présentée comme un objectif futur, non demandée pour ce chantier.
- Nouveau domaine `Contact` (`demo.ts`, `DemoData.contacts`) : id, type (Interne/Externe), prénom, nom, société, fonction, catégories (plusieurs, par id), téléphone, mobile, e-mail, adresse, site internet, notes. Photo stockée séparément en IndexedDB (`contact-photo-store.ts`, base `prodpilot-contact-photos`), comme les photos machine, pour ne pas soumettre les Réglages/données de démonstration au quota `localStorage`.
- Nouvelles catégories configurables dans Réglages → Contacts (`ContactsSettingsPanel.tsx`, miroir de l'éditeur d'origines d'actions) : les 16 catégories demandées (Direction, Production, Méthodes, Qualité, Maintenance, Achats, RH, Informatique, Fournisseur, 3 sous-traitances, Transport, Commercial, Client, Autre), ajoutables/renommables/réordonnables comme toute autre liste configurable (`OrderedStandardSettings`, même migration générique `migrateStandards` que les origines d'actions/départements/statuts).
- Nouveau service `contact-service.ts` (créer/modifier/supprimer, même convention que `action-service.ts`) et service pur testé `contact-directory.ts` (recherche par nom/société, filtre par catégorie, filtre par type, tri alphabétique).
- Nouvel écran `/contacts` (recherche, filtres type/catégorie, cartes avec photo/badges) et fiche complète `/contacts/[id]` (coordonnées cliquables — `tel:`/`mailto:`/lien externe —, catégories, notes, photo, modification, suppression).
- Entrée de navigation « Contacts » ajoutée (icône `BookUser`), visible automatiquement pour les installations existantes (le menu se construit depuis la liste par défaut du code, fusionnée avec les préférences déjà enregistrées).
- Deux composants jusqu'ici dupliqués une fois pour les machines (`MachineThumbnail`, `MachinePhotoUploader` — déjà génériques dans leur implémentation, seulement mal nommés) déplacés vers `src/components/ui/` (`PhotoThumbnail`, `PhotoUploader`) et réutilisés tels quels par Contacts, en plus de leurs points d'appel existants (sélecteur machine de l'Atelier, revue de réunion, fiche machine) : aucune troisième quasi-copie créée.
- **Chevauchement identifié, non résolu dans ce chantier** (décision volontaire pour rester dans le périmètre demandé — unifier ces modèles serait un changement architectural majeur nécessitant une décision explicite) : `DemoData.people` (`TeamMember`, planification équipe d'Actions) et `MachineSavContact` (contact SAV rattaché à une seule machine) sont deux annuaires de personnes déjà existants, distincts de Contacts et non fusionnés avec lui. Voir `docs/06 - Todo.md`.
- **Intégration avec les autres modules non traitée dans ce chantier** (assigner une action à un contact, appeler/e-mailer en un clic depuis un autre écran, sélection automatique lors d'une demande de sous-traitance…) : explicitement présentée par l'utilisateur comme un objectif futur, pas une fonctionnalité demandée maintenant. Seule la fiche contact elle-même propose des liens `tel:`/`mailto:`/site cliquables.
- 16 nouveaux tests (`tests/contacts.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (431/431), `npm run build` tous verts. Routes `/contacts` et `/contacts/[id]` vérifiées servies sans erreur, contenu de démonstration confirmé dans le HTML rendu (5 contacts de départ : 3 internes reprenant les personnes déjà connues de la Planification équipe, 2 externes).
- [ ] Recette manuelle dans le navigateur nécessaire (aucun outil interactif disponible dans cet environnement) : créer/modifier/supprimer un contact, tester la recherche et les filtres, ajouter une photo, vérifier les liens tel:/mailto:/site, gérer les catégories depuis Réglages → Contacts, et confirmer que l'entrée de navigation apparaît correctement pour un rôle non-administrateur.

### Ajout : sous-actions dans la fiche d'une action — 04/08/2026

- Demandé par l'utilisateur : développer le module Actions pour pouvoir ouvrir une action et y ajouter des sous-actions. La fiche d'une action (`/actions/[id]`) existait déjà (ouverture déjà possible depuis la colonne Description du registre) ; seule la notion de sous-action manquait.
- Nouveau champ `ProductionAction.parentActionId: string | null` (`demo.ts`) : une sous-action est une `ProductionAction` normale (mêmes statuts, mêmes mutations Fait/Reporter/réassignation, sa propre fiche `/actions/[id]`), simplement rattachée à une action parente — aucun second modèle de données. Migration des données locales existantes (`demo-data-migration.ts`, `parentActionId: null` par défaut) et seed de démonstration mis à jour.
- `action-service.ts` : `createAction` accepte un `parentActionId` optionnel (`null` par défaut, aucun appelant existant à changer) ; `deleteAction` supprime désormais aussi les sous-actions de l'action supprimée (confirmation explicite mentionnant leur nombre avant suppression).
- `ActionFormDialog.tsx` accepte `parentActionId` (titre/texte adaptés : « Nouvelle sous-action »).
- `ActionDetail.tsx` gagne une section « Sous-actions » : bouton « + Sous-action », liste des sous-actions existantes réutilisant `ActionGroupedList` (même tableau que le registre Actions et la revue de réunion, pas une présentation ad hoc), et un lien vers l'action parente si la fiche ouverte est elle-même une sous-action.
- Une sous-action n'apparaît que dans la fiche de son parent : exclue du registre Actions, de la Planification équipe et de la revue des actions en réunion (nouvelle fonction partagée `isSubAction`, `action-status.ts`), pour ne jamais apparaître deux fois sous une forme détachée de son contexte.
- 9 nouveaux tests (`tests/action-subactions.test.mjs`), 1 assertion existante mise à jour (`tests/team-planning.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (415/415), `npm run build` tous verts.

### Uniformisation : bouton « + Nouvelle action » de la réunion déplacé au même endroit que dans le module Actions — 04/08/2026

- Demandé par l'utilisateur, en suite directe de l'uniformisation de la revue des actions : que « Créer une action » ait le même emplacement et le même style que dans son module parent (Actions).
- Le bouton, jusqu'ici isolé au milieu de la page (bloc « Créer une action » entre Note rapide et Parking lot), rejoint le `ModuleHeader` de la réunion, en premier élément de `actions` — exactement l'emplacement et le style (`primaryButton`, libellé « + Nouvelle action ») du bouton du module Actions (`ActionsModule.tsx`).
- Fonctionnalité inchangée : ouvre toujours `ActionFormDialog` avec `origine` (QRQC/Réunion de production) et `contextLink` vers la réunion en cours. La grille Note rapide/Parking lot passe de 3 à 2 colonnes suite au retrait de ce bloc.
- Nouveau test de câblage (`tests/meeting-machine-review.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (406/406), `npm run build` tous verts.

### Uniformisation : la revue des actions en réunion reprend exactement le tableau du module Actions — 04/08/2026

- Demandé par l'utilisateur : garder la même mise en page entre l'étape « Revue des actions » des réunions (QRQC/Production) et le module Actions, pour une meilleure compréhension entre les deux écrans.
- `MeetingActionReview.tsx` affichait jusqu'ici des cartes ad hoc (description, responsable/échéance en texte libre, 3 boutons Fait/Reporté/Réassigner) — une présentation différente du tableau du module Actions, avec ses propres colonnes non configurables. Remplacé par un usage direct de `ActionGroupedList`/`ActionRow`, les composants du module Actions lui-même : mêmes colonnes (celles configurées dans Réglages → Actions), même regroupement, mêmes actions rapides Fait/Reporter, mêmes badges de statut.
- Toute la logique de mutation dupliquée (`completeAction`/`postponeAction`/`reassignAction` appelés directement) disparaît de ce composant : `ActionRow` s'en charge déjà, une seule implémentation pour les deux écrans. La réassignation, auparavant un menu déroulant dédié, se fait désormais en éditant la colonne Responsable directement dans le tableau — comme dans le module Actions.
- Regroupement proposé limité à « Par personne »/« Par échéance » (pas « Par origine », qui n'aurait affiché qu'un seul groupe puisque les actions listées partagent déjà l'origine de la réunion en cours).
- 4 nouveaux tests (`tests/meeting-action-review.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (405/405), `npm run build` tous verts.

### Amélioration : navigation par onglets entre les étapes de réunion (QRQC et Production) — 04/08/2026

- Demandé par l'utilisateur : pouvoir revenir et sauter directement entre les étapes depuis le haut de l'écran, comme des onglets, plutôt que seulement pas à pas.
- La barre de progression non interactive (« Étape X sur Y ») est remplacée par `StepTabs` (`MeetingWorkflow.tsx`) : un onglet cliquable par étape, même style de pilules que les onglets de vue d'Actions, numéroté et repliable sur plusieurs lignes sur petit écran (`flex-wrap`). Applicable aux deux types de réunion (QRQC et Production), sans dupliquer de logique entre les deux.
- Les boutons Précédent/Suivant (et Clôturer la réunion en dernière étape) restent inchangés, en complément pour l'avancement linéaire habituel. Les onglets sont désactivés une fois la réunion clôturée (la section affiche alors le compte rendu, plus les étapes).
- Nouveau test de câblage (`tests/meeting-machine-review.test.mjs`). `npx tsc --noEmit`, `npm run lint`, `npm test` (401/401), `npm run build` tous verts.

### Amélioration : présentation plus professionnelle de la revue OF par machine, avec la photo de la machine — 04/08/2026

- Demandé par l'utilisateur : rendre la revue « OF planifiés par machine » plus professionnelle, avec la photo de la machine en petit format, comme sur sa fiche (Parc Machines).
- Nouveau composant partagé `MachineThumbnail.tsx` (`src/features/machines/components/`) : vignette photo avec repli explicite « — » sans photo, en deux tailles (`xs`/`md`). Extrait de l'implémentation jusque-là dupliquée localement dans `WorkshopMachinePicker.tsx` (sélecteur de machine de l'Atelier), qui la réutilise désormais au lieu de sa propre copie — même photo que celle enregistrée depuis la fiche machine (`machine-photo-store.ts`, IndexedDB), aucune deuxième source.
- `MeetingMachineReview.tsx` : chaque machine devient une carte avec un bandeau d'en-tête (photo en taille `md`, nom, nombre d'OF à revoir), sur le même principe visuel que les panneaux de l'Atelier (bandeau `bg-slate-50` + corps blanc). Chaque OF reçoit un numéro d'ordre (pastille ronde) en plus du client/article/quantité déjà présents.
- Nouveaux tests (`tests/meeting-machine-review.test.mjs`) : présence de la vignette dans la revue, réutilisation du composant partagé par le sélecteur de l'Atelier, disparition de l'ancienne définition locale.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (400/400), `npm run build` tous verts.

### Correctif : suppression de l'étape « Vue planning », devenue redondante avec « OF planifiés par machine » — 04/08/2026

- Signalé par l'utilisateur : l'ancienne étape « Vue planning » (liste brute `data.planning` de démonstration, jamais reliée aux données ERP réelles) faisait doublon avec la nouvelle étape « OF planifiés par machine », plus complète (désignation, client, article, quantité, bascule ERP réel/démonstration, création d'action).
- `productionSteps` (`MeetingWorkflow.tsx`) perd « Vue planning » ; « OF planifiés par machine » prend directement sa place (étape 3 affichée, index 2). Les étapes suivantes de la réunion Production se décalent d'un cran vers le haut. Réunion QRQC non concernée (steps déjà indépendants par type).
- `npx tsc --noEmit`, `npm run lint`, `npm test` (399/399), `npm run build` tous verts.

### Amélioration : client, code article et quantité dans la revue OF par machine de la réunion de production — 04/08/2026

- Demandé par l'utilisateur juste après l'ajout de l'étape : compléter chaque ligne d'OF avec le client, le code article et la quantité commandée.
- `MeetingMachineReviewRow` (`meeting-machine-review.ts`) gagne `customerName`/`articleCode`/`quantity`, repris en mode ERP réel depuis `operation.articleCode` et `operation.workOrder.customerName`/`.quantity` (mêmes champs que la colonne Client/Quantité de l'Atelier), et en mode démonstration depuis `WorkOrder.customer`/`.article`/`.quantity`. Replis explicites si absents (« Client inconnu », « — », `null` → « — » affiché).
- `MeetingMachineReview.tsx` affiche cette ligne secondaire sous chaque OF.
- Tests mis à jour et étendus (`tests/meeting-machine-review.test.mjs`) : valeurs correctement reprises en mode ERP et démonstration, replis vérifiés, affichage vérifié.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (399/399), `npm run build` tous verts.

### Ajout : étape « OF planifiés par machine » dans la réunion de production, avec création d'action liée à l'OF — 04/08/2026

- Demandé par l'utilisateur : une étape de la réunion de production où revoir, machine par machine, les 5 OF planifiés avec leur désignation, et pouvoir créer une action directement liée à l'OF si un point le nécessite pendant la revue.
- Nouveau service pur et testé `meeting-machine-review.ts` (`buildErpMachineReview`/`buildDemoMachineReview`) : les 5 OF de plus haute priorité de chaque machine active et visible, avec leur désignation. Réutilise le regroupement et le tri déjà utilisés par l'Atelier (`groupOperationsByMachineId`/`sortOperations`), sans redéfinir aucune règle de correspondance machine ou de priorité.
- Nouveau composant `MeetingMachineReview.tsx`, basculant automatiquement entre le planning ERP réel (import actif) et le repli démonstration, exactement comme la fiche OF (`WorkOrderDetail.tsx`, `useErpImportActive`) — jamais les deux mélangés.
- Chaque ligne d'OF propose un bouton « + Action » qui ouvre la fenêtre unique `ActionFormDialog` déjà utilisée partout ailleurs, avec `contextLink` pointant vers l'OF précis (`module: "workOrder"`, comme la fiche OF et Parc Machines) et `origine` = « Réunion de production » : l'action créée réapparaît dans la revue des actions (étape 1) d'une prochaine réunion, comme toute autre action de cette origine.
- Nouvelle étape insérée dans `productionSteps` (`MeetingWorkflow.tsx`), juste après « Vue planning » ; les étapes suivantes de la réunion Production se décalent d'un cran. Étapes et logique de la réunion QRQC inchangées (chantier explicitement limité à la réunion de production, demande de l'utilisateur).
- 6 nouveaux tests (`tests/meeting-machine-review.test.mjs`) : regroupement/tri/limite par machine (ERP et démonstration), exclusion des machines inactives/masquées, repli de désignation, bascule ERP/démonstration, câblage du `contextLink` vers l'OF, non-régression des indices d'étapes QRQC.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (398/398), `npm run build` tous verts. Route `/reunions/production` testée servie sans erreur de compilation ; le parcours interactif (navigation entre étapes, ouverture de la fenêtre d'action) reste à recetter manuellement dans un navigateur, aucun outil interactif n'étant disponible dans cet environnement.

### Amélioration : colonne Retard de l'Atelier resserrée — 04/08/2026

- Demandé par l'utilisateur après le correctif de resserrement précédent : la colonne Retard restait « trop grande ».
- Cause : `StatusPill` (badge partagé, utilisé aussi pour les statuts machine/OF en taille normale ailleurs dans l'app) n'avait jamais été resserré comme le reste du tableau Atelier — `px-2.5 py-1 text-xs`, nettement plus grand que les 10px/20px de ligne du tableau resserré.
- Nouvelle variante `size="sm"` sur `StatusPill` (`px-1.5 py-0 text-[10px]`, même palette de couleurs par ton) ; taille par défaut (`"md"`) inchangée pour tous les autres usages (Parc Machines, Réunions, Qualité ERP…). Colonne Retard de l'Atelier (`WorkshopOperationRow.tsx`) utilise désormais `size="sm"`.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392), `npm run build` tous verts.

### Correctif racine : le resserrement visuel de l'Atelier du 31/07/2026 n'appliquait pas ses propres réductions de padding, et les cadres machine différaient en hauteur — 04/08/2026

- Signalé par l'utilisateur en recettant l'onglet Atelier : « tout les planning n'ont pas la même taille » et « dans la case priorité on ne voit plus tellement que c'est petit ».
- Cause racine du texte cramé/peu lisible : le resserrement du 31/07/2026 empilait des utilitaires Tailwind plus petits (`px-1`, `px-1.5`, `text-[10px]`) par-dessus les primitives partagées `fieldClass`/`secondaryButton`, qui imposent déjà `px-3`/`text-sm`. En Tailwind v4, quand deux classes fixent la même propriété CSS, celle qui l'emporte est celle définie en dernier dans la feuille de style générée — pas celle écrite en dernier dans le JSX. Vérifié directement dans le CSS compilé : `.px-3` est généré après `.px-1`/`.px-1.5`, donc le padding `px-3` (12px de chaque côté) restait réellement appliqué dans le champ Priorité (`w-11` = 44px), le sélecteur Statut et les 3 boutons d'action de `WorkshopOperationRow.tsx`, ainsi que le déclencheur et la recherche de `WorkshopMachinePicker.tsx` — malgré l'intention visible dans le code. Seuls les utilitaires touchant une propriété différente de celle de la primitive (`min-h-0` face à `min-height`, `text-[10px]` généré après `text-sm`) s'appliquaient réellement.
- Corrigé en remplaçant ces compositions partielles par des classes entièrement autonomes (`compactFieldClass`/`compactButtonClass` dans `WorkshopOperationRow.tsx`, `compactTriggerClass`/`compactSearchClass` dans `WorkshopMachinePicker.tsx`), sans aucune dépendance à `fieldClass`/`secondaryButton` : plus aucun conflit de propriété possible, quel que soit l'ordre de génération de Tailwind.
- Cause racine de la taille inégale des cadres machine : `WorkshopMachinePanel.tsx` bornait le cadre défilant avec `maxHeight` plutôt qu'une hauteur fixe — une machine avec moins d'opérations que le réglage « Lignes par machine » affichait donc un cadre visiblement plus court que ses voisines. Remplacé par `height` fixe (même valeur pour toutes les machines à réglage égal), avec espace vide en bas pour les machines peu chargées plutôt qu'un cadre raccourci.
- Deux assertions de tests figées sur l'ancien texte exact des classes (`px-1 py-0 text-[10px]` composé avec `fieldClass`) mises à jour pour refléter les classes autonomes.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392), `npm run build` tous verts. Serveur de développement relancé et testé (`/`, `/actions`, `/planning` répondent 200, aucune erreur de compilation) ; le rendu réel reste à recetter visuellement dans un navigateur, aucun outil interactif n'étant disponible dans cet environnement.

### Correctif : 3 assertions de tests Atelier désynchronisées du resserrement visuel du 31/07/2026 — 04/08/2026

- Passe de remise à jour/sauvegarde du dépôt : `npx tsc --noEmit` et `npm run lint` verts, mais `npm test` révélait 3 échecs dans `tests/planning-workshop.test.mjs`, tous dans `WorkshopOperationRow.tsx`, non liés aux 3 assertions de dimensions déjà corrigées lors du resserrement du 31/07/2026 (entrée précédente) : badge « N OF » de la colonne Article devenu un simple nombre (texte complet conservé en infobulle), colonne Client ayant reçu `className="block truncate"`, et libellé « Non disponible » du Temps raccourci en « Non disp. » (texte complet conservé en infobulle).
- Ces trois changements de texte/markup étaient des effets du resserrement visuel intentionnel, jamais répercutés dans les assertions correspondantes. Assertions mises à jour pour refléter le rendu actuel plutôt que revenir sur le resserrement demandé par l'utilisateur.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392), `npm run build` tous verts.

### Amélioration : tableau Atelier resserré visuellement — 31/07/2026

- Demandé par l'utilisateur : réduire les dimensions de colonnes/lignes des tableaux planning ; clarifié au périmètre de l'Atelier uniquement, avec un resserrement marqué (texte, paddings et largeurs de colonnes réduits, pas seulement l'espacement).
- `WorkshopMachinePanel.tsx`/`WorkshopOperationRow.tsx`/`WorkshopMachinePicker.tsx`/`WorkshopDepartmentSection.tsx` : hauteurs de ligne/en-tête, largeurs de colonnes par défaut, paddings et tailles de police réduits ; les contrôles (priorité, statut, sélecteur de machine, boutons d'action) reçoivent `min-h-0` pour contourner la hauteur minimale partagée de `fieldClass`/`secondaryButton` (sans quoi `h-6`/`h-8` restait sans effet). Libellés des 3 boutons d'action par ligne raccourcis (texte complet conservé en infobulle) pour tenir sur une seule ligne dans la colonne resserrée.
- Borne minimale de redimensionnement manuel des colonnes (`WORKSHOP_COLUMN_MIN_WIDTH_PX`) abaissée de 80 à 60px, pour rester cohérente avec les nouvelles largeurs par défaut.
- Changement purement visuel : aucun autre tableau (Planning capacité, Planification équipe Actions, Cockpit ERP/module OF) n'est concerné. `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392, 3 assertions de dimensions mises à jour), `npm run build` tous verts ; le rendu réel de l'onglet Atelier reste à recetter dans un navigateur, aucun outil interactif n'étant disponible dans cet environnement.

### Ajout : Planification équipe dans le module Actions — 28/07/2026

- Demandé par l'utilisateur : planifier la charge des personnes du bureau (responsable/charge/période par action), avec un onglet « Liste des actions » enrichi et un nouvel onglet « Planification équipe » calqué visuellement sur Planning capacité (grille personnes × semaines/mois, glisser-déposer, réordonnancement, ligne « Total équipe »), sans modifier Planning capacité ni ajouter de dépendance externe.
- Nouveau modèle `TeamMember` et 5 champs ajoutés à `ProductionAction` (`priority`, `responsableId`, `estimatedHours`, `plannedWeek`, `planningOrder`) ; le responsable est désormais référencé par id, jamais par nom, avec synchronisation automatique du champ texte libre existant pour ne rien casser ailleurs dans l'app. Migration `DemoData` mise à jour pour ne perdre aucune donnée locale existante.
- Nouveaux services purs `iso-week.ts` (semaines ISO 8601 autonomes) et `team-planning-service.ts` (mutateurs + index de performance `Map` personne+semaine → actions/charge, construit une seule fois par rendu). Couleurs de charge reprises telles quelles des Réglages Production → Planning, jamais de seuil réinventé.
- Nouveaux composants : `TeamCapacityCard`, `MoveActionMenu` (repli clic « Déplacer vers… » sans glisser-déposer), `UnscheduledActionsPanel` (panneau « Non planifiées »), `TeamCapacityGrid`, `TeamManagementDialog`, `TeamPlanningTab`. Interprétation signalée : le panneau des actions sans période a été nommé « Non planifiées » pour éviter toute confusion avec le statut existant `"À planifier"` (idées de backlog), sémantiquement opposé.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (392/392, dont 22 nouveaux), `npm run build` tous verts. Page `/actions` vérifiée servie et rendue côté serveur ; le glisser-déposer et les dialogues interactifs restent à recetter manuellement, aucun outil de navigateur automatisé n'étant disponible dans cet environnement.

### Ajout : statut « En attente » éditable dans l'Atelier et la fiche OF, avec remarque et onglet dédié — 27/07/2026

- Demandé par l'utilisateur : pouvoir changer le statut d'une opération à la fois dans l'Atelier et depuis la fiche OF, avec « En attente » comme statut à part entière, et un 4ᵉ onglet dans le module OF pour y associer une remarque.
- Le statut manuel et la remarque existaient déjà entièrement côté données/API (`PlanningDecision.planningStatus`/`comment`) — seule l'interface manquait. Nouveau statut `waiting` (« En attente ») ajouté à `ErpOperationStatus` et répercuté aux 6 endroits où ce vocabulaire est référencé, avec la priorité bloquée > en attente > en cours > terminée > à faire.
- Atelier : la colonne Statut devient un menu déroulant modifiable directement (nouveau `updateStatus`, même mécanisme PATCH optimiste que la machine/la priorité). Fiche OF : statut modifiable sur chaque opération, plus un champ remarque éditable. Module OF : 4ᵉ onglet « En attente », calculé indépendamment du statut global affiché pour ne perdre aucune OF réellement en attente.

### Amélioration : « Clôturées depuis » et « Nouvelles depuis le dernier import » passent en onglets dans le module OF — 27/07/2026

- Demandé par l'utilisateur : « je préfère des onglets comme les départements et non un filtre » (pour ces deux vues précisément, pas le filtre Statut existant).
- Le menu déroulant et la case à cocher ajoutés juste avant sont remplacés par une barre de 3 onglets (Tous / Clôturées récemment / Nouvelles depuis le dernier import), même gabarit que les onglets de département du Parc Machines/de l'Atelier — pastille comptée par onglet, un seul actif à la fois. Le choix de période (7/30 jours) reste disponible en boutons secondaires, visibles uniquement sur l'onglet « Clôturées récemment ».

### Ajout : masquage des opérations terminées du planning + suivi des OF clôturés/nouveaux dans le module OF — 27/07/2026

- Demandé par l'utilisateur, clarifié par 4 questions avant tout code : une opération terminée dans un futur export ERP ne doit plus apparaître dans le planning au jour le jour (Atelier + Planning capacité, par opération), tandis que le module OF doit continuer à montrer les OF clôturés — avec un filtre de période choisi à l'écran — et permettre de repérer les OF apparues lors du tout dernier import.
- `groupOperationsByMachineId` (Atelier, tous modes de département) et `buildErpOperationBlocks` (Planning capacité) excluent désormais les opérations `effectiveStatus === "completed"` ; les compteurs par onglet (`buildDepartmentOperationIndex`) suivent. Module OF et Cockpit ERP inchangés.
- Nouveau champ `closedAt` sur chaque résumé d'OF (dérivé des `actualEndAt` déjà importées, aucune nouvelle donnée) et nouveau filtre « Clôturées depuis » (Toutes/7/30 jours) dans le module OF.
- Nouveau champ persisté `ErpWorkOrder.firstSeenImportId`, fixé une seule fois par OF dans `synchronizationService.synchronize` et jamais réécrit ensuite, pour repérer les OF nouvelles depuis le dernier import (donnée qui n'existait nulle part avant, seul un compteur agrégé existait) — nouvelle case à cocher dans le module OF. Effet transitoire attendu : aucun OF déjà importé n'a cette information tant qu'un nouvel import réel n'a pas eu lieu.

### Ajout : assignation automatique et permanente d'une catégorie à sa machine unique, partout dans l'app — 27/07/2026

- Demandé par l'utilisateur, en allant plus loin que le regroupement d'affichage précédent : que les OF d'une catégorie (ex. Peinture, 18) rejoignent automatiquement leur machine unique partout (pas seulement dans l'Atelier), y compris pour les OF apportés par de futurs imports ERP, sans action manuelle répétée.
- `reconcileOperationViewMachineCatalog` (`erp-machine-mapping-status.ts`), déjà appelée à chaque affichage par l'Atelier, Planning capacité, le module OF et le Cockpit ERP, assigne désormais automatiquement un OF sans machine réellement assignée à l'unique machine/poste taguée sur sa catégorie de tâche (`MachineSettings.taskCategoryCode`, déjà existant sur la fiche machine). Calculé à la lecture, jamais écrit : une assignation manuelle explicite garde toujours la priorité, et la règle cesse proprement de s'appliquer (sans purge nécessaire) dès qu'une deuxième machine est taguée sur la même catégorie.
- Limite assumée : le tableau de bord Qualité des données ERP (calculé côté serveur, sans accès aux machines qui vivent uniquement dans le navigateur) n'est pas concerné par cette règle — mesure différente et indépendante (complétude du mapping code ERP → machine).

### Ajout : une catégorie à une seule machine candidate absorbe directement ses OF sans machine assignée — 27/07/2026

- Demandé par l'utilisateur : quand une seule machine/poste existe pour une catégorie (ex. Peinture), les OF de cette catégorie sans machine assignée doivent rejoindre directement cette machine plutôt que rester dans une ligne « Machine non définie » séparée.
- `buildWorkshopCategories` détecte désormais le cas à un seul candidat par catégorie et fusionne l'affichage en conséquence ; dès qu'une deuxième machine devient candidate, la ligne séparée réapparaît (impossible de deviner laquelle des deux devrait recevoir l'OF). Affichage uniquement : aucune écriture, l'opération reste réellement sans machine assignée dans les données.

### Correctif racine : les catégories d'un onglet en mode lié n'étaient pas resynchronisées au chargement de la page — 27/07/2026

- Signalé par l'utilisateur : un poste créé pour la Peinture dans le département « Traitement de surface » affiche sa section de planning, mais sans aucune opération catégorie 18.
- Cause racine : le réglage partagé « Catégories visibles » n'était resynchronisé sur les catégories liées du département affiché qu'au clic sur son onglet, à sa création ou à son édition — jamais au premier rendu si l'onglet était déjà sélectionné avant (préférence restaurée, retour depuis un autre module). Le réglage partagé gardait alors sa dernière valeur (par ex. issue du Cockpit ERP), qui pouvait exclure la catégorie affichée ; ses opérations restaient invisibles partout, sans message d'erreur.
- Nouveau `useEffect` dans `PlanningWorkshopView.tsx` : resynchronise ce réglage sur les catégories liées dès que le département affiché change, y compris au tout premier rendu.

### Ajout : colonnes Client et Quantité commandée dans l'Atelier — 27/07/2026

- Demandé par l'utilisateur : masquer/démasquer les colonnes de l'Atelier (déjà possible, vérifié plutôt que supposé), et ajouter le client (`Nom`, fichier ERP `REQ_MacroGamme_Top.xlsx`) et la quantité commandée (`Qté_Cdée`, même fichier) à chaque opération.
- Aucun nouveau parseur ERP : les deux colonnes sont déjà importées et alimentent déjà `ErpWorkOrder.customerName`/`.quantity`. Seule la quantité manquait sur le trajet jusqu'à l'Atelier (`ErpPlanningWorkOrderSummary`/`toPlanningListRow` dans `erp-planning-service.ts`, qui réduit le work order transmis à l'écran) — étendue en conséquence.
- Nouvelles colonnes `client`/`quantity` câblées à l'écran (`WorkshopOperationRow.tsx`, largeur par défaut dans `WorkshopMachinePanel.tsx`) et à l'impression (`WorkshopMachinePrintView.tsx`, quantité alignée à droite comme Priorité/Retard) ; masquables/réordonnables comme les colonnes existantes sans code supplémentaire.

### Uniformisation : bandeau d'erreur partagé, primitives Réglages, icônes, retours honnêtes d'action-service — 27/07/2026

- Demandé par l'utilisateur : « fais une grosse analyse du projet et améliore/uniformise tous les modules », avec autorisation à agir sans redemander confirmation à chaque changement. Analyse préalable du code (UI, services/données, tests) : pas de dette massive, mais une dizaine de divergences concrètes et localisées. Passe bornée (Volet A) exécutée maintenant ; chantiers plus lourds documentés en backlog (Volet B) dans `docs/06 - Todo.md` plutôt qu'empilés sans recul.
- Nouveau `ErrorBanner` (`src/components/ui/ModuleUi.tsx`), remplace le bandeau d'erreur rouge dupliqué à l'identique dans 5 modules (`WorkOrderDetail.tsx`, `ErpPlanningWorkspace.tsx`, `PlanningWorkshopView.tsx`, `ErpQualityModule.tsx`, `MailDiagnosticsScreen.tsx`).
- `SettingsUi.tsx` (`inputClass`/`buttonClass`) repose désormais sur les primitives partagées `fieldClass`/`secondaryButton` au lieu de les redéfinir : corrige une dérive réelle (opacité désactivée et curseur non cohérents avec le reste de l'app sur les boutons désactivés de tout le module Réglages).
- Glyphes unicode `✕` remplacés par l'icône partagée `AppIcon name="close"` dans `PlanningDialogShell.tsx` et `MachinePhotoUploader.tsx`.
- `action-service.ts` : les mutations (`completeAction`, `postponeAction`, `planAction`, `reassignAction`, `setRemark`, `reopenAction`, `deleteAction`) retournent désormais `boolean` au lieu de `void`, alignées sur la convention déjà utilisée par `machineSettingsService`. Corrige un vrai bug côté assistant IA (`AssistantPanel.tsx`, Mon Espace) : si l'id interprété par l'assistant ne correspondait plus à une action réelle, le message annonçait quand même un succès alors que rien n'avait changé.
- Cas vérifiés puis volontairement laissés inchangés (réutilisation aurait dégradé l'UX plutôt que l'uniformiser) : lightbox photo et placeholder « Aucune photo » de `MachinePhotoUploader.tsx`, texte inline de `MeetingActionReview.tsx`, glyphes `↑`/`↓` de tri dans `ActionsSettingsPanel.tsx` (les ajouter au registre `AppIcon` les ferait apparaître dans le sélecteur d'icônes de Mon Espace, effet de bord hors sujet).

### Correctif : catégories visibles retirées du menu Filtres de l'Atelier, uniquement gérées via le crayon (✎) de département — 26/07/2026

- Signalé par l'utilisateur en diagnostiquant une machine « Peinture » nouvellement créée sans aucune opération visible (ni sous la machine, ni en « Machine non définie ») : cause identifiée, le réglage partagé « Catégories visibles » masque tout ce qui n'est pas explicitement coché (`applyTaskCategoryVisibility`, appliqué avant tout regroupement) et pouvait diverger des catégories liées au département — deux endroits permettaient de le régler séparément, le menu « Filtres » de l'Atelier et la fenêtre ✎ de chaque département. L'utilisateur a jugé ces deux réglages redondants (« 2 endroits qui n'ont pas lieu d'être ») et a demandé de n'en garder qu'un.
- Le bloc « Catégories visibles » (recherche, tout afficher/masquer, liste à cocher) et le compteur « X/41 catégories visibles » disparaissent du bouton/menu « Filtres » de l'Atelier (`WorkshopFilters.tsx`, redevenu simplement « Filtres »/« Fermer les filtres »). Le réglage partagé (`visibleTaskCategoryCodes`) reste piloté uniquement par la sélection ou l'édition d'un département (`PlanningWorkshopView.tsx`, inchangé) : le crayon (✎) de chaque département devient l'unique endroit, dans l'Atelier, pour choisir les catégories.
- Cockpit ERP et Planning capacité gardent leur propre bouton « Catégories » séparé (`TaskCategoryVisibilityControl`), inchangé — hors périmètre de cette demande.

### Ajout : Parc Machines navigue par onglets de département, plus un onglet « Tous » — 26/07/2026

- Demandé par l'utilisateur : « j'aimerais des onglets avec les départements et un onglet avec tout ».
- Nouveau `MachineDepartmentTabs` (même style de pilules que l'Atelier) : onglet « Tous » + un onglet par département actif, chacun avec un compteur de machines. Le filtre « Catégorie » existant devient secondaire, appliqué à l'intérieur de l'onglet actif (ses options se limitent aux catégories réellement présentes dans cet onglet), et se réinitialise à chaque changement d'onglet pour ne jamais garder une sélection devenue invisible.

### Correctif racine : un filtre « départements » retiré de l'interface pouvait vider un département physique entier — 26/07/2026

- Signalé par l'utilisateur : Fraisage est bien coché dans la fenêtre ✎, les machines (dont Akira Seiki) y apparaissent bien comme rattachées, mais l'onglet n'affiche toujours que la section « Opérations sans machine », aucune machine.
- Cause racine : `buildWorkshopDepartments` vérifie encore `filters.departments`, l'ancien filtre à cases à cocher « Départements » retiré de l'interface de l'Atelier plus tôt dans ce chantier (redondant avec les onglets). Un utilisateur ayant coché des départements avant ce retrait garde cette valeur dans ses préférences déjà enregistrées, sans aucun moyen de la modifier depuis l'interface — dès qu'elle ne contient pas l'onglet actif, `buildWorkshopDepartments` l'exclut entièrement en silence, alors que la nouvelle section « Opérations sans machine » (`buildUnassignedOperationsSection`) n'a jamais eu ce filtre et continue de s'afficher normalement : exactement le symptôme rapporté.
- Neutralisé au point d'appel dans `PlanningWorkshopView.tsx`, sans modifier `buildWorkshopDepartments` elle-même (comportement d'origine conservé, toujours documenté et testé). Corrige tous les départements physiques d'un coup, sans action requise de l'utilisateur.

### Atelier : menu Filtres unique + diagnostic élargi aux machines isolées manquantes — 26/07/2026

- Demandé par l'utilisateur : « tout les filtres et les catégories visibles sont toujours là, mets les dans le même menu ». Le bouton séparé « Catégories (X/41 visibles) » de l'Atelier disparaît ; ses champs rejoignent le volet « Filtres » existant (groupes Machines, Articles, puis Catégories visibles). Extraction de `TaskCategoryVisibilityFields` (champs seuls, sans bouton/popover) hors de `TaskCategoryVisibilityControl`, qui garde son bouton séparé pour Cockpit ERP et Planning capacité, inchangés — une seule liste des 41 catégories, jamais dupliquée.
- Signalé par l'utilisateur : une machine précise (Akira Seiki, Fraisage) restait introuvable dans son onglet alors que d'autres machines du même département s'affichaient normalement. Le diagnostic de machine orpheline (lien de département rompu), ajouté plus tôt aujourd'hui mais visible seulement quand l'onglet entier était vide, est désormais calculé pour tout l'onglet et affiché en permanence au-dessus des sections — une seule machine orpheline au milieu d'autres correctement rattachées reste donc signalée nommément.

### Correctif : les départements physiques retrouvent un lien par catégorie, nécessaire pour les OF sans machine — 26/07/2026

- Signalé par l'utilisateur en rouvrant le ✎ d'un département physique (Tournage/Fraisage/Découpe fil) : le choix de catégories avait disparu de cette fenêtre lors du chantier précédent. Raison donnée par l'utilisateur, exacte : « sans cela tu ne sais pas savoir quelle opération sont liées à quelle catégorie » — une opération pas encore assignée à une machine n'a pas de `departmentId` à lire, donc pas d'autre moyen que sa catégorie ERP pour rejoindre le bon département.
- `DepartmentLinksDialog.tsx` retrouve la liste à cocher des catégories pour les départements physiques (identique à Qualité/Maintenance), avec un texte clarifiant qu'elle ne pilote plus l'appartenance des machines (toujours régie par la fiche machine) — seulement les OF sans machine assignée.
- Nouveau `buildUnassignedOperationsSection` (`workshop-view-service.ts`) : construit la section « Opérations sans machine » d'un département physique à partir de ses catégories liées, toujours affichée en premier, sur le même principe que les départements en mode lié. `countDepartmentOperations` compte désormais ces OF dans les deux modes.

### Diagnostic : département physique vide malgré des machines affichées avec le bon libellé — 26/07/2026

- Signalé par l'utilisateur : « dans le planning fraisage je ne retrouve plus aucune machine pourtant dans le parc machine le département est bien défini en fraisage ».
- Hypothèse la plus probable, établie par lecture de code : le Parc Machines affiche `machine.department` (texte libre, figé au dernier enregistrement) en repli quand `machine.departmentId` ne correspond plus à aucun département existant — ce qui peut afficher « Fraisage » alors que le lien réel est rompu, typiquement après suppression puis recréation du département via l'éditeur générique de Réglages (aucune vérification des machines encore rattachées). Ce décalage était invisible avant le passage de Tournage/Fraisage/Découpe fil en mode « département physique » plus tôt aujourd'hui.
- Ajout d'un diagnostic explicite dans l'Atelier : `findMachinesWithMismatchedDepartmentLabel` détecte ces machines et remplace le message générique par la liste précise des identifiants concernés et la manipulation de récupération.

### Amélioration : Parc Machines plus compact, import/export regroupés dans un bouton « Options » — 26/07/2026

- Demandé par l'utilisateur : les cartes « Importer/exporter le parc en CSV » et « Importer des photos en masse », toujours visibles sur la page Parc Machines, prenaient trop de place.
- Nouveau bouton « Options » dans l'en-tête, qui ouvre une fenêtre modale (`MachineOptionsDialog.tsx`, réutilise `PlanningDialogShell` déjà utilisée ailleurs) regroupant les deux outils. Aucun changement de comportement interne : `MachineCsvTools`/`MachinePhotoBulkImport` sont réutilisés tels quels, seul leur emplacement change.

### Ajout : onglet « À planifier » dans Actions, pour les idées et tâches d'amélioration — 26/07/2026

- Demandé par l'utilisateur : pouvoir mettre de côté des idées/tâches d'amélioration à planifier « pour ne pas les oublier », et qu'une fois validées elles rejoignent les actions actuelles.
- Nouveau statut `"À planifier"` (`ActionStatus`), en plus des trois statuts existants (`À faire`/`Fait`/`Reporté`) — une idée sans responsable ni échéance réels, jamais mélangée aux actions en cours.
- `ActionsModule.tsx` (`/actions`) gagne deux onglets : **Actions** (comportement inchangé, exclut désormais toujours les idées) et **À planifier** (pastille avec le nombre d'idées en attente). Le bouton de création s'adapte : « + Nouvelle idée » n'exige que la description, contrairement à « + Nouvelle action » qui garde ses champs obligatoires habituels.
- Nouveau `planAction(id, responsable, echeance)` : fait passer une idée de `À planifier` à `À faire`, avec un vrai responsable et une vraie échéance donnés à ce moment-là — c'est l'étape « validée » qui la fait rejoindre l'onglet Actions. Disponible depuis le tableau (bouton « Planifier » sur chaque ligne du backlog, au lieu de Fait/Reporter) et depuis la fiche détail d'une idée.
- Corrigé en cours de route : la règle « action en retard » était dupliquée trois fois dans le module (tableau, regroupement, assistant Actions) et aurait fait apparaître une idée comme « en retard » dans les revues, faute d'échéance réelle. Regroupée dans un nouveau fichier partagé `action-status.ts`, qui exclut explicitement les idées du calcul de retard et des revues de l'assistant.

### Correctif de fond : les départements de production redeviennent basés sur le département physique de la machine — 26/07/2026

- Signalé par l'utilisateur : « la mazak integrex 300 est dans fraisage hors que le département est une machine du tournage ». Cause : l'Integrex 300 est une machine tourno-fraiseuse, physiquement en Tournage, mais elle porte aussi de vraies opérations codées Fraisage — le système de catégories construit plus tôt dans ce chantier la faisait donc apparaître dans les deux onglets à la fois, une machine étant affichée dans toute catégorie pour laquelle elle a une opération en cours, indépendamment de son département physique.
- Avant de corriger, deux échanges de clarification avec l'utilisateur (une machine mixte doit-elle apparaître dans les deux plannings, seulement dans son département physique, ou seulement selon sa fiche ?), puis un premier « oui, revenez partout au département physique » suivi d'un rappel explicite des conséquences (Qualité/Maintenance redeviendraient des onglets vides, leur toute première raison d'être dans ce chantier), avant d'aboutir à la portée finale : uniquement les départements de production.
- Nouveau `DepartmentSettings.membershipMode?: "physical" | "linked"`. Tournage, Fraisage et Découpe fil passent en `"physical"` par défaut : leur contenu vient désormais uniquement du champ « Département » de la fiche de chaque machine (déjà existant, modifiable depuis Parc Machines → la machine → Identité), sans aucun lien par catégorie — une machine tourno-fraiseuse n'apparaît donc plus que dans son propre département physique, même si elle porte ponctuellement une opération d'une autre catégorie. Qualité et Maintenance restent en mode `"linked"` (comportement inchangé), puisqu'elles n'ont structurellement aucune machine physiquement rattachée.
- `resolveDepartmentMachineIds`/`countDepartmentOperations` (`workshop-view-service.ts`) branchent sur ce mode ; `PlanningWorkshopView.tsx` réutilise `buildWorkshopDepartments` (déjà présent et testé, jusque-là remplacé partout par `buildWorkshopCategories`) pour les onglets physiques, à partir des opérations non filtrées par catégorie (`allRows`) pour ne perdre aucune opération d'une machine selon la catégorie actuellement affichée ailleurs dans l'app. `DepartmentLinksDialog.tsx` remplace les cases à cocher catégories/machines par un message explicatif et une liste en lecture seule pour ces trois départements.

### Amélioration : présentation plus professionnelle de la fiche machine imprimée — 26/07/2026

- Demandé par l'utilisateur juste après l'ajout de l'impression : « j'aimerais quelque chose de plus professionnel et plus propre » — précisé, sur clarification, comme portant sur le document imprimé lui-même (`WorkshopMachinePrintView.tsx`), pas sur l'écran de l'Atelier ni sur Mon Espace.
- En-tête repensée façon courrier officiel : logo et nom de société en couleur de thème (`var(--app-primary)`, pas de couleur en dur — reste cohérent si l'entreprise change ses couleurs dans Réglages), titre « Fiche de production — Atelier » séparé par un filet de couleur, bloc « Document de travail · Non contractuel » et date d'édition à droite.
- Nouveau bloc d'informations clé encadré sous l'en-tête (machine, code, département, type Machine/Poste, nombre d'opérations imprimées sur le total) — reprend le badge « Poste » déjà utilisé ailleurs dans l'app (Parc Machines) plutôt que d'inventer une nouvelle terminologie.
- Tableau plus lisible : en-tête à séparation nette (filet noir, libellés en petites capitales), alignement à droite des colonnes numériques (Priorité, Retard), lignes jamais coupées entre deux pages imprimées (`break-inside: avoid`) et en-tête de tableau répété sur chaque page (`thead { display: table-header-group }`) — la première fiche multi-page n'aurait sinon montré les colonnes qu'en première page.
- Pied de page enrichi d'une ligne de visa/date, usage courant sur une fiche de production papier, en plus du texte de pied de page déjà configuré dans Réglages.

### Ajout : impression de la fiche machine dans l'Atelier, avec choix du nombre de lignes — 26/07/2026

- Demandé par l'utilisateur : « j'aimerais pouvoir imprimer la fiche de planning par machine et je dois pouvoir dire combien de lignes je veux imprimer ». L'Atelier n'avait encore aucune impression (contrairement à Planning capacité, qui a déjà un aperçu par semaine).
- Cadrage confirmé par l'utilisateur avant implémentation : impression par machine (un bouton « Imprimer » sur chaque panneau machine), choix du nombre de lignes dans une petite fenêtre juste avant d'imprimer plutôt que de réutiliser le réglage écran « Lignes par machine ».
- Nouveau `WorkshopMachinePrintDialog.tsx` : paliers rapides (10/25/50/Toutes) et un champ pour un nombre précis, toujours borné au total d'opérations réellement affichées pour cette machine.
- Nouveau `WorkshopMachinePrintView.tsx` : fiche plein écran pour une seule machine, reprenant exactement les colonnes actuellement visibles à l'écran (`visibleColumnIds`) et la même configuration papier/logo/société que l'impression déjà existante du Planning capacité (`settings.print`), sans dupliquer ces réglages. Comme partout ailleurs dans l'Atelier, aucun temps de fabrication n'est inventé (colonne Temps : « Non disponible »).
- Les lignes imprimées suivent l'ordre et le tri actuellement affichés à l'écran pour cette machine, mais restent indépendantes du fenêtrage DOM ajouté pour la fluidité (`computeVirtualRowRange`, voir l'optimisation « 10 secondes » ci-dessous) : l'impression n'est jamais limitée par ce qui est effectivement monté à l'écran au moment du clic.

### Correctif : les OF sans machine de plusieurs catégories se mélangeaient dans un seul planning — 26/07/2026

- Signalé par l'utilisateur : « j'ai des départements dans lesquels j'ai des catégories, mais si je ne mets pas de machine tout se met dans un même planning alors que c'est plusieurs postes de travail ».
- Cause : dans `buildWorkshopCategories`, les OF d'une catégorie visible qui n'ont pas encore de machine assignée atterrissaient tous dans un panier unique (id `unassigned`, toujours en tête de la liste des sections) — **partagé par toutes les catégories visibles à la fois**. Un département avec par exemple 3 catégories mais aucune machine/poste encore rattaché à aucune d'elles voyait donc tous ses OF mélangés dans un seul planning, perdant la distinction par catégorie qui fait tout l'intérêt de cette organisation.
- `buildWorkshopCategories` répartit désormais ces OF par leur propre code catégorie (`operation.taskCode`), directement à l'intérieur de la section de leur catégorie (en première position, comme ligne « Machine non définie ») au lieu d'un panier global. Chaque catégorie visible reste ainsi son propre planning distinct, avec ou sans machine/poste rattaché.
- Explication donnée à l'utilisateur en parallèle : pour qu'un poste de travail réel (ex. plusieurs postes manuels dans une même catégorie) obtienne sa propre section plutôt que de rester dans « Machine non définie », il faut (1) le créer comme poste dans le Parc Machines et (2) le mapper au bon code machine/ressource ERP dans Cockpit ERP → Import → Correspondances machines — ce qui suppose que l'export ERP distingue déjà ces postes par un code propre à chacun. Si l'ERP ne reporte qu'un seul code (ou aucun) pour toute la catégorie, aucun réglage côté ProdPilot ne peut reconstituer cette distinction automatiquement.

### Optimisation (suite 4) : 10 secondes pour changer d'onglet de département dans l'Atelier — 26/07/2026

- Signalé par l'utilisateur, cette fois mesuré (« je dois attendre 10 sec avant qu'il change de département »), malgré les trois optimisations précédentes (index de compteurs, store dédié, débounce de la recherche).
- Cause racine trouvée dans `WorkshopMachinePanel.tsx` : le réglage « Lignes par machine » (10 par défaut) ne bornait que la hauteur CSS du cadre défilant (`max-height` + `overflow: auto`) — il ne limitait jamais le nombre réel de lignes `<tr>` montées dans le DOM. Chaque changement d'onglet de département faisait donc monter d'un coup l'intégralité des opérations de toutes les machines du nouveau département (potentiellement plusieurs milliers de lignes, chacune avec son sélecteur de machine, ses badges et ses gestionnaires de glisser-déposer), pour n'en montrer que 10 à la fois via le défilement.
- Un test existant (`tests/planning-workshop.test.mjs`) interdit explicitement de masquer des opérations derrière ce réglage — décision volontaire d'une itération précédente pour ne jamais perdre de données silencieusement. La solution retenue respecte cette contrainte : fenêtrage (« windowing ») plutôt que troncature. Nouvelle fonction pure et testée `computeVirtualRowRange` (`src/features/planning/services/virtual-rows.ts`) qui, à partir de la position de défilement du cadre et d'une hauteur de ligne fixe, calcule la petite plage de lignes à monter et la taille des deux espaceurs (haut/bas) qui représentent le reste — la barre de défilement et la position restent correctes, et toute opération demeure atteignable en faisant défiler, sans jamais être masquée.
- Aucune nouvelle dépendance : le fenêtrage est implémenté à la main (la hauteur de ligne était déjà fixe dans ce tableau), sur le même principe que les précédents choix de ce chantier (mini-graphiques SVG/CSS purs plutôt qu'une bibliothèque).

### Refonte visuelle de Mon Espace — 26/07/2026

- Demandé par l'utilisateur : améliorer le tableau de bord « Mon Espace » à partir d'une maquette visuelle de référence (bannière de bienvenue + tuiles de lancement rapide, puis des widgets d'indicateurs de production), le contenu précis restant à optimiser dans une prochaine itération.
- Nouvelle mise en page : `WorkspaceWelcomeBanner.tsx` (bannière dégradée sur les couleurs de thème configurables) suivie des tuiles de lancement rapide (icône + libellé + pastille de compteur), puis deux rangées de 3 widgets — Indisponibilités machines, Taux d'occupation machines, Suivi des OF, puis Agenda du jour, Charge par département, OF à planifier.
- Les grandes cartes descriptives de l'ancienne section « Vue d'ensemble » (`WorkspaceCard.tsx`) sont remplacées par des tuiles compactes ; l'écran de personnalisation existant (Réglages → Interface → Mon Espace) reste inchangé et continue de piloter le libellé, l'icône, la couleur, l'ordre et la visibilité de chaque tuile.
- Nouveaux mini-graphiques réutilisables sans dépendance externe (`MiniAreaChart`/`MiniBarChart`, SVG/CSS pur) et nouveau service de métriques pur et testé (`workspace-dashboard-metrics.ts`) qui dérive les indicateurs des données de démonstration existantes (machines, maintenance, planning, OF) : aucune donnée n'est inventée, mais son contenu exact est amené à évoluer une fois les besoins réels précisés avec l'utilisateur.
- `TodayAgendaCard.tsx` reprend le même gabarit de widget compact (`WidgetCard`, nouveau composant partagé) que les nouveaux widgets, pour une intégration cohérente dans la grille.

### Optimisation (suite 3) : recherche saccadée dans l'Atelier — 26/07/2026

- Signalé par l'utilisateur après les optimisations précédentes : le Planning Atelier restait « pas fluide », en plus du compteur Qualité incorrect (voir correctif ci-dessous).
- Cause : le champ de recherche du panneau Filtres (`WorkshopFilters.tsx`) écrivait directement dans les préférences persistées (`patch({ search: value })`) à chaque frappe, ce qui refiltrait et re-rendait tout le département affiché sur chaque caractère tapé.
- Ajout d'un débounce ~250 ms : `searchInput` (état local) reflète la saisie instantanément dans le champ, mais `patch({ search })` n'est déclenché qu'une fois la frappe interrompue pendant 250 ms. Resynchronisation de l'affichage local géré pendant le rendu (pas dans un `useEffect`, pour respecter la règle `react-hooks/set-state-in-effect` et éviter un rendu en cascade) si `filters.search` change pour une autre raison que la saisie (ex. « Tout effacer »).

### Correctif : le compteur d'OF de l'onglet Qualité affichait 0 — 26/07/2026

- Signalé par l'utilisateur : un nouveau département Qualité avec plusieurs catégories liées affichait 0 OF dans son onglet alors que des OF existaient bien pour ces catégories.
- Cause : deux implémentations divergentes de la même règle « quelles opérations appartiennent à ce département ». `buildWorkshopCategories` (l'affichage réel d'un onglet) compte, en plus des machines taguées/liées directement, toute machine non taguée porteuse d'une opération de la catégorie liée et les OF sans machine assignée (ajouté lors des correctifs précédents). `countDepartmentOperations` (compteur par onglet) et l'aperçu de `DepartmentLinksDialog` n'avaient jamais reçu ces deux règles — un département comme Qualité, sans aucune machine physiquement taguée, retombait donc systématiquement à 0.
- Unifié les deux logiques autour d'un même index partagé dans `workshop-view-service.ts` : `buildDepartmentOperationIndex` (remplace `buildMachineOperationCountIndex`, ajoute l'index catégorie→machines et le compte d'opérations sans machine), `resolveDepartmentMachineIds` (ensemble des machines rattachées à un département, mêmes règles que l'affichage) et `countDepartmentOperations` (somme sur cet ensemble + opérations sans machine des catégories liées). `PlanningWorkshopView.tsx` et `DepartmentLinksDialog.tsx` consomment désormais ce même index.

### Optimisation (suite 2) : ralenti restant de l'Atelier — Cockpit ERP en arrière-plan — 25/07/2026

- Signalé par l'utilisateur après les deux optimisations précédentes : l'Atelier restait trop lent.
- Cause identifiée : le Workspace Planning garde ses trois onglets (Cockpit ERP, Planning capacité, Atelier) montés une fois visités. Le Cockpit ERP n'avait pas encore reçu la même scission que `useWorkshopOperations` : son `loadRows` redéclenchait `reconcileOperationViewMachineCatalog` sur ~23 000 lignes à **chaque** changement du réglage partagé « catégories visibles » — y compris quand ce changement venait de l'Atelier (clic d'onglet de département), pendant que le Cockpit ERP restait simplement monté en arrière-plan sans être à l'écran.
- `ErpPlanningWorkspace.tsx` sépare désormais, comme `useWorkshopOperations`, les lignes réconciliées avec le référentiel machine (`reconciledRows`, ne recalcule que si les données chargées ou les machines changent) du filtrage par catégorie visible (`rows`, recalcul léger). Les patchs optimistes (priorité, machine, date, statut, commentaire) patchent désormais `reconciledRows`.
- Optimisation complémentaire dans `buildWorkshopCategories` (Atelier) : l'index « quelles catégories une machine porte-t-elle réellement dans ses opérations » (ajouté au correctif précédent pour ne jamais perdre un OF derrière une fiche machine mal taguée) est désormais construit une seule fois, pas une fois par catégorie visible.

- Signalé par l'utilisateur après la première optimisation (index/mémoïsation de `useWorkshopOperations`) : passer d'un onglet de département à l'autre restait beaucoup trop lent.
- Cause racine, plus profonde que le pipeline de données ERP déjà optimisé : chaque clic d'onglet appelait `updateSettings` pour synchroniser le réglage partagé « catégories visibles », qui vivait dans `settings.production.visibleTaskCategoryCodes` — au milieu du gros objet `AppSettings` (départements, machines, utilisateurs, IA, mails…). Chaque appel `updateSettings` clone l'intégralité de cet arbre (`structuredClone`), le réécrit en entier et de façon synchrone dans `localStorage` (`JSON.stringify` + `localStorage.setItem`), puis force le recalcul de tous les écrans qui lisent les Réglages via le même contexte React partagé (plus de 30 fichiers) — un coût bien trop élevé pour un réglage qui change à chaque clic.
- Confirmé et validé avec l'utilisateur avant de le faire (changement structurant) : « catégories visibles » a été sorti des Réglages partagés vers son propre store dédié et minuscule (`src/lib/visible-task-categories-store.ts`, `useSyncExternalStore`, même famille de pattern que `useWorkshopViewPreferences`), avec ses propres abonnés. Changer d'onglet ne touche plus du tout le reste de l'application. Migration automatique et unique depuis l'ancien emplacement au premier chargement, pour ne pas perdre les catégories déjà configurées par un utilisateur existant.
- Le champ `AppSettings.production.visibleTaskCategoryCodes` reste dans le type et la migration de `settings-repository.ts` (marqué `@deprecated`), uniquement pour que les anciennes sauvegardes/exports continuent de se lire correctement — plus aucun code actif ne le lit ni ne l'écrit (Cockpit ERP, Planning capacité, Atelier, module OF migrés vers le nouveau store).

### Correctif : les catégories d'un département tout juste créé ne s'activaient pas — 25/07/2026

- Signalé par l'utilisateur : créer un département avec plusieurs catégories liées n'affichait pas immédiatement les OF correspondants.
- Cause : `handleCreateDepartment` déléguait à `handleSelectDepartment`, qui retrouve les catégories liées en cherchant le département dans `activeDepartments` (dérivé de `settings`). Juste après `updateSettings(...)`, `settings` n'est pas encore mis à jour dans cette fermeture React (la mise à jour d'état n'est pas synchrone) — le département tout juste créé n'existait donc pas encore dans `activeDepartments`, la recherche échouait silencieusement et `visibleTaskCategoryCodes` repassait à vide.
- Corrigé en appliquant directement `input.linkedCategoryCodes` (déjà connu, transmis par la modale) au lieu de le relire depuis une liste pas encore à jour.

- Signalé par l'utilisateur : passer d'un onglet de département à l'autre était lent, et chaque onglet non actif affichait 0 OF jusqu'à ce qu'on clique dessus et attende le chargement.
- Cause double : (1) les compteurs par onglet étaient calculés à partir de `rows`, déjà filtrées par la seule catégorie du département **actif** — les autres départements n'avaient donc structurellement aucune opération disponible pour se compter ; (2) chaque clic d'onglet changeait le réglage partagé « Catégories visibles », ce qui redéclenchait `reconcileOperationViewMachineCatalog` sur les ~23 000 opérations alors que seule la catégorie affichée avait changé, pas les données elles-mêmes — et cette fonction faisait en plus un `.find()` dans la liste des machines pour chaque opération.
- `useWorkshopOperations` sépare désormais la réconciliation machine (`allRows`, ne recalcule que si les données chargées ou le référentiel machine changent) du filtrage par catégorie visible (`rows`, recalcul léger à chaque changement d'onglet). Les compteurs de `WorkshopDepartmentTabs` utilisent `allRows` : ils sont toujours exacts, sans attendre un clic. `reconcileOperationViewMachineCatalog` indexe désormais les machines dans une `Map` au lieu d'un `.find()` par opération.
- Aucun changement de comportement affiché, seulement de performance et d'exactitude des compteurs.

### Correctif : OF invisibles malgré une correspondance ERP machine correcte — 25/07/2026

- Suite au correctif précédent (OF sans machine), l'utilisateur a mappé ses 2 machines Découpe fil au bon code ERP, mais leurs OF restaient invisibles. Audit du pipeline de correspondance ERP → machine (`operation-view-service.ts`, `erp-planning-service.ts`, caches associés) : la résolution est bien en direct (aucun souci de cache), le mapping fonctionnait donc correctement. La vraie cause : l'Atelier ne montrait une machine dans une catégorie que si sa **fiche machine** portait elle-même cette catégorie (`taskCategoryCode`) — un champ distinct du mapping ERP, jamais rempli automatiquement pour une machine créée par import CSV.
- `buildWorkshopCategories` affiche désormais aussi, dans chaque catégorie visible, toute machine qui porte au moins une opération de cette catégorie (`operation.taskCode`) même si sa fiche n'a jamais été taguée — une correspondance ERP faite ne doit plus jamais laisser des OF invisibles faute d'un second réglage manuel désynchronisé. Le tag de fiche machine reste utile pour planifier une machine avant sa première opération (ex. un poste de travail neuf).
- Ordre des sections dans un onglet, demandé par l'utilisateur : « Opérations sans machine » toujours en premier, puis les catégories, puis les machines liées directement.

### Correctif : OF sans machine assignée invisibles dans une catégorie — 25/07/2026

- Signalé par l'utilisateur : « j'ai plusieurs OF dans la catégorie 39 mais je ne les vois pas dans le planning Découpe fil ». Cause confirmée : `buildWorkshopCategories` regroupait les OF machine par machine (via la catégorie de la machine), sans section pour les OF déjà de la bonne catégorie mais pas encore assignés à une machine — contrairement à `buildWorkshopDepartments` qui avait toujours ce cas (« Atelier non défini »).
- `buildWorkshopCategories` ajoute désormais une section finale « Opérations sans machine » (toujours affichée en dernier si non vide) pour les OF dont la catégorie est actuellement visible mais qui n'ont aucune machine assignée — filtrée par le propre code catégorie de l'opération (`operation.taskCode`), pas seulement par confiance dans le filtrage amont, pour rester correcte même appelée isolément (utile pour les tests).

### Départements paramétrables (Atelier) — catégories/machines liées — 25/07/2026

- Un prompt fourni décrivait un problème réel (les onglets Qualité/Maintenance de l'Atelier restaient vides) avec un modèle de données par endroits inexact par rapport au dépôt réel (application supposée monopage HTML/CSS/JS, catégories supposées auto-assignées par l'ERP). Audité avant d'implémenter : les 5 départements du prompt existent bien réellement, mais Qualité et Maintenance n'ont structurellement aucune machine physiquement rattachée (`MachineSettings.departmentId`) — c'était la vraie cause.
- Le contenu d'un onglet département vient désormais uniquement d'une configuration explicite (`DepartmentSettings.linkedCategoryCodes`/`linkedMachineIds`, nouveaux champs additifs), totalement indépendante du département physique de la machine (`departmentId`, inchangé partout ailleurs : Parc Machines, capacités, création de machine). Une machine Fraisage réalisant une opération catégorie 20 (Contrôle Qualité) apparaît désormais aussi dans l'onglet Qualité.
- Les 5 départements de démonstration reçoivent un mapping par défaut (Tournage→5, Fraisage→27, Découpe fil→39, Qualité→20, Maintenance→23), rétro-rempli automatiquement pour les installations existantes via la fusion générique déjà en place dans `settings-repository.ts` (`migrateStandards`), sans bump de `SETTINGS_VERSION`.
- Nouveau service `department-settings-service.ts` (miroir de `machine-settings-service.ts`) : créer/éditer les liens/supprimer un département, avec une garde de suppression absente de l'éditeur générique existant (Réglages → Production → Départements, qui supprime sans aucune vérification aujourd'hui, non modifié) — refuse de supprimer un département encore physiquement rattaché à des machines.
- L'Atelier gagne un onglet « ＋ » (création) et une icône « ✎ » réservée à l'onglet actif (édition) ouvrant `DepartmentLinksDialog.tsx` : nom, catégories liées (recherche debouncée ~150 ms, nombre de machines par catégorie), machines individuelles (recherche debouncée, machines déjà incluses via une catégorie cochée grisées/non modifiables, machines non catégorisées incluses), aperçu en direct « → X machines · Y OF », suppression avec confirmation.
- Chaque onglet affiche un compteur d'OF, calculé via un index précalculé machine→nombre d'OF plutôt qu'en reparcourant toutes les opérations par département (`buildMachineOperationCountIndex`/`countDepartmentOperations`).
- Nouvelle section « Machines liées directement » (badge du même nom, réutilisant `StatusPill`) pour les machines rattachées individuellement sans être déjà couvertes par une catégorie visible.
- Le dropdown « Catégories » reste le réglage partagé/persisté construit lors du chantier précédent (pas de reset par onglet, décision explicite) : sélectionner un onglet écrase ce réglage avec les catégories liées du département, ajustable ensuite librement, sans jamais revenir en arrière automatiquement.
- Décision de portée explicite : Réglages → Production → Départements n'expose pas encore ces nouveaux champs (gérables uniquement depuis la modale de l'Atelier) ; délégation d'événements manuelle non ajoutée (React délègue déjà tous les événements synthétiques au niveau racine, un ajout manuel aurait été cosmétique).

### Atelier : navigation par onglets de département + catégories à l'intérieur — 25/07/2026

- L'Atelier gagne une navigation par onglets de département (`WorkshopDepartmentTabs.tsx`) en haut de l'écran : un seul département affiché à la fois (pas d'onglet « Tous », décision explicite), à la place du sélecteur « Regrouper par : Département / Catégorie » ajouté puis retiré dans la même session sans jamais avoir été publié.
- À l'intérieur d'un onglet de département, les machines et postes de travail se regroupent en sections dépliables par catégorie de tâche (`buildWorkshopCategories`, qui accepte désormais un identifiant de département optionnel pour restreindre le calcul des opérations par machine à ce seul département), sur le même réglage partagé « Catégories » que Planning capacité et le Cockpit ERP — activer/désactiver une catégorie a le même effet, quel que soit l'onglet ouvert.
- Le filtre « Départements » à cases à cocher du panneau Filtres a disparu, devenu redondant avec les onglets.
- L'onglet actif est mémorisé (`WorkshopViewState.selectedDepartmentId`, additif, `null` par défaut) dans les mêmes préférences déjà utilisées pour les colonnes/filtres/tri/sections repliées de l'Atelier, et préservé par « Réinitialiser la vue ».
- `buildWorkshopDepartments` (regroupement par département sans catégories) reste dans le code et ses tests — plus utilisé par l'Atelier aujourd'hui, mais conservé tel quel plutôt que supprimé, pour rester réutilisable si le besoin revient.
- Prochaine étape explicitement prévue par l'utilisateur (hors périmètre de ce chantier) : étendre la même structure à Planning capacité.

### Planning organisé par catégorie de tâche + postes de travail — 25/07/2026

- Planning capacité (grille machines × jours) gagne le contrôle de catégories de tâche (« Catégories (X/41 visibles) », déjà partagé Atelier/Cockpit ERP) qui lui manquait : ses opérations ERP étaient déjà silencieusement filtrées par ce réglage partagé dès qu'un import était actif, sans aucun moyen de le voir ou de le piloter depuis cet écran.
- Ses machines sont désormais regroupées en sections dépliables par catégorie (moteur partagé `groupMachinesByTaskCategory`, `src/lib/task-category-grouping.ts`) : activer une catégorie affiche une section avec ses machines/postes, repliable/dépliable ; la désactiver la masque. Comme pour l'Atelier et le Cockpit ERP, le réglage est vide par défaut — **changement de comportement à connaître** : Planning capacité n'affiche plus aucune machine tant qu'au moins une catégorie n'a pas été activée quelque part dans l'application (Cockpit ERP, Atelier ou Planning capacité, réglage partagé).
- L'Atelier gagne un sélecteur « Regrouper par : Département / Catégorie » (`WorkshopViewState.groupBy`, additif, défaut `department` — aucun changement pour l'existant tant qu'on ne bascule pas), qui réutilise le même moteur de regroupement (`buildWorkshopCategories`, miroir de `buildWorkshopDepartments`) et les composants de section déjà existants sans aucune modification.
- Nouveau concept de « poste de travail » pour les catégories sans machine physique (ex. Ébavurage) : un poste se crée depuis la fenêtre « Ajouter une machine » existante (nouvelle case à cocher « Poste de travail (sans machine physique) ») et n'est qu'une `MachineSettings` avec `kind: "poste"` — il traverse donc gratuitement tout le pipeline existant (capacité, glisser-déposer, Atelier, Parc Machines) sans plomberie nouvelle, et apparaît dans le Parc Machines avec un badge « Poste » le distinguant des machines physiques.
- Le contrôle de catégories partagé gagne une entrée « Non catégorisées », pour afficher/masquer explicitement les machines et postes sans catégorie assignée dans les nouvelles sections dépliables.
- Décisions explicites de portée (validées avec l'utilisateur) : le Cockpit ERP garde son tableau plat existant (23 500+ lignes paginées) sans section dépliable ; les postes de travail ne sont pas encore une colonne de l'import/export CSV du Parc Machines ; la fiche d'un poste garde exactement les mêmes onglets qu'une machine physique.

### Fiche technique, contacts SAV, consommables et impression machine — 25/07/2026

- L'onglet « Fiche technique » de la fiche machine (jusque-là limité à statut/fabricant/modèle/année/n° de série/robot) est désormais complet : trois sections Identification, Caractéristiques techniques et Raccordements, sur le modèle libellé/valeur déjà utilisé par la Vue générale — aucun nouvel onglet créé, les champs déjà existants restent à leur place et modifiables comme avant.
- Nouveaux champs machine (`Machine` en démonstration) : emplacement atelier, mise en service, fin de garantie, type d'usinage, commande numérique, broche (vitesse/puissance), cône outil, courses X/Y/Z, capacité magasin outils, passage de barre, arrosage centre broche, alimentation électrique et air comprimé — tous « À compléter » par défaut, jamais inventés pour les données propres à l'atelier.
- Pré-remplissage prudent des spécifications constructeur connues avec un niveau de confiance raisonnable pour 3 des 4 machines de démonstration (type d'usinage, commande numérique, cône outil), marquées visuellement « Pré-rempli — à vérifier » (`Machine.unverifiedFields`) tant qu'un utilisateur ne les a pas confirmées ; le marquage disparaît automatiquement dès que la valeur est réellement modifiée. Volontairement laissé vide partout où la variante exacte de la machine n'est pas identifiable avec certitude (aucune caractéristique inventée).
- Nouvelles sections Contacts SAV et Consommables ajoutées sous le contenu Maintenance déjà existant de la fiche machine (inchangé) : contacts SAV illimités par machine avec CRUD complet, et tableau consommables (catégorie avec badge coloré, désignation, référence, fournisseur, fréquence de remplacement, lieu de stockage, remarques) avec recherche en direct, filtre par catégorie et CRUD complet. Cinq consommables d'exemple préchargés sur TOU-01, marqués « (exemple) ».
- Nouveau bouton « Imprimer la fiche machine » (en-tête de la fiche) : bascule vers une vue d'impression dédiée (`MachinePrintView`) reprenant identité, caractéristiques, raccordements, contacts SAV et consommables sur une page A4 propre, lisible en noir et blanc, sans navigation ni formulaires (`print:hidden`/`@media print`, sections non coupées en pleine page), sur le même modèle que l'impression du Planning déjà existante (`PlanningPrintView`).
- Nouveaux tableaux `DemoData.savContacts`/`DemoData.consumables` avec migration rétrocompatible des données déjà présentes en `localStorage`, sans perte des actions/OF/machines/maintenance déjà enregistrés.
- La maquette visuelle transmise (`Fiche_Machine_ProdPilot_Proposition.html`) n'était pas présente dans le dépôt ; à la demande explicite de l'utilisateur, aucune maquette n'a été utilisée et le rendu reprend exclusivement les conventions déjà en place dans l'application.

### Tri au clic + réorganisation des colonnes sur les tableaux de données — 24/07/2026

- Les tableaux de données réels de l'app peuvent désormais être triés en cliquant sur un en-tête de colonne (cycle décroissant → croissant → aucun tri, une seule colonne active à la fois, comme un tableur), sur le modèle déjà en place dans l'Atelier — mais généralisé dans une base commune (`src/lib/table-columns.ts`, `src/lib/use-table-columns.ts`, `src/components/ui/SortableColumnHeader.tsx`) que tout futur tableau devra réutiliser plutôt que réinventer.
- **Parc Machines** (Réglages → Production → Machines) et **Correspondances ERP** (`ErpMachineMappingsPanel.tsx`) gagnent le tri au clic **et** le glisser-déposer de colonnes, les deux entièrement nouveaux sur ces tableaux. Sur le Parc Machines, le tri d'affichage est purement client-side, indépendant du champ métier `machine.order` déjà utilisé ailleurs (Planning) ; les boutons ↑/↓ existants (qui modifient le vrai ordre) se désactivent avec une info-bulle explicite pendant qu'un tri d'affichage est actif, pour ne jamais mélanger les deux mécanismes.
- **Cockpit ERP** (`ErpPlanningOperations.tsx`) : le glisser-déposer de colonnes existait déjà, mais rien dans l'interface ne permettait de changer le tri des opérations — `activeView.sort` était figé sur « priorité » sans aucun contrôle utilisateur. Cliquer sur les en-têtes Score/OF/Client/Article/Date/Machine sélectionne désormais ce tri ; un second clic sur la colonne déjà active inverse le résultat déjà trié (nouveau champ `sortDirection` sur la vue sauvegardée), sans toucher aux comparateurs métier finement ajustés existants (tie-breaks par client/OF/machine/article).
- **Actions** : tri au clic uniquement, décision explicite de l'utilisateur — l'ordre et la visibilité des colonnes restent pilotés par Réglages → Actions, pas de glisser-déposer supplémentaire ici pour éviter deux mécanismes concurrents.
- Exclus explicitement (décisions validées avec l'utilisateur) : la grille Planning (Gantt, pas une liste de données), les vues d'impression, les tableaux à lignes fixes (Qualité ERP, Notifications, matrice des permissions), et le tableau « Gamme complète » d'une fiche OF (l'ordre affiché est la gamme de fabrication réelle — la trier pourrait laisser croire à tort qu'on la modifie).
- Nettoyage associé, sans changement de comportement (couvert par les tests déjà existants) : `nextSortState` (Atelier) et `moveWorkshopColumn`/`moveErpPlanningColumn` délèguent désormais à la nouvelle base commune plutôt que de dupliquer trois fois la même logique de cycle de tri et de glisser-déposer.

### Correction du faux Code ERP de la fiche machine — 24/07/2026

- L'utilisateur a signalé que le champ « Code ERP » (texte libre) de la fiche machine n'avait visiblement aucun lien avec l'import ERP réel. Audit confirmé : `MachineSettings.erpCode` n'était jamais lu par le pipeline d'import (résolution machine ⇄ code ERP via `ErpMachineMapping`, entièrement séparé) — un champ purement cosmétique, sans aucun effet, malgré son nom trompeur. Retiré entièrement : type `MachineSettings`, service de réglages, migration du dépôt, tableau Réglages → Production → Machines, carte du Parc Machines et colonnes d'import/export CSV.
- La fiche machine affiche à la place, en lecture seule, le ou les vrais codes ERP mappés à cette machine (même source que le compteur « Codes ERP non mappés » du Parc Machines), avec un lien « Gérer les correspondances ERP » vers le panneau Correspondances ERP déjà existant (Cockpit ERP) plutôt que de dupliquer l'édition sur la fiche machine — choix explicite de l'utilisateur.

### Catégorisation des machines par catégorie de tâche — 24/07/2026

- Chaque machine peut désormais être liée à l'une des ~40 catégories de tâche ERP fournies par l'utilisateur (Tournage, Fraisage, Affûtage, Rectification cylindrique, Découpe fil…) : nouveau champ `MachineSettings.taskCategoryCode` (nullable), assignable depuis la fiche machine (« Modifier » → Catégorie), avec « Non catégorisée » comme option explicite.
- Le dictionnaire des catégories déménage de `erp-import/config/` vers `src/lib/task-category-dictionary.ts` : il est désormais réutilisé tel quel par le Cockpit ERP/l'Atelier (filtre de visibilité des opérations, déjà existant) **et** par le Parc Machines (catégorisation des machines, nouveau), sans qu'aucune des deux features ne dépende de l'autre pour ce vocabulaire partagé — une seule liste, jamais dupliquée.
- Les machines du référentiel de démonstration sont pré-catégorisées selon leur département/type déjà curatés (Tournage → « Tournage », Fraisage → « Fraisage », Découpe fil → « Découpe fil », les 4 machines combinées Tournage/Fraisage → la catégorie « Tournage/Fraisage » dédiée déjà présente dans le dictionnaire) ; toute nouvelle machine (création manuelle ou import CSV) reste volontairement non catégorisée tant que l'utilisateur ne l'assigne pas lui-même.
- Le Parc Machines gagne un filtre « Catégorie » (grille de cartes inchangée par choix explicite de l'utilisateur, pas de regroupement en sections) : seules les catégories réellement utilisées par au moins une machine apparaissent dans la liste, plus « Non catégorisées » si au moins une machine n'a pas encore de catégorie. Chaque carte affiche désormais sa catégorie.

### Import/export CSV du Parc Machines — 24/07/2026

- Ajoute « Exporter en CSV » et « Importer un CSV » au Parc Machines (`MachineCsvTools.tsx`) : une ligne par machine avec l'identité (Réglages : département, type, code ERP, capacité, commentaires…) et la fiche technique (fabricant, modèle, année, n° de série, robot, statut opérationnel) réunies, alors qu'elles vivent aujourd'hui dans deux stores séparés.
- Format CSV plutôt qu'un vrai `.xlsx` (choix explicite de l'utilisateur) : s'ouvre nativement dans Excel, sans nouvelle dépendance — aucune bibliothèque d'écriture `.xlsx` n'existait dans le projet (`read-excel-file` ne fait que lire, et `ExcelJS` avait déjà été écarté lors de l'audit de l'import ERP). Nouveau service pur `src/features/machines/services/machine-csv-service.ts` : délimiteur `;` et BOM UTF-8 pour Excel en locale française, guillemets/échappement conformes (gère les valeurs contenant `;`, des guillemets, des accents).
- Import strictement additif (choix explicite de l'utilisateur) : une ligne dont l'identifiant existe déjà dans le parc est ignorée et signalée dans le rapport, jamais mise à jour. Réutilise `machineSettingsService.createMachine`/`updateIdentity`/`setInactive`/`setHidden` et `machineTechnicalService.updateTechnicalDetails` — aucune nouvelle logique de création dupliquée. Le département se résout par libellé ou par identifiant ; une ligne dont le département est introuvable est rejetée avec un message explicite plutôt que d'être devinée.
- Les colonnes « Supprimée » et « Ordre » sont exportées à titre informatif mais jamais relues à l'import, pour ne jamais ressusciter une machine supprimée ou bouleverser l'ordre déjà en place (les nouvelles machines s'ajoutent à la fin, comme la création manuelle).
- Les photos machine (IndexedDB) restent hors de ce CSV.

### Grosse phase d'optimisation : mutations optimistes, mémoïsation, fetch partagé — 24/07/2026

Audit préalable en lecture seule (agent de recherche) puis validation du design (second passage d'analyse) avant toute modification, pour cibler les vrais points chauds plutôt que deviner.

- **Mutations Planning optimistes** : éditer une priorité, réaffecter une machine ou déplacer un OF ERP (Atelier, Capacité, module OF, Cockpit ERP) n'entraîne plus de rechargement complet des ~23 500 opérations (16,7 Mo). Le changement s'applique immédiatement à la seule ligne concernée (nouveau `applyOperationPatchLocally`, `src/features/erp-import/services/operation-view-local-patch.ts`), le PATCH réel part en arrière-plan, et seule une erreur restaure la valeur précédente. Avant ce correctif, modifier un seul champ désactivait et re-rendait toutes les lignes de toutes les machines pendant tout l'aller-retour réseau.
- Extrait `priorityScore`/`rowIssueLabels`/`collectIssueCategories` du service serveur (`erp-planning-service.ts`, marqué `server-only`) vers un nouveau module partagé sans cette contrainte (`src/features/erp-import/services/operation-quality-scoring.ts`), pour que la mise à jour optimiste côté client et l'enrichissement serveur ne puissent jamais diverger — une seule définition, importée des deux côtés.
- Les mutations groupées (glisser-déposer, bouton Renuméroter) appliquent désormais le même patch optimiste en un seul passage puis envoient leurs PATCH en parallèle (`Promise.allSettled`) au lieu d'une boucle séquentielle — plus rapide, et seules les lignes réellement en échec sont restaurées.
- Ajoute `React.memo` aux lignes chaudes du tableau (`WorkshopOperationRow`, `OperationRow` du Cockpit ERP) et stabilise les callbacks qui leur sont passés (`useCallback`, lecture par ref pour `handleReorder`/`handleRenumber` dans `WorkshopMachinePanel.tsx`) : sans cette stabilisation, la mémoïsation aurait été neutralisée silencieusement par des fonctions recréées à chaque rendu.
- Partage le fetch de `/api/erp/planning?scope=workbench&pageSize=50000` entre l'Atelier/Capacité/OF et le Cockpit ERP (nouveau `src/features/erp-import/services/erp-planning-rows-fetch-cache.ts`) : le Workspace Planning garde ses trois onglets montés une fois visités, ce qui chargeait deux fois les mêmes 17 Mo dès que l'Atelier et le Cockpit ERP étaient tous deux ouverts dans la même session.
- Ajoute un cache mémoire avec invalidation à l'écriture directement dans `SerializedAtomicJsonFile` (dette déjà notée de longue date) : bénéficie automatiquement aux 6 dépôts consommateurs (comptes mail, comptes calendrier, règles mail, activité mail, décisions ERP), tous des singletons au niveau module — plus de relecture disque à chaque accès.
- Hors périmètre de cette passe, documenté explicitement : éclatement du contexte Réglages en plusieurs stores (changement structurant à l'échelle de toute l'application) et virtualisation des lignes de l'Atelier (aucune mesure réelle disponible pour en confirmer le besoin aujourd'hui).

### Correctif du bouton Renuméroter — 24/07/2026

- Le bouton Renuméroter n'affectait visiblement que la première ligne de la machine. Deux causes corrigées :
  - La numérotation réutilisait le schéma décroissant du glisser-déposer (999, 998, 997…, une seule opération bouge en général), au lieu d'une suite lisible commençant à 1. Nouvelle fonction dédiée `renumberOperations` dans `useWorkshopOperations.ts` qui attribue 1, 2, 3… jusqu'à la dernière opération selon l'ordre affiché, via la même route PATCH que les autres mutations de priorité.
  - Le champ Priorité de chaque ligne (`WorkshopOperationRow.tsx`) est un champ non contrôlé (`defaultValue`) : après une mutation groupée (Renuméroter, glisser-déposer), React ne remet jamais à jour un champ non contrôlé déjà monté, même quand la donnée change réellement côté serveur — seule la ligne dont le champ vient d'être recréé (ou la première jamais montée) semblait se mettre à jour. Corrigé en forçant le remontage du champ (`key={operation.effectivePriority}`) dès que la priorité change depuis l'extérieur.
- Le glisser-déposer garde volontairement son schéma décroissant existant (999, 998…), inchangé : seul le bouton Renuméroter adopte la numérotation 1, 2, 3…, à la demande explicite de l'utilisateur.

### Renumérotation par machine et colonnes redimensionnables dans le Planning Atelier — 24/07/2026

- Ajoute un bouton « Renuméroter » au-dessus de chaque panneau machine : il réattribue la priorité de toutes les opérations de cette machine selon l'ordre actuellement affiché (après recherche, tri — par exemple par retard décroissant — et filtres), en réutilisant exactement la même mutation que le glisser-déposer de réordonnancement (`onReorderOperations`) — aucune nouvelle règle de numérotation, la même écriture PATCH que partout ailleurs. Désactivé pendant une mutation ou s'il n'y a rien à renuméroter.
- Rend les colonnes du tableau de chaque machine redimensionnables à la souris (glisser le bord droit d'un en-tête) : la largeur se fixe via `<colgroup>`/`table-fixed`, avec un minimum de 80px et un maximum de 640px, pour lire un texte jusque-là coupé dans certains champs (article, description, machine…).
- La largeur de chaque colonne redimensionnée est persistée par colonne, par utilisateur/site/entreprise (`WorkshopViewState.columnWidths`), avec migration silencieuse pour les vues déjà enregistrées sans ce champ (largeur par défaut tant qu'aucun redimensionnement n'a eu lieu).
- Le redimensionnement n'interfère pas avec le glisser-déposer déjà existant qui réordonne les colonnes (l'un utilise une poignée dédiée avec `stopPropagation`, l'autre le glisser-déposer HTML natif de l'en-tête).

### Filtres du Cockpit ERP repositionnés au-dessus du tableau — 24/07/2026

- Les filtres du Cockpit ERP (`PlanningFilterPanel`) ne forment plus une colonne latérale toujours dépliée : ils s'affichent désormais dans une barre horizontale repliable au-dessus du tableau, sur le modèle déjà en place dans le Planning Atelier — recherche, catégories et compteur de résultats toujours visibles ; le détail (clients, départements, machines, priorités, statuts, état technique) se déplie à la demande via un bouton « Filtres ».
- Retire la grille latérale fixe (`grid-cols-[280px_minmax(0,1fr)]`) : le tableau d'opérations profite maintenant de toute la largeur disponible.
- Aplati les regroupements imbriqués « Production »/« Priorités et statuts » en groupes de filtres indépendants, affichés côte à côte dans la barre ouverte plutôt qu'empilés verticalement.

### Filtre par catégorie de tâche ERP, découverte progressive — 24/07/2026

- Ajoute le dictionnaire des 41 catégories de tâche ERP (colonne `Code_Tâche`, fourni par l'utilisateur — ex. code 5 = « Tournage », 27 = « Fraisage ») dans `src/features/erp-import/config/task-category-dictionary.ts`. Les codes 1 et 2 existent dans l'ERP mais leur signification n'est pas encore connue : ils retombent sur le libellé générique « Catégorie inconnue », comme tout futur code inattendu — aucun texte n'est inventé.
- Ajoute un réglage partagé `AppSettings.production.visibleTaskCategoryCodes`, volontairement **vide par défaut** : à l'inverse des autres filtres (machines, départements…) où une liste vide signifie « aucune restriction », ici une liste vide masque tout. L'utilisateur démasque ensuite lui-même les catégories qu'il veut voir, à son rythme.
- Ajoute un contrôle compact et replié par défaut « Catégories (X/41 visibles) » (recherche + case à cocher, boutons Tout afficher/Tout masquer) partagé entre le Planning Atelier et le Cockpit ERP — un seul composant, un seul réglage.
- Le masquage est appliqué aux deux seuls points où les opérations ERP sont chargées côté client (`useWorkshopOperations`, utilisé par l'Atelier/Planning capacité/le module OF, et `ErpPlanningWorkspace` pour le Cockpit ERP), via la fonction partagée `applyTaskCategoryVisibility` — un masquage cohérent dans les quatre vues sans dupliquer la règle quatre fois.

### Identifiant de machine généré automatiquement à la création — 24/07/2026

- L'identifiant n'est plus saisi à la main dans la fenêtre « Ajouter une machine » : il est calculé automatiquement (`machineSettingsService.suggestMachineId`) et affiché en lecture seule, recalculé à chaque changement de département.
- Reprend la numérotation déjà en place par département (ex. TOU-01…TOU-09 pour Tournage, FRA-01…FRA-17 pour Fraisage) : même préfixe et même largeur de numérotation que les machines existantes du département, en incrémentant le plus grand numéro trouvé ; sans machine existante dans le département, dérive un préfixe à partir de son libellé.
- Évite toute collision avec un identifiant déjà utilisé ailleurs dans le référentiel, y compris hors du département choisi.

### Édition et création de machine centralisées entre Parc Machines et Réglages — 24/07/2026

- Le Parc Machines (`/machines`) dispose désormais de son propre bouton « Ajouter une machine », en plus de celui de Réglages → Production → Machines ; les deux ouvrent la même fenêtre `MachineCreateDialog` (sur le modèle de `PlanningDialogShell`, déjà utilisé par `ActionFormDialog`) et passent par le même `machineSettingsService.createMachine` — même validation (identifiant, nom technique et département obligatoires, refus d'un identifiant déjà pris), pas de logique dupliquée entre les deux écrans.
- Réglages → Production → Machines perd son ancien formulaire de création inline (dupliqué) au profit de cette fenêtre partagée ; le bouton « Ajouter une machine » et le comportement (redirection vers la fiche créée) restent identiques pour l'utilisateur.
- La fiche machine (`MachineIdentityPanel`, déjà l'unique écran d'édition riche) gagne le champ « Nom technique » parmi les paramètres modifiables via son bouton « Modifier » existant — c'était jusqu'ici le seul champ de la fiche resté figé après la création.

### Ordre des machines par glisser-déposer sur le Parc Machines — 24/07/2026

- Les cartes du Parc Machines (`/machines`) se réordonnent désormais par glisser-déposer, pour refléter l'ordre du flux de travail de l'atelier plutôt qu'un tri figé.
- Nouveau `machineSettingsService.moveMachine(settings, draggedId, targetId)` : déplace une machine visible juste avant sa cible et réassigne un `order` séquentiel à l'ensemble des machines (même champ partagé avec Réglages → Production → Machines, qui garde ses flèches ↑/↓) ; les machines masquées conservent leur position relative d'origine, non concernées par ce glisser-déposer.
- Retire le tri « favorites toujours en premier » propre à cette page (choix explicite de l'utilisateur) : l'ordre affiché est exactement celui glissé par l'utilisateur, du début à la fin ; l'étoile reste affichée mais n'influence plus le tri ici.

### Détection des articles partagés dans le Planning Atelier — 23/07/2026

- Ajoute dans l'Atelier, pour chaque opération, le même badge « N OF » que le Cockpit ERP dès que `operation.articleWorkOrderCount > 1` (article présent dans plusieurs OF en cours), avec la même couleur déterministe (`articleColor`, `erp-planning-grouping.ts`) — aucune nouvelle règle de détection, réutilisation directe de la valeur déjà calculée côté serveur.
- Ajoute le filtre « Articles » (tous / présents dans plusieurs OF / présents dans un seul OF), avec les mêmes libellés que le Cockpit ERP, câblé sur `filterEngine.apply(..., articleMultiplicity)` déjà existant — persisté par préférence utilisateur (`WorkshopFilterState.articleMultiplicity`), avec migration silencieuse sur « Tous les articles » pour une préférence déjà enregistrée sans ce champ.
- Ajoute le nombre d'OF partageant l'article dans le détail déplié d'une opération.

### Module OF en phase avec l'ERP, fiche unifiée — 23/07/2026

- `/of` et `/of/[id]` affichent désormais les vrais OF importés d'ERP dès qu'un import est actif (`useErpImportActive`), en réutilisant `useWorkshopOperations` (même source que l'Atelier et Planning capacité) et `groupErpPlanningRows(rows, "work-order", machines)` pour regrouper les opérations par OF — aucune nouvelle logique de regroupement. Sans import actif, les deux pages retombent sur les OF de démonstration, strictement inchangés.
- Nouveau service testable `src/features/work-orders/services/erp-work-order-summary.ts` (`summarizeErpWorkOrder`, `deriveErpWorkOrderStatus`, `matchesErpWorkOrderFilters`) : dérive client/article/échéance/statut/progression/retard d'un OF depuis ses seules opérations `OperationView`, sans dupliquer de règle déjà détenue par l'ERP.
- La liste `/of` retrouve les mêmes filtres qu'en mode démonstration (recherche, statut, machine, département, retard) mais alimentés par les vraies données ; la catégorie de priorité textuelle (propre au jeu de démonstration) n'a pas d'équivalent ERP et n'a pas été inventée.
- Unifie la fiche OF : le Cockpit ERP n'ouvre plus sa propre fenêtre dupliquée (`WorkOrderDialog`) — cliquer un OF navigue désormais vers `/of/[id]`, seule fiche OF de l'application. La fiche ERP redemande le détail complet (`include=work-order-details`) au chargement, comme le faisait l'ancienne fenêtre, et garde le même temps « Non disponible » que partout ailleurs (aucun champ de durée sur `OperationView`).
- Extrait `erpOperationDelayTone`/`erpOperationDelayLabel` dans `erp-operation-status-presentation.ts` (déjà utilisé pour les statuts) : une seule table de retard partagée entre l'Atelier et la fiche OF, au lieu d'une copie locale.
- Le bouton « Ouvrir l'OF », précédemment désactivé dans l'Atelier, pointe maintenant vers `/of/[id]`.

### Tri générique par colonne dans le Planning Atelier — 23/07/2026

- Généralise le tri par priorité en un tri par colonne (`WorkshopSortState { column: "priority" | "delay" | null; direction }`) : les en-têtes Priorité et Retard exposent chacun le même bouton ⇅/▼/▲, une seule colonne triée à la fois (cliquer une autre colonne bascule dessus, comme un tableur classique).
- `sortOperations` trie par priorité effective ou par jours de retard selon la colonne active ; les opérations sans valeur connue (pas de date pour le retard) restent en fin de liste plutôt que de recevoir une valeur fabriquée pour les comparer.
- Migration automatique et silencieuse de l'ancien réglage `prioritySort` déjà enregistré dans le navigateur vers le nouveau `sort` générique, sans perte de la préférence existante.

### Planning capacité en phase avec les données ERP réelles — 23/07/2026

- Planning capacité (`PlanningModule.tsx`) affiche désormais les opérations ERP réelles (`OperationView`, même source que l'Atelier via `useWorkshopOperations`) plutôt que les OF de démonstration, dès qu'un import ERP est actif (`useErpImportActive`, lecture de `/api/erp/imports`) — la démonstration et l'ERP ne se mélangent jamais dans la même grille ; sans import actif, le comportement de démonstration reste inchangé. La maintenance (sans équivalent ERP) continue de s'afficher dans les deux cas.
- Chaque OF ERP se place au jour de `plannedDate` et à la machine de `operation.machineId`, et peut être glissé-déposé vers une autre machine/jour comme les blocs de démonstration ; la confirmation écrit `{ machineId, plannedDate }` en une seule requête PATCH (`useWorkshopOperations.updatePlacement`, même route que l'Atelier), et se reflète immédiatement dans l'Atelier et le Cockpit ERP via le bus de synchronisation déjà en place.
- `OperationView` ne portant aucun temps de fabrication, `durationHours` devient `number | null` sur tous les blocs de planning (`null` = indisponible, jamais 0 inventé) ; les sommes d'heures et de charge (`sumDurationHours`/`countUnknownDurationBlocks`) excluent les blocs ERP du calcul et affichent séparément leur nombre (« N op. ERP · temps n.d. ») plutôt que de fabriquer une valeur.
- Extrait la table de libellés/couleurs de statut ERP (`ERP_OPERATION_STATUS_LABELS`/`erpOperationStatusTone`) dans `src/features/erp-import/services/erp-operation-status-presentation.ts`, réutilisée par l'Atelier et par Planning capacité — une seule source, pas de duplication.
- Le bouton « + » d'ajout d'un OF de démonstration à une case disparaît quand un import ERP est actif (l'affectation d'un tout nouvel OF ERP à une case reste hors périmètre de cette itération ; seul le déplacement d'un OF ERP déjà placé est couvert).

### Colonne Retard dans le Planning Atelier — 23/07/2026

- Ajoute la colonne « Retard » (visible par défaut) qui reprend `OperationView.delayDays` avec exactement les mêmes seuils et libellés que la colonne Retard du Cockpit ERP (danger au-delà de 15 jours, avertissement au-delà de 0, « j avance »/« j retard »/« Aujourd’hui »/« Sans date ») — aucune nouvelle règle de retard, réutilisation directe.

### Tri de priorité et cadre défilant du Planning Atelier — 23/07/2026

- Ajoute le tri croissant/décroissant sur la colonne Priorité (bouton ⇅/▼/▲ dans l'en-tête, cycle none → décroissant → croissant → none), persisté par préférence utilisateur (`prioritySort`) et appliqué par machine dans `buildWorkshopDepartments`/`sortByPriority`. « none » conserve l'ordre reçu, sans tri ajouté par défaut.
- Remplace la troncature « 10 opérations affichées, les suivantes masquées » par un cadre défilant : le tableau de chaque machine reste dans un bloc bordé dont la hauteur correspond au réglage « Lignes par machine » (en-tête collant), mais toutes les opérations restent atteignables par défilement — aucune n'est cachée derrière le réglage.
- Le menu Colonnes (afficher/masquer chaque colonne) existait déjà depuis la première version de l'Atelier ; vérifié à nouveau et couvert par un test dédié.

### Réaffectation machine et réordonnancement par glisser-déposer — 23/07/2026

- Ajoute `WorkshopMachinePicker` : la colonne Machine devient un sélecteur avec recherche par nom et vignette photo (réutilise `useMachinePhotos()`/Parc Machines existant) pour identifier la bonne machine même quand le nom seul ne suffit pas. La sélection appelle `PATCH /api/erp/operations/[id]` avec `{ machineId }` — même champ, même route que le Cockpit ERP — puis l'opération apparaît immédiatement dans le panneau de sa nouvelle machine.
- Ajoute le glisser-déposer des lignes d'opération à l'intérieur d'une même machine (`reorderOperationIds`) : déposer une ligne sur une autre recalcule des priorités strictement décroissantes pour tout ce qui a bougé et n'écrit que les valeurs réellement modifiées, via le même champ `priority` que l'édition manuelle déjà en place — aucun champ de classement parallèle n'est introduit.
- Les deux mutations passent par `useWorkshopOperations` et notifient `erp-planning-data-bus`, donc le Cockpit ERP reflète aussi une réaffectation ou un réordonnancement fait dans l'Atelier, comme pour la priorité.

### Ergonomie et interactivité du Planning Atelier — 23/07/2026

- Limite l'affichage de chaque machine à 10 opérations par défaut (réglable : 10/25/50/Toutes, dans le menu Colonnes), pour ne plus dérouler des dizaines de lignes par machine ; un message indique combien restent masquées.
- Les tableaux d'opérations sont désormais réordonnables par glisser-déposer des en-têtes de colonne (`moveWorkshopColumn`, même mécanique que le Cockpit ERP), l'ordre étant partagé par toutes les machines et persisté.
- La colonne Priorité devient modifiable directement dans l'Atelier (`updatePriority`, `PATCH /api/erp/operations/[id]`, même route que le Cockpit ERP).
- Ajoute `src/features/erp-import/services/erp-planning-data-bus.ts`, un signal partagé en mémoire navigateur : après une mutation réussie (priorité, mapping machine, import…), le Cockpit ERP et l'Atelier se notifient mutuellement et rechargent leurs données pour rester synchronisés sans se recharger inutilement eux-mêmes (identifiant de source ignoré sur son propre auteur). Le Planning capacité, qui repose sur un modèle de données distinct (démonstration locale, pas `OperationView`), ne peut structurellement pas suivre ces changements — limite documentée, pas une régression.
- Déplace les filtres au-dessus du contenu (barre horizontale repliable) au lieu d'une colonne latérale gauche.
- Ajoute un en-tête de département visuellement distinct (bandeau sombre, compteur machines/opérations) et encadre chaque tableau machine dans un bloc bordé.

### Planning Atelier — 23/07/2026

- Ajoute une troisième vue au Workspace Planning, « Atelier » (`PlanningWorkshopView`), inspirée de l'écran ERP historique : les opérations sont regroupées par département puis par machine, chaque machine dans un panneau repliable dont l'état est mémorisé (préférences locales versionnées `prodpilot.planning-workshop-view.v1:<entreprise>:<site>:<utilisateur>`, sur le modèle des vues personnelles du Cockpit ERP).
- Réutilise strictement les sources et services existants — `OperationView` via `/api/erp/planning`, `MachineSettings` et `DepartmentSettings` via Réglages, `filterEngine` et `groupErpPlanningRows` du Cockpit ERP — sans créer de deuxième source de données ni dupliquer une règle de filtrage ou de correspondance machine.
- N'affiche jamais un temps de fabrication ou une charge inventés : `OperationView` ne porte aucun champ de durée (choix produit déjà en vigueur pour le Cockpit ERP) ; la colonne « Temps » et la charge machine affichent explicitement « Non disponible », prêtes à s'activer dès qu'une source de durée fiable existera. La capacité machine (heures/jour) reste, elle, disponible dès aujourd'hui via `CapacitySettings` (export de `resolveCapacity`, sans modification de son calcul).
- Ajoute des colonnes personnalisables (Priorité, OF, Opération, Article, Désignation, Temps, Statut, Date début, Date fin, Machine) et des filtres (machines actives/inactives/masquées/sans OF, départements, recherche OF/article/description/client), tous dérivés de `OperationView`/`MachineSettings` sans valeur codée en dur.
- Le sélecteur Cockpit ERP / Planning capacité / Atelier ne recharge jamais les données au changement d'onglet : chaque vue ne se monte qu'à sa première ouverture puis reste montée (affichage seul masqué), sans toucher au fonctionnement interne du Cockpit ERP ni du Planning capacité.
- Nouveaux fichiers : `src/features/planning/types/workshop-view.ts`, `services/workshop-view-service.ts`, `services/workshop-view-preferences.ts`, `repositories/browser-workshop-view-repository.ts`, `hooks/useWorkshopViewPreferences.ts`, `hooks/useWorkshopOperations.ts`, `components/PlanningWorkshopView.tsx`, `WorkshopFilters.tsx`, `WorkshopColumnSelector.tsx`, `WorkshopDepartmentSection.tsx`, `WorkshopMachinePanel.tsx`, `WorkshopOperationRow.tsx`, et `tests/planning-workshop.test.mjs`.

### Photos machine hors quota Réglages — 23/07/2026

- Retire `photoDataUrl` de `MachineSettings` (Réglages, `localStorage`) : la limite de quelques mégaoctets qui provoquait des échecs de stockage n'était pas un choix, c'est le quota `localStorage` du navigateur — inadapté à des photos, quelle que soit la compression.
- Ajoute un dépôt dédié `src/features/machines/repositories/machine-photo-indexeddb-adapter.ts` (IndexedDB, base `prodpilot-machine-photos`) et le store réactif `machine-photo-store.ts` (`useMachinePhotos()`, `setMachinePhoto()`), sur le même principe que le store Réglages/démo existant (cache mémoire + `useSyncExternalStore`) mais avec hydratation asynchrone puisque IndexedDB ne l'est pas.
- Migre automatiquement, une fois par session, les photos déjà enregistrées dans l'ancien emplacement vers IndexedDB (`MachinePhotoStorageMigration`, montée sur `/machines` et sur la fiche), puis force une sauvegarde des Réglages pour que les anciennes données binaires ne restent pas dans le JSON persistant.
- Bascule la fiche machine, la carte du Parc Machines et l'import groupé sur `useMachinePhotos()` / `setMachinePhoto()` ; relâche en conséquence la compression de l'import groupé (1300 px / qualité 0,8, le quota n'étant plus la contrainte).
- Bascule `SETTINGS_VERSION` à 17 (suppression de champ) et ajoute `settingsRepository.extractLegacyMachinePhotos()`, seul point d'accès au JSON brut historique — le module Machines ne lit jamais directement le stockage de Réglages.

### Import groupé résilient au quota de stockage — 22/07/2026

- Corrige l'import groupé qui enregistrait les 27 photos en un seul bloc : si le total dépassait le quota `localStorage` du navigateur, aucune photo n'était sauvegardée, même celles qui auraient tenu. Chaque photo est désormais enregistrée individuellement dès qu'elle est traitée ; l'import s'arrête proprement au premier échec de stockage sans perdre les photos déjà enregistrées.
- Réduit la compression par défaut de l'import groupé (900 px, qualité 0,7) pour limiter le volume total.
- Affiche le poids actuel des Réglages (en Ko) dans le panneau d'import, pour comprendre la marge disponible avant d'atteindre le quota.

### Import groupé des photos du parc — 22/07/2026

- Ajoute un import de photos en masse sur `/machines` (`MachinePhotoBulkImport`) : sélection multiple de fichiers (le dialogue standard « Ouvrir », qui affiche les images), association automatique de chaque image à sa machine par comparaison stricte (normalisée, avec ou sans espaces) du nom de fichier au nom technique, au nom affiché ou à l'identifiant — sans correspondance approximative, pour ne jamais risquer d'associer une photo à la mauvaise machine.
- Corrige un premier réglage qui forçait la sélection d'un dossier entier via le dialogue Windows « Sélectionner un dossier » : celui-ci n'affiche jamais les fichiers qu'il contient, ce qui donnait l'impression qu'aucune photo n'était présente.
- Réutilise la compression client existante (`src/lib/image-file.ts`) avec des réglages plus serrés pour l'import groupé (1100 px, qualité 0,75) afin de limiter le volume total écrit en une seule fois dans `localStorage`.
- Le résultat affiche le nombre de photos associées, la liste des fichiers sans machine correspondante et ceux qui ont échoué au traitement.

### Fiabilisation de l'ajout de photo machine — 22/07/2026

- Corrige l'échec silencieux (« rien ne se passe ») lors de l'ajout de certaines photos : une image trop volumineuse faisait dépasser le quota `localStorage` des Réglages, et l'écriture échouait sans aucun message ni mise à jour visible.
- Compresse désormais chaque photo côté client avant stockage (redimensionnement à 1600 px maximum, réencodage JPEG qualité 0,82 via `src/lib/image-file.ts`), ce qui réduit très largement le poids des photos issues d'un smartphone ou d'un scanner.
- `SettingsRepository.save()` et `updateSettingsSnapshot()` détectent désormais un échec d'écriture localStorage (quota dépassé ou autre), annulent la mise à jour en mémoire au lieu de la laisser incohérente, et remontent une erreur explicite à l'appelant.
- La fiche machine affiche un message d'erreur clair sous le bouton photo si l'ajout échoue (fichier non reconnu comme image ou stockage saturé), au lieu de rester silencieuse.

### Mise en avant de la photo machine — 22/07/2026

- Agrandit la photo sur la fiche machine (miniature `h-40 w-64`) et ajoute un zoom plein écran au clic (lightbox avec fermeture par Échap, clic extérieur ou bouton).
- Transforme les cartes du Parc Machines en fiches façon « produit » : la photo occupe désormais toute la largeur en tête de carte quand elle existe ; les machines sans photo gardent une mise en page inchangée sans bandeau vide.

### Fiche machine unique et complète, photo du parc — 22/07/2026

- Corrige l’accès à la fiche machine (`/machines/[id]`) : le lien depuis le Parc Machines n’était visible que pour les 4 machines de démonstration ; il est désormais systématique pour toutes les machines du référentiel.
- Fait de la fiche machine l’unique écran d’édition riche d’une machine : identité (nom affiché, département, type, code ERP, couleur, capacité future, commentaires, favori), fiche technique (statut opérationnel, fabricant, modèle, année, n° de série, robot, informations techniques) et suppression/restauration, en plus des cases Actif/Visible déjà existantes.
- Ajoute l’upload et l’affichage d’une photo par machine (`MachineSettings.photoDataUrl`), visible sur la fiche et en miniature sur les cartes du Parc Machines ; ce champ existait déjà mais n’était ni affiché ni éditable en dehors de Réglages.
- Réduit Réglages → Production → Machines à la liste, au réordonnancement, à la création minimale (identifiant, nom, département) et à la suppression/restauration ; le bouton « Modifier » de chaque ligne renvoie désormais vers la fiche au lieu de dupliquer un formulaire complet.
- Supprime le champ mort `Machine.photoUrl` du dépôt de démonstration (jamais lu, doublon dormant de `MachineSettings.photoDataUrl`).
- Ajoute `MachineSettingsService.updateIdentity/setPhoto/softDelete/restore` et le nouveau `machineTechnicalService` (mise à jour des champs techniques du dépôt de démonstration, avec création à la volée pour les machines réelles sans fiche démo préexistante).

### Fiche machine comme source de vérité — 22/07/2026

- Ajoute `visible` à `MachineSettings`, avec migration et valeur par défaut à `true`, et centralise les transitions d’activité et de visibilité dans `MachineSettingsService`.
- Limite le mapping ERP à `erpMachineCode`, `machineId` et `updatedAt`. Le panneau ERP lit désormais nom, statut et visibilité depuis la fiche machine et ouvre celle-ci pour les modifier.
- Migre au chargement les anciens champs `status`, `active`, `visible` et `hidden` vers les réglages avant leur retrait du registre ERP.
- Le Planning ne propose pour les nouvelles affectations que les machines actives, visibles et non supprimées, tout en conservant les opérations historiques.
- Aucun import, aucune opération et aucun historique ERP ne sont supprimés ou réécrits par cette migration.

### Fiabilisation des correspondances machines ERP — 22/07/2026

- Conserve la chaîne unique `CODE_MACH_INT → ErpMachineMapping → MachineSettings.id` et supprime le fallback incorrect qui transformait un code ERP brut en identifiant machine ProdPilot.
- Ajoute une normalisation centrale et rétrocompatible des codes ERP : espaces, BOM, caractères invisibles et casse, sans retirer les tirets significatifs.
- Agrège les codes normalisés dans l’overview avec leur description ERP et leur nombre d’opérations.
- Étend l’interface de correspondance existante : recherche, filtre des non-mappés, machine et identifiant internes, statuts actif/inactif/supprimé/absent, modification et suppression d’une association.
- Documente l’impact transversal des identifiants actuels et la future numérotation métier dans `docs/43 - ERP Machine Identifier Migration.md`, sans modifier aucune fiche ni aucun identifiant machine.

### Réinitialisation locale des imports ERP — 22/07/2026

- Remise à zéro des données ERP locales à la demande de l’utilisateur : aucun import actif, aucun OF et aucune opération ne restent exposés par les API ERP.
- Les historiques d’import, ajustements, correspondances machines, rapports de synchronisation et décisions Planning ont été retirés ensemble afin d’éviter tout état résiduel lors du prochain import.
- Une sauvegarde récupérable a été créée sous `.local-data/backups/erp-reset-2026-07-22_19-08-26/`. Les données Mail et Calendrier ainsi que les classeurs d’exemple n’ont pas été modifiés.

### Optimisation de performance — 22/07/2026

- Audit ciblé des points de ralentissement les plus concrets du dépôt (accès disque répétés, filtrage/tri non mémorisé, recalculs React inutiles, config de développement) plutôt qu'une refonte générale — conforme à la règle « pas de refactorisation non demandée ».
- Correctif principal : `ErpImportRepository.findDuplicate()` (vérification de doublon à chaque tentative d'import) relisait et reparsait tout le fichier `erp-planning.json` (16,7 Mo, 23 558 opérations) au lieu d'utiliser le cache en mémoire déjà en place pour le reste du dépôt — mesuré à environ 130 ms de blocage par appel. Route maintenant systématiquement via le cache.
- `getErpPlanningRows()` (route `/api/erp/planning`, appelée à chaque recherche/tri/pagination) mémorise désormais le résultat filtré et trié par signature de filtres, au lieu de reparcourir et retrier les 23 558 lignes à chaque requête identique (navigation entre pages, par exemple).
- `WorkspaceDashboard` (Mon Espace) et `ErpPlanningOperations` (tableau Planning ERP) recalculaient des tableaux dérivés à chaque rendu sans mémorisation — cartes/métriques de Mon Espace et liste des machines actives par ligne de tableau sont désormais mémorisées avec `useMemo`.
- `npm run dev` repasse de Webpack à Turbopack (comportement par défaut de Next.js 16) : le flag `--webpack` avait été introduit le 15/07/2026 sans raison documentée dans ce journal ; le build de production utilisait déjà Turbopack sans le moindre problème. Vérifié après bascule : `tsc`, `lint`, `build` et les 139 tests passent, et un serveur de développement Turbopack propre répond correctement sur `/`, `/mails/assistant`, `/actions` et `/reglages/connexions/calendrier`. Point non couvert par cette vérification, à tester manuellement par l'utilisateur : le flux micro/voix de l'Assistant mails (permissions et enregistrement navigateur, hors de portée d'un test par requêtes HTTP).
- Non-problèmes confirmés lors de l'audit : la page d'accueil paralléllise déjà ses chargements (`Promise.all`), aucun `middleware.ts` n'ajoute de coût par requête, aucune boucle de sondage (`setInterval`) ne rafraîchit inutilement des données, et les icônes ne sont pas importées en bloc.
- Reste identifié mais non traité (voir `docs/06 - Todo.md`) : `SerializedAtomicJsonFile`, la primitive de stockage JSON partagée par plusieurs domaines, n'a pas de cache intégré — chaque dépôt qui l'utilise doit le réimplémenter lui-même, et la plupart ne le font pas. Sans risque aujourd'hui vu la taille des fichiers concernés, mais à surveiller si un autre domaine grossit comme `erp-planning.json`.

### Calendrier Google réel dans Mon Espace — 21/07/2026

- Ajoute un connecteur Google Calendar complet (`src/features/calendar/`) : agenda du jour visible dans Mon Espace et planification de réunions par l'assistant local, en plus de sa capacité Actions existante.
- Décision actée avec l'utilisateur : calendrier **réel** (Google Calendar, pas un calendrier interne), et connexion **séparée** de celle de Mail — connecter la messagerie n'accorde pas silencieusement l'accès au calendrier, et réciproquement. Nouvelle variable serveur `GOOGLE_CALENDAR_REDIRECT_URI` (voir `.env.example`) et nouvelle URI de rappel à déclarer dans le même projet Google Cloud que Mail, avec le scope minimal `calendar.events`.
- Choix architectural délibéré : plutôt que de refactoriser le mécanisme OAuth de Mail (`google-auth.ts`) — actuellement en usage réel avec un compte connecté par l'utilisateur — pour le rendre générique, le connecteur Calendrier duplique le petit nombre de fonctions génériques nécessaires (client OAuth2, état signé, échange de code, rafraîchissement de jeton) dans son propre module server-only. Aucun fichier du module Mail n'a été modifié ; les 132 tests Mail existants passent sans changement (7 nouveaux tests Calendrier ajoutés, 139 au total).
- Nouveau domaine `src/features/calendar/` sur le modèle exact de `src/features/mail/` : types (`CalendarAccount`, `CalendarEvent`), contrat `CalendarProvider`, implémentation Google (`calendar.events.list`/`.insert`) et de démonstration, dépôt de compte local (fichier JSON atomique, réutilise `SerializedAtomicJsonFile` déjà partagé par Mail, ERP-import et la gestion Mail), service de connexions.
- Réglages → Connexions → Calendrier (connecter, activer, tester, déconnecter) — version volontairement plus simple que Messagerie (pas de réglages par compte, un compte de démonstration toujours disponible par défaut).
- Mon Espace affiche désormais l'agenda du jour (nouvelle carte `TodayAgendaCard`, pleine largeur, avant l'assistant) : heure, titre, lieu, participants, lien vers l'événement réel dans Google Calendar. État vide explicite si rien n'est prévu ou si aucun compte n'est connecté — jamais présenté comme une connexion active tant qu'elle ne l'est pas.
- L'assistant local de Mon Espace (déjà utilisé pour la revue des Actions et la redirection vers le Mail Copilot) reconnaît désormais une troisième capacité : résumer l'agenda du jour (« qu'est-ce que j'ai aujourd'hui ? ») et proposer la planification d'une réunion (« planifie une réunion à 14h pour... »). Comme pour les Actions et Mail, toute création reste reformulée puis soumise à confirmation explicite avant le moindre appel réseau ; l'heure et l'adresse d'un participant ne sont jamais devinées — seulement extraites du texte de la demande, sinon l'assistant les redemande.
- Validation : TypeScript, lint, build et 139 tests automatisés réussis. La connexion Google Calendar réelle n'a pas été recettée manuellement (nécessite de déclarer `GOOGLE_CALENDAR_REDIRECT_URI` dans Google Cloud puis `.env.local`) ; un sélecteur de participants/formulaire de création dans l'interface (au-delà de la commande en langage naturel) reste à construire.

### Mail Copilot — rédaction assistée et envoi manuel — 20/07/2026

- Ajoute la rédaction d’un mail neuf (« écris un mail à… pour… ») au Mail Copilot, jusqu’ici capable uniquement de répondre à un message déjà reçu. Nouvel intent `compose_new_mail`, raccordé au moteur de commandes, au moteur d’approbation et à l’orchestrateur central (`assistant-core`) déjà en place pour Mail — aucune duplication de service.
- Résout le contexte de production (OF, client, échéance, statut, projet) depuis le texte libre de la demande, entièrement côté client (`data.workOrders` vit en `localStorage`, jamais accessible depuis la session serveur) puis le transmet au serveur avec l’instruction : le serveur ne lit jamais directement le dépôt de démonstration, conformément à la Règle 6 de la Constitution.
- Ajoute `AiProvider.composeMail` (implémentations OpenAI structurée et démonstration déterministe) : l’IA ne reçoit jamais d’accès libre aux données et ne peut jamais inventer une adresse e-mail — le destinataire est résolu de façon déterministe avant l’appel IA ; toute information manquante est signalée dans `missingInformation` plutôt que devinée.
- Ajoute les modèles de mails réutilisables dans Réglages → Mails (`mailTemplates`, ajout/édition/suppression/réordonnancement), seedés avec trois exemples explicitement cités par l’utilisateur (relance client en retard, relance fournisseur, notification qualité) et entièrement remplaçables — aucun modèle en dur dans le code.
- Implémente l’envoi Gmail réel, absent du dépôt jusqu’ici (`MailProvider` n’avait pas de méthode d’envoi ; `sendingEnabled` était un verrou typé littéralement `false`). Décision actée avec l’utilisateur : l’IA ne doit jamais envoyer, l’utilisateur doit cliquer lui-même. En conséquence, `sendingEnabled` devient un `boolean` désactivable par compte dans Réglages → Connexions → Messagerie (désactivé par défaut), et le bouton « Envoyer » vit dans un composant dédié (`MailDraftReviewCard`) totalement séparé du champ de conversation : aucune commande de chat ni confirmation IA ne peut l’atteindre — seul un clic humain explicite, après relecture complète du destinataire/objet/corps, appelle `POST /api/mail/drafts/[draftId]/send`, qui revérifie le réglage côté serveur avant d’appeler `gmail.users.drafts.send`.
- Relie Mon Espace/Accueil : l’assistant local des Actions détecte désormais une demande de rédaction de mail et redirige vers le Mail Copilot avec l’instruction transmise via `sessionStorage`, au lieu de dupliquer un second pipeline IA/réseau dans un panneau conçu pour rester local et synchrone.
- Réutilise le pont Mail → Actions déjà construit : une action de suivi peut être créée depuis un mail composé, uniquement sur demande explicite dans la conversation (jamais systématique, décision actée avec l’utilisateur).
- Ajoute 13 tests ciblés (interprétation de la demande, non-invention de destinataire, niveau d’approbation, mapping capacité/risque de l’orchestrateur, résolution du contexte de production, garde-fous de la route d’envoi) et met à jour un test existant qui verrouillait l’absence totale d’envoi Gmail pour refléter le nouveau garde-fou (`sendingEnabled` requis) au lieu de l’absence de fonctionnalité.
- Validation : TypeScript, lint, build et 132 tests automatisés réussis. L’envoi réel sur un compte Google Workspace effectivement connecté n’a pas été recetté manuellement ; le sélecteur de modèle dans l’interface reste à construire (le modèle n’est aujourd’hui reconnu que s’il est cité par son nom dans la commande).

### Correctif critique Assistant Mail voix — 20/07/2026

- Corrige la destruction de `SpeechRecognition` au premier résultat partiel en stabilisant les callbacks et le cycle de vie de l’instance.
- Rend le clic micro persistant, fiabilise arrêt/reprise et écoute mains libres, évite les doubles démarrages et déduplique les résultats avec `resultIndex`.
- Migre le raccourci initial `Ctrl+Espace`, susceptible d’être capturé par Plaud au niveau système, vers `F8` ; aucun connecteur Plaud n’est ajouté.
- Empêche les rendus React d’interrompre la synthèse vocale, améliore les réglages initiaux et conserve la sélection, vitesse, volume, langue et moteur TTS.
- Ajoute un diagnostic intégré et condense l’historique ancien avant les dix tours complets les plus récents.

### Orchestrateur central ProdPilot IA — 20/07/2026

- Ajoute le catalogue transversal de capacités, les contrats d’outil, le registre contrôlé, le plan d’exécution et l’orchestrateur central sans logique métier Mail.
- Isole chaque exécution par entreprise, utilisateur, module, mode et corrélation ; contrôle la capacité, la frontière de module et la confirmation selon le risque avant l’appel d’un outil.
- Raccorde toutes les commandes de session Mail existantes à cette couche centrale tout en conservant l’interpréteur, les services, fournisseurs, mémoires et approbations spécialisés.
- Documente l’ajout futur d’outils et distingue explicitement les contrats cibles des capacités déjà implémentées.

### Socle de décisions durables — 20/07/2026

- Identité métier stable des opérations ERP, indépendante de la ligne et de la version d’import.
- Journal séparé et historisé des décisions Planning avec ancienne/nouvelle valeur, acteur, origine, module et état d’application.
- Migration automatique et non destructive des anciens ajustements, réconciliation après import, conservation des décisions ambiguës ou orphelines et rapport explicatif.
- Architecture Undo/Redo par événements inverses et sauvegarde automatique versionnée après chaque mutation du registre.
- Documentation des garanties locales, limites industrielles et étapes nécessaires avant un déploiement partagé.

### Registre unique d’actions — 20/07/2026

- Refond le module Actions en registre unique et transversal, conformément aux Règles 4 et 6 de la Constitution (source unique, communication par services centraux). Le registre existait déjà comme dépôt partagé (`data.actions`) ; QRQC, Réunion de production, Parc machines et Centre de demandes y écrivaient déjà, mais chaque module utilisait son propre formulaire ad hoc avec des champs codés en dur (`responsible: "Daniel Mülverstedt"`, `priority: "Haute"`, `dueDate: "2026-07-15"` dans `MeetingWorkflow.tsx`).
- Simplifie le modèle `ProductionAction` : suppression de `title`, `department`, `priority`, `comments` et `history` (fils de commentaires et sous-tâches explicitement interdits par la demande), remplacés par `dateEncodage`, `introduitPar`, `origine` (configurable), `contextLink` (lien contexte unique et cliquable), `description`, `responsable`, `échéance`, un statut à exactement trois valeurs (À faire / Fait / Reporté, volontairement non configurable) et `dateCloture`/`remarque`. Une migration automatique (`demo-data-migration.ts`) convertit les données `localStorage` existantes vers le nouveau format au premier chargement, sans perte.
- Ajoute Réglages → Actions : liste des origines modifiable (ajout, renommage, suppression, réordonnancement, sert de preuve de traçabilité EN 9100) et colonnes du tableau du registre configurables (affichage, ordre).
- Crée un service central (`action-service.ts`) et une fenêtre de saisie unique (`ActionFormDialog`) qui remplace les quatre formulaires existants et est désormais utilisée par QRQC, Réunion de production, Centre de demandes, Parc machines (nouveau bouton sur la fiche machine, qui n’en avait aucun), fiches OF (nouveau bouton) et Qualité ERP.
- Ajoute les regroupements « par personne » (retards en premier), « par origine » et « par échéance » (En retard / Aujourd’hui / Cette semaine / Plus tard) sur la page Actions, ainsi que les filtres statut/origine/responsable/recherche.
- Ajoute l’étape 1 obligatoire des réunions QRQC et Production : revue des actions « À faire » de cette origine avec Fait / Reporté / Réassigner avant les nouveaux sujets ; le compte rendu de clôture affiche désormais le résultat de cette revue (faites / reportées / restantes).
- Corrige l’assistant Mail : `createActions()` écrivait dans une copie de session (`session.actionsCreated`) explicitement documentée comme « pas encore enregistrée durablement dans le module Actions ». La session serveur prépare désormais un brouillon d’action réel, appliqué au registre par le client après confirmation dans la conversation, avec origine « Mail » et lien vers le message d’origine — conforme à l’exemple donné par `02 - Global Architecture.md`.
- Ajoute une revue des actions en langage naturel dans l’assistant de Mon Espace (jusqu’ici un stub à trois mots-clés sans état) : « revue des actions », « montre les actions de X », « qu’est-ce qui est en retard », création et mise à jour (fait / reporte / réassigne / remarque) d’une action référencée, toujours reformulées et soumises à confirmation explicite avant application. Entièrement local et déterministe, sans appel IA payant, conformément au principe d’escalade locale avant IA.
- Tournée atelier n’existe pas encore comme module dans `src/` (seulement dans `legacy-reference/`) ; seule l’origine correspondante a été ajoutée à la liste configurable, à la demande explicite de l’utilisateur — le module lui-même reste à construire.
- Validation : TypeScript, lint, build et 109 tests automatisés existants réussis. Aucun test dédié n’a été ajouté pour le nouveau regroupement (`action-grouping.ts`) ni pour l’interprète de commandes de la revue IA (`action-assistant-interpreter.ts`) ; la revue IA conversationnelle et la revue de réunion restent à recetter manuellement dans le navigateur.

### Conversation vocale mains libres et alignement visuel de la session mail — 19/07/2026

- Ajoute les réglages « Conversation mains libres » et « Envoyer automatiquement dès la fin de la transcription » dans Réglages → Mails → Voix. Le champ `continuousConversation` existait déjà dans le modèle de données et conditionnait déjà la ré-écoute automatique après chaque réponse, mais n’avait jamais eu de contrôle dans l’interface : impossible à activer, ce qui rendait la conversation vocale laborieuse (redéclenchement manuel du micro après chaque échange).
- Bascule ces deux réglages à `true` par défaut pour les nouvelles installations, afin qu’une conversation vocale mains libres (brief parlé → écoute → réponse parlée → écoute…) fonctionne dès le premier usage sans réglage préalable.
- Remplace le shell minimal et sombre (`MailSessionShell`, fond `#0b0e0d`, accents vert sarcelle `#1f5f49` et citron `#d8f567`) de `/mails/assistant` par le shell applicatif standard (menu latéral, en-tête) et la palette claire configurable partagés avec Mon Espace, Planning et le reste de l’application.
- Recolore l’intégralité des écrans de la session (veille « Morning Brief », travail actif, timeline d’exécution, fin de session) sur `var(--app-primary)`, `var(--app-background)`, `var(--app-border)` et `var(--app-text)`, y compris les mesures « déjà traité » ajoutées précédemment.
- Supprime `MailSessionShell`, devenu inutile, et met à jour les tests qui figeaient l’ancien shell et la palette sombre en dur.
- Validation : TypeScript, lint, build et 109 tests automatisés réussis ; vérification par capture d’écran de la veille, de la session active avec 20 décisions et des réglages vocaux, sans erreur console. Le rendu audio réel (Edge/Chrome) reste à valider manuellement par l’utilisateur.

### Correctif du brief vocal de la session mail — 19/07/2026

- Corrige le Morning Brief (`/mails/assistant`, écran de veille) : la lecture vocale automatique n’était en réalité câblée que dans une session déjà active (`MailAssistantWorkspace`), jamais sur l’écran de démarrage quotidien (`MailCommandCenterStandby`), qui ne parlait donc jamais malgré le réglage « Lire le brief à voix haute » activé par défaut.
- Ajoute deux mesures locales déterministes au brief (`processedTotal`, `noActionTotal`, calculées depuis la mémoire locale déjà chargée, sans appel réseau supplémentaire) afin que la voix annonce aussi les mails déjà traités et classés sans action, en plus des éléments en attente de validation ou de réponse.
- N’emploie jamais le terme « archivé » tant qu’aucune mutation Gmail réelle n’est confirmée : la gestion Mail (libellés Gmail) reste un système séparé, server-only, qui exige une confirmation explicite avant tout archivage ; le brief ne décrit que ce qui est réellement vérifiable localement.
- Validation : TypeScript, lint, build et 109 tests automatisés réussis (y compris les tests qui interdisent tout `fetch(`/appel IA dans le chemin de démarrage) ; vérification par navigateur headless que `speechSynthesis.speak` est bien appelé avec le texte du brief à l’ouverture de l’écran. La lecture audio réelle sur poste utilisateur (Edge/Chrome) reste à valider manuellement.

### Refonte visuelle forte — icônes et palette — 19/07/2026

- Remplacement du jeu de pictogrammes maison par `lucide-react` (MIT), avec conservation stricte des mêmes identifiants d’icône (`mail`, `calendar`, `factory`, etc.) pour ne pas invalider les choix d’icône déjà enregistrés dans Réglages.
- Rafraîchissement de la palette par défaut (accent indigo `#4f46e5`, menu latéral `#0f172a`) dans `default-settings.ts` et `globals.css`, sans modifier le mécanisme de personnalisation : toute entreprise garde la main sur ses couleurs depuis Réglages → Identité.
- Redesign des cartes de Mon Espace : badge d’icône teinté (fond pastel dérivé de la couleur de la carte) au lieu d’un aplat saturé, hiérarchie et survol plus soignés.
- Harmonisation du Centre de réglages (onglets de catégories et de personnalisation) avec la nouvelle couleur d’accent.
- Validation : TypeScript, lint, build et 109 tests automatisés réussis ; vérification visuelle par capture d’écran sur 10 pages (Mon Espace, Réglages, Parc Machines, Planning, Qualité ERP, Réunions, Actions, Analyses, OF, Suivi) en desktop et mobile, sans erreur console.

### Modernisation des fondations visuelles — 19/07/2026

- Remplacement de la police système codée en dur (Arial) par la police Geist déjà chargée, avec repli système.
- Ajout de jetons d’ombre, de rayon et de transition dans `globals.css`, sans modifier les couleurs configurables (`--app-primary`, `--app-secondary`, etc.) qui restent pilotées depuis Réglages → Identité.
- Rafraîchissement de l’AppShell : dégradé de profondeur sur la barre latérale, état actif de navigation plus lisible, en-tête avec ombre et flou, focus des champs et boutons plus visibles.
- Harmonisation des primitives partagées (`ModuleUi`, `SettingsUi`) : boutons, champs, pastilles de statut et panneaux avec ombres et anneaux de focus cohérents sur tous les modules.
- Validation : TypeScript, lint, build et 109 tests automatisés réussis ; vérification visuelle par capture d’écran sur Mon Espace, Réglages et un viewport mobile, sans erreur console.

### Fiabilisation du module Mail — 19/07/2026

- Synchronisation de toutes les pages de `INBOX` sans filtre temporel, comparaison au total Gmail, mesure de durée et cache serveur de 60 secondes invalidé après mutation.
- Ajout de `/mails/diagnostic` pour OAuth, Gmail, volumes, synchronisation, erreurs, OpenAI, quota et capacités audio du navigateur, sans secret ni contenu de mail.
- Suppression du statut Plaud fantôme : aucun connecteur, jeton ou session Plaud n’existe ; un périphérique homonyme reste signalé comme simple matériel local.
- Conversation OpenAI multi-tour explicitement déclenchée, sessions serveur partagées entre bundles Next, budgets conservés et annulation de la requête active.
- Ajout des préférences **Réponse écrite** et **Réponse vocale**, du repli texte sur erreur TTS et suppression de 960 ms de délais artificiels par commande.
- Validation locale : 87 messages Gmail détectés et 87 synchronisés, cache chaud en 52–76 ms, conversation réelle sur deux tours, TypeScript, lint et 109 tests automatisés réussis.
- Les tests matériels Edge/Chrome et les captures restent à réaliser manuellement, le navigateur intégré n’étant pas disponible pendant cette validation.

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
## [Fondation de synchronisation ERP] — 22/07/2026

### Ajouté

- `OperationIdentityService`, seule autorité de construction des identités métier stables et des identifiants d'occurrence.
- `SynchronizationService` pour mettre à jour les données ERP, créer les nouvelles opérations et conserver les opérations retirées avec le statut `Removed`.
- Entité `PlanningDecision` indépendante avec priorité, ordre manuel, machine planifiée, commentaire, visibilité, verrouillage et horodatages.
- Rapports durables : nouveaux OF, nouvelles opérations, mises à jour, retraits, décisions préservées, décisions perdues et durée.

### Corrigé

- Un import quotidien ne remplace plus aveuglément toutes les opérations ; les retraits restent auditables et les décisions demeurent dans leur journal séparé.
- Le Planning courant ignore les opérations retirées tout en les conservant dans la projection commune des futurs modules.
## [Modèle métier OperationView] — 22/07/2026

### Ajouté

- Contrat `OperationView` commun aux futurs consommateurs métier.
- `OperationViewService`, unique responsable de la fusion entre opérations ERP, décisions Planning, OF et correspondances machines.
- Indicateurs `hasPlannedMachine`, `hasUserPriority`, `hasComment`, `hasManualOrder`, `isRemoved`, `isVisible` et `isWithoutMachine`.
- Propriétés futures non calculées pour retard, démarrage, fin, blocage, dates estimées et groupe de capacité.

### Modifié

- Le Planning et ses regroupements consomment désormais `OperationView` et ne réalisent plus la fusion ERP/décisions.
- Les opérations retirées restent consultables dans la projection métier mais sont exclues du Planning actif.
## [Vues de travail et FilterEngine] — 22/07/2026

### Ajouté

- `FilterEngine` pur et réutilisable pour Planning, ERP Explorer, Dashboard et futurs outils IA.
- `PlanningFilters` centralisé avec recherche, clients, production, priorités, statuts ERP et états techniques.
- Panneau latéral de filtres dynamiques, multisélection, catégories repliables, compteur et remise à zéro.
- Chargement unique des `OperationView`, filtrage et pagination instantanés en mémoire.

### Modifié

- Les vues personnelles passent en version 2 et restaurent automatiquement leurs filtres après redémarrage.
- Les statuts proposés proviennent exclusivement de `IDOperation_Status` et `Status` présents dans l'ERP.
## [Correctif du bouton d'import ERP] — 22/07/2026

### Corrigé

- Le bouton « Contrôler et importer » n'est plus désactivé avant la sélection des fichiers.
- Le clic ouvre désormais immédiatement le sélecteur natif limité aux fichiers `.xlsx` et autorisant la sélection multiple.
- Les fichiers sélectionnés sont transmis à l'import, tandis que l'annulation reste sans effet.
- La valeur de l'input est remise à zéro après lecture pour permettre de sélectionner à nouveau les mêmes fichiers.
- Les échecs POST restent affichés en français et produisent un journal console concis.

## [Correctif du profil machine Details] — 22/07/2026

### Corrigé

- `CODE_MACH_INT` et `DESCRIPTION_MACHINE` sont désormais des colonnes optionnelles autorisées du profil `REQ_MacroGamme_Details.xlsx`.
- Le code machine ERP et sa description sont projetés sans doublon dans `ErpOperation`, puis exposés par `OperationView` ; les cellules vides deviennent `null`.
- Les en-têtes sont comparés après normalisation sûre de la casse, des espaces, du BOM et des caractères invisibles, tandis que toute colonne réellement inconnue reste refusée.
- L'import réel du 22/07/2026 a été accepté en HTTP 201 avec 3 037 OF et 23 935 opérations.

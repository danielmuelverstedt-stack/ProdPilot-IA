# Audit des référentiels uniques — 09/08/2026

## Décision structurante proposée

L’application possède déjà plusieurs relations correctes par identifiant, mais elle conserve aussi deux familles de données concurrentes : les données de démonstration (`DemoData`) et les réglages/imports ERP. La migration doit être progressive. Aucun champ historique ne doit être supprimé avant création de la relation, migration, contrôle d’intégrité et recette des écrans consommateurs.

## Cartographie actuelle

| Domaine consommateur | Donnée utilisée | Source actuelle | Duplication ou risque | Source de vérité cible |
| --- | --- | --- | --- | --- |
| Contacts | identité, coordonnées | `DemoData.contacts` | `ProductionAction.responsable`, `TeamMember.name`, `MaintenanceEvent.responsible`, demandes et qualité stockent encore des noms libres | Contacts, référencé par `contactId` |
| Actions | responsable | `responsableContactId` + texte `responsable` + ancien `responsableId` | trois identités possibles pour une même personne | `responsableContactId`; texte libre uniquement pour un responsable externe non référencé pendant la transition |
| Réunions | participants et responsable | `contactId` / `responsableContactId` | modèle principal déjà correct; les versions envoyées contiennent volontairement emails et texte | Contacts en direct; snapshot explicite uniquement dans les versions envoyées |
| Machines | identité et organisation | `settings.production.machines` | `DemoData.machines` recopie nom, département, type et données techniques; certaines vues affichent encore l’ID faute de résolution | Parc Machines (`MachineSettings`) |
| Maintenance | machine | `machineId` | relation principale correcte; `MaintenanceEvent.responsible` reste un nom libre | Parc Machines + Contacts pour le responsable |
| Planning | machine et département | `machineId`, `departmentId`, projections ERP | relation machine globalement correcte; `OperationView.machine`, `department` et descriptions sont des projections d’affichage | Parc Machines et Départements; projections calculées, jamais éditées comme référentiels |
| Catégories / départements / halls | structure atelier | Réglages Production | coexistence de `department`, `departmentId`, `taskCategoryCode` et catégories ERP, avec des sens différents | Départements/halls dans Réglages; dictionnaire de catégories de tâche séparé et explicitement typé |
| OF réels | identité et données importées | projection ERP (`ErpWorkOrder`) | `DemoData.workOrders` constitue un second registre de démonstration; réunions et actions utilisent déjà souvent des IDs | projection ERP comme maître en exploitation; données locales limitées aux décisions/commentaires |
| Clients | nom client | chaîne dans les OF ERP et OF de démonstration | aucun `clientId`; dossiers prioritaires de type client utilisent une valeur canonique texte | futur référentiel Clients avec résolution d’import et `clientId` |
| Fournisseurs | fournisseur de consommable / SAV | chaînes dans `MachineConsumable` et données SAV | aucun référentiel Fournisseurs autonome | futur référentiel Fournisseurs avec `supplierId` |
| Dossiers prioritaires | OF, machine, client, projet | `referenceKind` + `referenceId` | OF et machine sont bien référencés; client/projet restent des chaînes faute de registre propriétaire | `ofId`, `machineId`, futur `clientId`; projet à définir avant migration |
| Imports | OF, client, machine, article | objets ERP + mapping machine | OF et articles sont cohérents dans une projection; client reste un nom, machine conserve aussi libellés source nécessaires à l’audit d’import | IDs internes résolus, avec valeurs ERP source conservées comme preuve d’import |

## Copies légitimes à conserver

- Les corps de comptes rendus et d’e-mails déjà envoyés sont des snapshots documentaires immuables.
- Les valeurs brutes d’un import ERP doivent rester disponibles pour l’audit et le diagnostic, sans devenir la donnée affichée prioritaire après résolution.
- Les entrées d’historique et commentaires conservent leur auteur affiché si aucune authentification/référence utilisateur durable n’existait au moment de leur création.
- Les données strictement contextuelles — notes de réunion, décisions, statut et échéance d’action, description/résolution maintenance — restent propriétaires de leur module.

## Doublons prioritaires

1. **Machines** : fusionner progressivement `DemoData.machines` dans `MachineSettings` ou dans une fiche technique rattachée au même `machineId`. C’est le doublon le plus visible.
2. **Responsables** : faire de `responsableContactId` la référence normale des Actions, Maintenance, demandes et qualité; maintenir temporairement le texte libre comme compatibilité.
3. **OF** : isoler clairement le mode démonstration et faire de la projection ERP le registre unique en exploitation.
4. **Clients et fournisseurs** : créer leurs référentiels seulement avec une stratégie de dédoublonnage d’import validée.
5. **Catégories** : documenter et séparer les notions de département physique, catégorie de tâche et code ERP; ne pas les fusionner uniquement parce que leurs libellés se ressemblent.

## Composants à mutualiser progressivement

- `ContactPickerDialog` doit devenir le sélecteur de contact partagé, avec un contrat utilisable dans Actions, Réunions et Maintenance.
- Les sélecteurs de machines aujourd’hui présents dans le Planning, la Maintenance et les liens d’Actions doivent converger vers un `MachineSelector` commun alimenté par `MachineSettings`.
- Un `WorkOrderSelector` commun doit résoudre les OF depuis la projection active, avec un repli de démonstration explicite.
- Les cartes complètes ne doivent pas être uniformisées artificiellement. Une petite primitive d’identité (`MachineIdentity`, `ContactIdentity`, `WorkOrderIdentity`) est préférable, puis chaque module conserve ses informations contextuelles.

## Migration sécurisée proposée

### Lot 1 — couche de résolution sans suppression

- Créer des résolveurs centraux en lecture seule pour Contact, Machine et OF.
- Faire migrer les affichages vers ces résolveurs tout en conservant les champs historiques.
- Ajouter des contrôles d’intégrité pour les références manquantes et des libellés explicites « supprimé/introuvable ».

### Lot 2 — relations Contacts

- Généraliser `contactId` aux responsables encore enregistrés par nom.
- Migrer par correspondance exacte contrôlée; laisser les cas ambigus en texte libre et produire un rapport.
- Ajouter l’analyse d’impact avant désactivation/suppression.

### Lot 3 — machine unique

- Rattacher les informations techniques de `DemoData.machines` au registre `MachineSettings` par `machineId`.
- Basculer Planning, Maintenance, Réunions, Actions et statistiques sur ce registre.
- Retirer les champs machine dupliqués uniquement après validation des photos, fiches techniques et historiques.

### Lot 4 — OF unique

- Définir officiellement le comportement démonstration versus exploitation ERP.
- Faire pointer dossiers prioritaires, réunions et actions vers `ofId`, puis résoudre l’affichage depuis la projection active.
- Conserver les données brutes importées et les décisions Planning dans leurs couches distinctes.

### Lot 5 — Clients et fournisseurs

- Introduire des IDs stables, une normalisation et un écran de résolution des doublons.
- Ne jamais fusionner automatiquement deux sociétés sur le seul nom approchant.

### Lot 6 — suppressions et nettoyage

- Ajouter un service d’analyse des relations avant désactivation/suppression.
- Retirer les champs copiés devenus inutiles par petites migrations versionnées.
- Vérifier chaque lot avec TypeScript, lint, tests ciblés, suite complète, build et recette visuelle.

## Règles d’intégrité

- Toute nouvelle relation métier utilise un ID stable et une contrainte applicative vérifiable.
- Aucun composant consommateur ne modifie directement un référentiel dont il n’est pas propriétaire.
- Une référence supprimée reste affichable dans l’historique avec un état explicite; elle n’est jamais silencieusement effacée.
- Un snapshot doit être nommé comme tel, horodaté et immuable après envoi/clôture.
- Les projections (`OperationView`, documents, métriques) sont recalculables et ne deviennent jamais des registres concurrents.

## Point nécessitant confirmation

Cette migration modifie les contrats centraux de Contacts, Machines, Actions, Maintenance et OF. Conformément aux règles du projet, le développement doit commencer uniquement après confirmation explicite du plan par lots. Le lot recommandé pour démarrer est le **Lot 1 — couche de résolution sans suppression**, car il réduit immédiatement les incohérences sans migration destructive.

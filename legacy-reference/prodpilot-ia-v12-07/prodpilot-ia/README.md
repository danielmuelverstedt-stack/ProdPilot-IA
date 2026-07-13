# ProdPilot IA — Prototype web (HTML / CSS / JavaScript)

Plateforme de pilotage de production pour atelier de mécanique de précision
(environnement EN 9100). Prototype autonome, sans installation ni serveur.

## Ouvrir le projet

**Pour l'utiliser :** double-cliquer sur `index.html` — il s'ouvre dans le
navigateur (Chrome, Edge, Firefox). Une connexion internet est nécessaire au
premier chargement pour la librairie de graphiques (Chart.js, via CDN).

**Pour le modifier :** ouvrir le dossier dans Visual Studio Code.
Avec l'extension « Live Server », la page se recharge à chaque modification.

## Structure du projet

```
prodpilot-ia/
├── index.html        Structure de la page (sidebar, topbar, panneau IA)
├── README.md         Ce fichier (documentation — ne pas renommer en index.html !)
├── css/
│   └── style.css     Tout le design (couleurs, cartes, planning, impression)
└── js/
    ├── data.js       Données de démonstration : machines, OF, planning
    └── app.js        Logique : navigation, modules, drag & drop, imports
```

## Corrections du 09/07/2026 (stabilisation)

- **Bug bloquant corrigé** : le module « Import société » avait redéfini la
  fonction `parseMachineLines`, écrasant celle utilisée par `getMachines()`.
  Résultat : liste machines vide → planning cassé, calculs de charge en erreur.
  La fonction d'import a été renommée `parseImportedMachineText`.
- 4 fonctions dupliquées (`getSettings`, `updateSetting`, `renderSettings`,
  `addMachineFromSettings`) : les anciennes versions ont été neutralisées
  (suffixe `_legacy`) pour éviter toute future collision.
- `index.html` reconstruit (il avait été écrasé par le README sur le disque).

## Nouveautés du 12/07/2026 — 🏠 Mon Espace (remplace le Tableau de bord)

- **Mon espace devient la page principale** : « Bonjour Daniel 👋 », date,
  heure (mise à jour automatique), **message IA du jour** généré à partir des
  données réelles (OF critiques, demandes, maintenance en retard).
- **Étapes de travail en grandes cartes** : Mails (démo — connexion Outlook
  en phase 2), Actions ouvertes, Planning, QRQC, Réunion Production,
  Parc Machines, Centre de demandes. Chaque carte : icône, résumé 3 lignes
  calculé en direct, compteur, état cliquable **Non commencé → En cours →
  ✔ Terminé** (réinitialisé chaque jour), bouton **Ouvrir** (le QRQC démarre
  directement la réunion). Aucun ordre imposé.
- **Zone de notifications** : nouvelles demandes, maintenance aujourd'hui /
  en retard, machines à l'arrêt, mail urgent, « QRQC dans 30 minutes ».
- **Assistant IA en bas de page** : grand champ de conversation + raccourcis
  (« Prépare le QRQC », « Montre mes actions », « Créer une action »…), avec
  le contexte complet de la journée.
- **Réglages → Mon espace** : routines multiples (Responsable Production,
  Maintenance, Direction, Atelier + création libre), étapes personnalisables
  (ajouter, supprimer, masquer, renommer, icône, couleur, taille, cible,
  ordre ↑↓). **Chaque profil mémorise sa routine active** (sélecteur en haut
  de la page et via le profil actif de la barre latérale).
- **Tableau de bord supprimé** du menu ; son ancienne route redirige vers
  Mon espace (le code de rendu reste dans app.js, inactif, si besoin de
  récupérer un élément). La page « Accueil » (command center) est conservée
  et peut être masquée dans Réglages → Interface si redondante.

## Nouveautés du 11/07/2026 — Module Parc Machines

- **🏭 Parc machines** (nouveau menu) avec 4 sous-onglets :
  *Vue atelier* (cartes machines avec photo et état 🟢 Disponible /
  🔵 En production / 🟠 Maintenance prévue / 🔴 En panne — états dérivés
  automatiquement du planning et des interventions),
  *Machines* (liste avec constructeur, prochaine maintenance, nb documents),
  *Planning maintenance* (interventions : type, date, durée, responsable,
  état — une intervention « Terminée » bascule automatiquement dans
  l'historique ; bouton « 📅 → Planning » pour poser le bloc maintenance
  dans le planning production), *Documents* (import PDF / notices / schémas /
  photos / vidéos par machine).
- **Fiche machine** : photo (partagée avec la Tournée atelier), constructeur,
  modèle, année, n° de série, robot associé, commentaires — tout est
  modifiable et conservé dans le navigateur (localStorage) ; bouton
  « Déclarer en panne / Remettre en service » ; photos supplémentaires.
- **Alertes accueil** : bandeau orange si une maintenance est prévue
  aujourd'hui, bandeau rouge si une maintenance est en retard (clic →
  planning maintenance).
- **Liaison planning ↔ maintenance** : quand un OF est posé sur une machine
  (bouton « + » ou glisser-déposer) alors qu'une maintenance est prévue ce
  jour-là, une fenêtre prévient (« Attention, une maintenance est prévue sur
  cette machine pendant cette période ») et propose « Continuer quand même »
  ou « Choisir une autre machine ».
- **Réglages → Production → Machines** : bouton « 🏭 Fiche parc & documents »
  par machine (l'ajout/modification/suppression, l'import Excel et la photo
  existaient déjà). Volontairement pas une GMAO : uniquement l'aide à la
  décision planning.

## Nouveautés du 10/07/2026

- **Tâches hors OF dans le planning** — bouton « 🔧 Maintenance / tâche libre »
  dans la barre du planning (et dans le « + » de chaque case) : maintenance,
  réparations, divers. Couleurs dédiées (violet = maintenance, vert-canard =
  divers), déplaçables au drag & drop, comptées dans la charge machine,
  présentes sur les fiches imprimables.
- **Onglet « Maintenance machine » dans le Centre de demandes** — création de
  demandes de maintenance (machine, type, priorité, description), circuit
  d'approbation habituel, puis bouton « 📅 Planifier » qui pose la tâche dans
  le planning et passe la demande au statut « Planifiée ».
- **Fenêtre de création d'action partout** — toute création d'action
  (réunions QRQC/production, tour des services, projets critiques, page
  Actions via « ＋ Nouvelle action ») ouvre une fenêtre : type d'action
  (Qualité, Outillage, Maintenance…), description libre, responsable
  (suggestions automatiques), échéance, priorité. Le type s'affiche en badge
  dans les listes. Plus aucune action créée « à l'aveugle ».

## Nouveautés du 09/07/2026

- **Import ERP des OF** — Réglages → Import société → carte « 4. Import ERP » :
  import par fichier CSV/TXT ou copier-coller.
  Colonnes : `Num ; Client ; Article ; Désignation ; Qté ; Échéance ; Statut ; Priorité ; Commande`.
  Deux modes : *ajouter / mettre à jour* (fusion par n° d'OF, sans écraser la
  gamme ni le planning existants) ou *remplacer tout*. Modèle CSV téléchargeable.
  Raccourci « 📥 Import ERP » dans la liste des OF.
- **Planning imprimable global** — bouton « Imprimer tout » dans la barre du
  planning : génère les fiches A4 de toutes les machines ayant des opérations
  planifiées, une page par machine (saut de page automatique).
- **Centre de demandes** — le module Demandes devient un vrai centre :
  compteurs (en attente / approuvées / refusées), filtres par statut et type,
  et bouton « ＋ Nouvelle demande » (type, OF concerné, priorité, demandeur,
  justification) qui alimente le circuit d'approbation.

## Modules

- **Accueil** — briefing quotidien, checklist, commandes IA
- **Tableau de bord** — priorités du jour, KPI, charge, OF à risque
- **Tournée atelier** — saisie état machines, Pareto des causes d'arrêt, historique
- **Ordres de fabrication** — liste filtrable + fiche OF + import ERP
- **Planning machines** — S28→S31, drag & drop, multi-OF par jour,
  fiche machine imprimable + impression globale
- **Centre de demandes** — création + circuit d'approbation
- **Actions** — plan d'actions lié aux OF
- **KPI & analyses** — OTD, taux d'occupation, Pareto
- **Qualité données ERP** — 15 règles de contrôle, score, e-mails d'alerte
- **Réunions** — QRQC du matin guidé en 5 étapes + Réunion de production
- **Réglages** — centre de configuration complet (identité, machines,
  templates, rôles, import société)

## Points d'attention

- **Pas de sauvegarde des données** : OF, planning, demandes et actions vivent
  en mémoire et se réinitialisent au rechargement. Seuls les **Réglages**
  (machines, templates, logo…) sont conservés dans le navigateur (localStorage).
  La persistance des données de production est l'étape suivante du projet.
- **Assistant IA** : l'appel API fonctionne dans l'environnement Claude.
  En local, brancher une clé côté serveur (jamais dans le JavaScript).

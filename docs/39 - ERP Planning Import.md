# Planning ERP — import Top / Details

## Périmètre livré

Cette première phase ajoute un cockpit opérationnel immédiatement exploitable sans temps de fabrication. Elle ne remplace pas le Planning de capacité historique, accessible depuis la vue « Planning capacité », et n’écrit jamais dans l’ERP.

Les exports reconnus sont exclusivement :

- `REQ_MacroGamme_Top.xlsx` : 19 colonnes attendues ;
- `REQ_MacroGamme_Details.xlsx` : 14 colonnes attendues.

Le profil exact se trouve dans `src/features/erp-import/config/macro-range-profile.ts`. Un nom, une colonne, une signature XLSX ou une taille non conforme bloque l’import avec un message visible.

## Flux

```text
Deux fichiers XLSX
  → contrôle nom / taille / signature / colonnes
  → empreintes SHA-256 et refus d’un couple déjà importé
  → copie source immuable dans .local-data/erp-imports/<import-id>/
  → parsing et normalisation typée
  → rapprochement Top → Num_OF → opérations Details
  → projection active locale
  → cockpit, qualité, parc machines

Ajustements utilisateur ───────────────→ registre séparé conservé entre imports
Correspondances machine ERP → machine ─→ registre séparé réutilisé entre imports
```

Les ajustements ne sont plus seulement un état final : ils sont migrés dans le journal durable décrit dans `docs/41 - Durable User Decisions.md`. Chaque nouvel import produit une réconciliation explicite sans suppression des décisions absentes ou ambiguës.

## Modèle métier commun OperationView

Les modules fonctionnels ne fusionnent plus eux-mêmes les données ERP et les décisions du planificateur. `OperationViewService` constitue l'unique frontière de lecture :

```text
ERP Operation + PlanningDecision → OperationView → Planning / IA / Dashboard / ERP Explorer
```

Il applique les replis de machine, priorité et visibilité, expose le commentaire et l'ordre manuel, et prépare les indicateurs communs. Les opérations `Removed` restent présentes avec `isRemoved = true`, mais sont exclues de la liste active par le service Planning. Les champs futurs de retard, démarrage, fin, blocage, dates estimées et groupe de capacité existent avec la valeur `null` tant que leurs règles métier ne sont pas validées.

## Moteur de vues de travail

Le navigateur charge une seule fois les `OperationView` du plan de travail puis applique localement le service pur `FilterEngine`. La recherche, les combinaisons de filtres, le changement de vue et la pagination n'entraînent donc aucun nouvel appel réseau. Les composants React transmettent uniquement `OperationView[]` et `PlanningFilters` au moteur.

Les options client, machine, département, groupe de ressources, priorités et statuts sont extraites des données présentes. Aucune valeur métier n'est codée en dur. Une dimension sans source, notamment le département lorsque l'export et les correspondances ne le fournissent pas, reste vide et est signalée comme indisponible dans le panneau.

Les vues de travail sont versionnées et enregistrées automatiquement dans le dépôt navigateur existant, isolé par entreprise, site et utilisateur. La version 2 migre les anciennes vues sans perdre leurs colonnes ni leur recherche.

### Mesure du FilterEngine — 22/07/2026

Mesure Node après 20 échauffements et sur 100 applications combinant recherche, priorités ERP et statuts bruts, à partir de la projection locale réelle :

- 23 558 `OperationView` ;
- moyenne : 2,97 ms ;
- médiane : 2,90 ms ;
- 95e percentile : 3,61 ms ;
- génération initiale des options dynamiques : 16,57 ms ;
- 65 clients et 15 codes machines détectés.

Le coût linéaire est adapté au volume actuel. Avant plusieurs centaines de milliers d'opérations, prévoir un index de recherche normalisé, des ensembles précompilés par facette, une exécution dans un Web Worker et une virtualisation des lignes. Le chargement initial de toute la projection dans le navigateur devra alors être remplacé par un dépôt indexé ou un protocole incrémental, sans déplacer les règles hors de `FilterEngine`.

Les copies sources, la projection active, les ajustements et les correspondances utilisent des fichiers distincts. Les écritures JSON sont sérialisées et remplacées atomiquement. Les classeurs archivés sont créés avec l’option exclusive `wx` afin de ne jamais remplacer une source existante.

## Résultat observé sur les fichiers fournis

- 3 284 lignes Top, regroupées en 3 004 OF uniques ; les OF à plusieurs lignes conservent toutes leurs lignes de commande ;
- 23 558 lignes Details ;
- 22 892 opérations reliées à un OF Top ;
- 666 opérations orphelines, conservées et signalées ;
- 190 OF Top sans opération ;
- 5 789 répétitions de lignes Details strictement identiques, conservées dans la source et signalées comme doublons ;
- 15 codes distincts dans `Macro_Gamme_Pe` (`0` à `14`) ;
- `Macro_Gamme` vaut `0` sur toutes les lignes et est donc signalé comme non renseigné.

`Macro_Gamme_Pe` est utilisé comme code de correspondance machine parce qu’il est le seul champ de l’export présentant une distribution de codes machines possible. Cette sémantique doit encore être confirmée par le propriétaire ERP avant de considérer les correspondances comme définitives.

## Statuts

L’export contient seulement `IDOperation_Status` avec les codes `1` à `5`, sans table de libellés. ProdPilot n’invente pas leur signification :

- une date de fin réelle donne le statut « Terminée » ;
- une date de début réelle sans fin donne « En cours » ;
- les autres lignes restent « À qualifier » jusqu’à confirmation du dictionnaire ERP ou ajustement manuel.

Le code ERP brut reste visible et conservé. Un futur registre de correspondance des statuts pourra être ajouté sans modifier le modèle d’import.

## Dates, retard et priorité

Le retard est calculé en jours calendaires par `aujourd’hui - date demandée`. En l’absence de date demandée, le délai de l’opération puis la date confirmée servent uniquement de repli visible. Le Planning ne consomme aucun temps de réglage, temps pièce ou capacité dans cette vue.

Le score de vigilance initial est transparent et borné :

- retard : jusqu’à 50 points ;
- priorité ERP ou priorité locale : jusqu’à 25 points ;
- opération commencée : 10 points ;
- sous-traitance : 5 points ;
- anomalies de qualité : jusqu’à 10 points.

Les facteurs client important, blocage assemblage, qualité produit et commande urgente ne sont pas calculés tant que les sources correspondantes n’existent pas. Ils pourront être ajoutés au service de priorité sans changer les composants.

## Machines

Les machines des Réglages restent le référentiel central. Elles disposent maintenant des champs facultatifs code ERP, favorite, supprimée, capacité future et commentaires. Une suppression devient logique : la machine reste dans l’historique et ses affectations peuvent être détectées.

Deux affectations sont possibles :

- ajustement d’une seule opération, conservé dans `erp-planning-overrides.json` ;
- correspondance confirmée d’un code ERP vers une machine ProdPilot, conservée dans `erp-machine-mappings.json` et réutilisée aux imports futurs.

Les codes ERP sont normalisés avant toute recherche ou écriture : suppression des caractères invisibles et du BOM, espaces externes retirés, espaces multiples regroupés et casse convertie en majuscules. Les tirets et autres caractères significatifs sont conservés. Les anciens mappings restent lisibles grâce à la normalisation du registre au chargement.

Un code ERP non mappé n’est jamais utilisé comme `MachineSettings.id` : l’opération conserve `sourceMachineCode` et `sourceMachineDescription`, mais expose `machineId = null` et « Non définie ». L’interface existante permet de rechercher les codes, filtrer les non-mappés, associer, modifier ou supprimer une correspondance et distingue les machines actives, inactives, supprimées ou absentes.

L’audit des identifiants actuels et la future numérotation métier sont documentés dans `docs/43 - ERP Machine Identifier Migration.md`. Aucun identifiant technique existant n’est modifié automatiquement.

### Source de vérité des états machines

`MachineSettings` est l’unique propriétaire de `active` et `visible`. Ces états sont modifiables depuis la fiche machine et consommés par le Planning, l’ERP et le parc machines. `ErpMachineMapping` est limité à `erpMachineCode`, `machineId` et `updatedAt` : le module ERP affiche le nom, le statut et la visibilité en lecture seule et renvoie vers la fiche machine pour toute modification.

Au premier chargement, les anciens champs ERP `status`, `active`, `visible` ou `hidden` sont appliqués aux fiches machines connues et sauvegardés dans les réglages. Le nettoyage du mapping n’a lieu qu’après cette sauvegarde ; les états visant une machine absente restent en attente. Les imports, opérations et historiques ne sont jamais modifiés par cette migration.

Les codes vides, `0`, non mappés, mappés vers une machine absente ou supprimée apparaissent dans « OF sans machine ». Le glisser-déposer et la liste déroulante aboutissent au même ajustement local.

## Qualité ERP

Le tableau de bord contrôle notamment les machines, délais, priorités à zéro, codes tâche, macro gamme, client, article, référence, opérations orphelines, OF sans opération, doublons, dates incohérentes, quantités zéro ou 9999, articles incohérents et statuts non qualifiés. Les anomalies portant sur un OF sont dédupliquées par OF ; celles portant sur une opération sont comptées par opération.

Le score qualité est un indicateur de vigilance de la projection active, pas une preuve de conformité ERP. Toute correction reste locale et aucune correction silencieuse n’est appliquée à la source.

## Routes locales

- `GET/POST /api/erp/imports` : vue synthétique et import multipart ;
- `GET /api/erp/planning` : recherche, filtres, tris et pagination serveur ;
- `PATCH /api/erp/operations/[id]` : ajustement local d’une opération ;
- `GET/POST /api/erp/machine-mappings` : registre de correspondance.

Les mutations exigent une origine identique. Avant un déploiement partagé, ces routes doivent aussi recevoir une authentification applicative, une autorisation serveur, un contexte d’entreprise et un stockage chiffré multi-tenant.

## Vues personnelles et articles identiques

Le cockpit permet désormais à l’utilisateur local actif d’enregistrer plusieurs vues. Une vue conserve l’ordre, la largeur, la visibilité et le figement des colonnes, ainsi que le regroupement, le tri, les filtres et le zoom. Les changements d’affichage sont immédiats et n’entraînent aucune requête ERP ; la sauvegarde automatique passe par un dépôt navigateur versionné, isolé par entreprise locale, site et utilisateur.

Cette persistance est une infrastructure locale de transition. Elle devra être remplacée par un dépôt serveur authentifié pour synchroniser plusieurs appareils et garantir l’isolation multi-tenant en production.

Le moteur déterministe d’articles identiques normalise l’identifiant article, compte les OF distincts et ignore le nombre d’opérations d’un même OF. Le compteur global, le badge et les filtres « plusieurs OF » et « OF unique » reposent sur toute la projection active. Les regroupements visuels portent sur la page chargée, actuellement limitée à 100 opérations ; ils ne prétendent pas matérialiser les 500 000 opérations dans React.

La projection et ses lignes dérivées sont conservées en mémoire par le processus local, puis invalidées après un nouvel import, un ajustement ou une correspondance machine. Ce cache réduit les relectures du JSON mais n’est pas une persistance multi-instance : le futur dépôt indexé reste nécessaire avant tout déploiement partagé.

Les regroupements proposés correspondent uniquement aux données réellement disponibles : article, OF, machine, atelier, client, famille d’article, priorité, statut et date. Aucun taux d’économie ni caractère « regroupable » n’est inventé sans règle métier validée. Le déplacement groupé et les recommandations IA restent des phases ultérieures soumises à confirmation humaine.

### Mesures du 19/07/2026

Sur la projection locale de 23 558 opérations brutes :

- l’analyse déterministe des articles prend 2,7 ms en médiane ;
- une réponse de 100 lignes passe de 147 191 à 84 961 octets grâce au résumé d’OF, soit 42 % de moins ;
- les requêtes chaudes mesurées avec `Invoke-WebRequest` passent d’environ 139–161 ms à 71–78 ms ;
- dix requêtes successives culminent à environ 321 Mo au lieu de 553 Mo, puis le processus se stabilise autour de 263 Mo au lieu de 238 Mo avant cache ;
- la première requête après démarrage reste coûteuse, environ 1,2 s, car elle charge et dérive la projection complète.

Le cache échange donc environ 25 Mo de mémoire résidente supplémentaire contre une baisse importante des allocations répétées et de la latence chaude. La première requête et l’objectif de 500 000 opérations nécessitent toujours un dépôt indexé ; ce cache local ne les résout pas.

## Open source

`read-excel-file@9.3.2` (MIT) est la seule dépendance ajoutée. ExcelJS, React Data Grid, dnd-kit et SVAR Gantt ont été évalués mais non ajoutés. ERPNext (GPL-3.0) et OpenMES (AGPL-3.0) ont servi uniquement à la comparaison fonctionnelle ; aucun code n’a été repris. Les révisions et licences sont consignées dans `THIRD_PARTY_NOTICES.md`.

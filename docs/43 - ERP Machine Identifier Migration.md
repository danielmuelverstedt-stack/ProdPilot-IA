# Identifiants machines et correspondances ERP

## Source de vérité actuelle

La chaîne autorisée reste unique :

```text
CODE_MACH_INT ERP → ErpMachineMapping → MachineSettings.id
```

`MachineSettings.id` est l’identifiant technique interne. `ErpMachineMapping` est le seul registre de correspondance des codes ERP. Aucun alias parallèle n’est introduit et une machine inconnue n’est jamais créée automatiquement.

## Audit des dépendances à `MachineSettings.id`

Les identifiants actuels (`TOU-01`, `FRA-01`, `FIL-01`, etc.) sont utilisés comme clés ou références dans :

- le Planning : affectations d’opérations, blocs, filtres, glisser-déposer, impression et calcul de charge ;
- les capacités : `CapacitySettings.targetId` lorsque la portée est `machine` ;
- la maintenance : événements et conflits par `machineId` ;
- les actions et demandes : liens de contexte vers une machine ;
- les décisions ERP : `PlanningDecision.plannedMachineId` et anciens ajustements ;
- les correspondances ERP : `ErpMachineMapping.machineId` ;
- les données de démonstration : OF, Planning, maintenance et demandes ;
- les réglages sauvegardés dans `localStorage` sous `prodpilot.settings` ;
- les données de démonstration sauvegardées et migrées côté navigateur.

Un remplacement direct par `M01`, `M02`, etc. casserait donc des relations existantes ou créerait des références orphelines. Aucun identifiant actuel ne doit être modifié sans migration transactionnelle de toutes ces sources, vérification des collisions, sauvegarde, rapport de réconciliation et procédure de retour arrière.

## Numérotation métier future

Cette table documente la numérotation souhaitée. Elle ne modifie ni `MachineSettings.id`, ni les données sauvegardées, ni les mappings ERP actuels.

| Identifiant actuel | Numéro métier futur | Désignation |
|---|---:|---|
| TOU-01 | M01 | MAZAK INTEGREX 300 |
| TOU-02 | M02 | Mazak 200MSY |
| TOU-03 | M03 | GRAZIANO GT300 |
| TOU-04 | M08 | MAZAK INTEGREX 150 |
| TOU-05 | M04 | OKUMA LB15 II-C |
| TOU-06 | M05 | Tour CNC HYUNDAI-KIA SKT 250 |
| TOU-07 | M06 | OKUMA LB25 II-C |
| TOU-08 | M07 | Mazak Quick Turn Smart 350 |
| TOU-09 | 99 | TOUR trad. Pinacho |
| FRA-01 | M09 | MAZAK VTC-200C-II |
| FRA-02 | M10 | MAZAK NEXUS 410 A II |
| FRA-03 | M11 | HEDELIUS CB70 |
| FRA-04 | M12 | AKIRA SEIKI V4.5 |
| FRA-05 | M17 | Fraiseuse DMC 1035 (B) |
| FRA-06 | M18 | Mikron VCE 800 PRO |
| FRA-07 | M19 | DMG DMC 635 |
| FRA-08 | M20 | DECKEL MAHO DMC 1035V |
| FRA-09 | M21 | DECKEL MAHO DMC 64V linear |
| FRA-10 | M13 | HEDELIUS ACURA 65 EL |
| FRA-11 | M14 | MAZAK CV5-500 + robot |
| FRA-12 | M15 | DMG MORI CMX50 U + PH150 |
| FRA-13 | M16 | DMG MORI DMU50 + Robot |
| FRA-14 | M22 | DECKEL MAHO DMU 60 (1) |
| FRA-15 | M23 | DECKEL MAHO DMU 60 (2) |
| FRA-16 | M24 | DMG MORI SEIKI DMU50 (Ecoline) |
| FRA-17 | M25 | MAZAK VTC 800 |
| FIL-01 | M29 | MITSUBISHI FA30S |
| FIL-02 | M30 | MV 2400R connect |

## Conditions d’une migration future

Une migration sûre devra au minimum :

1. figer une table sans doublon entre anciens et nouveaux identifiants ;
2. sauvegarder réglages, données de démonstration, décisions et mappings ERP ;
3. migrer dans la même opération machines, capacités, Planning, maintenance, actions, demandes, décisions et mappings ;
4. réconcilier chaque référence et refuser toute cible absente ou ambiguë ;
5. migrer les sauvegardes navigateur versionnées ;
6. produire un rapport vérifiable et permettre un retour complet vers les anciens identifiants.

Cette migration n’est pas réalisée dans l’évolution actuelle.

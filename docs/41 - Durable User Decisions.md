# Persistance durable des décisions utilisateur

## Garantie et séparation des couches

ProdPilot traite l’ERP comme une source externe en lecture seule. Le flux Planning ERP est séparé en six couches :

```text
Archives ERP brutes immuables
  → projection ERP normalisée
  + configuration versionnée
  + journal de décisions utilisateur
  + recommandations IA non appliquées
  → projection Planning fusionnée
```

Les classeurs archivés et la projection ERP ne sont jamais modifiés par une décision utilisateur. Les décisions Planning sont enregistrées dans `.local-data/user-decisions.json`, indépendamment de `.local-data/erp-planning.json`. L’ancien registre `erp-planning-overrides.json` est migré une seule fois, sans suppression, vers le journal durable.

## Identité et réassociation

Une opération reçoit une identité stable composée de l’OF, du numéro d’opération et du code tâche. L’identifiant d’affichage peut distinguer des occurrences en doublon, mais cette distinction instable n’est pas utilisée pour restaurer silencieusement une décision.

Après chaque import, les dernières décisions par champ sont rapprochées :

- une correspondance unique devient `applied` et est restaurée ;
- plusieurs correspondances deviennent `ambiguous` ;
- aucune correspondance devient `orphaned` ;
- une valeur impossible à appliquer pourra devenir `inapplicable` lors des validations métier futures.

Un rapport versionné conserve les volumes restaurés, ambigus, orphelins et inapplicables, ainsi qu’une explication par décision non appliquée. Aucune décision n’est supprimée par la réconciliation.

## Historique, annulation et reprise

Chaque changement de champ ajoute un événement horodaté avec identifiant, acteur, entreprise, module, origine, ancienne valeur, nouvelle valeur et commentaire facultatif. Les actions IA ne peuvent entrer dans ce journal qu’avec l’origine `ai-confirmed` après validation humaine.

Undo et Redo ajoutent des événements inverses liés à l’événement d’origine. Ils ne réécrivent ni ne suppriment l’historique, ce qui permet l’audit et une future synchronisation serveur.

## Sauvegardes et migrations

Une sauvegarde automatique exclusive du registre est créée sous `.local-data/backups/decisions/` après migration, mutation, réconciliation, undo ou redo. Les fichiers locaux sont exclus de Git et créés avec des droits restreints.

Cette implémentation locale protège les redémarrages et mises à jour conservant `.local-data`. Avant un déploiement partagé ou multi-instance, le même contrat de dépôt doit être branché sur PostgreSQL chiffré, authentifié, sauvegardé hors machine et isolé par entreprise. Une conservation sur plusieurs années exige également une politique de sauvegarde externe testée ; le disque local seul ne constitue pas une garantie industrielle suffisante.

## Limites encore ouvertes

- exposer le rapport de réconciliation et l’historique dans l’interface ;
- relier les commandes Undo/Redo aux écrans ;
- créer l’export/import global signé couvrant aussi Réglages, vues navigateur et autres domaines ;
- automatiser la restauration complète et tester régulièrement les sauvegardes ;
- remplacer les identités locales temporaires par l’utilisateur et l’entreprise authentifiés ;
- migrer le dépôt fichier vers une base transactionnelle avant production partagée.

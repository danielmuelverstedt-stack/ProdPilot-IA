# Données de démonstration

## Source unique

Les données métier sont définies dans `src/features/demo/mock/demo-data.ts` et typées dans `src/features/demo/types/demo.ts`. Les modules utilisent `demo-repository.ts`, jamais une copie locale de la même entité.

Les références sont cohérentes entre modules : par exemple `OF-240184` utilise `TOU-01` puis `FRA-10`, ses actions et anomalies pointent vers le même OF, et les maintenances de `FRA-10` apparaissent dans le planning.

## Persistance

Les mutations sont conservées dans la clé locale `prodpilot.demo-data.v1`. Sont persistés : actions, statuts, planning déplacé, réunions clôturées, demandes, maintenance et anomalies ERP.

Pour revenir à l’état initial : **Réglages → Sauvegardes → Réinitialiser les données de démonstration**. Cette opération demande confirmation. Les comptes de messagerie et les réglages possèdent leurs propres dépôts et ne sont pas effacés par cette action.

## Limites

- Les dates et quantités sont réalistes mais fictives.
- Aucun enregistrement n’est lu ou écrit dans l’ERP.
- La persistance locale n’est pas multi-utilisateur et ne convient pas à la production.
- Les réponses de l’assistant sont déterministes et ne font aucun appel OpenAI.

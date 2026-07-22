# Orchestrateur central ProdPilot IA

## Décision d’architecture

Le Mail Copilot est le premier client de l’assistant transversal. Les futures interfaces Planning, OF, Machines, Documents ou Mon Espace doivent appeler les mêmes contrats centraux au lieu de recréer une conversation, un registre d’outils ou une politique d’exécution.

```text
Interface d’un module
  → interprétation métier du module
  → plan de capacités et d’outils
  → orchestrateur central
  → outils autorisés
  → services métier propriétaires
  → résultat sourcé et trace d’exécution
```

L’orchestrateur ne connaît ni Gmail, ni un format ERP, ni les règles d’un OF. Le module transforme l’intention en plan. Chaque outil délègue ensuite au service métier déjà propriétaire de la donnée ou de l’action.

## Briques centrales

- `assistant-core/types/assistant-core.ts` : capacités, demandes, contexte isolé, plans, outils, résultats et traces ;
- `assistant-capability-catalog.ts` : catalogue transversal sans fournisseur ;
- `assistant-tool-registry.ts` : registre contrôlé, sans doublon de nom ;
- `assistant-orchestrator.ts` : validation du plan, contrôle module/capacité, confirmation selon le risque, exécution ordonnée et trace sourcée.

Le contexte transporte entreprise, utilisateur, module, mode réel/démonstration et corrélation. Les identités locales sont temporaires tant que l’authentification applicative n’est pas livrée.

## Premier client Mail

`mail-assistant-orchestration.ts` adapte les intentions Mail existantes en capacités génériques. Il ne remplace pas les services Mail : classement, approbation, lecture, brouillons, actions et conversation restent dans leurs propriétaires actuels. Le service de session passe désormais par l’orchestrateur avant chaque commande autorisée.

La sécurité existante reste prioritaire : le moteur Mail refuse d’abord les intentions non autorisées ; l’orchestrateur exige ensuite une confirmation pour tout outil autre qu’une lecture. Le raccordement initial transmet cette confirmation seulement après validation par le moteur d’approbation existant.

## Mémoire et apprentissage

La mémoire IndexedDB Mail reste une projection spécialisée. Elle n’est pas déplacée ni dupliquée. La future mémoire centrale devra définir des contrats transversaux pour conversations, préférences confirmées, décisions et liens sources, puis adapter les stores existants avec migration.

L’apprentissage reste local, explicite et versionné. Une correction utilisateur peut devenir une préférence après confirmation ; elle ne modifie jamais automatiquement les prompts globaux.

## Points d’extension

1. Un module interprète sa demande avec ses règles et permissions.
2. Il produit un plan utilisant une capacité du catalogue.
3. Il enregistre des outils qui déclarent modules, capacités et niveau de risque.
4. Les outils appellent les services existants ; ils n’accèdent pas directement au stockage.
5. Les sorties conservent des liens sources et une trace exploitable par l’historique.

Streaming, mémoire de conversation centrale, voix commune et outils Planning/ERP/Documents seront raccordés progressivement. Leur présence au catalogue exprime un contrat cible, pas une implémentation déclarée comme terminée.

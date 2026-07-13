# ProdPilot IA

ProdPilot IA est un assistant opérationnel destiné aux environnements de production. Le socle actuel comprend « Mon Espace », un centre de réglages local et un espace de messagerie indépendant du fournisseur, avec Gmail côté serveur et un emplacement réservé à Microsoft 365.

## Démarrage local

Prérequis : Node.js compatible avec la version de Next.js déclarée dans `package.json`.

```bash
npm install
npm run dev
```

L’application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

La messagerie fonctionne actuellement avec un registre multi-comptes local de démonstration. Google Workspace, Microsoft 365 et Mock peuvent être ajoutés plusieurs fois, mais aucun flux OAuth réel n’est lancé. Le guide `docs/09 - Google Mail Setup.md` décrit l’adaptateur Google historique qui devra être raccordé au stockage de jetons par compte avant sa réactivation.

## Contrôles qualité

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Repères

- `src/app` : routes et pages Next.js App Router ;
- `src/components` : composants applicatifs partagés ;
- `src/features` : fonctionnalités organisées par domaine ;
- `docs` : vision, architecture, règles, backlog, journal et guides de configuration.

Le dépôt local de jetons Google est strictement réservé au développement. Une authentification applicative et un stockage chiffré des jetons sont requis avant tout déploiement partagé.

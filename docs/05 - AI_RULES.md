# Règles produit et de développement pour Codex

Ces règles opérationnelles appliquent la [Constitution produit](specifications/00%20-%20Vision.md). Avant toute modification, lire les dix documents de `docs/specifications/` dans leur ordre numérique. En cas de conflit avec une documentation historique ou une demande qui enfreint la Constitution, signaler le conflit et demander une décision avant toute modification risquée.

## Avant de modifier le projet

1. Lire `AGENTS.md` et tous les fichiers de `/docs` avant toute modification majeure.
2. Inspecter l’état réel du dépôt et préserver les fonctionnalités existantes qui fonctionnent.
3. Pour Next.js, lire dans `node_modules/next/dist/docs/` le guide correspondant à l’API ou à la convention utilisée : cette version peut comporter des changements incompatibles avec les connaissances antérieures.
4. Vérifier l’état Git et ne jamais écraser les changements non liés de l’utilisateur.
5. Demander confirmation avant tout changement architectural majeur, migration structurante ou nouvelle dépendance importante.

## Règles produit

- Tous les textes visibles par l’utilisateur doivent être en français.
- Chaque fonctionnalité doit faire gagner du temps, prévenir un oubli ou améliorer une décision de production.
- Prioriser la simplicité et le parcours quotidien avant la richesse fonctionnelle.
- Ne pas construire un ERP complet ni une GMAO complète sans demande explicite.
- Ne jamais modifier directement les données ERP dans les premières versions.
- Distinguer clairement données source, données nettoyées et contenu généré par l’IA.
- Conserver l’utilisateur aux commandes des décisions et actions engageantes.
- Utiliser les formats européens : `JJ/MM/AAAA`, heure sur 24 heures et nombres/locales adaptés au français.
- Concevoir les écrans pour ordinateur et mobile.
- Maintenir l’accessibilité : HTML sémantique, clavier, focus visible, libellés, contrastes et messages d’erreur associés.

## Règles techniques

- Utiliser TypeScript en mode strict ; éviter `any` et préférer `unknown` avec validation.
- Utiliser Next.js App Router et les conventions de la version installée.
- Utiliser les composants serveur par défaut et les composants client seulement lorsque nécessaire.
- Préférer les intégrations côté serveur.
- Créer des composants réutilisables lorsque plusieurs usages réels existent.
- Garder les fichiers raisonnablement petits et focalisés sur une responsabilité.
- Éviter le code dupliqué, sans créer d’abstraction prématurée.
- Éviter les packages inutiles ; vérifier d’abord les capacités de la plateforme et du projet.
- Ne pas mélanger appels fournisseurs, règles métier et rendu dans un même composant.
- Préserver les fonctionnalités existantes et ajouter des tests proportionnés au risque.

## Conventions de nommage

- Composants React et types exportés : `PascalCase` (`MachineSchedule`, `WorkOrder`).
- Fonctions, variables et hooks : `camelCase` (`getRecentMessages`, `usePlanningFilters`).
- Constantes globales : `UPPER_SNAKE_CASE` seulement pour les constantes réellement immuables.
- Fichiers de composants : `PascalCase.tsx`; utilitaires et services : `kebab-case.ts`.
- Segments de route et dossiers de fonctionnalité : `kebab-case` en anglais technique stable.
- Hooks : préfixe `use`; gestionnaires d’événements : préfixe `handle` dans les composants.
- Booléens : préfixes explicites `is`, `has`, `can` ou `should`.
- Noms métier visibles et libellés : français ; identifiants de code : anglais cohérent.
- Tables et colonnes de base : `snake_case`, avec `company_id`, `created_at` et `updated_at` lorsque pertinents.

## Conventions de dossiers

- Les routes, layouts et fichiers spéciaux Next.js restent dans `app/` ou `src/app/`.
- Le code propre à un domaine va dans `features/<feature>/`.
- Les composants d’interface sans logique métier vont dans `components/ui/`.
- Les éléments de structure partagés vont dans `components/layout/`.
- Les adaptateurs d’intégration restent côté serveur dans `lib/` ou `server/`, jamais dans un composant client.
- Les validations résident près du cas d’usage ou dans un sous-dossier `schemas/` de la fonctionnalité.
- Les tests sont proches du code testé ou dans un dossier de tests clairement associé.
- Ne pas créer de dossier générique `utils/` pour y accumuler du code sans domaine.
- Toute migration de la racine vers `src/` est un changement architectural à faire valider.

## Conventions de composants

- Un composant a une responsabilité et une API de propriétés typée.
- Préférer la composition aux nombreuses options booléennes.
- Ne pas dupliquer l’état dérivable des propriétés ou des données serveur.
- Prévoir les états chargement, vide, erreur, succès et permission refusée.
- Les formulaires ont des libellés visibles, des erreurs explicites et conservent les saisies après une erreur récupérable.
- Ne pas déclencher d’effet métier pendant le rendu.
- Les composants partagés n’importent pas directement une intégration externe.
- Les dates affichées sont localisées ; les dates échangées et stockées utilisent un format non ambigu.

## Gestion des erreurs

- Valider toute donnée externe à la frontière du système.
- Retourner à l’utilisateur un message français actionnable, sans détail sensible.
- Conserver la cause technique côté serveur avec un identifiant de corrélation si nécessaire.
- Ne jamais ignorer silencieusement une erreur, une ligne ERP rejetée ou une réponse IA invalide.
- Différencier les erreurs de validation, d’autorisation, de fournisseur externe et les erreurs internes.
- Prévoir des délais d’attente et des reprises limitées pour les appels externes ; ne pas répéter automatiquement une opération non idempotente.
- Dégrader proprement l’interface lorsqu’une intégration est indisponible.

## Sécurité et confidentialité

- Ne jamais exposer de secret dans le navigateur, le dépôt, les journaux ou les captures.
- Ne jamais placer de clé ou jeton Google, Microsoft ou OpenAI dans du code client ou une variable publique.
- Stocker les jetons OAuth de manière chiffrée et les révoquer lors d’une déconnexion définitive.
- Appliquer le moindre privilège et vérifier les autorisations côté serveur pour chaque opération.
- Isoler toutes les données par entreprise ; ne jamais faire confiance à un `company_id` fourni par le client sans contrôle.
- Limiter et valider le type, la taille, le nom et le contenu des fichiers importés.
- Minimiser les données envoyées aux services d’IA et documenter leur finalité.
- Ne jamais envoyer un e-mail automatiquement : exiger une confirmation explicite après affichage du destinataire, de l’objet et du contenu.
- Journaliser les actions sensibles sans inclure les secrets ni plus de données personnelles que nécessaire.
- Utiliser des requêtes paramétrées et les protections natives du framework.

## Recommandations Git

- Commencer par `git status` et examiner les différences avant et après l’intervention.
- Travailler par changement cohérent, avec des commits courts et descriptifs en français ou en anglais cohérent.
- Ne pas mélanger refactorisation non demandée et fonctionnalité.
- Ne jamais réécrire l’historique partagé, supprimer des branches ou forcer un envoi sans autorisation explicite.
- Ne pas committer de secret, fichier `.env`, export ERP réel ou donnée personnelle.
- Relire les fichiers ajoutés et le diff avant de proposer un commit ou une pull request.

## Contrôles obligatoires

Après tout changement de code, exécuter au minimum :

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Ajouter les tests ciblés pertinents. Si un contrôle ne peut pas être exécuté, l’indiquer clairement avec la raison. Pour une modification exclusivement documentaire, relire la cohérence, les liens, l’encodage UTF-8 et le diff ; il n’est pas nécessaire de lancer un build sans impact sur le code.

## Documentation et suivi

- Mettre à jour `06 - Todo.md` après chaque tâche terminée : cocher seulement ce qui est réellement validé.
- Ajouter une entrée datée dans `07 - Changelog.md` après chaque changement terminé.
- Mettre à jour Vision, Roadmap, Architecture ou Modules lorsqu’une décision approuvée les rend obsolètes.
- Ne jamais présenter une fonctionnalité planifiée comme déjà livrée.

## Définition de terminé

Une tâche est terminée lorsque :

- les critères d’acceptation convenus sont satisfaits ;
- les textes utilisateur sont en français et les formats européens sont respectés ;
- les états principaux, permissions, erreurs et exigences d’accessibilité sont traités ;
- aucun secret n’est exposé et les contrôles serveur sont en place ;
- le code est lisible, typé, sans duplication évitable et accompagné des tests utiles ;
- TypeScript, ESLint, build et tests pertinents réussissent, ou toute exception est explicitement documentée ;
- les changements existants non liés sont préservés ;
- le diff a été relu ;
- le Todo et le Changelog sont à jour.

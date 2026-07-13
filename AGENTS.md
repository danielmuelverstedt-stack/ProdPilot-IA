# Instructions pour Codex

- Avant toute modification majeure, lire `AGENTS.md` et tous les fichiers pertinents de `docs/`, inspecter l’état Git et préserver les fonctionnalités ainsi que les changements utilisateur existants.
- Avant d’utiliser ou de modifier une API ou convention Next.js, lire le guide correspondant dans `node_modules/next/dist/docs/` et respecter les dépréciations de la version installée.
- Demander une confirmation avant tout changement architectural majeur, migration structurante ou dépendance importante.
- Prioriser la simplicité, la rapidité, les parcours courts et une interface accessible et responsive, notamment sur mobile.
- Utiliser TypeScript strict, Next.js App Router et Tailwind CSS. Préférer les composants serveur et les intégrations côté serveur lorsque possible.
- Garder tous les textes visibles par l’utilisateur en français. Afficher les dates au format européen `JJ/MM/AAAA`, les heures sur 24 heures et les nombres selon la locale française.
- Créer des composants réutilisables pour les usages réellement partagés. Garder le code focalisé, éviter la duplication, les abstractions prématurées et les dépendances inutiles.
- Ne jamais exposer de secret, clé API ou jeton OAuth dans le code client, les variables publiques, le dépôt, les journaux ou les captures.
- Ne jamais envoyer d’e-mail sans confirmation explicite de l’utilisateur après affichage du destinataire, de l’objet et du contenu.
- Dans les premières versions, traiter l’ERP en lecture seule : ne jamais modifier directement ses données.
- Après toute modification de code significative, exécuter `npx tsc --noEmit`, `npm run lint`, `npm run build` et les tests ciblés pertinents. Signaler clairement tout contrôle non exécuté ou en échec.
- Après chaque tâche terminée, mettre à jour `docs/06 - Todo.md` sans cocher de travail non validé, puis ajouter une entrée datée à `docs/07 - Changelog.md`.
- Relire le diff avant de terminer et ne jamais mélanger une refactorisation non demandée au changement demandé.

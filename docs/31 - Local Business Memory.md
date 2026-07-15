# Mémoire métier locale

## Rôle

La mémoire locale de l’Assistant mails est une projection IndexedDB destinée à la recherche, au travail hors ligne et à la réutilisation des résultats. Gmail ou le fournisseur connecté reste la source officielle des messages et brouillons. Une décision confirmée par l’utilisateur est l’autorité de ProdPilot IA pour cette décision.

```text
Interface → services d’application → services de mémoire → dépôt typé → adaptateur IndexedDB
```

Aucun composant n’accède directement à IndexedDB. `MailMemoryRepository` peut être remplacé par Supabase, PostgreSQL ou un serveur chiffré sans modifier les consommateurs.

## Base versionnée

La base `prodpilot-mail-memory`, version 1, crée les stores : `mailMessages`, `mailThreads`, `mailAnalyses`, `mailEntities`, `mailDecisions`, `commitments`, `replyProposals`, `draftReferences`, `assistantSessions`, `assistantCommands`, `assistantAuditEvents`, `internalActions`, `followUps`, `meetingRequests`, `contactPreferences`, `sourceLinks`, `synchronizationState` et `usageMetrics`.

Chaque store possède des index de contexte, source et date. Toute donnée porte compte, fournisseur, utilisateur, entreprise, mode démonstration/réel, source, dates et état de synchronisation. Les requêtes filtrent toujours ces cinq dimensions.

## Autorité et sources de vérité

1. Décision explicitement confirmée par l’utilisateur.
2. Fait du système source.
3. Extraction déterministe.
4. Analyse IA validée.
5. Suggestion IA non confirmée.

Les comptes et préférences Mail restent dans `MailAccountRepository`. Les jetons OAuth restent exclusivement dans `GoogleTokenRepository`. Les actions d’autres domaines ne sont pas dupliquées : la mémoire conserve uniquement les objets Mail locaux et leurs liens sources tant qu’aucun raccordement central n’est validé.

## Fonctionnement

Au démarrage explicite d’une session, les messages autorisés sont nettoyés, indexés et empreintés. Les sessions, commandes, propositions, audits et références de brouillons sont ensuite mis à jour après chaque commande. Une erreur IndexedDB ne bloque pas la session et est signalée clairement.

La mémoire permet la recherche locale, les listes « À faire », les demandes de réunion préparées, les décisions confirmées et les préférences de contact explicitement acceptées. Elle ne conserve jamais l’audio du microphone.

## Limite de production

IndexedDB est propre au profil navigateur, non chiffré par l’application et non multi-utilisateur. Avant une production partagée, synchroniser ou remplacer l’adaptateur par un stockage serveur chiffré, authentifié, audité et isolé par entreprise.

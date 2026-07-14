# Optimisation des jetons et des coûts IA

Aucune analyse de masse ou automatique n’existe. Chargement, rendu, filtres, synchronisation, changement de compte et saisie ne déclenchent jamais OpenAI. Seuls les boutons explicites lancent une opération ; les clics simultanés sont coordonnés côté serveur et désactivés côté client.

| Opération | Entrée max. | Sortie max. | Messages du fil | Caractères/message |
|---|---:|---:|---:|---:|
| Analyse | 6 000 | 1 200 | 4 | 8 000 |
| Réponse | 4 000 | 900 | 3 | 6 000 |
| Réécriture | 2 000 | 500 | 1 | 3 000 |

Les historiques cités sont limités à 1 500, 800 et 0 caractères ; les métadonnées à 8, 5 et 0 éléments ; les instructions à 0, 1 000 et 500 caractères. L’estimation conservatrice utilise quatre caractères par jeton. Les réglages utilisateur ne peuvent qu’abaisser les plafonds serveur.

La clé d’analyse hache entreprise, utilisateur, compte, message, contexte réduit, fournisseur, modèle, version du prompt, réglages et opération. Toute modification pertinente change la clé. L’expiration et l’actualisation explicite empêchent une réutilisation périmée. Les réponses et réécritures ne sont pas mises en cache globalement ; leur historique reste local à l’éditeur.

La politique centrale propose 50 appels quotidiens par entreprise et utilisateur. `OPENAI_DAILY_REQUEST_LIMIT` peut abaisser ce plafond côté serveur. L’analyse est limitée à 10 appels par message et la réécriture à 20 par brouillon. Le budget mensuel vérifie aussi le coût maximal projeté du prochain appel avant le fournisseur, lorsque le registre contient un tarif exact et validé.

Le dépôt d’usage conserve uniquement des métadonnées sûres : opération, modèle, nombres de jetons, durée, tentative fournisseur, cache, résultat et références techniques. Il ne conserve ni corps d’e-mail, ni réponse complète, ni prompt, ni secret. Les appels refusés sont également comptés, sans être confondus avec une tentative réellement envoyée au fournisseur.

Aucun tarif n’est codé en dur. Sans registre validé, l’interface affiche « Estimation financière non configurée » et les limites non monétaires restent actives. Les coûts affichés sont toujours des estimations internes ; OpenAI Platform reste la source officielle pour l’usage et la facturation.

Pour modifier une enveloppe de jetons, ajuster `src/features/ai/config/ai-token-budget.ts` puis mesurer sur les fixtures synthétiques. Avant production, remplacer cache, métriques et coordination locaux par des dépôts durables, chiffrés, multi-tenant et partagés avec verrou distribué.

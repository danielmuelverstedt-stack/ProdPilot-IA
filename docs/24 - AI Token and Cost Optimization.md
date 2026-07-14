# Optimisation des jetons et des coûts IA

Aucune analyse de masse ou automatique n’existe. Chargement, rendu, filtres, synchronisation, changement de compte et saisie ne déclenchent jamais OpenAI. Seuls les boutons explicites lancent une opération ; les clics simultanés sont coordonnés côté serveur et désactivés côté client.

| Opération | Entrée max. | Sortie max. | Messages du fil | Caractères/message |
|---|---:|---:|---:|---:|
| Analyse | 6 000 | 1 200 | 4 | 8 000 |
| Réponse | 4 000 | 900 | 3 | 6 000 |
| Réécriture | 2 000 | 500 | 1 | 3 000 |

Les historiques cités sont limités à 1 500, 800 et 0 caractères ; les métadonnées à 8, 5 et 0 éléments ; les instructions à 0, 1 000 et 500 caractères. L’estimation conservatrice utilise quatre caractères par jeton. Les réglages utilisateur ne peuvent qu’abaisser les plafonds serveur.

La clé d’analyse hache entreprise, utilisateur, compte, message, contexte réduit, fournisseur, modèle, version du prompt, réglages et opération. Toute modification pertinente change la clé. L’expiration et l’actualisation explicite empêchent la réutilisation. Les réponses et réécritures ne sont pas mises en cache globalement ; leur historique reste local à l’éditeur.

Le plafond quotidien serveur utilise `OPENAI_DAILY_REQUEST_LIMIT` (100 par défaut) combiné au plafond utilisateur. L’analyse est limitée à 10 appels réussis par message et la réécriture à 20. Sans table `pricing` validée, l’interface affiche « Estimation financière non configurée ».

Pour changer une limite, modifier d’abord `src/features/ai/config/ai-token-budget.ts`, puis les variables serveur documentées. Mesurer sur les fixtures avant toute hausse. Stockage distribué, limite mensuelle durable, verrou partagé, tarification validée et authentification multi-tenant restent requis pour la production.

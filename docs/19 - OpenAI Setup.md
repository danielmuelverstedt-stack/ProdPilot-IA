# Configuration OpenAI

L’assistance IA des mails utilise l’API OpenAI côté serveur. Un abonnement ChatGPT et la facturation de l’API OpenAI sont deux services distincts : un abonnement ChatGPT ne finance pas les appels API. OpenAI Platform reste la source de vérité pour l’usage, les crédits et la facturation.

## Préparer OpenAI Platform

1. Créer un compte ou se connecter sur [OpenAI Platform](https://platform.openai.com/).
2. Configurer la facturation API ou des crédits prépayés dans OpenAI Platform. Pour un premier essai contrôlé, 5 à 10 EUR/USD équivalents constituent une proposition prudente, pas une obligation ni une garantie de coût.
3. Créer, lorsque l’organisation le permet, un projet dédié à ProdPilot IA afin d’isoler accès et suivi.
4. Créer une clé API pour ce projet. Utiliser une clé restreinte si les restrictions disponibles couvrent les opérations requises.
5. Copier la clé une seule fois, ne jamais la partager et ne jamais l’insérer dans un écran du navigateur.

La séparation ChatGPT/API est expliquée dans [l’aide officielle OpenAI](https://help.openai.com/en/articles/9039756-managing-billing-settings-on-chatgpt-web-and-platform). Consulter aussi la [documentation officielle d’authentification API](https://platform.openai.com/docs/api-reference/authentication) et les [informations sur les crédits prépayés](https://help.openai.com/en/articles/8264778-what-is-prepaid-billing).

## Configurer le serveur local

Créer `.env.local` à la racine, à partir de `.env.example` :

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_MAIL_ANALYSIS_MODEL=
OPENAI_MAIL_REPLY_MODEL=
OPENAI_MAIL_REWRITE_MODEL=
OPENAI_MAIL_AI_ENABLED=false
OPENAI_MAX_OUTPUT_TOKENS=
OPENAI_TIMEOUT_MS=
OPENAI_DAILY_REQUEST_LIMIT=
OPENAI_PROMPT_CACHE_KEY_PREFIX=
```

- `OPENAI_API_KEY` : clé secrète, exclusivement serveur.
- `OPENAI_MODEL` : modèle de repli commun.
- Les trois variables `OPENAI_MAIL_*_MODEL` permettent un modèle distinct pour l’analyse, la réponse et la réécriture ; une valeur vide utilise le modèle commun.
- `OPENAI_MAIL_AI_ENABLED=true` autorise les appels réels. Avec `false`, une clé absente ou un modèle absent, le repli déterministe reste disponible.
- Les autres variables fixent des plafonds serveur optionnels. Les réglages du navigateur ne peuvent pas les augmenter.

Redémarrer Next.js après chaque modification de `.env.local`. Ouvrir ensuite Réglages → IA → Configuration et lancer « Tester la connexion OpenAI ». Le test envoie uniquement une instruction minimale, jamais le contenu d’un e-mail.

## Première activation

Avant un appel réel :

- compléter la checklist de première utilisation ;
- laisser l’analyse automatique, la création automatique de brouillons et l’envoi automatique désactivés ;
- configurer le budget interne, avec par défaut un avertissement à 5 et un arrêt interne à 10 ;
- ajouter un tarif uniquement après vérification d’une source officielle ;
- surveiller en parallèle l’usage et la facturation dans OpenAI Platform.

Les montants de ProdPilot IA sont des estimations internes, pas des factures. Le garde-fou dépend des prix saisis et de métriques locales ; il ne change pas les contrôles de facturation OpenAI et ne garantit pas l’absence de dépassement externe. Si un plafond interne bloque un appel, le mode déterministe reste proposé.

## Sécurité et limites de production

`.env.local` est ignoré par Git. La clé n’est ni retournée par une API, ni stockée dans `localStorage`, ni affichée dans Réglages. Les erreurs fournisseur sont transformées en catégories sûres en français.

Avant un déploiement partagé, remplacer le dépôt d’usage local par un stockage durable, chiffré, multi-entreprise et transactionnel ; ajouter une authentification applicative et une autorisation administrateur serveur ; partager cache et verrou de déduplication entre instances. Les coordonnées de carte et autres données de paiement restent exclusivement sur OpenAI Platform.

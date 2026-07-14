# Architecture IA des mails

L’interface Mail ne connaît ni OpenAI, ni les noms de modèles. Elle appelle trois routes serveur uniquement après une action explicite : `POST /api/ai/mail/analyze`, `POST /api/ai/mail/reply` et `POST /api/ai/mail/rewrite`. Une factory sélectionne OpenAI ou le repli déterministe.

## Chaîne d’une opération

1. validation stricte et contrôle same-origin ;
2. résolution du compte Mail actif côté serveur ;
3. lecture du seul message demandé et du contexte récent utile ;
4. réduction locale selon le budget central ;
5. recherche d’une analyse validée dans le cache ;
6. contrôle des limites, déduplication et appel éventuel ;
7. validation du JSON, métriques sûres et cache ;
8. nouveau contrôle du compte actif avant restitution.

L’analyse regroupe résumé, catégorie, priorité, besoin de réponse, justification, entités, dates, actions, informations manquantes et confiance en un appel.

Les modèles viennent de `OPENAI_MAIL_ANALYSIS_MODEL`, `OPENAI_MAIL_REPLY_MODEL` et `OPENAI_MAIL_REWRITE_MODEL`, avec `OPENAI_MODEL` comme repli. Les préfixes stables sont `mail-analysis-v1`, `mail-reply-v1` et `mail-rewrite-v1`. Les instructions invariantes précèdent le contenu variable et `prompt_cache_key` reste stable par opération.

Le cache, les métriques et la coordination en vol sont abstraits, mais leurs implémentations sont locales (`.local-data` et mémoire du processus). Avant production, les remplacer par des dépôts chiffrés, multi-tenant et partagés avec verrou distribué. La création Gmail reste séparée et confirmée ; aucune route d’envoi n’existe.

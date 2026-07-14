# Tests de l’IA Mail

`tests/fixtures/mail-ai-evaluation.mjs` contient neuf e-mails professionnels synthétiques : livraison fournisseur, risque de retard client, maintenance, qualité, planning, information seule, fil long, message vide et message multilingue. Aucun e-mail réel n’est versionné.

Pour chaque modèle, évaluer : exactitude du résumé, catégorie, priorité, entités, ancrage de la réponse, taille de sortie, jetons approximatifs et cache. Une insuffisance isolée ne justifie pas une montée de gamme globale.

Exécuter `npm test`. Les contrôles vérifient l’absence d’appel IA au chargement, les actions explicites, les versions stables, le budget réduit des réécritures, l’absence de corps dans les métriques et l’absence d’envoi Gmail.

Acceptation manuelle : ouvrir Mail sans appel OpenAI ; analyser un message ; vérifier un appel puis le cache ; générer une réponse ; appliquer « Plus court » ; modifier le texte ; confirmer le brouillon Gmail ; vérifier qu’aucun envoi n’a eu lieu ; consulter les jetons dans Réglages → IA.

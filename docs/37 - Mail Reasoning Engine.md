# Moteur de raisonnement Mail

## Objectif

Le moteur transforme les faits structurés déjà présents dans la mémoire Mail locale en objets métier explicables. Il ne remplace ni Gmail, ni les fournisseurs existants, et n’envoie aucun message.

## Entrées et sorties

Il lit les messages, propositions de réponse, brouillons, suivis, engagements, décisions, demandes de réunion, actions internes et sessions. Il produit des risques, opportunités, recommandations, dépendances, blocages, attentes, conflits, échéances, engagements et impacts de décision.

Chaque objet contient un titre, une description, un niveau de confiance, une sévérité, une justification, les références des faits sources, un statut et une action recommandée. Les dépendances entre objets sont conservées séparément pour permettre les raisonnements transversaux.

## Local-first et coût

Le chargement du centre de commande exécute seulement les règles déterministes locales. La trace indique le mode (`local`, `cached` ou `ai`), la raison, l’estimation de jetons et si une IA a été appelée. Sans consentement explicite, un cas complexe reste local et en attente ; il ne déclenche aucun appel distant.

## Sécurité d’exécution

Une recommandation n’est jamais une autorisation. Les envois, réunions et changements externes restent soumis aux confirmations existantes. Les métriques ne stockent ni corps de message, ni secret, ni jeton OAuth.

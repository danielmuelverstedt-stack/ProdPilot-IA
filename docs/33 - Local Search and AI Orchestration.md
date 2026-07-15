# Recherche locale et orchestration IA

## Recherche déterministe

La recherche locale examine d’abord expéditeur, destinataire, objet, texte nettoyé, date, fil et noms de fichiers. Les termes métier contenus dans le texte permettent aussi de retrouver client, fournisseur, projet, OF, machine, action, décision ou engagement sans appel distant.

Le filtre de contexte interdit tout résultat provenant d’un autre compte, utilisateur, entreprise ou mode. Les résultats indiquent leurs liens sources et si les données peuvent être anciennes.

## Niveaux d’orchestration

- Niveau 0 : recherche, filtre, date, statut, lien source, décision connue et liste « À faire ».
- Niveau 1 : résumé, analyse, entité ou préférence locale encore valide.
- Niveau 2 : synthèse nouvelle, comparaison complexe, nouvelle réponse ou ambiguïté difficile.

L’orchestrateur choisit toujours le niveau valide le moins coûteux. Une interface conversationnelle ne justifie jamais à elle seule un appel OpenAI. Un appel de niveau 2 reste soumis aux budgets, consentements et routes serveur existants.

## Réutilisation

Une analyse est réutilisée uniquement si l’empreinte du contenu, la version du prompt et le contexte correspondent, et si l’expiration n’est pas atteinte. Une modification du message, du fil, des réglages ou une actualisation explicite invalide le résultat.

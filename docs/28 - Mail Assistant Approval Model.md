# Modèle d’approbation de l’Assistant mails

## Niveau 1

Lecture, classement, synthèse, raisonnement, propositions et état de session sont automatiques après le démarrage explicite de la session. Ils ne mutent aucune source externe.

## Niveau 2

Un accord conversationnel non ambigu autorise la création de brouillons, une action locale, une réécriture ou l’ignorance dans la session. Après « Les réponses sont bonnes », l’assistant propose les brouillons ; « OK » peut alors les créer sans modal supplémentaire.

## Niveau 3

Un envoi exige une expression explicite telle que « Envoie » ou « Tu peux envoyer ». Un simple « OK » n’est jamais une intention d’envoi. Les portées Google et l’application actuelle ne permettent pas l’envoi : une demande explicite prépare les brouillons et répond clairement qu’aucun message n’a été envoyé.

Suppression permanente, publication externe et envoi autonome restent interdits. Les lots vérifient chaque compte et chaque message, évitent les doublons, puis résument réussites, échecs et éléments ignorés.

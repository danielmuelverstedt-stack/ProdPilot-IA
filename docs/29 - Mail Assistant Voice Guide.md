# Guide vocal de l’Assistant mails

La dictée utilise `SpeechRecognition` ou son préfixe navigateur lorsqu’il existe. Elle ne démarre qu’après un clic sur **Micro**, s’arrête à la demande ou à la fin de la phrase et n’écoute jamais en arrière-plan.

La transcription apparaît dans le champ texte et reste modifiable avant envoi. Le bouton annonce son état avec `aria-pressed`, un statut visible indique l’écoute et les erreurs renvoient vers la saisie clavier. Aucun audio n’est transmis à un service ajouté par ProdPilot IA.

Si le navigateur ne prend pas en charge cette API, l’interface affiche une information claire et conserve toutes les fonctions texte.

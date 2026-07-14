# Commandes de l’Assistant mails

La couche typée autorise uniquement : `start_mail_session`, `summarize_new_mail`, `list_important_mail`, `open_message`, `explain_classification`, `modify_reply`, `generate_reply`, `create_draft`, `create_action`, `add_to_qrqc`, `add_to_meeting`, `mark_processed`, `ignore_message`, `send_email`, `undo`, `redo`, `next_message`, `previous_message` et `finish_session`.

Le modèle ne peut ni exécuter du code arbitraire ni choisir une route libre. L’interpréteur transforme le texte en intention validée et en identifiants stables de messages.

Les références prises en charge comprennent les numéros de session, « le premier », « le deuxième », un expéditeur, un sujet et un groupe urgent. Une correspondance multiple produit une question de clarification concise et aucune action.

Les réécritures créent une nouvelle version. `undo` et `redo` déplacent la version courante sans supprimer l’historique. Une modification doit viser une seule proposition.

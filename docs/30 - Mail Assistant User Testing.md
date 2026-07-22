# Recette utilisateur — Assistant mails

1. Ouvrir `/mails/assistant` et vérifier l’absence d’analyse avant le clic.
2. Démarrer la session et vérifier le compte actif, le brief, les groupes et les raisons.
3. Dire « Pour le deuxième, fais plus diplomatique », puis vérifier la seule proposition n° 2.
4. Dire « Les deux réponses sont bonnes », puis « OK » et vérifier la création des brouillons sans envoi.
5. Recommencer avec « Envoie les deux » : vérifier que les brouillons sont créés ou ignorés s’ils existent déjà et que l’absence d’envoi est annoncée.
6. Tester une référence ambiguë et vérifier qu’aucune action n’est exécutée.
7. Changer de compte pendant une session et vérifier son invalidation.
8. Tester micro, transcription modifiable, arrêt et navigateur non compatible.
9. Terminer et vérifier le résumé de session.
10. En mode démonstration, vérifier que chaque mutation externe est explicitement annoncée comme simulée.
11. Ouvrir `/mails/diagnostic`, lancer une synchronisation complète et vérifier que « Messages synchronisés » égale « Nombre réel détecté ».
12. Vérifier que les promotions et autres catégories encore dans `INBOX` apparaissent, tandis que les archivés, le spam et la corbeille n’augmentent pas le total de la boîte de réception.
13. Envoyer deux questions naturelles successives et vérifier que la deuxième réponse conserve le contexte dans la même session.
14. Alterner clavier et micro sans recharger, puis interrompre une réponse en cours et continuer la discussion.
15. Activer séparément puis simultanément **Réponse écrite** et **Réponse vocale** ; simuler un échec TTS et vérifier que le texte reste visible.
16. Vérifier que Plaud reste « Non connecté » en l’absence de connecteur, même si un périphérique audio porte ce nom.

À tester manuellement avec un compte réel : création de deux brouillons, expiration OAuth, changement de compte pendant un lot, échec partiel du fournisseur, permissions micro, TTS/STT, périphériques et interruption audio dans Edge et Chrome.

## Recette voix critique Edge et Chrome

1. Cliquer **Micro** sans raccourci : aucune application externe ne doit s’ouvrir et l’écoute doit rester active pendant plusieurs phrases.
2. Vérifier la transcription partielle puis finale et confirmer qu’un seul texte est envoyé, sans duplication.
3. Enchaîner au moins dix échanges texte/voix dans la même session et vérifier que l’historique ne disparaît pas.
4. Pendant la lecture TTS, saisir du texte puis ouvrir le diagnostic : la voix ne doit pas être coupée.
5. Comparer au moins trois voix françaises aux vitesses 0,8, 0,9 et 1,0, avec volume et hauteur à 1.
6. Refuser la permission microphone : la conversation texte doit continuer normalement.
7. Vérifier les neuf lignes du diagnostic intégré, notamment Plaud comme périphérique éventuel et jamais comme connexion ProdPilot.
8. Tester arrêt, reprise, interruption, conversation mains libres et perte de focus dans les deux navigateurs.

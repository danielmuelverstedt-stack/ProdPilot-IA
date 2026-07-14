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

À tester manuellement avec un compte réel : synchronisation Gmail, création de deux brouillons, expiration OAuth, changement de message pendant un lot et échec partiel du fournisseur.

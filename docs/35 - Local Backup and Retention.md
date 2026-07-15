# Sauvegarde locale et rétention

## Sauvegarde

Réglages → Sauvegardes exporte un JSON `prodpilot-mail-memory` version 1 pour le compte actif. L’import exige le même compte, utilisateur, entreprise et mode. Le fichier exclut secrets, jetons, audio, HTML brut et contenu de pièces jointes.

L’écran affiche la taille locale estimée et la date de dernière sauvegarde. Les suppressions d’analyses, de sessions ou de toute la mémoire exigent une confirmation explicite.

## Rétention

Les valeurs initiales centralisées sont : index Mail 180 jours, analyses 90 jours, sessions 365 jours, audit 180 jours et maximum local 250 Mo. Elles sont configurables dans Réglages → Mails.

Le service de nettoyage supprime uniquement les caches et historiques arrivés à expiration. Il ne supprime pas automatiquement une décision ou préférence confirmée. Une limite de navigateur ou un quota proche doit être signalé ; l’application ne promet pas un volume garanti.

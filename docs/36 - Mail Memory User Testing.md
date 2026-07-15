# Recette utilisateur — Mémoire Mail locale

1. Démarrer une session Mail et vérifier la création de la base IndexedDB version 1.
2. Rechercher « Retrouve la discussion avec Julian sur les licences SolidWorks » et vérifier un résultat local sans appel OpenAI.
3. Ouvrir la source et vérifier le lien Gmail ; en mode démonstration, vérifier l’indisponibilité explicite.
4. Contrôler qu’une pièce jointe ne conserve que nom, MIME, taille, identifiant et lien ; aucun octet local.
5. Changer de compte et vérifier qu’aucun résultat du compte précédent n’apparaît.
6. Confirmer une décision par « Oui, retiens cette décision » puis vérifier son autorité utilisateur.
7. Demander une réunion et vérifier la proposition locale, les informations manquantes et l’absence d’événement externe.
8. Demander « Que dois-je faire aujourd’hui ? » et vérifier une réponse déterministe issue des suivis Mail.
9. Couper Gmail/OpenAI et vérifier recherche, sessions, décisions, brouillons locaux et indication de fraîcheur.
10. Exporter puis importer une sauvegarde compatible ; inspecter l’absence de jeton, clé, audio et binaire.
11. Tester les effacements sélectifs et leurs confirmations.
12. Vérifier clavier, focus, mobile et libellés des sources.

La validation multi-utilisateur, le chiffrement serveur et la synchronisation multi-instance restent hors du stockage IndexedDB local.

# Guide de recette utilisateur

## Préparation

1. Lancer `npm run dev` puis ouvrir `http://localhost:3000`.
2. Dans Réglages → Sauvegardes, réinitialiser les données de démonstration.
3. Choisir le rôle **Administrateur** dans la barre latérale.

## Parcours recommandés

1. **Mon Espace** : vérifier huit cartes, les compteurs et une réponse déterministe de l’assistant.
2. **Actions** : filtrer, créer une action, l’éditer, la reporter, la terminer puis confirmer une suppression.
3. **OF** : rechercher `OF-240184`, ouvrir le détail, lire la gamme et suivre une action liée.
4. **Planning** : alterner les départements, semaines et machines configurés ; déplacer une opération après confirmation ; changer sa machine et sa date ; ouvrir l’OF ; vérifier les charges et l’aperçu imprimable.
5. **Réunions** : parcourir un QRQC, ajouter une note, une action et un sujet au parking, puis clôturer. Vérifier l’action dans Actions et la mise à jour de Mon Espace.
6. **Suivi** : créer une demande liée à un OF, changer son statut et son responsable, commenter puis créer une action.
7. **Parc Machines** : ouvrir `FIL-01`, consulter les onglets et mettre une maintenance à jour.
8. **Qualité ERP** : filtrer, générer et copier un e-mail mock, créer une action et résoudre une anomalie.
9. **Analyses** : vérifier que les indicateurs reflètent les mutations précédentes.
10. **Permissions** : choisir **Opérateur** ou **Lecture seule**, vérifier le menu et l’écran d’accès refusé.
11. **Responsive** : répéter le parcours principal aux largeurs mobile, tablette et bureau.

## Configuration du Planning

Dans Réglages → Production, ajouter temporairement une machine, changer son ordre puis la désactiver et vérifier chaque résultat dans le Planning. Renommer un département, modifier une capacité et une couleur, puis vérifier les onglets, charges et cartes. Dans Personnalisation → Impression, modifier la visibilité et l’ordre d’une colonne et contrôler l’aperçu. Restaurer ensuite les réglages initiaux si cette recette ne doit pas être conservée.

## Messagerie

Le compte de démonstration permet une recette sans identifiants. Pour Google local, suivre `docs/09 - Google Mail Setup.md`. Ne jamais tester un envoi : la version ne crée que des brouillons confirmés.

La recette complète de la recherche, des filtres, des paramètres par compte, des états responsive, des pièces jointes et des brouillons est décrite dans `docs/18 - Mail Architecture.md`. Le terme « compte de démonstration » doit être utilisé dans toute interface visible.

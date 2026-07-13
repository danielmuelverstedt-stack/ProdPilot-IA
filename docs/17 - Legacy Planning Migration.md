# Migration du Planning historique

Audit réalisé le 13/07/2026 à partir de la référence disponible dans `legacy-reference/prodpilot-ia-v12-07/prodpilot-ia` (le chemin court indiqué dans la demande n’existe pas dans le dépôt).

## Structure et composition d’origine

- Écran mensuel dense centré sur une grille machines/jours : une ligne par machine, vingt jours ouvrés de juillet 2026 en colonnes et regroupement visuel par semaines 28 à 31.
- Colonne « Machine » figée à gauche avec identifiant, nom, département et accès à la fiche imprimable ; colonne « Charge période » à droite avec heures, capacité et taux.
- Barre d’outils supérieure : onglets de département, sélecteur mois/semaine, création d’une maintenance ou tâche libre, impression globale et légende des états.
- Tableau placé dans une carte blanche arrondie, large et défilable horizontalement (`min-width: 1650px`) ; séparateurs plus marqués à la fin de chaque semaine.
- Chaque cellule contient zéro à plusieurs blocs compacts, un total journalier `Σ heures/capacité`, une alerte de surcharge et un bouton `+` d’ajout.
- Les données historiques distinguent 28 machines, chacune avec une capacité journalière, et des blocs de planning répartis par machine et par jour.

## Informations et contrôles

- Bloc OF : suffixe du numéro d’OF, opération, durée et indicateur de pièce identique ; l’infobulle reprend l’OF et l’opération.
- Bloc hors OF : pictogramme outil, libellé, durée et responsable lorsqu’il est renseigné.
- L’ouverture d’un bloc OF donne accès au détail de l’OF.
- Filtres d’origine : département et période (mois complet ou semaine). La migration conserve en plus les filtres actuels machine, client et OF demandés pour la version Next.js.
- Ajout sur une cellule : sélection d’une opération compatible, saisie des heures, priorité de l’OF, échéance et signalement des pièces regroupables.
- Dialogue de tâche libre : type Maintenance/Divers, machine, libellé, jour, durée et responsable.
- Impression : une machine ou toutes les machines, regroupement par semaine, identité société et colonnes configurées dans les réglages.

## Interactions d’origine

- Glisser-déposer d’un bloc non bloqué vers une autre machine et/ou un autre jour, avec recalcul immédiat des charges.
- Les opérations bloquées ne sont pas déplaçables.
- Un conflit de maintenance ouvre une confirmation avant le déplacement ou l’ajout d’un OF.
- Les modifications sont conservées localement dans la session du prototype.
- Le bouton `+` d’une cellule planifie un OF ; la barre d’outils planifie une tâche hors OF.
- La surcharge est signalée si la somme d’une cellule dépasse la capacité journalière de la machine.

## Identité visuelle d’origine

- En cours : bleu principal (`#1d4ed8`) avec texte blanc.
- Planifiée : gris ardoise clair avec bordure grise.
- En réglage : ambre (`#fbbf24`).
- Bloquée : rouge clair avec bordure rouge.
- Maintenance : violet (`#7c3aed`).
- Divers : vert canard (`#0d9488`).
- Charge : vert sous 80 %, ambre de 80 à 94 %, rouge à partir de 95 %.
- Blocs très compacts, coins de 8 px, typographie de 10 px ; carte et contrôles suivent les surfaces claires et arrondies du shell historique.

## Écarts du Planning Next.js actuel

- La vue actuelle est une succession de grandes cartes verticales groupées par machine ou département, et non la grille mensuelle historique.
- Elle ne présente ni semaines groupées, ni charge journalière par cellule, ni colonne figée, ni ajout direct dans une case.
- Le déplacement se limite à des boutons haut/bas et à des champs machine/date ; il n’existe pas de glisser-déposer ni de dialogue de tâche libre.
- L’impression est globale et intégrée à la même vue, sans entrée par machine.
- La densité, la hiérarchie de la barre d’outils, les couleurs d’état et le comportement mobile divergent fortement de la référence.
- Avant la finalisation, les données centralisées contenaient quatre machines et cinq opérations ; la liste des 28 machines a ensuite été portée dans les Réglages, qui restent la source unique, sans recopier les blocs de planning historiques.

## Plan exact de migration

1. Construire une projection typée du dépôt mock courant : machines configurées actives, OF, opérations, maintenances, jours ouvrés, semaines ISO, capacité et charge.
2. Remplacer la liste verticale par la grille historique machines/jours, avec colonne machine figée, en-têtes de semaines, cellules multi-blocs, charges et légende.
3. Scinder le rendu en composants focalisés : barre d’outils, filtres, grille, ligne machine, bloc, dialogues de mouvement/ajout/tâche et vue d’impression.
4. Utiliser les machines, départements, couleurs de thème, identité société, droits et colonnes d’impression des réglages actuels.
5. Persister ajouts et déplacements via le dépôt mock existant ; étendre uniquement `MaintenanceEvent` avec la catégorie d’affichage Maintenance/Divers, sans dupliquer les données.
6. Reproduire le glisser-déposer sur ordinateur et fournir le même résultat par un dialogue explicite utilisable au clavier et sur mobile.
7. Conserver le défilement horizontal sur tablette et mobile, avec filtre machine pour limiter la grille sans altérer la composition desktop.
8. Comparer la référence et `/planning`, corriger les écarts majeurs, puis valider TypeScript, ESLint, build et propreté du diff.

## Différences assumées

- La liste complète des machines provient des Réglages centralisés ; seul le volume d’OF reste volontairement limité au dépôt mock actuel, sans recopier les blocs historiques.
- L’interface Next.js demande une confirmation avant d’enregistrer un déplacement, alors que le prototype déplaçait immédiatement hors conflit de maintenance. Cette confirmation préserve le comportement de sécurité déjà livré.
- Le glisser-déposer HTML est complété par un bouton de déplacement : il reste ainsi accessible sur écran tactile et au clavier.

## Validation de la migration

- La composition, les classes et les comportements de la référence ont été comparés directement avec les composants Next.js et leur feuille de style locale.
- `/planning` répond en HTTP 200 et son rendu initial contient le titre, les machines et la charge.
- La comparaison visuelle automatisée côte à côte n’a pas pu être exécutée : aucun navigateur contrôlable n’était disponible dans la session. Une recette visuelle desktop reste donc recommandée.
- Les écarts visibles conservés sont le volume réduit d’OF du dépôt mock courant, la confirmation systématique des mouvements et les commandes tactiles explicites.

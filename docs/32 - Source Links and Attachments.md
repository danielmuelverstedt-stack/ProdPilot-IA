# Liens sources et pièces jointes

## Règle absolue

ProdPilot IA ne télécharge, ne copie et ne persiste aucun contenu binaire de pièce jointe. Aucun OCR ni extraction de fichier n’est réalisé.

Pour une pièce jointe, seuls sont conservés : identifiant fournisseur, message parent, compte, fournisseur, nom, type MIME, taille approximative, référence source, lien résolvable et état d’accès. L’adaptateur IndexedDB refuse `Blob`, `ArrayBuffer` et vues binaires.

## Modèle universel

`SourceLink` est indépendant du fournisseur et couvre mail, fil, pièce jointe, brouillon, événement calendrier, réunion, action, document externe, OF, machine et projet. Seuls les liens Mail Google sont résolus actuellement.

Le composant n’assemble jamais une URL fournisseur. `source-link-resolver` produit l’URL Gmail et le libellé « Ouvrir dans Gmail ». Sans URL stable, le lien conserve une référence fournisseur et affiche une indisponibilité ou une demande de reconnexion.

Les liens ne contournent pas les permissions : Gmail peut demander une authentification ou refuser l’accès. ProdPilot IA ne prétend pas que la source est disponible lorsque cette validation n’est plus certaine.

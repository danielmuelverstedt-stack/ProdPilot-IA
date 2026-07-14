# Migration de l’application historique

Ce document conserve l’audit et les décisions prises au début de la migration. Il ne décrit pas l’état fonctionnel courant. La [Constitution produit](specifications/00%20-%20Vision.md) gouverne les évolutions futures, tandis que `docs/04 - Modules.md`, `docs/06 - Todo.md` et les guides de migration plus récents décrivent ce qui est désormais livré. Les éléments indiqués « à différer » ci-dessous doivent donc être lus comme un instantané historique.

## Périmètre audité

Le prototype historique situé dans `legacy-reference/prodpilot-ia-v12-07/prodpilot-ia` a été audité intégralement : structure HTML, feuille de styles, données de démonstration, logique applicative et documentation. Il sert de référence fonctionnelle et visuelle uniquement. Son JavaScript n’est ni importé ni exécuté par l’application Next.js.

## Écrans et modules historiques

- Mon espace : routines quotidiennes, cartes configurables, notifications et assistant.
- Accueil / command center et ancien tableau de bord.
- Tournée atelier avec saisie rapide de l’état des machines.
- Parc machines : vue atelier, fiches, maintenance et documents.
- Ordres de fabrication : liste, détail, gamme, documents et import.
- Planning machines : calendrier mensuel, charge, glisser-déposer et impression.
- Centre de demandes : production et maintenance, approbation et planification.
- Actions : liste, responsables, priorités, échéances et statuts.
- KPI et analyses : OTD, occupation et Pareto.
- Qualité des données ERP : règles, score, anomalies, responsables et alertes.
- Réunions : QRQC guidé et réunion de production avec compte rendu.
- Réglages : identité, interface, routines, ERP, production, réunions, IA, notifications, utilisateurs, sauvegardes et journal.
- Assistant IA latéral et assistant contextuel dans Mon espace.

## Navigation historique

Le menu était généré depuis une configuration locale et comprenait : Mon espace, Accueil, Tournée atelier, Parc machines, OF, Planning, Demandes, Actions, KPI et analyses, Qualité ERP, Réunions et Réglages. L’ancien Tableau de bord était conservé dans le code mais retiré du menu.

La migration retient une navigation rationalisée : Mon Espace, Tableau de bord, Planning, OF, Réunions, Actions, Qualité ERP, Parc Machines, Suivi, Analyses et Réglages. Elle reste configurable, ordonnable et filtrée selon les permissions du rôle actif.

## Identité visuelle à conserver

- Style SaaS industriel compact, professionnel et orienté décision.
- Barre latérale bleu nuit, zone principale gris très clair et surfaces blanches.
- Couleur principale bleue, avec statuts vert, orange, rouge, bleu et violet.
- Cartes arrondies, bordures fines et ombres discrètes.
- Typographie système lisible, titres compacts et densité d’information maîtrisée.
- Badges arrondis, barres de progression, tableaux denses et états clairement colorés.
- En-tête fixe avec recherche, notifications et profil.
- Adaptation mobile avec navigation horizontale ou panneau dédié.

### Palette historique de référence

| Usage | Valeur historique |
|---|---|
| Fond principal | `#f8fafc` |
| Surface | `#ffffff` |
| Bordure | `#e2e8f0` |
| Texte principal | `#0f172a` |
| Texte secondaire | `#475569` |
| Bleu principal | `#1d4ed8` |
| Bleu sombre | `#1e40af` |
| Sidebar | `#020617` |
| Succès | `#059669` |
| Attention | `#d97706` |
| Danger | `#dc2626` |
| Information | `#2563eb` |

La nouvelle application centralise ces valeurs dans des tokens configurables et ne recopie pas la feuille CSS historique.

## Composants visuels recensés

- Cartes KPI, cartes de priorité, cartes Mon espace et cartes machines.
- Tableaux de gestion, matrices de permissions et planning à colonnes fixes.
- Badges de statut et priorité, filtres en pastilles et barres de charge.
- Chronologie de gamme, listes d’actions et panneaux de détail.
- Dialogues modaux pour actions, demandes, interventions et conflits.
- Panneau latéral d’assistant, notifications déroulantes et messages toast.
- Aperçus d’impression et documents A4/A3.

## Réglages configurables recensés

- Menu principal : visibilité, ordre, libellé et icône.
- Mon espace : routines, cartes, visibilité, ordre, libellé, icône, couleur, taille et cible.
- Identité société : nom, logo, coordonnées et pied de page.
- Production : machines, départements, capacités, priorités et types d’OF.
- ERP : connexion future, imports, mapping, synchronisation et qualité.
- Réunions : étapes, questions, parking lot et comptes rendus.
- IA : prompts, ton, résumés, e-mails et commandes.
- Notifications : règles d’alerte.
- Utilisateurs, rôles et droits par module.
- Modèles de mails, QRQC, réunions et comptes rendus.
- Impression : format, orientation, identité, colonnes, cases et aperçu.
- Sauvegarde/import JSON et journal local des modifications.

## Fonctionnalités retenues pour cette migration

- Shell réutilisable avec sidebar repliable, en-tête, profil, notifications et mobile.
- Navigation issue d’une configuration unique et filtrée par rôle.
- Mon Espace composé de cartes configurables.
- Centre Réglages avec les dix catégories demandées et la navigation Personnalisation détaillée.
- Designers du menu principal et des cartes Mon Espace avec boutons haut/bas.
- Identité société et logo local à taille maîtrisée avec `object-fit: contain`.
- Thème centralisé et appliqué immédiatement à l’interface.
- Gestion locale des machines et des référentiels de production.
- Utilisateurs, rôles, permissions par module et sélecteur de rôle de développement.
- Paramètres d’impression du planning machine et aperçu.
- Service de réglages versionné, centralisé et remplaçable ultérieurement par Supabase.
- Placeholders propres pour les modules métier non migrés.
- Conservation complète de l’architecture de messagerie Next.js existante.

## Fonctionnalités à différer

- Planning réel, glisser-déposer, calcul de charge et détection de conflits.
- Import ERP, nettoyage, règles qualité et promotion des données.
- Tournée atelier, maintenance, documents et fiches machines persistées côté serveur.
- Workflows complets d’actions, demandes et réunions.
- KPI réels et graphiques Chart.js.
- Génération effective de fichiers ou impression métier complète.
- Sauvegarde serveur, authentification et isolation multi-entreprise.
- Appels IA réels, Microsoft Graph et envoi d’e-mails.

## Éléments obsolètes ou dupliqués à ne pas migrer

- Le rendu global par `innerHTML`, les gestionnaires `onclick` en chaînes et l’état global mutable.
- Les fonctions historiques suffixées `_legacy` et les doubles implémentations de `getSettings`, `updateSetting`, `renderSettings` et `addMachineFromSettings`.
- Le doublon historique de `parseMachineLines` qui cassait le planning.
- L’ancien Tableau de bord inactif et l’Accueil redondant avec Mon Espace.
- Les dates de démonstration codées en dur et les données métier en mémoire globale.
- Les appels directs et dispersés à `localStorage`.
- L’ouverture Outlook par URL et toute simulation d’envoi d’e-mail.
- Les clés API côté navigateur et l’appel IA local historique.
- Chart.js chargé par CDN tant qu’aucun besoin d’analyse réel n’est validé.
- Le CSS monolithique, les styles en ligne répétés et les sélecteurs correctifs en doublon.

## Architecture cible de la migration

Les réglages sont décrits par des modèles TypeScript, initialisés par une configuration par défaut, lus et écrits par un dépôt unique et exposés aux composants par un provider React. Le stockage navigateur porte un numéro de version et une fonction de migration. Les composants ne connaissent pas directement `localStorage`, ce qui permettra de remplacer le dépôt local par Supabase sans réécrire les designers ni le shell.

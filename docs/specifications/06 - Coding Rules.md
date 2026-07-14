# Constitution produit — Règles de construction

## Intention

Le code doit préserver les principes produit : configuration centralisée, source unique, connecteurs remplaçables, logique métier indépendante de l’interface et contrôle utilisateur. Une solution techniquement correcte qui enfreint ces principes n’est pas acceptable.

## Architecture par fonctionnalité

- Chaque domaine fonctionnel possède un espace clairement identifié.
- Les routes orchestrent ; elles ne concentrent pas toute la logique.
- Les composants affichent et recueillent des intentions.
- Les hooks coordonnent un comportement d’interface réutilisable, sans devenir des dépôts cachés.
- Les services portent les cas d’usage et règles partagées.
- Les dépôts sont les seuls points d’accès à la persistance.
- Les connecteurs traduisent les fournisseurs externes vers des contrats communs.
- Les composants transversaux restent sans règle métier propre à un domaine.

## Taille et responsabilité

- Un composant possède une responsabilité principale.
- Un composant devrait rester sous 250 lignes, imports et types compris.
- Au-delà de 300 lignes, il doit être découpé avant livraison, sauf justification exceptionnelle documentée dans la revue.
- Une extraction doit correspondre à une responsabilité réelle ; elle ne sert pas uniquement à déplacer des lignes.
- Les fonctions longues ou à nombreux embranchements sont séparées en opérations nommées et testables.

## Nommage

- Les noms de code sont en anglais technique cohérent.
- Les libellés visibles et le vocabulaire métier sont en français et proviennent des Réglages lorsqu’ils varient selon l’entreprise.
- Les composants et types utilisent `PascalCase`.
- Les fonctions, variables et hooks utilisent `camelCase` ; les hooks commencent par `use`.
- Les booléens expriment leur intention avec `is`, `has`, `can` ou `should`.
- Les services, dépôts et connecteurs sont nommés d’après leur responsabilité, jamais d’après un écran temporaire.
- Les noms vagues comme `utils`, `helper`, `data` ou `manager` sont évités lorsqu’un nom métier précis existe.

## Organisation

- Le code d’un domaine reste regroupé dans sa fonctionnalité.
- Les contrats partagés sont placés à la frontière commune la plus proche.
- Une abstraction n’est rendue globale qu’après plusieurs usages réels.
- Aucun dossier générique ne doit devenir un fourre-tout.
- Les tests sont proches du comportement qu’ils protègent.
- Les valeurs initiales configurables existent dans un seul fichier central de valeurs par défaut.

## TypeScript

- Le mode strict est obligatoire.
- `any` est interdit sauf frontière héritée explicitement justifiée et isolée.
- Toute donnée externe est reçue comme inconnue puis validée.
- Les contrats métier utilisent des types explicites et des identifiants stables.
- Les états impossibles doivent être rendus difficiles à représenter.
- Les conversions de date, nombre, statut ou fournisseur sont centralisées.

## Dépôts et services

- Un objet métier possède un dépôt responsable.
- Aucun composant ne lit directement le stockage navigateur, une base ou une API externe.
- Un service ne duplique pas une règle déjà détenue par un autre service ; il l’appelle par son contrat.
- Les opérations sensibles contrôlent droits, contexte d’entreprise et validation avant mutation.
- Les lectures et écritures exposent des erreurs compréhensibles et typées.
- Le remplacement d’une implémentation ne modifie pas les consommateurs métier.

## Composants et hooks

- Les propriétés sont typées et limitées à ce dont le composant a besoin.
- L’état dérivable n’est pas dupliqué.
- Aucun effet métier n’est déclenché pendant le rendu.
- Les formulaires conservent la saisie après une erreur récupérable.
- Les états chargement, vide, erreur, succès et permission refusée sont traités lorsque pertinents.
- Les composants partagés n’importent aucun connecteur externe.

## Erreurs et observabilité

- Les erreurs sont validées et classées à la frontière où elles apparaissent.
- Le message utilisateur est en français, actionnable et sans secret.
- Une erreur ne doit pas être ignorée silencieusement.
- Les appels externes possèdent des délais d’attente et des reprises limitées adaptées à leur caractère idempotent.
- Les journaux utiles excluent secrets, jetons et contenus sensibles non nécessaires.
- Une intégration indisponible produit un état dégradé explicite.

## Interface, accessibilité et responsive

- Les parcours principaux fonctionnent sur mobile, tablette et ordinateur.
- L’interface utilise une structure sémantique, des libellés explicites, un focus visible et une navigation clavier.
- Les contrastes et informations de statut ne reposent pas uniquement sur la couleur.
- Les dates utilisent `JJ/MM/AAAA`, les heures le format 24 heures et les nombres une locale française adaptée.
- Les textes utilisateur sont en français.

## Sécurité

- Secrets, clés et jetons restent côté serveur et hors des journaux.
- Les permissions sont vérifiées au point d’action, pas seulement dans l’interface.
- Les entrées, fichiers et réponses externes sont validés.
- Les contenus non fiables ne sont jamais rendus comme code actif.
- L’envoi d’un e-mail exige une confirmation explicite après relecture.
- Les premières versions ne modifient jamais directement l’ERP.

## Qualité avant livraison

- Relire la Constitution et les documents fonctionnels concernés.
- Vérifier l’absence de duplication de données, règles et réglages.
- Tester les cas nominal, vide, erreur, permission et mode démonstration.
- Vérifier responsive et accessibilité proportionnellement au changement.
- Exécuter les contrôles de types, lint, build et tests ciblés après toute modification de code significative.
- Relire le diff et mettre à jour Todo et Changelog.

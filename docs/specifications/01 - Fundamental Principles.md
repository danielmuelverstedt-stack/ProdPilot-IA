# Constitution produit — Principes fondamentaux

Ces principes sont immuables tant qu’une décision produit explicite ne modifie pas la Constitution. Ils s’appliquent aux fonctionnalités existantes, aux migrations et à tout développement futur.

## Règle 1 — Résoudre un problème métier réel

Chaque fonctionnalité doit résoudre un problème concret rencontré par un responsable de planification, de production ou de flux. Une possibilité technique, une imitation de logiciel existant ou une préférence esthétique ne constitue pas à elle seule un besoin produit.

## Règle 2 — Configurer tout ce qui varie

Tout élément susceptible de varier selon l’entreprise, le site, l’équipe ou l’utilisateur doit être configurable dans Réglages. Aucun standard propre à une entreprise ne peut être codé en dur.

## Règle 3 — Être utilisable par une autre entreprise

Une entreprise différente doit pouvoir adopter une fonctionnalité par configuration, sans modification du code source. Les exemples et valeurs initiales ne doivent jamais devenir des hypothèses métier permanentes.

## Règle 4 — Une source de vérité par objet métier

Chaque objet métier possède une source de vérité unique et identifiable. Les autres vues le consultent ou le référencent ; elles ne créent pas de copie concurrente.

## Règle 5 — Séparer interface et logique métier

Les composants d’interface présentent l’information et recueillent les intentions. Ils ne définissent ni standards métier, ni calculs décisionnels, ni règles d’intégration.

## Règle 6 — Faire communiquer les domaines par des services centraux

Les modules ne lisent ni ne modifient directement l’état interne d’un autre module. Les échanges passent par des services et contrats centralisés qui préservent la source de vérité.

## Règle 7 — Rendre les connecteurs remplaçables

Tout système externe est accessible derrière un contrat indépendant du fournisseur. Le remplacement d’un ERP, d’une messagerie, d’un stockage ou d’un service d’IA ne doit pas imposer une réécriture des parcours métier.

## Règle 8 — Maintenir un mode démonstration

Chaque module doit pouvoir être compris et testé avec des données de démonstration clairement identifiées. Le mode démonstration respecte les mêmes contrats et règles que les sources réelles, sans donner l’impression qu’une intégration est active.

## Règle 9 — Interdire les décisions irréversibles de l’IA

L’IA peut analyser, expliquer, comparer et préparer. Elle ne prend jamais seule une décision irréversible et ne déclenche jamais silencieusement une action engageante.

## Règle 10 — Maintenir le contrôle utilisateur

L’utilisateur choisit, corrige, confirme ou refuse. Avant toute action externe ou sensible, il doit comprendre ce qui va se produire, sur quelles données et avec quelles conséquences.

## Principes complémentaires

- La source, la date et la fiabilité d’une information doivent rester compréhensibles.
- Les permissions s’appliquent aux données et aux actions, pas seulement à la visibilité des écrans.
- Les premières versions lisent l’ERP sans le modifier directement.
- Aucun e-mail n’est envoyé sans confirmation explicite après relecture du destinataire, de l’objet et du contenu.
- La simplicité et la rapidité d’usage priment sur l’accumulation de fonctions.
- Toute exception à ces principes doit être traitée comme une décision produit majeure.

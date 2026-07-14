# Constitution produit — Règles des développements futurs

## Point de départ obligatoire

Avant de concevoir ou modifier une fonctionnalité, lire l’intégralité de `docs/specifications`, puis la documentation fonctionnelle et technique concernée. Le comportement existant n’est pas une justification suffisante s’il contredit la Constitution.

## Questions de qualification

Toute proposition doit répondre clairement aux questions suivantes :

1. Quel problème réel d’un responsable de planification, de production ou de flux est résolu ?
2. Quel résultat observable doit s’améliorer : temps, oubli, risque, décision ou suivi ?
3. La fonction aide-t-elle l’utilisateur ou cherche-t-elle à remplacer un système spécialisé ?
4. Quelles informations sont nécessaires, et quelle est leur source de vérité ?
5. L’élément existe-t-il déjà dans un autre domaine ou service ?
6. Qu’est-ce qui varie selon l’entreprise, le site, le rôle ou l’utilisateur ?
7. Ces variations sont-elles gérées dans Réglages ?
8. Une autre entreprise peut-elle utiliser la fonction sans modification du code ?
9. Comment la fonction se comporte-t-elle avec des données de démonstration ?
10. Quelles décisions restent sous contrôle humain ?

Une proposition sans réponse convaincante à ces questions n’est pas prête à être développée.

## Séquence de conception

### 1. Formuler le problème

Décrire la situation actuelle, l’utilisateur concerné, la fréquence, les conséquences et le résultat attendu. Éviter de formuler le besoin comme un écran ou une technologie.

### 2. Identifier les sources

Recenser les objets nécessaires, leur propriétaire, leur fraîcheur, leurs permissions et les éventuelles incertitudes. Aucun nouveau dépôt n’est créé si une source de vérité existe déjà.

### 3. Définir la configuration

Lister tout ce qui varie et préciser son emplacement dans Réglages. Les valeurs initiales doivent être centralisées et modifiables.

### 4. Définir le parcours

Décrire le chemin le plus court entre le signal et la décision. Prévoir les cas sans donnée, source indisponible, accès refusé et information incertaine.

### 5. Définir les confirmations

Identifier toute action externe, sensible ou irréversible. Préciser ce que l’utilisateur doit voir avant de confirmer et comment il peut annuler ou corriger.

### 6. Vérifier la réutilisation

Confirmer que les services, contrats, composants et règles existants sont réutilisés. Une nouvelle abstraction doit répondre à plusieurs usages réels ou isoler une frontière remplaçable.

### 7. Prévoir le mode démonstration

Le parcours doit être testable sans compte réel et sans secret. Les données simulées sont explicites et respectent les mêmes contrats.

### 8. Définir l’acceptation

Les critères couvrent valeur métier, configuration, autre entreprise, source unique, permissions, erreurs, responsive, accessibilité, sécurité et absence d’action autonome.

## Critères de refus

Une fonctionnalité doit être refusée ou redéfinie si elle :

- duplique un objet, dépôt ou calcul existant ;
- ajoute une norme d’entreprise dans le code ;
- transforme ProdPilot IA en ERP, logiciel de planning ou GMAO généraliste ;
- impose un fournisseur à la logique métier ;
- crée une action irréversible sans confirmation ;
- masque la source ou l’incertitude d’une recommandation ;
- ne fonctionne que pour l’entreprise d’origine ;
- ne prévoit ni erreur ni mode démonstration ;
- ajoute de la complexité sans valeur utilisateur mesurable.

## Changement architectural ou constitutionnel

Toute nouvelle source de vérité, communication directe entre domaines, migration structurante, dépendance majeure ou exception à la Constitution exige une décision explicite avant développement. La décision doit préciser le problème, les alternatives, les effets et la manière de revenir en arrière.

## Définition fonctionnelle de terminé

Une fonctionnalité est terminée lorsque le problème annoncé est réellement résolu, que les variations sont configurables, que les sources sont uniques, que le mode démonstration fonctionne, que les décisions restent contrôlées et que la documentation décrit fidèlement l’état livré.

# Budget IA et facturation

## Deux contrôles complémentaires

OpenAI Platform gère le compte API, les crédits, l’usage officiel et la facturation. ProdPilot IA ne stocke aucune carte bancaire et ne modifie aucun paramètre de facturation OpenAI.

Le budget ProdPilot est un garde-fou interne. Il contrôle les appels autorisés par l’application à partir des métriques enregistrées et, pour les seuils monétaires, des tarifs validés manuellement. Il ne remplace pas les contrôles OpenAI Platform et ses estimations ne sont pas des factures.

## Politique centralisée

La configuration par défaut est définie une seule fois dans `src/features/ai/config/ai-budget-policy.ts` :

- budget mensuel indicatif : 10 ;
- avertissement mensuel : 5 ;
- arrêt interne mensuel : 10 ;
- limite quotidienne entreprise et utilisateur : 50 ;
- 10 analyses par message ;
- 20 réécritures par brouillon ;
- dépassement administrateur interdit et inactif ;
- analyse, brouillon et envoi automatiques désactivés.

Un administrateur peut modifier ces valeurs dans Réglages → IA. Un dépassement n’est possible que si son autorisation puis son activation sont toutes deux explicites ; aucun dépassement automatique n’existe.

## Ordre des contrôles

Avant chaque appel réel, le serveur résout le contexte utilisateur/entreprise disponible, contrôle les limites quotidiennes, mensuelles et par objet, puis appelle le fournisseur uniquement après une action utilisateur. Le cache est consulté avant le contrôle et évite un nouvel appel lorsqu’un résultat valide existe. Un refus est journalisé sans contenu sensible et propose le repli déterministe.

## Registre de prix et estimations

Aucun prix n’est livré par défaut. Chaque entrée doit préciser le fournisseur, le modèle exact, les prix par million de jetons d’entrée, d’entrée en cache et de sortie, la devise, la date d’effet, une note de source officielle et son état actif.

Sans tarif valide pour le modèle et la devise, l’interface affiche « Estimation financière non configurée » et aucun montant n’est inventé. Avec un tarif valide, le tableau calcule des estimations par opération, par jour, par mois, les économies de cache et les moyennes par analyse, réponse et réécriture.

## Alertes et blocage

Les alertes couvrent 50 % du budget indicatif, le seuil d’avertissement, 80 % de l’arrêt interne, l’arrêt atteint, les échecs répétés, un faible taux de cache et un volume quotidien inhabituel. Elles restent internes à l’interface ; aucune notification externe n’est envoyée.

L’arrêt monétaire nécessite un tarif validé. Sans tarif, les limites quotidiennes et par opération restent actives, mais le serveur ne peut pas convertir les jetons en montant. En production, le dépôt local est volontairement considéré comme non opérationnel : les appels réels restent bloqués jusqu’à la mise en place d’un dépôt durable partagé.

## Suivi recommandé

Commencer avec un faible crédit, vérifier le test de connexion, effectuer une seule analyse manuelle, puis comparer régulièrement les métriques internes aux tableaux officiels OpenAI Platform. Les éventuels délais de comptabilisation, changements de prix ou écarts de mesure imposent de conserver une marge de sécurité.

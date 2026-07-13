# Architecture technique — ProdPilot IA

## État et objectif

Le projet utilise actuellement Next.js 16.2.10, React 19, TypeScript strict, Tailwind CSS 4 et l’App Router sous `src/app`. L’architecture ci-dessous est une cible progressive : elle ne signifie pas que les intégrations réelles ou la base de données sont déjà implémentées.

L’objectif est un monolithe modulaire simple à déployer, dont les domaines métier restent séparés et pourront évoluer sans réécriture globale.

## Choix techniques prévus

### Frontend

- Next.js avec App Router.
- React et TypeScript.
- Tailwind CSS pour les styles.
- Composants serveur par défaut ; composants client uniquement pour l’interactivité nécessaire.
- Interfaces responsive, accessibles et rédigées en français.

### Backend

- Route Handlers et fonctions serveur Next.js pour les premiers besoins.
- Validation systématique aux frontières : formulaires, fichiers, routes et réponses externes.
- Couche de services indépendante de l’affichage pour la messagerie, OpenAI et les imports.
- Supabase pourra être ajouté lorsque l’authentification, la persistance ou les traitements le justifieront.

### Base de données

- PostgreSQL, fourni à terme par Supabase si ce choix est validé.
- Migrations versionnées et reproductibles.
- Isolation logique par `company_id` dès les modèles multi-entreprises.
- Politiques d’accès côté base, notamment Row Level Security avec Supabase, en complément des contrôles serveur.

### Intégrations

- Gmail API via Google OAuth, avec portée minimale, comme premier fournisseur réel.
- Microsoft Graph via Microsoft OAuth dans une phase suivante.
- OpenAI API appelée uniquement côté serveur.
- ERP par fichiers CSV/Excel en lecture seule dans un premier temps.
- Connexions SQL ou API ERP envisagées plus tard, derrière des adaptateurs dédiés.

## Structure `src` suggérée

Le projet utilise `src/` depuis la mise en place de l’architecture de messagerie. La structure cible est :

```text
src/
├── app/
│   ├── (auth)/
│   ├── (workspace)/
│   ├── api/
│   │   ├── auth/
│   │   └── mail/
│   ├── layout.tsx
│   └── page.tsx
├── features/
│   ├── workspace/
│   ├── mail/
│   │   ├── components/
│   │   ├── providers/
│   │   │   ├── google/
│   │   │   └── microsoft/
│   │   ├── services/
│   │   └── types/
│   ├── actions/
│   ├── erp-import/
│   ├── work-orders/
│   ├── planning/
│   ├── meetings/
│   └── machines/
├── components/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── openai/
│   ├── validation/
│   └── observability/
├── server/
│   ├── services/
│   └── repositories/
├── types/
└── config/
```

Chaque fonctionnalité contient, selon ses besoins, ses composants, opérations serveur, schémas de validation, types, tests et fonctions métier. Les composants vraiment transversaux vont dans `components/`; le code métier ne doit pas devenir un fourre-tout dans `lib/`.

## Architecture par fonctionnalités

Une page de l’App Router orchestre une fonctionnalité, mais n’héberge pas toute sa logique. Le flux normal est :

```text
Interface → opération/route serveur → service métier → dépôt ou adaptateur externe
          ← résultat typé et contrôlé ←
```

- **Présentation** : pages et composants, sans secret ni accès direct aux fournisseurs externes.
- **Application** : cas d’usage, permissions, orchestration et transactions.
- **Domaine** : règles de production, qualité, planning et états métier.
- **Infrastructure** : PostgreSQL, stockage de fichiers, adaptateurs de messagerie, OpenAI et futurs ERP.

## Flux de données général

1. L’utilisateur authentifié déclenche une consultation ou une commande.
2. Le serveur vérifie session, entreprise active, rôle et données reçues.
3. Un service métier lit ou modifie uniquement les données autorisées.
4. Les adaptateurs isolent les API et formats externes.
5. Le résultat est normalisé, typé et renvoyé à l’interface.
6. Les opérations sensibles produisent une trace d’audit adaptée.

## Flux d’authentification

1. L’utilisateur ouvre l’application et démarre une session.
2. Le fournisseur d’authentification réalise l’identification.
3. Le serveur associe l’identité à un utilisateur, une entreprise et des rôles.
4. La session côté serveur expose uniquement les informations nécessaires.
5. Chaque opération protégée revérifie l’accès ; masquer un bouton ne constitue pas une autorisation.
6. Le changement d’entreprise, s’il devient possible, recrée un contexte strictement isolé.

L’authentification applicative et l’autorisation d’un fournisseur de messagerie sont deux consentements distincts.

## Architecture et flux de messagerie

Les composants d’interface utilisent uniquement les types communs et les services de messagerie. Ils ne connaissent ni Gmail API ni Microsoft Graph. Le contrat `MailProvider` expose la connexion, la déconnexion, l’état, les messages, fils, recherches, brouillons et archivage. L’envoi est volontairement absent des premières versions. Une factory sélectionne un adaptateur lié au compte à partir du fournisseur (`google`, `microsoft` ou `mock`) et du mode du compte.

L’état actuel comprend un registre local multi-comptes réservé au développement. Plusieurs comptes par fournisseur sont autorisés, exactement un compte est actif et les comptes en mode `demo` utilisent l’adaptateur Mock. Le service `getActiveMailContext` est l’unique point de résolution pour l’espace Mails, Mon Espace et les futures fonctions IA liées aux e-mails. Un changement de compte actif ne nécessite donc aucun changement dans les consommateurs.

L’adaptateur Google Workspace réel est lié à l’`accountId` sélectionné. La clé de jeton contient l’utilisateur local, l’entreprise locale, le fournisseur et l’`accountId`. L’état OAuth est signé, expirant et lié à un nonce `HttpOnly`. Le placeholder Microsoft 365 reste inchangé.

### Flux Google Workspace local

1. L’utilisateur choisit de connecter Gmail.
2. Le serveur sélectionne le fournisseur Google puis lance Google OAuth avec les portées minimales.
3. Google retourne un code au callback serveur.
4. Le serveur vérifie l’état signé, échange le code, valide la politique d’adresses ou de domaines et stocke localement les jetons associés au compte.
5. Un service Gmail récupère les identifiants puis le détail des messages autorisés à la demande.
6. L’utilisateur relit, modifie et confirme explicitement la création d’un brouillon Gmail.
7. Aucun envoi ni archivage n’est disponible dans cette version.

Ni les jetons de messagerie ni le contenu HTML non fiable ne sont exposés au rendu. Le dépôt local de jetons doit être remplacé par un stockage chiffré et multi-entreprise avant la production. Le futur flux Microsoft 365 suivra les mêmes frontières, avec Microsoft Graph encapsulé dans son propre adaptateur.

## Architecture de la démonstration métier

Les types partagés vivent dans `src/features/demo/types`. Les entités mock et leurs références croisées sont définies une seule fois dans `src/features/demo/mock`. Le dépôt `demo-repository` expose un instantané commun aux modules et persiste les mutations attendues dans une unique clé `localStorage`. Actions, OF, opérations, planning, machines, maintenances, réunions, demandes, anomalies ERP et notifications utilisent donc les mêmes identifiants.

Cette persistance est strictement une infrastructure de démonstration. Le contrat de données permet de remplacer le dépôt par des implémentations Supabase ou serveur sans recopier les entités dans les composants. La fonction de réinitialisation est accessible depuis Réglages → Sauvegardes.

Les permissions de développement sont centralisées dans les réglages. Le shell filtre le menu et bloque le rendu d’un module lorsque le rôle actif ne possède pas le droit de lecture. Il ne s’agit pas d’une authentification : les contrôles devront être reproduits côté serveur avant tout usage partagé.

## Flux d’import ERP

1. L’utilisateur dépose un fichier CSV ou Excel.
2. Le serveur vérifie l’autorisation, le type, la taille et la structure du fichier.
3. Le fichier et ses lignes sont enregistrés dans une zone d’import brut, avec provenance et empreinte.
4. L’utilisateur mappe les colonnes source vers le modèle canonique ProdPilot.
5. Le moteur de qualité valide formats, références, doublons et règles métier.
6. Les anomalies sont classées ; aucune correction silencieuse n’est appliquée.
7. Une transformation versionnée produit des données nettoyées.
8. La promotion vers les OF exploitables est explicite, traçable et réversible.

### Séparation des données ERP

- **Données brutes** : copie immuable et horodatée de la source, jamais utilisée directement pour le planning.
- **Zone de préparation** : résultats de parsing, mappage, normalisation et anomalies.
- **Données ProdPilot nettoyées** : entités canoniques validées, utilisées par les modules métier.

Chaque enregistrement nettoyé conserve un lien vers l’import et, si possible, la ligne source. Les nouveaux imports créent des versions plutôt que d’écraser l’historique.

## Flux de données du planning

1. Le planning lit les OF, opérations, gammes, machines, calendriers et durées nettoyés.
2. Un service construit une proposition selon les contraintes et priorités disponibles.
3. Les conflits et hypothèses sont retournés avec le résultat.
4. L’utilisateur ajuste la proposition ; ces changements sont historisés dans ProdPilot.
5. Les vues par machine, « Mon Espace » et impressions utilisent une même version publiée du planning.
6. Aucune modification n’est répercutée dans l’ERP lors des premières versions.

## Principes de sécurité

- Secrets uniquement dans des variables d’environnement serveur ou un coffre adapté.
- Validation et autorisation côté serveur pour chaque entrée et opération.
- Principe du moindre privilège pour Google OAuth, Microsoft OAuth, la base et les rôles applicatifs.
- Chiffrement des communications et des jetons sensibles au repos.
- Protection contre les fichiers malveillants, limites de taille et noms de fichiers neutralisés.
- Journalisation sans clés, jetons, contenu sensible inutile ni données personnelles excessives.
- Confirmation explicite avant envoi d’e-mail ou autre action engageante.
- Gestion contrôlée de la rétention et de la suppression des imports et e-mails.
- Dépendances limitées, maintenues et évaluées avant ajout.

## Préparation multi-entreprise

- Les entités métier portent un identifiant d’entreprise non nullable dès que la persistance partagée existe.
- Les requêtes sont filtrées côté serveur et, avec Supabase, par des politiques RLS.
- Les connexions de messagerie, imports ERP, configurations de mappage et fichiers appartiennent à une entreprise.
- Les caches, chemins de stockage, journaux et tâches asynchrones incluent le contexte d’entreprise.
- Un utilisateur n’accède qu’aux entreprises et rôles explicitement attribués.

Cette préparation n’implique pas de construire immédiatement toute l’administration SaaS.

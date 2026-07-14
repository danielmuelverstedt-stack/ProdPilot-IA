# Assistant mails conversationnel

## Parcours du matin

L’utilisateur ouvre `/mails/assistant` puis choisit **Démarrer ma session mails**. Aucun appel IA n’est effectué au rendu. Le serveur résout le compte actif, lit les messages autorisés et applique d’abord un classement déterministe. La liste traditionnelle reste disponible sur `/mails`.

Le brief indique les nouveaux messages, réponses recommandées, actions suggérées, urgences et éléments à vérifier. Chaque classement conserve une raison et un niveau de confiance. Un message à faible confiance reste visible dans **À vérifier**.

## État et sécurité

La session locale de développement conserve compte actif, références numérotées, classements, propositions versionnées, brouillons, actions locales, erreurs et audit sans corps complet. Le dépôt est abstrait afin de permettre une persistance durable ultérieure. Aucun jeton OAuth ni secret n’entre dans la session.

Le compte actif est vérifié avant les commandes et après chaque création de brouillon. Les opérations sont idempotentes pendant la session. Les échecs partiels n’annulent pas les succès précédents.

## Réel et démonstration

Avec Google OAuth, la lecture et la création de brouillons utilisent les contrats existants. En démonstration, le même parcours fonctionne avec des données fictives et toute mutation est annoncée comme simulée. Les actions internes restent locales à la session dans cette version afin de ne pas modifier un autre domaine.

## Limites connues

La session est conservée en mémoire du processus local. Les préférences conversationnelles durables, QRQC, réunions, stockage multi-instance et envoi direct restent non implémentés. Les commandes de traduction ou de reformulation avancée utilisent pour l’instant un repli déterministe limité.

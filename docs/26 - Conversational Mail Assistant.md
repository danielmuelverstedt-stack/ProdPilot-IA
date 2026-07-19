# Assistant mails conversationnel

## Parcours du matin

L’utilisateur ouvre `/mails/assistant` puis choisit **Démarrer ma session mails**. Aucun appel IA n’est effectué au rendu. Le serveur résout le compte actif, lit les messages autorisés et applique d’abord un classement déterministe. La liste traditionnelle reste disponible sur `/mails`.

Le brief indique les nouveaux messages, réponses recommandées, actions suggérées, urgences et éléments à vérifier. Chaque classement conserve une raison et un niveau de confiance. Un message à faible confiance reste visible dans **À vérifier**.

## Expérience de session

La route utilise le shell applicatif standard (menu latéral, en-tête, compte actif) partagé avec le reste de ProdPilot IA, afin que la session mail reste cohérente visuellement et navigable comme tout autre module.

Le parcours suit cinq temps : accueil minimal, analyse progressive sans pourcentage artificiel, brief central, décisions une par une puis synthèse de fin. La vue **Un par un** est proposée par défaut ; la vue synthèse reste accessible. Les messages sans action sont repliés et le corps original s’ouvre dans un panneau secondaire.

L’interface utilise une colonne centrale, le fond et la couleur d’accent configurables de l’entreprise (`--app-background`, `--app-primary`, identiques à Mon Espace, Planning, etc.), des cartes sobres et des animations courtes désactivées lorsque `prefers-reduced-motion` est actif.

## État et sécurité

La session locale de développement conserve compte actif, références numérotées, classements, propositions versionnées, brouillons, actions locales, erreurs et audit sans corps complet. Le dépôt est abstrait afin de permettre une persistance durable ultérieure. Aucun jeton OAuth ni secret n’entre dans la session.

Le compte actif est vérifié avant les commandes et après chaque création de brouillon. Les opérations sont idempotentes pendant la session. Les échecs partiels n’annulent pas les succès précédents.

Le navigateur conserve aussi une mémoire IndexedDB isolée : index nettoyé, liens sources, historique de session, commandes, propositions, audits et références de brouillons. Les recherches précises, les demandes « À faire », les décisions confirmées et les propositions de réunion sont traitées localement avant toute route IA.

## Réel et démonstration

Avec Google OAuth, la lecture et la création de brouillons utilisent les contrats existants. En démonstration, le même parcours fonctionne avec des données fictives et toute mutation est annoncée comme simulée. Les actions internes restent locales à la session dans cette version afin de ne pas modifier un autre domaine.

## Limites connues

La session active reste orchestrée par le processus serveur tandis que son historique et ses sources sont projetés dans IndexedDB. La reprise transactionnelle multi-instance, le chiffrement serveur, le calendrier externe, QRQC et l’envoi direct restent non implémentés. Les commandes de traduction ou de reformulation avancée utilisent pour l’instant un repli déterministe limité.
# Brief de démarrage systématique

Chaque démarrage produit un texte visible, même sans nouveau message. Quatre états sont pris en charge : nouveaux mails, éléments locaux en attente, boîte à jour et synchronisation indisponible. En mode démonstration, le brief le précise explicitement.

Les comptes proviennent de la mémoire locale isolée du compte actif : messages non lus ou sans statut, réponses et brouillons, sessions non résolues, relances, réunions préparées et actions ouvertes. Les phrases simples sont déterministes ; elles n’appellent jamais OpenAI.

# Architecture UX en quatre états

1. **Veille** : centre de commande clair, alimenté uniquement par la mémoire locale, sans conversation ni champ texte.
2. **Conversation** : créée après « Démarrer la session » ; le brief devient vocal si le réglage l’autorise.
3. **Travail actif** : validations, brouillons et timeline occupent l’espace principal ; l’historique conversationnel reste secondaire et replié.
4. **Session terminée** : résultats exécutés, éléments restant à vérifier et retour au centre de commande.

L’ouverture de la page ne contacte ni Gmail ni OpenAI. Elle peut uniquement lire la projection locale, recalculer des compteurs déterministes et afficher des résultats déjà présents. Toute synchronisation distante reste derrière l’action explicite de démarrage.

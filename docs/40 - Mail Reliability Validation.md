# Validation de fiabilité du module Mail

Date : 19/07/2026  
Environnement : Windows, Next.js 16.2.10 en développement local, un seul serveur sur le port 3000.

## Résultat

Le chargement complet de la boîte de réception et la conversation IA multi-tour sont validés par les routes locales et les tests automatisés. Le module ne masque plus une erreur Gmail par une liste vide. Les tests matériels voix, microphone, haut-parleurs et les captures dans Edge/Chrome restent à réaliser manuellement, car aucun navigateur intégré n’était exposé pendant cette session.

## Audit critique voix et conversation — 20/07/2026

### Causes racines

1. `MailAssistantVoiceInput` dépendait directement des callbacks `onTranscript` et `onSubmit`. Chaque transcription partielle modifiait le parent, recréait `onVoiceSubmit`, nettoyait l’effet et appelait `SpeechRecognition.abort()`.
2. Le jeton d’écoute automatique pouvait être retraité après un changement d’état et provoquer des démarrages concurrents.
3. `Ctrl+Espace` était le raccourci initial. ProdPilot n’appelle jamais Plaud, mais ce raccourci peut être capturé globalement par Plaud sous Windows.
4. `MailAssistantSpeechOutput` dépendait du callback `onFinished`. Un rendu du parent pouvait donc appeler `speechSynthesis.cancel()` pendant la lecture.
5. La session conservait tout l’historique, mais seuls les dix derniers tours étaient transmis au fournisseur IA sans condensation des tours antérieurs.

### Corrections

- callbacks vocaux stabilisés par références React et cycle de vie de `SpeechRecognition` limité aux vrais changements de configuration ;
- intention d’écoute, reprise navigateur, arrêt manuel et jeton automatique consommé une seule fois ;
- traitement depuis `resultIndex` pour éviter la duplication des résultats finaux ;
- mode initial « Cliquer pour parler » et migration `Ctrl+Espace` vers `F8` ;
- callback TTS stabilisé, hauteur neutre, vitesse plus lente et prévisualisation par URI exacte ;
- anciens tours de conversation condensés puis joints aux dix tours complets les plus récents ;
- diagnostic intégré couvrant micro, permission, STT, TTS, IA, streaming, Plaud, navigateur et erreurs ;
- saisie texte indépendante des erreurs audio.

### Limites de recette

Le navigateur intégré n’était pas disponible pendant cet audit. La recette matérielle Edge et Chrome reste obligatoire selon `docs/30 - Mail Assistant User Testing.md`. Le streaming des jetons n’est pas encore implémenté et apparaît comme « Non activé » dans le diagnostic.

## Anomalies trouvées et corrections

### Gmail incomplet

Avant correction, le fournisseur ajoutait la requête `after:yesterday -in:spam -in:trash`, limitait la lecture à 25 messages par défaut et ne suivait pas `nextPageToken`. La page ne recevait que 4 messages alors que Gmail déclarait 87 messages dans `INBOX`.

Correction : la page charge `INBOX` sans filtre temporel, suit toutes les pages, récupère les détails par lots bornés et compare le résultat à `messagesTotal`. Les catégories Gmail restent incluses lorsqu’elles portent encore le libellé `INBOX`. Les archivés, le spam et la corbeille sont volontairement exclus de cette vue ; ils ne sont pas perdus dans Gmail.

### Conversation non naturelle et session instable

Avant correction, une phrase naturelle tombait sur une réponse déterministe générique et ne déclenchait aucun appel OpenAI. Quatre pauses de 240 ms ajoutaient environ 960 ms à chaque commande. Le dépôt de sessions utilisait une `Map` propre au module compilé ; les bundles de démarrage et de commande pouvaient donc ne pas partager la même session et répondre 401 après recompilation locale.

Correction : les phrases conversationnelles explicitement envoyées utilisent l’API Responses OpenAI avec historique borné, budget et consentement. La session est partagée via `globalThis` dans le processus local. Un `AbortController` permet d’interrompre la réponse. Les actions Gmail restent déterministes et protégées par leurs confirmations.

### Voix et repli texte

Avant correction, une erreur `speechSynthesis` arrêtait silencieusement la lecture. Il n’existait pas de préférence indépendante pour le texte et la voix.

Correction : **Réponse écrite** et **Réponse vocale** peuvent être activées séparément ou ensemble, sans pouvoir désactiver les deux. Une erreur TTS affiche le texte avec un avertissement et ne bloque pas la conversation.

### Plaud

L’audit de `src`, des réglages, des variables d’environnement, des dépendances et du build local n’a trouvé aucun connecteur, jeton, session, provider ou état React Plaud. Il n’existait donc aucune connexion Plaud réelle à interroger ou déconnecter. L’origine visuelle historique du statut « connecté » n’a pas pu être reproduite sans navigateur intégré.

Le diagnostic applique désormais une règle vérifiable : Plaud reste en **Avertissement / Non connecté**. Si le navigateur annonce un périphérique audio dont le libellé contient Plaud, il est signalé comme matériel local seulement et jamais comme session applicative.

### Diagnostic absent

La route `/api/mail/diagnostics` et l’écran `/mails/diagnostic` exposent maintenant : connexion Gmail, OAuth, comptes, scopes, volumes synchronisé/réel, dernière synchronisation, durée, pages, erreurs, OpenAI et quota interne. Le client complète avec TTS, STT, Plaud, microphone et haut-parleurs. Aucun secret, jeton ou contenu de mail n’est renvoyé.

## Mesures observées

| Contrôle | Avant | Après |
| --- | ---: | ---: |
| Messages affichés / détectés dans `INBOX` | 4 / 87 | 87 / 87 |
| Pagination Gmail | absente | 1 page sur la boîte actuelle, boucle `nextPageToken` active |
| Synchronisation fournisseur complète | non mesurée | 2 699 ms |
| Route complète, cache chaud | non disponible | 52 à 76 ms avant redémarrage ; 402 ms après redémarrage avec sérialisation de 87 messages |
| Délai artificiel par commande | environ 960 ms | 0 ms |
| Conversation OpenAI, tour 1 | aucun appel | HTTP 200 en 7 342 ms |
| Conversation OpenAI, tour 2 avec contexte | aucun appel | HTTP 200 en 3 743 ms |
| Mémoire du serveur de développement | 2 565,8 Mio après de nombreuses recompilations | 1 996,9 Mio après redémarrage et recompilation initiale |

Les deux mesures mémoire ne constituent pas un benchmark comparable : le cache de compilation et les requêtes exécutées diffèrent. Aucune amélioration mémoire n’est donc revendiquée.

## Validation exécutée

- `npx tsc --noEmit` : réussi.
- `npm run lint` : réussi.
- `npm test` et tests de fiabilité ajoutés : 109 tests réussis, 0 échec.
- `npm run build` : réussi, 41 pages générées ; routes Mail et diagnostic incluses.
- `/mails` : HTTP 200.
- `/mails/assistant` : HTTP 200.
- `/mails/diagnostic` : HTTP 200.
- `/api/mail/diagnostics` : HTTP 200, 11 contrôles serveur.
- `/api/mail/messages?all=true` : HTTP 200, 87 synchronisés, 87 détectés, synchronisation complète.
- ouverture d’un message réel par `/api/mail/messages/[id]` : HTTP 200, identifiant, sujet, corps et pièces jointes cohérents.
- conversation réelle sur deux tours : HTTP 200, même identifiant de session, historique passé de 3 à 5 entrées, contexte confirmé.
- un seul processus Next écoute sur le port 3000 après le build et le redémarrage.

## Validations encore nécessaires avant reprise des fonctionnalités Mail

- Captures et recette visuelle dans le navigateur intégré ou dans Edge/Chrome.
- Dictée réelle, alternance clavier/voix, interruption pendant une réponse, TTS, STT, micro et haut-parleurs.
- Déconnexion puis reconnexion OAuth réelle et changement de compte Gmail.
- Création de brouillons Gmail avec affichage puis confirmation explicite ; aucun envoi ne doit être effectué.
- Expiration forcée du jeton et échec partiel Gmail/OpenAI.
- Les actions « locales » de la session Assistant ne sont pas encore un stockage durable du module Actions ; elles doivent rester présentées comme préparées dans la session, pas comme une mutation externe persistante.

Tant que ces contrôles manuels ne sont pas terminés, la fiabilisation ne doit pas être considérée comme validée à 100 % pour un usage de production.

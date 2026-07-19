# Guide vocal de l’Assistant mails

La dictée utilise `SpeechRecognition` ou son préfixe navigateur lorsqu’il existe. Elle ne démarre qu’après un clic sur **Micro**, s’arrête à la demande ou à la fin de la phrase et n’écoute jamais en arrière-plan.

La transcription apparaît dans le champ texte et reste modifiable avant envoi. Le bouton annonce son état avec `aria-pressed`, un statut visible indique l’écoute et les erreurs renvoient vers la saisie clavier. Aucun audio n’est transmis à un service ajouté par ProdPilot IA.

Si le navigateur ne prend pas en charge cette API, l’interface affiche une information claire et conserve toutes les fonctions texte.

Les réglages **Réponse écrite** et **Réponse vocale** sont indépendants et peuvent être actifs simultanément. L’interface empêche toutefois de désactiver les deux canaux à la fois. Une erreur de synthèse vocale affiche immédiatement le texte et un avertissement non bloquant.
# Lecture du brief

Si la voix est activée, le navigateur lit automatiquement le texte exact affiché. Les contrôles Pause, Reprendre, Arrêter et Écouter à nouveau restent visibles. La voix, la langue, la vitesse et le volume viennent des réglages locaux. Aucun fournisseur vocal externe n’est utilisé.

Le microphone reste coupé et visible par défaut. L’écoute automatique ne commence qu’après la lecture lorsque les deux réglages « écouter après le brief » et « auto après lecture » sont activés. Si les API navigateur sont absentes, le brief visuel reste utilisable.

# Interaction vocale principale

Le mode initial est le push-to-talk avec `Ctrl + Espace`. Le maintien démarre la reconnaissance et le relâchement l’arrête. Espace seul est ignoré dans les champs de saisie ; un raccourci comportant un modificateur reste utilisable. Le clic sur Micro offre le même contrôle démarrer/arrêter.

L’écran expose toujours l’état du microphone, la durée, la transcription courante et l’annulation. La permission n’est demandée qu’après une action explicite. La conversation continue est opt-in, possède un arrêt visible et peut être coupée lorsque la page perd le focus.

La sortie passe par le contrat `TtsProvider`. `system-browser` est gratuit et actif par défaut ; les fournisseurs premium futurs restent non configurés et ne déclenchent aucun appel. Les voix sont actualisées avec `voiceschanged`. Le style « Assistant britannique » est un réglage original de rythme et de hauteur ; il n’imite aucun personnage, acteur ou voix protégée.

Le bouton **Interrompre** annule la requête conversationnelle active et arrête la synthèse vocale. La saisie clavier et la dictée peuvent ensuite reprendre dans la même session sans rechargement.

# Diagnostic du microphone et choix de voix

Le panneau Voix énumère les entrées audio sans demander la permission. Les noms peuvent rester masqués jusqu’au clic sur « Tester mon microphone ». Le test utilise localement `AudioContext`, `AnalyserNode` et, lorsque disponible, `MediaRecorder`. Il mesure niveau et pic, limite la durée, puis arrête toutes les pistes et ferme le contexte audio.

La réécoute repose sur une URL d’objet temporaire révoquée après lecture ou à la fermeture du panneau. Aucun audio ne rejoint les réglages, IndexedDB, une route serveur ou un fournisseur externe.

Les voix système sont relues après un délai si la première liste est vide et à chaque événement `voiceschanged`. Le sélecteur conserve URI, nom et locale, puis applique le repli URI → nom et locale → défaut de locale → défaut navigateur. Le genre n’est jamais déduit lorsque la plateforme ne l’expose pas.

Plaud n’est pas un fournisseur configuré dans ProdPilot. L’écran Mail Diagnostic peut détecter un libellé de périphérique audio contenant « Plaud », mais l’affiche uniquement comme périphérique local, avec un statut d’avertissement et jamais comme connexion applicative active.

# Confidentialité de la mémoire Mail

## Données autorisées

La mémoire peut conserver des métadonnées de messages, le texte nettoyé lorsque le réglage l’autorise, des empreintes, analyses, décisions, engagements, préférences confirmées, sessions et liens sources.

Elle ne conserve jamais : jeton OAuth, secret Google, clé OpenAI, mot de passe, paiement, HTML brut inutile, ressource distante cachée, contenu binaire, enregistrement microphone ou erreur fournisseur complète.

Les textes sont neutralisés avant indexation. Le HTML source n’est jamais exécuté. Les sauvegardes appliquent une seconde exclusion des champs sensibles et du binaire.

## Isolation et effacement

Les données réelles et de démonstration sont séparées. Le changement de compte change le contexte de mémoire. L’utilisateur peut effacer analyses, sessions ou toute la mémoire du compte actif avec confirmation. Les décisions confirmées ne sont jamais supprimées silencieusement par la rétention automatique.

IndexedDB ne suffit pas à une production partagée. Un stockage serveur futur devra être chiffré, authentifié et isolé par entreprise.

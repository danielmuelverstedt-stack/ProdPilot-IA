# Confidentialité de l’IA Mail

Après consentement et clic explicite, le serveur peut transmettre : objet, expéditeur, destinataires utiles, date, corps texte réduit du message sélectionné, quelques échanges récents et, si autorisé, nom/type/taille d’un nombre limité de pièces jointes. Un aperçu de catégories, sans contenu sensible, est affiché.

Ne sont jamais transmis : boîte complète, messages sans rapport, HTML brut lorsqu’un texte est disponible, pièces jointes binaires, jetons OAuth, clés API, secrets, identifiants, diagnostics internes ou données ERP.

Le réducteur supprime espaces répétés, liens de suivi inutiles, historiques cités dupliqués, longues mentions légales et signatures répétées. Il déduplique le fil, conserve le message sélectionné, limite la taille et signale toute troncature.

Les métriques contiennent seulement opération, modèle, contexte de compte, référence hachée, jetons, durée, cache, succès et erreur sûre. Aucun corps ou prompt complet n’est journalisé. Le cache local contient une analyse validée et son empreinte, jamais de secret. Les requêtes OpenAI utilisent `store: false`. La politique contractuelle du fournisseur doit être validée avant activation réelle.

# Architecture du domaine Mails

## Statut et périmètre

Le domaine Mails est une couche d’assistance au traitement des signaux reçus, pas une boîte de messagerie complète. Il fonctionne avec des comptes de démonstration et l’intégration Google Workspace. La conversation explicitement déclenchée peut utiliser OpenAI côté serveur. Microsoft 365, IMAP, l’envoi, la suppression, l’OCR et le stockage de production ne sont pas implémentés.

L’architecture est prête à recevoir des implémentations réelles derrière ses contrats, mais elle n’est pas déployable en production partagée tant que l’authentification applicative, les permissions et le stockage chiffré des jetons ne sont pas disponibles.

## Chaîne de responsabilité

```text
Réglages du compte
  → dépôt de comptes
  → contexte du compte actif
  → factory de fournisseurs
  → services métier déterministes
  → routes serveur
  → composants Mails
```

- Les composants ne connaissent ni Gmail API ni Microsoft Graph.
- Le contexte actif garantit que Mails et les futures fonctions IA utilisent un seul compte.
- Les jetons Google restent dans un dépôt serveur séparé du registre des comptes.
- Les messages sont normalisés vers les types communs avant d’atteindre l’interface.

## Composants

- `MailWorkspaceLoader` orchestre chargement, connexion requise, erreur et état vide.
- `MailWorkspace` conserve uniquement l’état interactif de la vue.
- `MailToolbar` porte recherche, tri et filtres avancés.
- `MailMessageCard` présente un message normalisé et ses actions.
- `MailAttachments` présente les métadonnées ; aperçu et téléchargement restent désactivés.
- `MailDraftPanel` affiche le destinataire, l’objet, le contenu et la confirmation dédiée.
- `MailWorkspaceState` centralise les états chargement, vide, erreur et connexion requise.
- Les composants de connexion gèrent les cartes de comptes, leur résumé actif et leurs paramètres.

Les composants interactifs sont des Client Components ciblés. Les pages et intégrations sensibles restent côté serveur.

## Services

| Service | Responsabilité |
| --- | --- |
| `mail-account-context` | Résoudre le compte actif et son fournisseur. |
| `mail-message-cache` | Mettre en cache pendant 60 secondes une synchronisation Gmail complète, isolée par compte et options. |
| `mail-connections` | Ajouter, activer, tester, synchroniser, paramétrer et déconnecter un compte. |
| `mail-search` | Appliquer une recherche et des filtres indépendants du fournisseur. |
| `mail-intelligence` | Exposer les contrats IA et les résultats déterministes temporaires. |
| `mail-management-service` | Valider les mutations, relire Gmail, journaliser le résultat et restaurer les libellés lors d’une annulation. |
| `mail-workflow` | Traduire les vues et actions ProdPilot vers les identifiants de libellés Gmail. |
| `mail-classification-service` | Produire une décision stricte et déterminer si une proposition respecte les garde-fous d’automatisation. |
| `mail-attachments` | Décrire icône, taille et capacités futures d’une pièce jointe. |
| `mail-drafts` | Préparer copie de travail, modifications et révisions d’un brouillon. |
| `mail-conversations` | Construire une conversation normalisée depuis un fil. |
| `mail-notifications` | Créer des événements de notification normalisés, sans envoi externe. |
| `mail-server-diagnostics` | Vérifier OAuth, Gmail, volumes, synchronisation, erreurs, OpenAI et quota interne sans exposer de secret. |

## Dépôts

`MailAccountRepository` est la source de vérité des comptes et préférences. Son implémentation locale écrit dans `.local-data` uniquement en développement. Le stockage version 3 migre les anciens réglages en ajoutant les valeurs manquantes sans supprimer les comptes ni conserver des propriétés inconnues.

`GoogleTokenRepository` reste une frontière séparée et exclusivement serveur. Son implémentation locale doit être remplacée par un stockage chiffré lié à l’utilisateur et à l’entreprise avant la production.

`MailMemoryRepository` conserve dans IndexedDB une projection locale sourcée des messages synchronisés, sessions, décisions et liens. Il ne contient aucun jeton et ne remplace ni le registre des comptes ni Gmail. Son adaptateur est versionné et remplaçable par un stockage serveur futur.

`MailActivityRepository` et `MailRuleRepository` conservent en développement un journal borné des mutations et les règles approuvées dans `.local-data`. Gmail reste la source de vérité des libellés : chaque mutation est relue auprès du fournisseur avant d’être annoncée comme réussie. Ces dépôts locaux doivent devenir chiffrés, transactionnels et multi-tenant avant production.

## Expérience et accessibilité

- Interface française et dates européennes.
- Recherche rapide, filtres avancés et tri sans dépendance externe.
- Densité compacte ou confortable et aperçu configurable.
- États explicites pour chargement, vide, erreur et connexion absente.
- Focus visible, commandes natives, dialogues clavier et statuts textuels.
- Aucun HTML de message non fiable n’est rendu comme HTML actif.
- Les actions de workflow confirmées modifient les libellés Gmail réels ; l’ancien masquage local reste distinct et explicitement libellé.
- Créer un brouillon et envoyer sont deux actions distinctes ; l’envoi n’existe pas.

## Réglages Mails

Les préférences par compte comprennent : langue, ton, signature, densité, aperçu, position du volet, mode conversation, regroupement, formats européens, comportement de réponse, synchronisation, volume, non lus, métadonnées de pièces jointes, filtre et tri initiaux, dossiers favoris, notifications et préparation de l’historique/autosave des brouillons.

La préparation automatique de brouillons est désactivée par défaut. L’envoi est toujours forcé à `false`. Les couleurs et le thème global restent dans les Réglages généraux afin d’éviter une seconde source de vérité.

## Recherche et filtres

`MailSearchCriteria` couvre objet, expéditeur, destinataire, corps, pièce jointe, lecture, importance, indicateur, réponse attendue, période, fournisseur, compte, labels, tags, priorité, catégorie et futurs mots-clés IA. Le mode démonstration applique les critères localement. Google traduit le même contrat vers une requête Gmail limitée et validée, puis les résultats restent filtrés par le service commun.

## Synchronisation Gmail

La page Mails charge toutes les pages de `INBOX` avec `nextPageToken`, par lots Gmail de 500 identifiants, puis récupère les détails par lots bornés. Aucun filtre temporel n’est appliqué. `includeSpamTrash` reste désactivé : les messages archivés, le spam et la corbeille ne font pas partie de la boîte de réception, tandis que toutes les catégories Gmail encore étiquetées `INBOX` sont incluses.

Le total synchronisé est comparé à `messagesTotal` du libellé `INBOX`. Le résultat expose le nombre détecté, le nombre chargé, le nombre de pages, la durée, la date et l’origine cache/Gmail. Une différence rend la synchronisation incomplète au lieu d’être masquée. Les mutations confirmées invalident le cache.

L’écran `/mails/diagnostic` complète ces contrôles serveur par les capacités navigateur TTS, STT, microphone et haut-parleurs. ProdPilot ne contient aucun connecteur ni session Plaud : un périphérique dont le nom contient Plaud reste un simple périphérique audio et n’est jamais déclaré connecté.

## Fournisseurs

Le catalogue commun décrit Google Workspace, Microsoft 365, IMAP et démonstration, avec leurs capacités. La factory retourne :

- l’adaptateur Gmail existant pour un compte Google OAuth ;
- l’adaptateur de démonstration pour tout compte en mode démonstration ;
- un adaptateur indisponible explicite pour Microsoft 365 et IMAP.

Ajouter un fournisseur futur demande un adaptateur et une entrée de catalogue, sans réécrire les composants métier.

## Pièces jointes

Le modèle prévoit métadonnées, capacité d’aperçu, état OCR et état d’analyse future. Cette version affiche nom, type et taille. Aucun octet n’est téléchargé, aucun OCR n’est exécuté et aucune analyse IA n’est lancée.

La mémoire locale applique une politique plus stricte : elle conserve uniquement identifiant fournisseur, message parent, nom, MIME, taille approximative, lien source et état d’accès. Les objets binaires sont refusés par l’adaptateur.

## Brouillons et conversations

Le modèle de brouillon prévoit états, modifications non enregistrées, version et provenance. Les révisions et l’autosave sont des contrats déterministes, sans dépôt persistant dédié. Gmail conserve la création confirmée existante ; aucun envoi n’est disponible.

Le modèle de conversation couvre participants, chronologie, messages cités et mémoire IA future. Aucune réponse, réponse à tous ou transmission externe supplémentaire n’est déclenchée dans cette version.

## IA et conversation

Les interfaces `MailSummaryService`, `MailClassificationService`, `MailReplySuggestionService`, `MailPriorityService`, `MailActionDetectionService` et `MailEntityExtractionService` conservent leur moteur déterministe local. Une instruction conversationnelle explicite de l’utilisateur passe par `MailConversationService` et l’API Responses OpenAI lorsque la configuration et le consentement de confidentialité sont valides. L’historique récent de la session est transmis de manière bornée et la session serveur est partagée entre les bundles Next locaux.

Les actions sur Gmail restent interprétées et autorisées par le moteur déterministe. Une conversation OpenAI ne peut ni envoyer un mail, ni contourner la confirmation d’un brouillon, ni déclencher une mutation. Les appels sont bornés par les budgets, journalisés sans contenu de mail et annulables par `AbortSignal`.

## Notifications

Le contrat couvre nouveau message, synchronisation, perte de connexion, erreur fournisseur, brouillon enregistré et analyse IA future. Il ne crée actuellement ni notification système, ni e-mail, ni mutation externe.

## Guide de recette Mails

1. Vérifier qu’un compte de démonstration affiche les messages sans identifiant externe.
2. Tester recherche, lecture, période, priorité, pièce jointe, catégories et réinitialisation.
3. Vérifier densité, aperçu, langue, signature, filtre et tri après sauvegarde des paramètres.
4. Ouvrir un message, vérifier les métadonnées de pièce jointe et préparer une réponse.
5. Confirmer qu’une démonstration ne crée aucun brouillon externe.
6. Sans identifiants Google, vérifier l’état « Configuration manquante » sans crash.
7. Pour Google local, suivre `docs/09 - Google Mail Setup.md` et vérifier qu’un brouillon confirmé n’est jamais envoyé.
8. Tester clavier, focus, mobile, tablette, état vide, erreur et reconnexion.

## Feuille de route et intégrations futures

1. Étendre les tests automatisés aux erreurs HTTP réelles et aux volumes Gmail élevés.
2. Ajouter authentification applicative, permissions et isolation par entreprise.
3. Remplacer les deux stockages locaux par des dépôts chiffrés de production.
4. Valider Google OAuth réel de bout en bout avec les identifiants autorisés.
5. Implémenter Microsoft OAuth et Microsoft Graph dans l’adaptateur prévu.
6. Qualifier IMAP avant toute implémentation et définir ses garanties de sécurité.
7. Étendre l’IA contrôlée uniquement aux opérations explicitement déclenchées, sans remplacer les garde-fous déterministes des mutations.
8. Ajouter aperçu/téléchargement sécurisé, OCR et analyse seulement après validation produit.
9. Concevoir l’envoi séparément avec relecture complète et confirmation explicite ; il reste hors périmètre actuel.

# Gestion opérationnelle des mails

## Objectif et source de vérité

La gestion Mail transforme Gmail en file de travail courte sans créer une seconde boîte de réception. Les libellés Gmail sont la source de vérité. L’interface relit les messages après chaque mutation et n’affiche une réussite que lorsque Gmail confirme les libellés réellement présents.

Cette évolution ne change ni le fournisseur OAuth, ni le stockage des jetons, ni le mécanisme de brouillon. Elle ajoute la portée `gmail.modify`; `gmail.send` reste absent et aucun envoi n’est possible.

## États de workflow

| Vue ProdPilot | Libellé Gmail | Effet sur `INBOX` |
| --- | --- | --- |
| Nouveaux | `UNREAD` et `INBOX` | conservé |
| À traiter | `ProdPilot/À traiter` | ajouté ou conservé |
| En attente | `ProdPilot/En attente` | retiré par défaut |
| Traités | `ProdPilot/Traités` | retiré |
| Archivés par IA | `ProdPilot/Archivé par IA` | retiré |

Le choix produit pour **En attente** est d’archiver le message de la boîte principale afin que la vue Gmail reste courte. **Restaurer** remet `INBOX` et `ProdPilot/À traiter`. Un archivage manuel retire `INBOX` et les quatre libellés de workflow; un archivage attribué à l’IA ajoute son libellé dédié.

La création des quatre libellés est idempotente et sérialisée dans le processus serveur pour éviter les doublons lors de requêtes concurrentes.

## Actions et confirmations

Les actions unitaires portent sur le fil actuellement sélectionné. Les actions groupées portent sur les identifiants de messages explicitement cochés et utilisent `messages.batchModify`, avec la limite Gmail de 1 000 identifiants. Le serveur refuse une sélection vide, invalide, extérieure au compte actif ou non confirmée.

Chaque succès journalise uniquement les métadonnées nécessaires : compte, action, origine, identifiants, libellés avant/après, raison, confiance éventuelle et résultat Gmail. Aucun corps de mail, secret OAuth ou jeton n’est inscrit dans ce journal.

L’annulation relit l’entrée, vérifie le même compte, puis restaure exactement les libellés précédents message par message. Elle ne peut être exécutée qu’une fois. Les erreurs Gmail restent visibles et ne sont jamais transformées en succès vide.

Une mutation de fil Gmail concerne les messages présents au moment de l’appel. Un message futur du même fil peut ne pas hériter de l’état et doit être reclassé par une règle ou une nouvelle action.

## Classification et règles

Le classificateur retourne une structure stricte : classification, confiance, raison, actions, échéances, libellés recommandés et opération proposée. Une réponse hors schéma ou une opération inconnue est rejetée.

L’archivage automatique n’est admissible que si toutes les conditions suivantes sont vraies :

- le mail est de faible valeur et ressemble à une newsletter;
- la confiance atteint le seuil configuré;
- une règle d’archivage active a été créée explicitement par l’utilisateur et correspond au mail;
- aucune pièce jointe, importance, étoile, action ou échéance n’est détectée;
- aucun terme métier protégé lié à la production, la qualité, la livraison ou une commande n’est présent.

Dans cette première livraison, l’API de classification produit une prévisualisation et indique l’éligibilité, mais ne déclenche aucune mutation en arrière-plan. L’utilisateur confirme le lot depuis l’interface. Ce garde-fou évite un archivage silencieux avant recette réelle des règles.

## Migration progressive

La migration est une prévisualisation bornée aux 25 mails actuellement chargés. Elle sépare les propositions `À traiter` et les candidats d’archivage couverts par une règle. Aucun changement n’a lieu au chargement ni pendant l’analyse. Chaque groupe doit être confirmé séparément, puis peut être annulé depuis l’historique.

Avant une migration de plusieurs milliers de messages, il faut ajouter pagination, reprise idempotente, quota Gmail, rapport d’échec partiel et confirmation dédiée. Ce volume reste hors du périmètre actuel.

## Stockage local et production

En développement individuel, les règles et le journal sont stockés atomiquement dans `.local-data/mail-management-rules.json` et `.local-data/mail-activity.json`, tous deux exclus de Git. Le journal est borné à 500 entrées.

Avant production partagée, ces dépôts doivent être remplacés par un stockage chiffré, authentifié, transactionnel et isolé par entreprise. Le scope sensible `gmail.modify` doit aussi être déclaré et, selon l’audience Google Cloud, soumis au processus de validation Google approprié.

## Recette manuelle

1. Reconnecter le compte si l’interface signale l’absence de `gmail.modify`.
2. Créer/vérifier les libellés depuis la page Mails.
3. Classer un fil en `À traiter`, `En attente`, puis `Traité`; vérifier Gmail après chaque étape.
4. Archiver et restaurer un fil; vérifier `INBOX` et les libellés.
5. Marquer lu/non lu et tester un lot de plusieurs messages.
6. Annuler la dernière mutation et vérifier la restauration exacte dans Gmail.
7. Créer une règle de newsletter, lancer la prévisualisation de migration et confirmer uniquement un petit lot de test.
8. Vérifier qu’un mail avec pièce jointe ou terme métier protégé reste en vérification humaine.

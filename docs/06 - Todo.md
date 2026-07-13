# Backlog — ProdPilot IA

Les cases cochées correspondent uniquement à un travail effectivement présent et relu dans le dépôt au 13/07/2026. L’ordre à l’intérieur de chaque section indique la priorité pratique ; il ne constitue pas un calendrier.

## Maintenant

- [x] Créer le registre multi-comptes de messagerie avec Google Workspace, Microsoft 365 et Mock, plusieurs comptes par fournisseur et un compte actif unique.
- [x] Faire dépendre Mon Espace, Mails et le futur contexte IA uniquement du compte de messagerie actif.
- [x] Stabiliser le socle existant : audit global, validation stricte des sauvegardes de réglages, nettoyage du code mort et contrôles qualité complets.
- [x] Auditer le prototype historique et documenter la stratégie de migration dans `docs/08 - Legacy Migration.md`.
- [x] Migrer l’identité visuelle historique vers un shell responsive avec menu configurable, en-tête, profil et notifications.
- [x] Rendre les cartes de Mon Espace configurables : ordre, visibilité, libellé, icône, couleur et taille.
- [x] Créer le centre de réglages local avec identité société, thème, production, utilisateurs, rôles, impression, sauvegardes et journal.
- [x] Centraliser les réglages dans un service TypeScript versionné basé sur `localStorage` et remplaçable par Supabase.
- [x] Créer les dépôts mock centralisés pour actions, OF, opérations, planning, machines, maintenance, réunions, demandes, qualité ERP et notifications.
- [x] Créer les routes fonctionnelles Actions, OF, Planning, Réunions, Suivi, Parc Machines, Qualité ERP et Analyses.
- [x] Relier les actions créées depuis les réunions, demandes et anomalies ERP au dépôt Actions global.
- [x] Ajouter l’impression configurable du planning, les confirmations de déplacement et les alertes de conflits.
- [x] Faire respecter la visibilité et le droit de lecture du rôle de développement dans le shell et sur les routes rendues.
- [x] Ajouter la réinitialisation des données métier de démonstration depuis Réglages.

- [x] Finaliser la documentation initiale du projet.
- [x] Créer les instructions opérationnelles de contribution dans `AGENTS.md`.
- [x] Créer le shell de « Mon Espace » avec ses états vide, chargement et erreur.
- [x] Créer la barre latérale et la navigation responsive et accessible.
- [x] Créer la première vue fonctionnelle de « Mon Espace » avec six cartes métier, des placeholders et une zone assistant.
- [x] Créer l’abstraction de messagerie indépendante du fournisseur et sa factory.
- [x] Créer l’écran Réglages → Connexions → Messagerie avec Google Workspace et Microsoft 365.
- [x] Créer le fournisseur Gmail simulé et l’emplacement Microsoft Graph.
- [x] Remplacer le fournisseur Gmail simulé par l’intégration Google Workspace côté serveur.
- [x] Créer une interface simulée pour les e-mails, clairement signalée comme telle.
- [x] Implémenter Google OAuth côté serveur avec les portées minimales et la restriction du compte autorisé.
- [x] Lister les messages Gmail reçus depuis la veille avec leur contenu texte et leurs métadonnées.
- [ ] Créer les résumés d’e-mails avec l’IA et afficher leur provenance.
- [x] Créer des brouillons Gmail modifiables après confirmation explicite, sans fonctionnalité d’envoi.
- [ ] Remplacer le dépôt local de jetons Google par un stockage chiffré associé à l’utilisateur et à l’entreprise.
- [x] Raccorder Google OAuth au registre multi-comptes avec des jetons strictement associés à chaque `accountId`.
- [ ] Implémenter Microsoft OAuth et Microsoft Graph.
- [ ] Ajouter l’authentification applicative avant tout déploiement partagé de l’intégration Gmail.
- [ ] Protéger toutes les routes de messagerie par une session applicative et une autorisation liée à l’entreprise.
- [ ] Ajouter des tests automatisés ciblés pour les réglages, le parseur Gmail, la génération MIME et les Route Handlers.

## Ensuite

- [ ] Réduire le nombre d’appels Gmail nécessaires au compteur de Mon Espace et mettre en place une stratégie de synchronisation/cache maîtrisée.
- [ ] Signaler proprement à l’utilisateur un dépassement du quota `localStorage`, notamment pour les logos et photos de machines.
- [ ] Remplacer la persistance locale des réglages par un dépôt Supabase après validation de l’authentification et du modèle multi-entreprise.
- [ ] Faire respecter chaque droit créer/modifier/supprimer/imprimer/exporter côté serveur après ajout de l’authentification.
- [ ] Remplacer les dépôts mock par des dépôts Supabase après validation fonctionnelle.

- [ ] Valider le besoin puis intégrer Supabase pour l’authentification et/ou la persistance.
- [ ] Créer l’import ERP CSV/Excel sécurisé.
- [ ] Créer le mappage interactif des colonnes et les modèles réutilisables.
- [ ] Conserver les imports bruts, immuables et traçables.
- [ ] Créer les contrôles de qualité et le rapport d’anomalies.
- [ ] Transformer les imports validés en OF nettoyés liés à leur source.
- [x] Générer un planning machines de démonstration à partir du modèle canonique mock.
- [x] Détecter les conflits de démonstration et permettre des ajustements locaux confirmés.
- [x] Créer les plannings imprimables par machine avec identité, date et colonnes configurables.

## Plus tard

- [ ] Améliorer le QRQC et l’analyse des problèmes récurrents.
- [x] Structurer les réunions de production et leurs comptes rendus en mode démonstration.
- [x] Développer le suivi des machines et la planification légère de maintenance en mode démonstration.
- [x] Créer le centre de demandes internes en mode démonstration.
- [ ] Ajouter des commandes IA avancées, multi-sources et confirmées.
- [ ] Préparer puis déployer le mode SaaS multi-entreprise avec isolation vérifiée.

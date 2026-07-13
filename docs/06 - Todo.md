# Backlog — ProdPilot IA

Les cases cochées correspondent uniquement à un travail effectivement présent et relu dans le dépôt au 13/07/2026. L’ordre à l’intérieur de chaque section indique la priorité pratique ; il ne constitue pas un calendrier.

## Maintenant

- [x] Auditer le prototype historique et documenter la stratégie de migration dans `docs/08 - Legacy Migration.md`.
- [x] Migrer l’identité visuelle historique vers un shell responsive avec menu configurable, en-tête, profil et notifications.
- [x] Rendre les cartes de Mon Espace configurables : ordre, visibilité, libellé, icône, couleur et taille.
- [x] Créer le centre de réglages local avec identité société, thème, production, utilisateurs, rôles, impression, sauvegardes et journal.
- [x] Centraliser les réglages dans un service TypeScript versionné basé sur `localStorage` et remplaçable par Supabase.

- [x] Finaliser la documentation initiale du projet.
- [x] Créer les instructions opérationnelles de contribution dans `AGENTS.md`.
- [ ] Créer le shell de « Mon Espace » avec ses états vide, chargement et erreur.
- [x] Créer la barre latérale et la navigation responsive et accessible.
- [x] Créer la première vue fonctionnelle de « Mon Espace » avec six cartes métier, des placeholders et une zone assistant.
- [x] Créer l’abstraction de messagerie indépendante du fournisseur et sa factory.
- [x] Créer l’écran Réglages → Connexions → Messagerie avec Google Workspace et Microsoft 365.
- [x] Créer le fournisseur Gmail simulé et l’emplacement Microsoft Graph.
- [ ] Remplacer le fournisseur Gmail simulé par l’intégration Google Workspace côté serveur.
- [x] Créer une interface simulée pour les e-mails, clairement signalée comme telle.
- [ ] Configurer Google OAuth avec les portées minimales.
- [ ] Lister les messages Gmail récents.
- [ ] Créer les résumés d’e-mails avec l’IA et afficher leur provenance.
- [ ] Générer des brouillons Gmail modifiables avec confirmation explicite avant envoi.

## Ensuite

- [ ] Remplacer la persistance locale des réglages par un dépôt Supabase après validation de l’authentification et du modèle multi-entreprise.
- [ ] Relier les permissions aux actions métier en plus de la visibilité de la navigation.
- [ ] Remplacer les placeholders par les modules prioritaires après validation fonctionnelle.

- [ ] Valider le besoin puis intégrer Supabase pour l’authentification et/ou la persistance.
- [ ] Créer l’import ERP CSV/Excel sécurisé.
- [ ] Créer le mappage interactif des colonnes et les modèles réutilisables.
- [ ] Conserver les imports bruts, immuables et traçables.
- [ ] Créer les contrôles de qualité et le rapport d’anomalies.
- [ ] Transformer les imports validés en OF nettoyés liés à leur source.
- [ ] Générer le planning machines à partir des données ERP nettoyées.
- [ ] Détecter les conflits et permettre des ajustements tracés.
- [ ] Créer les plannings imprimables par machine avec date et version.

## Plus tard

- [ ] Améliorer le QRQC et l’analyse des problèmes récurrents.
- [ ] Structurer les réunions de production et leurs comptes rendus.
- [ ] Développer le suivi des machines et la planification légère de maintenance.
- [ ] Créer le centre de demandes internes.
- [ ] Ajouter des commandes IA avancées, multi-sources et confirmées.
- [ ] Préparer puis déployer le mode SaaS multi-entreprise avec isolation vérifiée.

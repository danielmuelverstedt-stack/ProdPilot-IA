# Intégrations restantes

## Priorité production

1. Ajouter l’authentification applicative et dériver utilisateur, entreprise et rôle depuis une session serveur.
2. Remplacer les dépôts `localStorage` par des dépôts Supabase avec isolation par entreprise, migrations et audit.
3. Remplacer le stockage local Google par des jetons chiffrés en base et tester l’isolation multi-compte.
4. Construire l’import ERP CSV/Excel, le mappage, la conservation brute et la promotion contrôlée vers le modèle canonique.
5. Relier les permissions créer/modifier/supprimer/imprimer/exporter aux opérations serveur.

## Hors périmètre actuel

- Microsoft Graph et OAuth Microsoft 365.
- Connexion SQL ou API ERP et toute écriture directe dans l’ERP.
- OpenAI et traitements IA distants.
- Envoi ou archivage d’e-mails.
- Téléchargement des pièces jointes Gmail.
- Optimisation avancée du planning, coûts de maintenance et GMAO complète.

Chaque connexion réelle devra conserver les interfaces de dépôt et de fournisseur déjà utilisées par les composants afin d’éviter de réécrire les modules.

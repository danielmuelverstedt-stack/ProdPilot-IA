# Avis relatifs aux références tierces

## Périmètre de cette évolution

L’évolution de gestion des mails du 19/07/2026 a été implémentée spécifiquement pour ProdPilot IA. Aucun fichier, extrait de code ou mécanisme OAuth provenant des dépôts étudiés ci-dessous n’a été copié ou adapté.

| Projet | Révision auditée | Licence constatée | Utilisation dans ProdPilot IA |
| --- | --- | --- | --- |
| Documentation Gmail API | pages consultées le 19/07/2026 | Documentation CC BY 4.0, exemples Apache-2.0 | Référence des contrats `labels`, `messages.modify`, `messages.batchModify` et `threads.modify` ; aucun exemple copié. |
| GongRzhe/Gmail-MCP-Server | `a890d19189bbc1325b8728fab830fc278cfd8804` | MIT | Inspiration fonctionnelle uniquement ; aucun code repris. |
| j3k0/mcp-google-workspace | `0f6b8692ad2192738b8139c8cb49a6590358038e` | MIT | Comparaison d’architecture uniquement ; aucun code repris. |
| elie222/inbox-zero | `062df5f6c3e1e8ecfa0ca32ffbebe5fead8cf2fb` | AGPL-3.0 avec restrictions commerciales et d’entreprise additionnelles | Concepts fonctionnels seulement ; aucune copie autorisée ni réalisée. |
| Foundry376/Mailspring | `4327fac777b30652ff66533b6b9fa8176bca0557` | GPL-3.0 | Inspiration visuelle générale seulement ; aucun code repris. |

## Sources officielles Google

- <https://developers.google.com/workspace/gmail/api/guides/labels>
- <https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/modify>
- <https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/batchModify>
- <https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/create>

Les dépendances npm existantes conservent leurs propres licences et avis dans leurs distributions. Aucune nouvelle dépendance n’a été ajoutée pour cette évolution.

## Évolution Planning et imports ERP — 19/07/2026

Le moteur d’import a été développé spécifiquement pour ProdPilot IA. La seule bibliothèque ajoutée au produit est `read-excel-file`, utilisée pour lire les classeurs XLSX côté serveur. Aucun code des autres projets étudiés n’a été copié ou adapté.

| Projet | Révision ou version auditée | Licence constatée | Décision |
| --- | --- | --- | --- |
| read-excel-file | `9.3.2`, dépôt `b469e7536597a202a22bf9a9e5634273b0ec347c` | MIT | Retenu pour la lecture XLSX stricte côté serveur ; surface plus focalisée qu’un moteur complet d’édition Excel. |
| fflate | `0.8.3` | MIT | Dépendance transitive de `read-excel-file`. |
| unzipper-esm | `0.13.2` | MIT | Dépendance transitive de `read-excel-file`. |
| saxen | `11.1.0` | MIT | Dépendance transitive de `read-excel-file`. |
| exceljs/exceljs | `5bed18b45e824f409b08456b59b87430ded023ab` | MIT | Évalué puis non retenu : fonctions d’écriture et de mise en forme inutiles pour l’import en lecture seule. |
| Comcast/react-data-grid | `97d7131486cec4dedd0e04a145a85ad7b6206ef8` | MIT | Évalué pour une future grille virtualisée ; non ajouté tant que la pagination serveur suffit. |
| clauderic/dnd-kit | `6fb57833026e06bb3925eef78316ba56d59749c8` | MIT | Évalué ; non ajouté, le glisser-déposer natif et l’alternative clavier existante couvrent la phase 1. |
| svar-widgets/react-gantt | `8ce2cdeb50567b32073cfbe3e6a9fde7898e6861` | MIT pour le cœur, fonctions avancées commerciales | Évalué pour le futur APS ; non intégré dans cette phase sans temps de fabrication. |
| frappe/erpnext | `1cd32b9c73ce77ec1eb7ec670cf100b4a6566004` | GPL-3.0 | Inspiration fonctionnelle uniquement ; aucune copie autorisée ni réalisée. |
| OpenMES | site consulté le 19/07/2026 | AGPL-3.0 | Inspiration fonctionnelle uniquement ; aucune copie autorisée ni réalisée. |

Références :

- <https://www.npmjs.com/package/read-excel-file>
- <https://gitlab.com/catamphetamine/read-excel-file>
- <https://github.com/exceljs/exceljs>
- <https://github.com/Comcast/react-data-grid>
- <https://github.com/clauderic/dnd-kit>
- <https://github.com/svar-widgets/react-gantt>
- <https://github.com/frappe/erpnext>
- <https://getopenmes.com/>

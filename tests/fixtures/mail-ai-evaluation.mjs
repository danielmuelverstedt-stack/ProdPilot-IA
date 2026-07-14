export const mailAiEvaluationFixtures = [
  { id: "supplier-delivery", subject: "Confirmation livraison PO-1042", body: "Bonjour, merci de confirmer la réception des pièces jeudi 16 juillet. Référence PO-1042.", expected: { categoryHint: "reply", requiresReply: true, entities: ["PO-1042"] } },
  { id: "customer-delay", subject: "Risque de retard client", body: "La commande CMD-884 risque trois jours de retard. Merci de confirmer aujourd’hui le nouveau délai.", expected: { categoryHint: "urgent", requiresReply: true, entities: ["CMD-884"] } },
  { id: "maintenance", subject: "Panne machine", body: "Le tour T-04 est bloqué depuis 08 h 30. Une intervention maintenance est nécessaire.", expected: { categoryHint: "urgent", requiresReply: false, entities: ["T-04"] } },
  { id: "quality", subject: "Demande qualité REF-5521", body: "Pouvez-vous fournir le rapport de contrôle pour REF-5521 avant vendredi ?", expected: { categoryHint: "reply", requiresReply: true, entities: ["REF-5521"] } },
  { id: "planning", subject: "Planification OF-4508", body: "Merci de planifier OF-4508 sur la semaine prochaine et de confirmer la capacité disponible.", expected: { categoryHint: "reply", requiresReply: true, entities: ["OF-4508"] } },
  { id: "information", subject: "Compte rendu hebdomadaire", body: "Pour information, la réunion de production est déplacée à 14 h. Aucune réponse nécessaire.", expected: { categoryHint: "information", requiresReply: false, entities: [] } },
  { id: "long-thread", subject: "Re: Livraison", body: `${"Échange utile sur la livraison. ".repeat(500)}\n\nDe : ancien@example.test\n${"Historique cité. ".repeat(500)}`, expected: { truncated: true } },
  { id: "empty", subject: "Message sans contenu", body: "   \n\n", expected: { emptyDetected: true } },
  { id: "multilingual", subject: "Levering / Delivery", body: "Beste, please confirm the levering van order PO-7788 pour lundi. Dank u.", expected: { categoryHint: "reply", requiresReply: true, entities: ["PO-7788"] } },
];

import type { AiProvider } from "@/features/ai/services/ai-provider";
import type { MailAiAnalysisInput, MailAiConversationInput, MailAiReplyInput, MailAiRewriteInput } from "@/features/ai/types/mail-ai";

export class MockAiProvider implements AiProvider {
  readonly type = "mock" as const;
  readonly model = "deterministic-v1";

  async analyzeMail(input: MailAiAnalysisInput) {
    const text = `${input.message.subject}\n${input.message.bodyText}`;
    const urgent = /urgent|aujourd|immédiat|bloqu|retard/i.test(text);
    const reply = /répond|confirmation|pouvez-vous|merci de|please confirm/i.test(text);
    const category = findCategory(input, urgent ? "urgent" : reply ? "reply" : "information");
    const priority = input.configuration.priorities.find((item) => item.level === (urgent ? "urgent" : "normal")) ?? input.configuration.priorities[0];
    const references = [...new Set(text.match(/\b(?:OF|PO|CMD|REF)[-_ ]?\d{3,}\b/gi) ?? [])].slice(0, 8);
    return {
      summary: { text: input.message.bodyText.slice(0, 300) || input.message.subject },
      category,
      priority,
      requiresReply: reply,
      reasoning: urgent ? "Des termes de délai ou de blocage sont présents dans le message." : "Classification issue des règles locales déterministes.",
      detectedEntities: references.map((value) => ({ type: "work_order", label: "Référence", value, sourceText: value })),
      importantDates: [],
      suggestedActions: reply ? [{ id: "prepare-reply", label: "Préparer une réponse", description: "Relire les faits puis préparer une réponse.", requiresConfirmation: true }] : [],
      missingInformation: [], confidence: "medium" as const,
      sourceReferences: [{ type: "message" as const, id: input.message.id, label: "Message sélectionné" }],
      generatedAt: new Date().toISOString(), provider: this.type, model: this.model,
      promptVersion: "deterministic-analysis-v1", usage: null, cached: false,
    };
  }

  async proposeMailReply(input: MailAiReplyInput) {
    const name = input.message.sender.split("<")[0].trim();
    const body = `Bonjour${name ? ` ${name}` : ""},\n\nMerci pour votre message. Nous vérifions les éléments communiqués et revenons vers vous après validation.${input.configuration.includeSignature && input.configuration.signature ? `\n\n${input.configuration.signature}` : ""}`;
    return this.reply(input, body, "deterministic-reply-v1");
  }

  async rewriteMailReply(input: MailAiRewriteInput) {
    let body = input.currentReply.bodyText;
    if (input.command === "shorter") body = body.split(/\n\n/).slice(0, 2).join("\n\n");
    else if (input.command === "more_diplomatic") body = body.replace("Nous vérifions", "Nous allons examiner avec attention");
    else if (input.command === "more_direct") body = body.replace("Nous allons examiner avec attention", "Nous vérifions");
    return this.reply(input, body, "deterministic-rewrite-v1");
  }

  async continueMailConversation(input: MailAiConversationInput) {
    const question = input.history.at(-1)?.content ?? "";
    return {
      text: question
        ? "OpenAI est indisponible ou désactivé. Je peux néanmoins exécuter les commandes Mail prévues et utiliser les résultats déterministes locaux."
        : "Le mode conversationnel déterministe est disponible.",
      generatedAt: new Date().toISOString(), provider: this.type, model: this.model,
      promptVersion: "deterministic-conversation-v1", usage: null,
    };
  }

  private reply(input: MailAiReplyInput, bodyText: string, promptVersion: string) {
    return {
      recipients: [input.message.sender.match(/<([^>]+)>/)?.[1] ?? input.message.sender],
      cc: [], bcc: [], subject: input.message.subject.toLocaleLowerCase("fr").startsWith("re:") ? input.message.subject : `Re: ${input.message.subject}`,
      bodyText, tone: input.tone, language: input.configuration.preferredLanguage,
      generatedAt: new Date().toISOString(), provider: this.type, model: this.model,
      promptVersion, usage: null,
    };
  }
}

function findCategory(input: MailAiAnalysisInput, hint: string) {
  return input.configuration.categories.find((item) => item.id.includes(hint) || item.label.toLocaleLowerCase("fr").includes(hint)) ?? input.configuration.categories[0];
}

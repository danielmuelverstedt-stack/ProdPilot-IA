import "server-only";

import type { MailAiOperationType, MailAiTokenBudget } from "@/features/ai/types/ai";

const CONSERVATIVE_LOCAL_BUDGETS: Record<MailAiOperationType, MailAiTokenBudget> = {
  mail_analysis: {
    maximumInputTokens: 6_000,
    maximumOutputTokens: 1_200,
    maximumThreadMessages: 4,
    maximumCharactersPerMessage: 8_000,
    maximumQuotedHistoryCharacters: 1_500,
    maximumAttachmentMetadataEntries: 8,
    maximumCustomInstructionLength: 0,
  },
  mail_reply: {
    maximumInputTokens: 4_000,
    maximumOutputTokens: 900,
    maximumThreadMessages: 3,
    maximumCharactersPerMessage: 6_000,
    maximumQuotedHistoryCharacters: 800,
    maximumAttachmentMetadataEntries: 5,
    maximumCustomInstructionLength: 1_000,
  },
  mail_rewrite: {
    maximumInputTokens: 2_000,
    maximumOutputTokens: 500,
    maximumThreadMessages: 1,
    maximumCharactersPerMessage: 3_000,
    maximumQuotedHistoryCharacters: 0,
    maximumAttachmentMetadataEntries: 0,
    maximumCustomInstructionLength: 500,
  },
  mail_conversation: {
    maximumInputTokens: 4_000,
    maximumOutputTokens: 700,
    maximumThreadMessages: 10,
    maximumCharactersPerMessage: 4_000,
    maximumQuotedHistoryCharacters: 1_000,
    maximumAttachmentMetadataEntries: 0,
    maximumCustomInstructionLength: 2_000,
  },
  mail_compose: {
    maximumInputTokens: 2_500,
    maximumOutputTokens: 700,
    maximumThreadMessages: 0,
    maximumCharactersPerMessage: 0,
    maximumQuotedHistoryCharacters: 0,
    maximumAttachmentMetadataEntries: 0,
    maximumCustomInstructionLength: 1_000,
  },
};

export function getMailAiTokenBudget(operation: MailAiOperationType, requested?: { maximumInputTokens?: number; maximumOutputTokens?: number }): MailAiTokenBudget {
  const budget = CONSERVATIVE_LOCAL_BUDGETS[operation];
  const globalOutputLimit = parseInteger(process.env.OPENAI_MAX_OUTPUT_TOKENS);
  const outputLimit = globalOutputLimit ? Math.min(globalOutputLimit, budget.maximumOutputTokens) : budget.maximumOutputTokens;
  return {
    ...budget,
    maximumInputTokens: requested?.maximumInputTokens ? Math.min(requested.maximumInputTokens, budget.maximumInputTokens) : budget.maximumInputTokens,
    maximumOutputTokens: requested?.maximumOutputTokens ? Math.min(requested.maximumOutputTokens, outputLimit) : outputLimit,
  };
}

export function estimateTokens(value: string): number {
  return Math.ceil(value.length / 4);
}

function parseInteger(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

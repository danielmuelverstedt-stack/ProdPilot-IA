import type { AiProviderType } from "@/features/ai/types/ai";
import type {
  MailAiAnalysis,
  MailAiAnalysisInput,
  MailAiCompose,
  MailAiComposeInput,
  MailAiConversationInput,
  MailAiConversationResult,
  MailAiReply,
  MailAiReplyInput,
  MailAiRewriteInput,
} from "@/features/ai/types/mail-ai";

export interface AiProvider {
  readonly type: AiProviderType;
  readonly model: string;
  analyzeMail(input: MailAiAnalysisInput): Promise<MailAiAnalysis>;
  proposeMailReply(input: MailAiReplyInput): Promise<MailAiReply>;
  rewriteMailReply(input: MailAiRewriteInput): Promise<MailAiReply>;
  composeMail(input: MailAiComposeInput): Promise<MailAiCompose>;
  continueMailConversation(input: MailAiConversationInput, signal?: AbortSignal): Promise<MailAiConversationResult>;
}

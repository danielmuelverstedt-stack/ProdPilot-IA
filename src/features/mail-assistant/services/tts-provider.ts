export type TtsProviderId = "system-browser" | "openai-tts-future" | "other-future-provider";
export interface TtsVoice { id: string; uri: string; name: string; language: string; locale: string; local: boolean; isDefault: boolean; category: "françaises" | "anglaises" | "autres" }
export interface TtsRequest { text: string; language: string; voiceId?: string; voiceName: string; rate: number; pitch: number; volume: number; onStart(): void; onEnd(): void; onError(): void }
export interface TtsProvider { id: TtsProviderId; label: string; configured: boolean; supported(): boolean; voices(): TtsVoice[]; subscribeVoices(listener: () => void): () => void; speak(request: TtsRequest): void; pause(): void; resume(): void; stop(): void }

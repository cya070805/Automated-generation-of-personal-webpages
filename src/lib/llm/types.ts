export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
}

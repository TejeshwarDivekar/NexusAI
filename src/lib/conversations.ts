export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  createdAt?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "nexusai-conversations";

function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function getAllConversations(): Conversation[] {
  return getConversations().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function createConversation(id: string): Conversation {
  const conversations = getConversations();
  const newConvo: Conversation = {
    id,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  conversations.push(newConvo);
  saveConversations(conversations);
  return newConvo;
}

export function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "title" | "messages">>
): void {
  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === id);
  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: Date.now(),
    };
    saveConversations(conversations);
  }
}

export function deleteConversation(id: string): void {
  const conversations = getConversations().filter((c) => c.id !== id);
  saveConversations(conversations);
}

export function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateTitle(firstMessage: string): string {
  const title = firstMessage.trim().substring(0, 50);
  return title.length < firstMessage.trim().length ? title + "..." : title;
}

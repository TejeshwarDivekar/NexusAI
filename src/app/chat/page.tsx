"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/chat/Sidebar";
import {
  getAllConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  generateId,
  generateTitle,
  type Conversation,
  type ChatMessage,
} from "@/lib/conversations";
import { Sparkles, Zap, Globe, FileText, Code } from "lucide-react";

export default function ChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    charCount: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    setConversations(getAllConversations());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save on messages change
  useEffect(() => {
    if (currentConvoId && messages.length > 0) {
      const timer = setTimeout(() => {
        updateConversation(currentConvoId, { messages });
        const convo = getConversation(currentConvoId);
        if (convo?.title === "New Chat") {
          const firstUserMsg = messages.find((m) => m.role === "user");
          if (firstUserMsg) {
            updateConversation(currentConvoId, {
              title: generateTitle(firstUserMsg.content),
            });
          }
        }
        setConversations(getAllConversations());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages, currentConvoId]);

  const handleNew = () => {
    const id = generateId();
    createConversation(id);
    setCurrentConvoId(id);
    setMessages([]);
    setFileContent(null);
    setUploadedFile(null);
    setConversations(getAllConversations());
  };

  const handleSelect = (id: string) => {
    const convo = getConversation(id);
    if (convo) {
      setCurrentConvoId(id);
      setMessages(convo.messages);
      setFileContent(null);
      setUploadedFile(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    if (currentConvoId === id) {
      setCurrentConvoId(null);
      setMessages([]);
    }
    setConversations(getAllConversations());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let convoId = currentConvoId;
    if (!convoId) {
      convoId = generateId();
      createConversation(convoId);
      setCurrentConvoId(convoId);
      setConversations(getAllConversations());
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          fileContent,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat service error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = generateId();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        
        setMessages([
          ...newMessages,
          {
            id: assistantId,
            role: "assistant",
            content: assistantText,
            createdAt: Date.now(),
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          id: generateId(),
          role: "assistant",
          content: "NexusAI is currently processing with the deep research backend. Please use the Deep Research Workspace for grounded investigations.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setFileContent(data.content);
        setUploadedFile({ name: data.fileName, charCount: data.charCount });
      }
    } catch {
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFileContent(null);
    setUploadedFile(null);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const suggestionCards = [
    {
      icon: <Globe size={18} color="#06b6d4" />,
      title: "Research Analysis",
      desc: "Analyze latest breakthroughs in LLMs & quantum computing",
      prompt: "Synthesize the state of the art in Retrieval-Augmented Generation architectures with inline citations.",
    },
    {
      icon: <FileText size={18} color="#8b5cf6" />,
      title: "Document Ingestion",
      desc: "Upload a PDF or paper to extract grounded findings",
      prompt: "Analyze the methodology and empirical benchmarks in the uploaded document.",
    },
    {
      icon: <Code size={18} color="#10b981" />,
      title: "Algorithm Optimization",
      desc: "Explain, review, or write high-performance code",
      prompt: "Explain how to implement HNSW vector indexing for pgvector in PostgreSQL.",
    },
    {
      icon: <Zap size={18} color="#f59e0b" />,
      title: "Contradiction Detection",
      desc: "Audit papers for conflicting experimental results",
      prompt: "What are the conflicting findings regarding parameter scaling in dense versus mixture-of-experts models?",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentId={currentConvoId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Main Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          minWidth: 0,
        }}
      >
        {/* Messages / Welcome */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 0",
          }}
        >
          {messages.length === 0 ? (
            <div
              className="animate-fade-in"
              style={{
                maxWidth: 800,
                margin: "0 auto",
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Logo */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
                }}
              >
                <Sparkles size={28} color="#fff" />
              </div>

              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Where knowledge begins.
              </h1>
              <p
                style={{
                  fontSize: 16,
                  color: "var(--text-secondary)",
                  maxWidth: 520,
                  marginBottom: 40,
                  lineHeight: 1.6,
                }}
              >
                Ask anything, explore deep research questions, or upload documents to synthesize grounded evidence.
              </p>

              {/* Suggestion Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                  width: "100%",
                  maxWidth: 720,
                }}
              >
                {suggestionCards.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => handlePromptClick(card.prompt)}
                    className="glass-hover"
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>{card.icon}</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: "var(--text-primary)",
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-tertiary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {card.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <MessageBubble
                  message={{ role: "assistant", content: "" }}
                  isStreaming
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={handleRemoveFile}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}

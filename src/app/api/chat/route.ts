import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are NexusAI, an advanced AI Research Assistant. You are helpful, knowledgeable, and precise.

Your capabilities:
- Answer questions on any topic with depth and accuracy
- Help with research, analysis, and writing
- Write and explain code in any programming language
- Analyze uploaded documents and extract insights
- Ground claims in citations and evidence

Guidelines:
- Be concise but thorough. Use markdown formatting for clarity.
- Use code blocks with language tags for code snippets.
- Use bullet points and numbered lists for structured information.
- When citing web search results, always include source URLs.
- If you're unsure about something, say so honestly.
- Be conversational and engaging while maintaining professionalism.`;

export async function POST(req: Request) {
  try {
    const { messages, fileContent } = await req.json();

    const systemMessages = fileContent
      ? `${SYSTEM_PROMPT}\n\nThe user has uploaded a document. Here is the content:\n\n---\n${fileContent}\n---\n\nPlease use this document content to answer the user's questions.`
      : SYSTEM_PROMPT;

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemMessages,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

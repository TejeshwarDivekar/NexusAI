import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NexusAI — AI Research Assistant",
  description:
    "Your intelligent research companion. Chat with AI, search the web, analyze documents, and get answers — all in one beautiful interface.",
  keywords: ["AI", "research", "assistant", "chatbot", "Gemini", "NexusAI"],
  openGraph: {
    title: "NexusAI — AI Research Assistant",
    description:
      "Your intelligent research companion powered by Google Gemini.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

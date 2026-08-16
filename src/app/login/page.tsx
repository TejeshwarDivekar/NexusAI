"use client";

import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, Globe } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/chat" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Floating Orbs */}
      <div
        className="animate-float"
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="animate-float"
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "1.5s",
        }}
      />

      {/* Login Card */}
      <div
        className="glass animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          margin: "0 16px",
          padding: "48px 40px",
          borderRadius: 24,
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Sparkles size={24} color="#fff" />
          </div>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          <span className="gradient-text">NexusAI</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: 15,
            marginBottom: 36,
            lineHeight: 1.5,
          }}
        >
          Sign in to start your intelligent research journey
        </p>

        {/* OAuth Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => handleSignIn("github")}
            disabled={loadingProvider !== null}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              padding: "14px 24px",
              borderRadius: 14,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 500,
              cursor: loadingProvider ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: loadingProvider && loadingProvider !== "github" ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingProvider) {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)";
              e.currentTarget.style.borderColor = "var(--border-primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loadingProvider === "github" ? (
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Continue with GitHub
                <ArrowRight size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
              </>
            )}
          </button>

          <button
            onClick={() => handleSignIn("google")}
            disabled={loadingProvider !== null}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              padding: "14px 24px",
              borderRadius: 14,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 500,
              cursor: loadingProvider ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: loadingProvider && loadingProvider !== "google" ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingProvider) {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)";
              e.currentTarget.style.borderColor = "var(--border-primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loadingProvider === "google" ? (
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            ) : (
              <>
                <Globe size={20} />
                Continue with Google
                <ArrowRight size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "28px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "var(--border-primary)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Powered by
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "var(--border-primary)",
            }}
          />
        </div>

        {/* Tech Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {["Google Gemini", "Next.js", "Vercel"].map((tech) => (
            <span
              key={tech}
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch (err: any) {
      setIsLoading(false);
      setError("Google sign-in failed. Please verify your Google OAuth credentials.");
    }
  };

  const handleNativeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
    const body =
      mode === "login"
        ? { username_or_email: email, password }
        : { email, username, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Authentication failed.");
      }

      const data = await res.json();
      localStorage.setItem("nexus_jwt_token", data.access_token);
      localStorage.setItem(
        "nexus_user_info",
        JSON.stringify({
          id: data.user_id,
          username: data.username,
          email: data.email,
        })
      );

      if (onSuccess) {
        onSuccess({ id: data.user_id, username: data.username, email: data.email });
      }
      setIsLoading(false);
      onClose();
      window.location.reload();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "An error occurred during authentication.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "login" ? "Sign in to NexusAI" : "Create your Account"}
      maxWidth="440px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
          {mode === "login"
            ? "Sign in to access your saved research, projects, and citations."
            : "Register for an account to save research reports and manage workspaces."}
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--danger-subtle)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Real Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "11px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            minHeight: "44px",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              e.currentTarget.style.borderColor = "var(--border-primary)";
            }
          }}
        >
          {/* Google 4-Color SVG Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
            or with credentials
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleNativeAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mode === "signup" && (
            <Input
              label="Username"
              placeholder="Your handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            style={{ width: "100%", marginTop: "4px", minHeight: "44px" }}
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Mode Switcher */}
        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

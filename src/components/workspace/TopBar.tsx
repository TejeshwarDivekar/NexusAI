"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  FolderKanban,
  HelpCircle,
  Plus,
  ChevronRight,
  Menu,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface TopBarProps {
  currentProjectTitle?: string;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onNewResearch: () => void;
  onOpenProjects: () => void;
  onToggleMobileMenu?: () => void;
  onOpenLogin: () => void;
}

export function TopBar({
  currentProjectTitle = "General Investigation",
  onOpenCommandPalette,
  onOpenShortcuts,
  onNewResearch,
  onOpenProjects,
  onToggleMobileMenu,
  onOpenLogin,
}: TopBarProps) {
  const { data: session, status } = useSession();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Check localStorage native user if next-auth is not active
  const [nativeUser, setNativeUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexus_user_info");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const currentUser = session?.user || nativeUser;
  const isLoggedIn = status === "authenticated" || !!currentUser;

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexus_jwt_token");
      localStorage.removeItem("nexus_user_info");
    }
    setNativeUser(null);
    if (status === "authenticated") {
      await signOut({ callbackUrl: "/" });
    } else {
      window.location.reload();
    }
  };

  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border-primary)",
        backgroundColor: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        flexShrink: 0,
        zIndex: 20,
        position: "relative",
      }}
    >
      {/* Left: Mobile Menu Button + Project Context */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="md-hide touch-target"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-subtle)",
              color: "var(--text-primary)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Mobile Brand Name */}
        <div
          className="md-hide"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "var(--accent-primary)" }}>Nexus</span>Research
        </div>

        <button
          onClick={onOpenProjects}
          className="mobile-hide"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid transparent",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            minHeight: "44px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <FolderKanban size={14} color="var(--accent-primary)" />
          <span className="mobile-hide">Projects</span>
        </button>

        <ChevronRight size={13} color="var(--text-tertiary)" className="mobile-hide" />

        <div
          className="mobile-hide"
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text-primary)",
            maxWidth: "180px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentProjectTitle}
        </div>
      </div>

      {/* Center: Search Bar (Desktop only) */}
      <div
        className="mobile-hide"
        style={{
          flex: 1,
          maxWidth: "340px",
          margin: "0 12px",
        }}
      >
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-tertiary)",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} />
            <span>Search or command...</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "1px 5px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--text-secondary)",
            }}
          >
            <span>⌘K</span>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onNewResearch}
          style={{ minHeight: "36px" }}
        >
          <span className="mobile-hide">New Research</span>
          <span className="mobile-only">New</span>
        </Button>

        <ThemeToggle />

        {/* Real User Profile / Login Button */}
        {isLoggedIn ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid var(--border-primary)",
                background: "var(--bg-subtle)",
                borderRadius: "var(--radius-full)",
                padding: "2px 8px 2px 2px",
                cursor: "pointer",
                minHeight: "36px",
              }}
            >
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name || "User"}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-subtle)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {(currentUser.name || currentUser.username || currentUser.email || "US")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <span
                className="mobile-hide"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  maxWidth: "110px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.name || currentUser.username || currentUser.email?.split("@")[0]}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  width: "200px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "8px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--text-primary)" }}>
                    {currentUser.name || currentUser.username || "Researcher"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {currentUser.email || ""}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleLogout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "transparent",
                    color: "var(--danger-text, #ef4444)",
                    fontSize: "13px",
                    fontWeight: 550,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogIn size={13} />}
            onClick={onOpenLogin}
            style={{ minHeight: "36px" }}
          >
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}

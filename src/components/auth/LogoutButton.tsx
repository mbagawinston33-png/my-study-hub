"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className="btn ghost"
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: isHovered ? 'var(--danger)' : 'var(--text-2)',
        borderColor: isHovered ? 'var(--danger)' : 'transparent',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1
      }}
      title="Sign Out"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span className="hidden sm:inline">
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </span>
    </button>
  );
}
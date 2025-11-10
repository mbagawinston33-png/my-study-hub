"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/navigation/Navigation";
import SearchModal from "@/components/search/SearchModal";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Keyboard shortcut for search (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchModalOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header with Navigation */}
        <header className="card" style={{ margin: '20px 20px 0 20px', borderRadius: 'var(--radius)' }}>
          <div className="container">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="row" style={{ gap: '12px' }}>
                <div className="logo" aria-hidden="true"></div>
                <div>
                  <b style={{ fontSize: '18px', letterSpacing: '0.2px', color: 'var(--text)' }}>MyStudyHub</b>
                  <div className="small" style={{ color: 'var(--text-2)' }}>Academic Dashboard</div>
                </div>
              </div>

              <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                {/* Search Button */}
                <button
                  onClick={handleSearchClick}
                  className="btn ghost"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Search (Ctrl+/)"
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
                    style={{ color: 'var(--text-2)' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Search
                </button>

                {/* Navigation */}
                <Navigation />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container">
          <div style={{ marginTop: '20px' }}>
            {children}
          </div>
        </main>

        {/* Search Modal */}
        {user && (
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={handleSearchClose}
            userId={user.userId}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
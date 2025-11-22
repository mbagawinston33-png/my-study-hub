"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SidebarNavigation from "@/components/navigation/SidebarNavigation";
import IntegratedSearch from "@/components/search/IntegratedSearch";
import NotificationBell from "@/components/notification/NotificationBell";
import NotificationCenter from "@/components/notification/NotificationCenter";
import LogoutButton from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNotificationClick = () => {
    setIsNotificationCenterOpen(true);
  };

  const handleNotificationClose = () => {
    setIsNotificationCenterOpen(false);
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>

          {/* Top Header Bar - Sticky at top */}
          <header
            className="card"
            style={{
              position: 'sticky',
              top: 0,
              margin: 0,
              borderRadius: 0,
              borderBottom: '1px solid var(--border)',
              zIndex: 100,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '12px 20px' }}>

              {/* Left Section: Menu Toggle + Branding */}
              <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                {/* Sidebar Toggle Button - Works on both mobile and desktop */}
                <button
                  onClick={toggleSidebar}
                  className="btn ghost"
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Toggle sidebar"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>

                {/* Logo */}
                <img
                  src="/logo.png"
                  alt="MyStudyHub Logo"
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain'
                  }}
                />

                {/* Branding */}
                <div>
                  <b style={{ fontSize: '18px', letterSpacing: '0.2px', color: 'var(--text)' }}>MyStudyHub</b>
                </div>
              </div>

              {/* Center: Search Bar */}
              {user && (
                <div style={{ flex: '1', maxWidth: '700px', minWidth: '0' }}>
                  <IntegratedSearch userId={user.userId} />
                </div>
              )}

              {/* Right Side: Notification + Logout */}
              <div className="row" style={{ gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {/* Notification Bell */}
                <NotificationBell onClick={handleNotificationClick} />

                {/* Logout Button */}
                <LogoutButton />
              </div>
            </div>
          </header>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

            {/* Desktop Sidebar - Fixed Position */}
            <div className="hidden md:block">
              <SidebarNavigation
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
              />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 30,
                  display: 'md:none'
                }}
                onClick={closeMobileMenu}
              />
            )}

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  zIndex: 40,
                  display: 'md:none'
                }}
              >
                <SidebarNavigation
                  isCollapsed={false}
                  onToggle={closeMobileMenu}
                />
              </div>
            )}

            {/* Main Content Area */}
            <main
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                minWidth: 0,
                marginLeft: isSidebarCollapsed ? '80px' : '260px',
                transition: 'margin-left 0.3s ease'
              }}
              className="md:ml-auto"
            >
              <div className="container">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Notification Center */}
        {user && (
          <NotificationCenter
            isOpen={isNotificationCenterOpen}
            onClose={handleNotificationClose}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
      </svg>
    )
  },
  {
    href: "/dashboard/subjects",
    label: "Subjects",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>
      </svg>
    )
  },
  {
    href: "/dashboard/reminders",
    label: "Reminders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  },
  {
    href: "/dashboard/timer",
    label: "Study Timer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  }
];

interface SidebarNavigationProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function SidebarNavigation({ isCollapsed = false, onToggle }: SidebarNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }
    return pathname === href;
  };

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: '73px', // Height of header bar (12px padding * 2 + content height ~49px)
        left: 0,
        width: isCollapsed ? '80px' : '260px',
        height: 'calc(100vh - 73px)',
        backgroundColor: 'var(--card)',
        borderRight: '1px solid var(--border)',
        transition: 'width 0.3s ease, top 0.3s ease, height 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40
      }}
    >

      {/* Navigation Items */}
      <nav
        style={{
          flex: 1,
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNavClick(item.href)}
            className={isActive(item.href) ? 'active' : ''}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 8px' : '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : '12px',
              fontWeight: isActive(item.href) ? '600' : '500',
              color: isActive(item.href) ? 'var(--brand)' : 'var(--text-2)',
              backgroundColor: isActive(item.href) ? 'var(--brand-container)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              position: 'relative'
            }}
            title={isCollapsed ? item.label : undefined}
          >
            {/* Active indicator */}
            {isActive(item.href) && !isCollapsed && (
              <div
                style={{
                  position: 'absolute',
                  left: '-12px',
                  width: '3px',
                  height: '20px',
                  backgroundColor: 'var(--brand)',
                  borderRadius: '0 2px 2px 0'
                }}
              />
            )}

            {item.icon}
            {!isCollapsed && (
              <span>{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Toggle Button (optional) */}
      {onToggle && (
        <div style={{ padding: '12px' }}>
          <button
            onClick={onToggle}
            className="btn ghost"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-2)'
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        button:hover {
          color: var(--brand) !important;
          background-color: var(--brand-container) !important;
          transform: translateX(2px);
        }

        button.active:hover {
          background-color: color-mix(in srgb, var(--brand-container) 90%, transparent) !important;
        }

        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </aside>
  );
}
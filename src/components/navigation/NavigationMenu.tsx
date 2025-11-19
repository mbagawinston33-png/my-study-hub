"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "link" | "action";
}

interface NavigationMenuProps {
  items: NavItem[];
  trigger?: React.ReactNode;
  position?: "bottom-right" | "bottom-left";
}

export default function NavigationMenu({
  items,
  trigger,
  position = "bottom-right"
}: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleItemClick = async (item: NavItem) => {
    setIsOpen(false);

    if (item.onClick) {
      await item.onClick();
    } else if (item.type === "action") {
      // Handle sign out or other actions
      if (item.href === "/logout") {
        try {
          await logout();
          router.push("/login");
        } catch (error) {
          // Error handling is done silently
        }
      }
    } else {
      router.push(item.href);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "right-0";
      case "bottom-right":
      default:
        return "left-0";
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn ghost"
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px'
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: '4px',
            minWidth: '200px',
            zIndex: 50,
            boxShadow: '0 8px 24px color-mix(in srgb, var(--shadow), transparent 20%)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '4px',
            backgroundColor: 'var(--bg)'
          }}
        >
          <div
            role="menu"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            {items.map((item, index) => (
              <div key={index} role="menuitem">
                {item.type === "action" || item.onClick ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className="btn ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      gap: '8px',
                      color: item.href === "/logout" ? 'var(--danger)' : 'var(--text)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.href === "/logout"
                        ? 'color-mix(in srgb, var(--danger), transparent 90%)'
                        : 'var(--bg-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleItemClick(item)}
                    className="btn ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      gap: '8px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
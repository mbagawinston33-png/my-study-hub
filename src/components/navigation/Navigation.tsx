"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navigationItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/tasks", label: "Tasks" },
    { href: "/dashboard/subjects", label: "Subjects" },
    { href: "/dashboard/reminders", label: "Reminders" },
    { href: "/dashboard/timer", label: "Study Timer" },
    { href: "/dashboard/profile", label: "Profile" },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      // Error handling is done silently as per original implementation
    }
  };

  const isActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === href || pathname === "/dashboard/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
      {navigationItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "btn subtle" : "btn ghost"}
            style={{
              transition: 'all 0.2s ease',
              transform: active ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: active
                ? '0 2px 8px color-mix(in srgb, var(--brand), transparent 70%)'
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = 'var(--brand)';
                e.currentTarget.style.boxShadow = '0 2px 8px color-mix(in srgb, var(--brand), transparent 90%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}

      <button
        onClick={handleSignOut}
        className="btn ghost"
        style={{
          color: 'var(--danger)',
          borderColor: 'color-mix(in srgb, var(--danger), var(--border))',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.background = 'var(--danger)';
          e.currentTarget.style.borderColor = 'var(--danger)';
          e.currentTarget.style.boxShadow = '0 2px 8px color-mix(in srgb, var(--danger), transparent 70%)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--danger)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--danger), var(--border))';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        aria-label="Sign out of account"
      >
        Sign Out
      </button>
    </nav>
  );
}
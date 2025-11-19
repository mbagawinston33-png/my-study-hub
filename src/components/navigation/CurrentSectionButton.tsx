"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import NavigationMenu from "./NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";

interface Section {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
      </svg>
    )
  },
  {
    href: "/dashboard/subjects",
    label: "Subjects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>
      </svg>
    )
  },
  {
    href: "/dashboard/reminders",
    label: "Reminders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  }
];

export default function CurrentSectionButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const getCurrentSection = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return sections[0];
    }

    const section = sections.find(s => s.href === pathname);
    return section || sections[0]; // Default to Dashboard
  };

  const currentSection = getCurrentSection();

  const otherSections = sections.filter(s => s.href !== currentSection.href);

  return (
    <NavigationMenu
      items={[
        ...otherSections,
        {
          href: "/dashboard/timer",
          label: "Study Timer",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          )
        },
        {
          href: "/dashboard/profile",
          label: "Profile",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )
        },
        {
          href: "/logout",
          label: "Sign Out",
          type: "action",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          )
        }
      ]}
      trigger={
        <>
          {currentSection.icon}
          <span style={{ fontWeight: '500' }}>{currentSection.label}</span>
        </>
      }
      position="bottom-right"
    />
  );
}
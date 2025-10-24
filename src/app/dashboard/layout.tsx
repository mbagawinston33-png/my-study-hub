"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header with Navigation */}
        <header className="card" style={{ margin: '20px 20px 0 20px', borderRadius: 'var(--radius)' }}>
          <div className="container">
            <div className="row">
              <div className="row" style={{ gap: '12px' }}>
                <div className="logo" aria-hidden="true"></div>
                <div>
                  <b style={{ fontSize: '18px', letterSpacing: '0.2px', color: 'var(--text)' }}>MyStudyHub</b>
                  <div className="small" style={{ color: 'var(--text-2)' }}>Academic Dashboard</div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <a href="/dashboard" className="btn subtle">
                  Dashboard
                </a>
                <a href="/dashboard/tasks" className="btn ghost">
                  Tasks
                </a>
                <a href="/dashboard/subjects" className="btn ghost">
                  Subjects
                </a>
                <a href="/dashboard/reminders" className="btn ghost">
                  Reminders
                </a>
                <a href="/dashboard/profile" className="btn ghost">
                  Profile
                </a>
                <button onClick={handleSignOut} className="btn ghost" style={{ color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger), var(--border))' }}>
                  Sign Out
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container">
          <div style={{ marginTop: '20px' }}>
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/navigation/Navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
              <Navigation />
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
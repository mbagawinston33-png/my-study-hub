"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        // User is not logged in, show landing page
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <Loader2 className="mx-auto h-12 w-12 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="small" style={{ marginTop: '16px', color: 'var(--text-2)' }}>Loading your academic workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="card" style={{ margin: '20px 0', borderRadius: 'var(--radius)', backdropFilter: 'blur(10px)' }}>
        <div className="container">
          <div className="row">
            <div className="row" style={{ gap: '12px' }}>
              <Image
                src="/logo.png"
                alt="MyStudyHub Logo"
                width={60}
                height={60}
                style={{ borderRadius: '16px' }}
              />
              <div>
                <b style={{ fontSize: '18px', letterSpacing: '0.2px', color: 'var(--text)' }}>MyStudyHub</b>
                <div className="small" style={{ color: 'var(--text-2)' }}>Academic Task Organizer • Integrated Learning System</div>
              </div>
            </div>
            <div className="right row" style={{ gap: '8px' }}>
              <a href="/login" className="btn ghost">
                Sign In
              </a>
              <a href="/register" className="btn">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container">
        <div className="text-center">
          <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 16px', color: 'var(--text)', fontWeight: '700' }}>
            Organize Your <span style={{ color: 'var(--brand)' }}>Academic Life</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-2)', maxWidth: '650px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            The integrated task organizer and knowledge management system designed specifically for students.
            Stay on top of your assignments, subjects, and study materials all in one place.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: '12px', marginBottom: '48px' }}>
            <a href="/register" className="btn" style={{ padding: '12px 24px', fontSize: '16px' }}>
              Start Free
            </a>
            <a href="#features" className="btn ghost" style={{ padding: '12px 24px', fontSize: '16px' }}>
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: 'var(--fs-h1)', textAlign: 'center', margin: '0 0 32px', color: 'var(--text)', fontWeight: '600' }}>
            Everything You Need to Succeed
          </h2>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 12px', color: 'var(--text)', fontWeight: '600' }}>Task Management</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-2)' }}>
                Create, organize, and track all your academic tasks with priorities and due dates.
              </p>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 12px', color: 'var(--text)', fontWeight: '600' }}>Subject Organization</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-2)' }}>
                Organize your study materials and files by subjects for easy access.
              </p>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 12px', color: 'var(--text)', fontWeight: '600' }}>Smart Reminders</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-2)' }}>
                Never miss deadlines with intelligent reminder system for tasks and events.
              </p>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 12px', color: 'var(--text)', fontWeight: '600' }}>File Management</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-2)' }}>
                Upload and organize study materials, notes, and assignments securely.
              </p>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 12px', color: 'var(--text)', fontWeight: '600' }}>Calendar View</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-2)' }}>
                Visualize your academic schedule with integrated calendar functionality.
              </p>
            </div>
            </div>
        </div>

        {/* Dashboard Preview Section */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: 'var(--fs-h1)', textAlign: 'center', margin: '0 0 40px', color: 'var(--text)', fontWeight: '600' }}>
            Dashboard Overview
          </h2>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-100), var(--accent-100))', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>Total Tasks</div>
              <h3 style={{ margin: '0', fontSize: 'var(--fs-h1)', color: 'var(--brand-700)', fontWeight: '700' }}>24</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>5 due this week</div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>Active Subjects</div>
              <h3 style={{ margin: '0', fontSize: 'var(--fs-h1)', color: 'var(--text)', fontWeight: '700' }}>6</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>3 assignments pending</div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>Study Materials</div>
              <h3 style={{ margin: '0', fontSize: 'var(--fs-h1)', color: 'var(--text)', fontWeight: '700' }}>48</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>12 uploaded this month</div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>Completion Rate</div>
              <h3 style={{ margin: '0', fontSize: 'var(--fs-h1)', color: 'var(--text)', fontWeight: '700' }}>87%</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>+5% from last month</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="card" style={{ margin: '48px 20px 20px' }}>
        <div className="container">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="small" style={{ color: 'var(--text-2)' }}>
              &copy; 2024 MyStudyHub. All rights reserved.
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Beta</span>
              <span className="badge ok">Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

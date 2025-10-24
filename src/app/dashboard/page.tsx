"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
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
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 8px', color: 'var(--text)' }}>
          Welcome back, {user?.displayName || "Student"}!
        </h1>
        <p className="small" style={{ fontSize: '16px', color: 'var(--text-2)' }}>
          Here's what's happening with your studies today.
        </p>
      </div>

      {/* Dashboard Widgets */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)', marginBottom: '28px' }}>
        <div className="card" style={{ gridColumn: 'span 3', background: 'var(--brand-100)' }}>
          <div className="small">Total Tasks</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--brand-700)' }}>24</h3>
          <div className="small">5 due this week</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Active Subjects</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>6</h3>
          <div className="small">3 assignments pending</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Study Materials</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>48</h3>
          <div className="small">12 uploaded this month</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Completion Rate</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--ok)' }}>87%</h3>
          <div className="small">+5% from last month</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(12, 1fr)' }}>

        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Recent Activity</h3>
            <span className="right badge warn">3 new</span>
          </div>
          <div className="hr"></div>

          {/* Activity Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="row" style={{ padding: '10px', borderRadius: '12px', background: 'var(--brand-100)' }}>
              <div className="row" style={{ flex: 1, gap: '12px' }}>
                <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                  T
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>Math Assignment Completed</b>
                  <div className="small">Calculus Problem Set #5 • 2 hours ago</div>
                </div>
              </div>
              <span className="badge ok">Done</span>
            </div>

            <div className="row" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="row" style={{ flex: 1, gap: '12px' }}>
                <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--warn)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                  R
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>Reminder Set</b>
                  <div className="small">Physics Lab Report • Due tomorrow</div>
                </div>
              </div>
              <span className="badge warn">Pending</span>
            </div>

            <div className="row" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="row" style={{ flex: 1, gap: '12px' }}>
                <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                  F
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>New File Uploaded</b>
                  <div className="small">Chemistry Notes.pdf • 5 hours ago</div>
                </div>
              </div>
              <span className="badge brand">New</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Progress */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Quick Actions</h3>
          <div className="hr"></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/dashboard/tasks/new" className="btn" style={{ justifyContent: 'center' }}>
              Create Task
            </a>
            <a href="/dashboard/subjects/new" className="btn subtle" style={{ justifyContent: 'center' }}>
              Add Subject
            </a>
            <a href="/dashboard/reminders/new" className="btn ghost" style={{ justifyContent: 'center' }}>
              Set Reminder
            </a>
          </div>

          <div className="hr" style={{ margin: '20px 0' }}></div>

          <h4 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 10px', color: 'var(--text)' }}>Weekly Progress</h4>
          <div style={{ height: '10px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ display: 'block', height: '100%', width: '72%', background: 'var(--brand)', borderRadius: '999px' }}></div>
          </div>
          <div className="small">18 of 25 tasks completed</div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Upcoming Tasks</h3>
            <span className="right badge brand">This Week</span>
          </div>
          <div className="hr"></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="row" style={{ gap: '10px' }}>
              <span className="badge warn">High</span>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--text)' }}>Physics Lab Report</b>
                <div className="small">Due tomorrow • 2:00 PM</div>
              </div>
            </div>
            <div className="row" style={{ gap: '10px' }}>
              <span className="badge ok">Medium</span>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--text)' }}>Math Problem Set #6</b>
                <div className="small">Due Friday • 11:59 PM</div>
              </div>
            </div>
            <div className="row" style={{ gap: '10px' }}>
              <span className="badge">Low</span>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--text)' }}>Read Chapter 8</b>
                <div className="small">Due Sunday • No specific time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Overview */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Subject Overview</h3>
            <span className="right badge ok">6 Active</span>
          </div>
          <div className="hr"></div>

          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Math</span>
              <div className="small">8 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Physics</span>
              <div className="small">5 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Chemistry</span>
              <div className="small">6 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Biology</span>
              <div className="small">5 tasks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
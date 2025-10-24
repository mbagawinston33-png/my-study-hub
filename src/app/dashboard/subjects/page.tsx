"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Subject } from "@/types/subject";
import { Plus, BookOpen, Edit, Trash2, Users, Calendar, RefreshCw } from "lucide-react";

// Fetch subjects from Firebase Firestore
const getSubjectsFromFirebase = async (userId: string): Promise<Subject[]> => {
  try {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const { getDb } = await import('@/lib/firebase');

    const db = getDb();
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(subjectsQuery);
    const subjects: Subject[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      subjects.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        code: data.code,
        description: data.description,
        color: data.color,
        teacher: data.teacher,
        room: data.room,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return subjects;
  } catch (error) {
    console.error("Error loading subjects from Firebase:", error);
    return [];
  }
};

export default function SubjectsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const refreshSubjects = async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);
      const userSubjects = await getSubjectsFromFirebase(user.userId);
      setSubjects(userSubjects);
    } catch (error) {
      console.error("Error refreshing subjects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load subjects from Firebase
    refreshSubjects();
  }, [user]);

  // Refresh when page becomes visible again (user navigates back from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.userId) {
        refreshSubjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.teacher?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete from Firebase
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { getDb } = await import('@/lib/firebase');

      const db = getDb();
      await deleteDoc(doc(db, 'subjects', subjectId));

      // Update UI
      setSubjects(prev => prev.filter(subject => subject.id !== subjectId));

      console.log("Subject deleted from Firebase:", subjectId);

    } catch (error) {
      console.error("Error deleting subject:", error);
      // TODO: Show error message to user
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-2)' }}>Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 4px', color: 'var(--text)' }}>
            My Subjects
          </h1>
          <p className="small" style={{ color: 'var(--text-2)' }}>
            Manage your academic subjects and course materials
          </p>
        </div>
        <div className="row" style={{ gap: '12px' }}>
          <button
            onClick={refreshSubjects}
            className="btn ghost"
            style={{ padding: '10px 14px' }}
            disabled={isLoading}
          >
            <RefreshCw size={16} style={{
              marginRight: '8px',
              animation: isLoading ? 'spin 1s linear infinite' : 'none'
            }} />
            Refresh
          </button>
          <button
            onClick={() => router.push("/dashboard/subjects/new")}
            className="btn"
            style={{ minWidth: '140px' }}
          >
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add Subject
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--brand-100)' }}>
          <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--brand)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div className="small">Total Subjects</div>
              <div style={{ fontSize: 'var(--fs-h2)', color: 'var(--brand-700)', fontWeight: '700' }}>
                {subjects.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              placeholder="Search subjects by name, code, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--card)',
                color: 'var(--text)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Subjects List */}
      {filteredSubjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <BookOpen size={48} style={{ color: 'var(--text-2)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text)', margin: '0 0 8px' }}>
            {searchTerm ? "No subjects found" : "No subjects yet"}
          </h3>
          <p className="small" style={{ color: 'var(--text-2)', marginBottom: '24px' }}>
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first subject"
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push("/dashboard/subjects/new")}
              className="btn"
            >
              <Plus size={16} style={{ marginRight: '8px' }} />
              Add Your First Subject
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredSubjects.map(subject => (
            <div key={subject.id} className="card" style={{
              borderLeft: `4px solid ${subject.color}`,
              transition: 'all 0.2s ease'
            }}>
              <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
                {/* Subject Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: subject.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {subject.code ? subject.code.substring(0, 2).toUpperCase() : subject.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Subject Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                      {subject.name}
                    </h3>
                    {subject.code && (
                      <span className="badge" style={{ background: `${subject.color}20`, color: subject.color, border: `1px solid ${subject.color}40` }}>
                        {subject.code}
                      </span>
                    )}
                  </div>

                  <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
                    {subject.teacher && (
                      <span className="small" style={{ color: 'var(--text-2)' }}>
                        Prof. {subject.teacher}
                      </span>
                    )}
                    {subject.room && (
                      <span className="small" style={{ color: 'var(--text-2)' }}>
                        {subject.room}
                      </span>
                    )}
                  </div>

                  {subject.description && (
                    <p className="small" style={{ color: 'var(--text-2)', marginTop: '4px', lineHeight: '1.4' }}>
                      {subject.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="row" style={{ gap: '8px' }}>
                  <button
                    onClick={() => router.push(`/dashboard/subjects/${subject.id}/edit`)}
                    className="btn ghost"
                    style={{ padding: '8px' }}
                    title="Edit subject"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="btn ghost"
                    style={{ padding: '8px' }}
                    title="Delete subject"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
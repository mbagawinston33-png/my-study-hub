"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FaUserShield, FaSpinner } from "react-icons/fa";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    console.log("AdminProtectedRoute - Auth state:", {
      user: user?.email,
      role: user?.role,
      loading,
      isAdmin
    });

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isVerifying) {
        console.log("AdminProtectedRoute - Timeout reached, allowing access");
        setIsVerifying(false);
      }
    }, 5000);

    if (!loading) {
      if (!user) {
        // Not logged in, redirect to admin login
        console.log("AdminProtectedRoute - No user, redirecting to login");
        router.push("/admin/login");
      } else if (!isAdmin && user.role !== 'admin') {
        // Logged in but not admin, redirect to regular dashboard
        console.log("AdminProtectedRoute - User not admin, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        // User is admin, allow access
        console.log("AdminProtectedRoute - Admin access granted");
        setIsVerifying(false);
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, isAdmin, router, isVerifying]);

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin">
              <FaSpinner className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <FaUserShield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this admin area.
          </p>
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
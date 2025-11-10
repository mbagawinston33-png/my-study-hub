"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "@/lib/auth";
import PasswordChangeForm from "@/components/auth/PasswordChangeForm";
import AccountDeletionModal from "@/components/auth/AccountDeletionModal";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeletionModal, setShowDeletionModal] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (user) {
        const success = await updateUserProfile(user.userId, {
          displayName: name,
        });

        if (success) {
          await refreshUser();
          setMessage("Profile updated successfully!");
        } else {
          setError("Failed to update profile");
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeleted = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className="bg-green-50 border border-green-500 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              value={email}
              readOnly
            />
            <p className="mt-1 text-sm text-gray-500">
              Email cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">User ID:</span>
              <span className="text-gray-900">{user?.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role:</span>
              <span className="text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Status:</span>
              <span className="text-gray-900 capitalize">{user?.accountStatus}</span>
            </div>
            {user?.studentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Student ID:</span>
                <span className="text-gray-900">{user.studentId}</span>
              </div>
            )}
            {user?.programme && (
              <div className="flex justify-between">
                <span className="text-gray-500">Programme:</span>
                <span className="text-gray-900">{user.programme}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PasswordChangeForm />

      <div className="mt-8 bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-red-900">Delete Account</h3>
          <p className="text-red-600 text-sm mt-1">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <button
          onClick={() => setShowDeletionModal(true)}
          className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete My Account
        </button>
      </div>

      <AccountDeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        onSuccess={handleAccountDeleted}
      />
    </div>
  );
}
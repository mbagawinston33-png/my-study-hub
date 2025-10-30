"use client";

import { useState } from "react";
import { changeUserPassword } from "@/lib/auth";

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters long";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await changeUserPassword(currentPassword, newPassword);

      if (result.success) {
        setMessage("Password changed successfully!");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      } else {
        setError(result.error?.message || "Failed to change password");
        if (result.error?.field) {
          setErrors({ [result.error.field]: result.error.message });
        }
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear messages when user starts typing
    if (message || error) {
      setMessage("");
      setError("");
    }

    switch (field) {
      case "currentPassword":
        setCurrentPassword(value);
        break;
      case "newPassword":
        setNewPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

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
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.currentPassword
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              value={currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              disabled={loading}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.newPassword
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              value={newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              disabled={loading}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 6 characters long.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              value={confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
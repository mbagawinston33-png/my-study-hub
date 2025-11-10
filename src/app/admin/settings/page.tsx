"use client";

import { Metadata } from "next";
import { useState, useEffect } from "react";
import FileConfigForm from "@/components/admin/FileConfigForm";
import { getFileValidationRules, getFormattedFileRules } from "@/lib/adminConfig";
import { FaSpinner } from "react-icons/fa";
import { AdminFileConfig } from "@/types/admin";

// Note: Metadata not available in client components, so we'll set it via a Head component if needed

export default function AdminSettingsPage() {
  const [currentRules, setCurrentRules] = useState<AdminFileConfig | null>(null);
  const [formattedRules, setFormattedRules] = useState<ReturnType<typeof getFormattedFileRules> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rules = await getFileValidationRules();
      const formatted = getFormattedFileRules(rules);
      setCurrentRules(rules);
      setFormattedRules(formatted);
    } catch (err) {
      console.error("Error loading current settings:", err);
      setError("Failed to load current settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin inline-flex items-center justify-center">
            <FaSpinner className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-2 text-gray-600">Loading file configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadCurrentSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            File Configuration
          </h1>
          <p className="mt-2 text-gray-600">
            Manage file upload settings and restrictions for all students
          </p>
        </div>

        {/* Current Configuration Summary */}
        {formattedRules && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-blue-900 mb-3">
              Current Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-blue-700">Allowed Types</h3>
                <p className="text-sm text-blue-600 mt-1">{formattedRules.allowedTypes}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-700">Max File Size</h3>
                <p className="text-sm text-blue-600 mt-1">{formattedRules.maxSize}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-700">Max Name Length</h3>
                <p className="text-sm text-blue-600 mt-1">{formattedRules.maxNameLength}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-700">Max Files/Subject</h3>
                <p className="text-sm text-blue-600 mt-1">{formattedRules.maxFilesPerSubject}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Configure File Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update the file upload restrictions and requirements for all student accounts
            </p>
          </div>
          <div className="px-6 py-6">
            <FileConfigForm onSettingsUpdated={loadCurrentSettings} />
          </div>
        </div>

        {/* Configuration Notes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-yellow-900 mb-3">
            Configuration Notes
          </h2>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Changes to file configuration will apply immediately to all new file uploads</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Existing files will not be affected by new configuration rules</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Students will be shown these restrictions during file upload</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>File size limits help manage storage costs and performance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Allowed file types can be adjusted based on your institution's needs</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/dashboard"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </a>
          <div className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md bg-gray-50">
            <span className="text-sm text-gray-600">
              Last loaded: {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
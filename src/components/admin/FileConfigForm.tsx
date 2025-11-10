"use client";

import { useState, useEffect } from "react";
import { getAdminSettings, updateAdminSettings, validateFileConfig } from "@/lib/adminConfig";
import { DEFAULT_ADMIN_FILE_CONFIG } from "@/types/admin";
import { AdminFileConfig } from "@/types/admin";
import { FileType } from "@/types/subject";
import { useAuth } from "@/contexts/AuthContext";
import {
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFile,
} from "react-icons/fa";

interface FileConfigFormProps {
  onSettingsUpdated?: () => void;
}

const availableFileTypes: FileType[] = [
  'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif',
  'zip', 'rar', 'mp4', 'mp3', 'wav', 'xlsx', 'pptx'
];

const fileSizeOptions = [
  { label: "1 MB", value: 1 },
  { label: "5 MB", value: 5 },
  { label: "10 MB", value: 10 },
  { label: "25 MB", value: 25 },
  { label: "50 MB", value: 50 },
  { label: "100 MB", value: 100 },
];

export default function FileConfigForm({ onSettingsUpdated }: FileConfigFormProps) {
  const { user } = useAuth();
  const [currentConfig, setCurrentConfig] = useState<AdminFileConfig>(DEFAULT_ADMIN_FILE_CONFIG);
  const [formData, setFormData] = useState<AdminFileConfig>(DEFAULT_ADMIN_FILE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getAdminSettings();
      setCurrentConfig(settings.fileConfig);
      setFormData(settings.fileConfig);
    } catch (error) {
      console.error("Error loading admin settings:", error);
      setErrors(["Failed to load current settings"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileTypeToggle = (fileType: FileType) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const handleInputChange = (field: keyof AdminFileConfig, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseInt(value) || 0 : value
    }));
  };

  const handleReset = () => {
    setFormData(currentConfig);
    setErrors([]);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.userId) {
      setErrors(["User not authenticated"]);
      return;
    }

    // Validate form data
    const validationErrors = validateFileConfig(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      setErrors([]);
      setSuccessMessage(null);

      await updateAdminSettings(formData, user.userId);

      setCurrentConfig(formData);
      setSuccessMessage("File configuration updated successfully!");
      onSettingsUpdated?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      setErrors(["Failed to update settings. Please try again."]);
    } finally {
      setIsSaving(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.length === 1 ? "Error" : "Errors"}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Types Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Allowed File Types
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {availableFileTypes.map((fileType) => (
            <label
              key={fileType}
              className={`
                relative flex cursor-pointer rounded-lg border p-3 focus:outline-none
                ${formData.allowedFileTypes.includes(fileType)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.allowedFileTypes.includes(fileType)}
                onChange={() => handleFileTypeToggle(fileType)}
                disabled={isSaving}
              />
              <div className="flex items-center justify-center w-full">
                <FaFile className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{fileType.toUpperCase()}</span>
              </div>
            </label>
          ))}
        </div>
        {formData.allowedFileTypes.length === 0 && (
          <p className="mt-2 text-sm text-red-600">At least one file type must be selected</p>
        )}
      </div>

      {/* Maximum File Size */}
      <div>
        <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum File Size
        </label>
        <select
          id="maxFileSize"
          value={formData.maxFileSizeBytes / (1024 * 1024)}
          onChange={(e) => handleInputChange('maxFileSizeBytes', parseInt(e.target.value) * 1024 * 1024)}
          disabled={isSaving}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {fileSizeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Maximum File Name Length */}
      <div>
        <label htmlFor="maxFileNameLength" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum File Name Length
        </label>
        <input
          type="number"
          id="maxFileNameLength"
          min="10"
          max="255"
          value={formData.maxFileNameLength}
          onChange={(e) => handleInputChange('maxFileNameLength', e.target.value)}
          disabled={isSaving}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Characters (between 10 and 255)
        </p>
      </div>

      {/* Maximum Files Per Subject */}
      <div>
        <label htmlFor="maxFilesPerSubject" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Files Per Subject
        </label>
        <input
          type="number"
          id="maxFilesPerSubject"
          min="1"
          max="500"
          value={formData.maxFilesPerSubject}
          onChange={(e) => handleInputChange('maxFilesPerSubject', e.target.value)}
          disabled={isSaving}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Files per subject (between 1 and 500)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <FaTimes className="h-4 w-4 mr-2" />
          Reset
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            <>
              <FaSave className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}
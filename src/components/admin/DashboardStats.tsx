"use client";

import { useState, useEffect } from "react";
import { AdminDashboardStats } from "@/types/admin";
import { getAdminDashboardStats, formatBytes, getFileTypeDistribution } from "@/lib/adminAnalytics";
import {
  FaUsers,
  FaFolderOpen,
  FaHdd,
  FaChartBar,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red";
  description?: string;
}

function StatsCard({ title, value, icon, color = "blue", description }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [fileDistribution, setFileDistribution] = useState<Array<{ type: string; count: number; size: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardStats, fileTypes] = await Promise.all([
        getAdminDashboardStats(),
        getFileTypeDistribution(),
      ]);

      setStats(dashboardStats);
      setFileDistribution(fileTypes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin inline-flex items-center justify-center">
            <FaSpinner className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-2 text-gray-600">Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={<FaUsers className="h-6 w-6" />}
          color="blue"
          description="Registered student accounts"
        />
        <StatsCard
          title="Total Files"
          value={stats.totalFiles.toLocaleString()}
          icon={<FaFolderOpen className="h-6 w-6" />}
          color="green"
          description="Files uploaded by all students"
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(stats.totalStorageUsed)}
          icon={<FaHdd className="h-6 w-6" />}
          color="yellow"
          description="Total storage consumption"
        />
      </div>

      {/* Storage Usage by User */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Storage Usage by User (Top 10)
          </h3>
          <div className="space-y-3">
            {stats.storageUsedByUser.slice(0, 10).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {user.userEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.fileCount} files
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatBytes(user.storageUsed)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((user.storageUsed / stats.totalStorageUsed) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            File Type Distribution
          </h3>
          <div className="space-y-3">
            {fileDistribution.slice(0, 8).map((type) => (
              <div key={type.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600 uppercase">
                      {type.type.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {type.type.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(type.size)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {type.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.totalFiles > 0
                      ? `${((type.count / stats.totalFiles) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/settings"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaChartBar className="h-4 w-4 mr-2" />
            Configure File Settings
          </a>
          <button
            onClick={loadDashboardData}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaSpinner className="h-4 w-4 mr-2" />
            Refresh Statistics
          </button>
          <div className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md bg-gray-50">
            <span className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
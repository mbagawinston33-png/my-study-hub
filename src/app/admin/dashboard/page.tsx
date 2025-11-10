import { Metadata } from "next";
import DashboardStats from "@/components/admin/DashboardStats";

export const metadata: Metadata = {
  title: "Admin Dashboard - MyStudyHub",
  description: "Admin dashboard for MyStudyHub control panel",
};

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor student activity and manage system settings
          </p>
        </div>

        <DashboardStats />
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import {
  FaUserShield,
  FaCog,
  FaSignOutAlt,
  FaTachometerAlt
} from "react-icons/fa";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't protect the login page
  const isLoginPage = pathname === "/admin/login";

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: FaTachometerAlt,
      current: pathname === "/admin/dashboard",
    },
    {
      name: "File Settings",
      href: "/admin/settings",
      icon: FaCog,
      current: pathname === "/admin/settings",
    },
  ];

  const content = (
    <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center">
                    <FaUserShield className="h-8 w-8 text-blue-600" />
                    <h1 className="ml-3 text-xl font-bold text-gray-900">
                      Admin Portal
                    </h1>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className={`${
                            item.current
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FaUserShield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-sm"
                >
                  <FaSignOutAlt className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {/* Hamburger icon */}
                  <svg
                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  {/* Close icon */}
                  <svg
                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${
                        item.current
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } block px-3 py-2 rounded-md text-base font-medium flex items-center`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </a>
                  );
                })}
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FaUserShield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{user?.email}</div>
                      <div className="text-gray-500">Administrator</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                    >
                      <FaSignOutAlt className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <main>{children}</main>
      </div>
    )

  // Only wrap with AdminProtectedRoute if not login page
  if (isLoginPage) {
    return content;
  }

  return <AdminProtectedRoute>{content}</AdminProtectedRoute>;
}
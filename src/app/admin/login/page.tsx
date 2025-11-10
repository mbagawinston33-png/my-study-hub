import { Metadata } from "next";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login - MyStudyHub",
  description: "Admin login for MyStudyHub control panel",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
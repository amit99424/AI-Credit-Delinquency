"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">

        {/* Desktop Sidebar */}
        <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <Sidebar />

          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">

          {/* Mobile Header */}
          <div className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="ml-3">
              <p className="font-bold text-slate-900">
                CreditAI
              </p>

              <p className="text-xs text-slate-500">
                Risk Intelligence
              </p>
            </div>
          </div>

          {/* Page Content */}
          <main className="min-w-0 p-4 sm:p-6 lg:p-8">
            {children}
          </main>

        </div>
      </div>
    </AuthGuard>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  History,
  ChartNoAxesCombined,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "New Prediction",
    href: "/predict",
    icon: BrainCircuit,
  },
  {
    name: "Prediction History",
    href: "/predictions",
    icon: History,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
  },
];

type User = {
  name: string;
  email: string;
  role?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  // Get logged-in user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // Logout Function
  const handleLogout = () => {
    // Remove JWT token
    localStorage.removeItem("access_token");

    // Remove saved user data
    localStorage.removeItem("user");

    // Redirect to login page
    router.push("/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-slate-950 px-4 py-6 text-white">

      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h1 className="text-xl font-bold">
            CreditAI
          </h1>

          <p className="text-xs text-slate-400">
            Risk Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={19} />

              <span>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3">

        {/* Logged In User */}
        {user && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-3">

              {/* User Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              {/* User Details */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {user.email}
                </p>

                {user.role && (
                  <p className="mt-1 text-xs capitalize text-blue-400">
                    {user.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BrainCircuit
              size={18}
              className="text-blue-400"
            />

            <p className="text-sm font-medium">
              AI Model
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Random Forest Classifier
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />

            <span className="text-xs text-green-400">
              Model Active
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={19} />

          <span>
            Logout
          </span>
        </button>

      </div>
    </aside>
  );
}
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  BarChart3, Bell, ChevronDown, FileText, Home, List, LogOut,
  Megaphone, Menu, Package, PlusCircle, Search, Settings, Tag, User, Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [campaignMenuOpen, setCampaignMenuOpen] = useState(false);
  const [advertiseMenuOpen, setAdvertiseMenuOpen] = useState(false);
  const [productConfigMenuOpen, setProductConfigMenuOpen] = useState(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) {
      redirected.current = true;
      router.replace("/login");
    } else if (user.role !== "admin") {
      redirected.current = true;
      router.replace("/viewer");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: "Dashboard", link: "/dashboard" },
    {
      icon: BarChart3, label: "Campaign", hasSubmenu: true,
      submenu: [
        { label: "Create Campaign", link: "/dashboard/campaign/create", icon: PlusCircle },
        { label: "Campaigns", link: "/dashboard/campaign", icon: List },
      ],
    },
    {
      icon: Megaphone, label: "Advertisement", hasSubmenu: true,
      submenu: [
        { label: "Create Advertisement", link: "/dashboard/advertise/create-advertisement-content", icon: PlusCircle },
        { label: "Advertisement List", link: "/dashboard/advertise/advertise-list", icon: List },
      ],
    },
    { icon: Users, label: "Users", link: "/dashboard/users" },
    {
      icon: Package, label: "Product Config", hasSubmenu: true,
      submenu: [
        { label: "Brand Management", link: "/dashboard/brands", icon: Tag },
      ],
    },
    { icon: FileText, label: "Projects", link: "/dashboard/projects" },
    { icon: Settings, label: "Settings", link: "/dashboard/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <Link href="/" className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {sidebarOpen && <span className="font-semibold text-lg">Campaign Dashboard</span>}
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isOpen =
              (item.label === "Campaign" && campaignMenuOpen) ||
              (item.label === "Advertisement" && advertiseMenuOpen) ||
              (item.label === "Product Config" && productConfigMenuOpen);

            return (
              <div key={item.label}>
                {item.hasSubmenu ? (
                  <>
                    <button
                      onClick={() => {
                        if (item.label === "Campaign") setCampaignMenuOpen(!campaignMenuOpen);
                        if (item.label === "Advertisement") setAdvertiseMenuOpen(!advertiseMenuOpen);
                        if (item.label === "Product Config") setProductConfigMenuOpen(!productConfigMenuOpen);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800"
                    >
                      <item.icon size={20} />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </>
                      )}
                    </button>
                    {isOpen && sidebarOpen && (
                      <div className="mt-2 ml-4 space-y-1">
                        {item.submenu.map((sub) => (
                          <Link href={sub.link} key={sub.label}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-slate-800">
                            <sub.icon size={16} className="text-gray-400" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.link}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800">
                    <item.icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{user?.name?.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white">{user?.name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <Link href="/dashboard/profile" className="px-4 py-2 text-sm flex gap-2 hover:bg-gray-50">
                    <User size={16} /> Profile
                  </Link>
                  <Link href="/dashboard/settings" className="px-4 py-2 text-sm flex gap-2 hover:bg-gray-50">
                    <Settings size={16} /> Settings
                  </Link>
                  <hr />
                  <button onClick={logout} className="w-full px-4 py-2 text-left text-sm text-red-600 flex gap-2 hover:bg-gray-50">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-gray-100 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
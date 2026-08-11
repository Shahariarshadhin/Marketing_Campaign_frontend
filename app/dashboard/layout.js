"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Bell,
  Users,
  Monitor,
  LayoutGrid,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  Home,
  BarChart2,
  Layers,
  Target,
  FileText,
  Tag,
  HelpCircle,
  RefreshCw,
  HomeIcon,
  Music2,
} from "lucide-react";

// ─── DV360-style icon button ──────────────────────────────────────────────────
function IconBtn({ icon: Icon, label, badge, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative w-9 h-9 flex items-center justify-center rounded-full transition
        ${active ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
    >
      <Icon size={19} strokeWidth={1.7} />
      {badge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border border-white" />
      )}
    </button>
  );
}

// ─── Right sidebar tool icons (DV360-style vertical strip) ───────────────────
function RightSidebar() {
  const tools = [
    { icon: BarChart2, label: "Reports" },
    { icon: HelpCircle, label: "Help" },
    { icon: RefreshCw, label: "Release notes" },
  ];
  return (
    <aside className="w-10 bg-white border-l border-gray-200 flex flex-col items-center py-3 gap-2 shrink-0">
      {tools.map(({ icon: Icon, label }) => (
        <button
          key={label}
          title={label}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
        >
          <Icon size={17} strokeWidth={1.7} />
        </button>
      ))}
    </aside>
  );
}

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

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

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const navItems = [
    { icon: Home, label: "Home", link: "/dashboard/brands" },
    {
      icon: BarChart2,
      label: "Campaigns",
      hasSubmenu: true,
      submenu: [
        { label: "All Campaigns", link: "/dashboard/brands" },
        { label: "Mother Brands", link: "/dashboard/brands" },
      ],
    },
    {
      icon: Music2,
      label: "Tiktok Ads Manager",
      link: "/dashboard/tiktok-ads-manager",
    },
    { icon: Layers, label: "Creatives", link: "/dashboard/brands" },
    { icon: Target, label: "Audiences", link: "/dashboard/brands" },
    { icon: Users, label: "Users", link: "/dashboard/users" },
    { icon: Tag, label: "Brands", link: "/dashboard/brands" },
    { icon: Settings, label: "Settings", link: "/dashboard/settings" },
  ];

  const toggleMenu = (label) =>
    setOpenMenus((m) => ({ ...m, [label]: !m[label] }));

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0 z-30">
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <Menu size={20} strokeWidth={1.7} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-3 shrink-0">
          <Link href="/" className="flex items-center gap-3 p-1">
            <Image
              src="/assets/logo/logo.svg"
              alt="Campaign Dashboard"
              width={32}
              height={32}
              className="w-32 h-32"
            />
          </Link>
        </div>

        {/* Partner label */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-l border-gray-200 mr-3 shrink-0">
          <div className="w-5 h-5 text-black rounded-sm flex items-center justify-center shrink-0">
            <HomeIcon size={17} strokeWidth={1.7} />
          </div>
          <div className="leading-tight">
            <p className="text-xs text-gray-400 leading-none">Partner</p>
            <p className="text-xs font-semibold text-gray-800 leading-none whitespace-nowrap">
              Slingshot Media
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right icon group */}
        <div className="flex items-center gap-0.5">
          <IconBtn icon={Search} label="Search" />
          <IconBtn icon={Bell} label="Notifications" badge />
          <IconBtn icon={Users} label="Support" />
          <IconBtn icon={Monitor} label="Preview" />
          <IconBtn icon={FileText} label="Reports" />
          <IconBtn icon={LayoutGrid} label="More apps" />

          {/* Avatar / user menu */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
            >
              {initials}
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mx-auto mb-2">
                      {initials}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 text-center">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-400 text-center capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={15} className="text-gray-400" /> Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Settings size={15} className="text-gray-400" /> Settings
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Body row ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside
          className={`${sidebarOpen ? "w-56" : "w-14"} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0 overflow-hidden`}
        >
          {/* Nav items */}
          <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive =
                item.link === pathname ||
                item.submenu?.some((s) => pathname?.startsWith(s.link));
              const isExpanded = openMenus[item.label];

              return (
                <div key={item.label}>
                  {item.hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition
                          ${isActive ? "text-gray-700 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={1.8}
                          className="shrink-0"
                        />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-left font-medium">
                              {item.label}
                            </span>
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </>
                        )}
                      </button>
                      {isExpanded && sidebarOpen && (
                        <div className="ml-9 border-l border-gray-100">
                          {item.submenu.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.link}
                              className={`block px-3 py-2 text-xs transition
                                ${pathname === sub.link ? "text-gray-700 font-semibold" : "text-gray-500 hover:text-gray-800"}`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.link}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm transition
                        ${pathname === item.link ? "text-gray-700 bg-blue-50 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                      {sidebarOpen && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom: user strip */}
          {sidebarOpen && (
            <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <RightSidebar />
      </div>
    </div>
  );
}

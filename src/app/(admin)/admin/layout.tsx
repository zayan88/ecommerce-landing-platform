"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBrand } from "@/components/brand/BrandProvider";
import { SAFKA_ENABLED } from "@/lib/features";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Tag,
  Target,
  CreditCard,
  Bot,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Lock,
  Megaphone,
  Settings,
  ChevronDown,
  Rss,
  Link2,
  Crosshair,
} from "lucide-react";

interface NavChild {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

const allNavigationItems: NavItem[] = [
  { name: "الرئيسية", href: "/admin", icon: LayoutDashboard },
  { name: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
  {
    name: "المنتجات",
    href: "/admin/catalog-group",
    icon: Tag,
    children: [
      { name: "كل المنتجات والعروض", href: "/admin/products", icon: Tag },
      { name: "صفحات الهبوط", href: "/admin/landing-pages", icon: Layers },
    ],
  },
  {
    name: "التتبع والتسويق",
    href: "/admin/marketing",
    icon: Megaphone,
    children: [
      { name: "إعدادات البيكسل", href: "/admin/marketing/pixels", icon: Crosshair },
      { name: "كتالوج المنتجات", href: "/admin/marketing/catalog", icon: Rss },
      { name: "روابط الإعلانات", href: "/admin/marketing/links", icon: Link2 },
    ],
  },
  { name: "دروبشيبينغ صفقة (Safka)", href: "/admin/safqa", icon: ShoppingBag },
  { name: "الإعدادات", href: "/admin/settings", icon: Settings },
];

const navigationItems = allNavigationItems.filter((item) => SAFKA_ENABLED || item.href !== "/admin/safqa");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrand();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pendingBadge, setPendingBadge] = useState(0);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/admin/orders-pulse", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPendingBadge(j?.success && j.supported !== false && typeof j.pending_count === "number" ? j.pending_count : 0))
      .catch(() => {});
  }, [pathname]);

  // If on login page, render full screen login without sidebar/topbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    if (!confirm("هل أنت متأكد من تسجيل الخروج من لوحة التحكم؟")) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-right font-sans" dir="rtl">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={brand.store_name} className="h-9 max-w-[7rem] rounded-lg bg-white p-1 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-base">
              {(brand.store_name || "M").trim().charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-heading font-black text-base">لوحة تحكم {brand.store_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            className="p-2 rounded-lg bg-slate-800 text-red-400 hover:text-red-300"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 px-2">
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt={brand.store_name} className="h-11 max-w-[8rem] rounded-xl bg-white p-1 object-contain shadow-lg" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
                  {(brand.store_name || "M").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-heading font-black text-white text-base leading-tight">
                  {brand.store_name}
                </h2>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> جلسة مشفرة وآمنة
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const groupActive = item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                const open = groupActive || openGroups[item.href];
                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenGroups((g) => ({ ...g, [item.href]: !open }))}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        groupActive ? "text-white bg-slate-800/60" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${groupActive ? "text-emerald-400" : "text-slate-400"}`} />
                      <span className="flex-1 text-right">{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="mt-1 mr-5 pr-3 border-r border-slate-700/70 space-y-1">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                                childActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 flex-shrink-0 ${childActive ? "text-white" : "text-slate-500"}`} />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              const isActive = item.href === "/admin/settings" ? pathname.startsWith(item.href) : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/admin/orders" && pendingBadge > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center" aria-label={`${pendingBadge} طلب جديد`}>
                      {pendingBadge > 99 ? "99+" : pendingBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-3 px-2">
          <div className="flex gap-2">
            <a
              href="/"
              target="_blank"
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>المتجر الرئيسي</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="تسجيل الخروج"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Desktop Bar */}
        <header className="hidden md:flex bg-white border-b border-gray-200 py-3.5 px-8 items-center justify-between sticky top-0 z-30 shadow-sm">
          <div />

          <div className="flex items-center gap-3 text-xs font-bold">
            <a
              href="/"
              target="_blank"
              className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
            >
              <span>معاينة واجهة المتجر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* Child Pages */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

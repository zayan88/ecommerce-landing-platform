"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

const navigationItems = [
  { name: "الإحصائيات والأداء", href: "/admin", icon: LayoutDashboard },
  { name: "إدارة الطلبات", href: "/admin/orders", icon: ShoppingBag },
  { name: "صفحات الهبوط", href: "/admin/landing-pages", icon: Layers },
  { name: "المنتجات والعروض", href: "/admin/products", icon: Tag },
  { name: "تتبع ميتا و CAPI", href: "/admin/tracking", icon: Target },
  { name: "دروبشيبينغ صفقة (Safka)", href: "/admin/safqa", icon: ShoppingBag },
  { name: "دليل وكيل AI (الإنشاء السريع)", href: "/admin/ai-guide", icon: Bot },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-base">
            R
          </div>
          <span className="font-heading font-black text-base">لوحة تحكم RexRack</span>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
                R
              </div>
              <div>
                <h2 className="font-heading font-black text-white text-base leading-tight">
                  RexRack Admin
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
              const isActive = pathname === item.href;
              const Icon = item.icon;
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
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-3 px-2">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">بوابة صفقة:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                API جاهز
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Meta CAPI:</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                مُفعل
              </span>
            </div>
          </div>

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
        <header className="hidden md:flex bg-white border-b border-gray-200 py-3.5 px-8 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">السوق المستهدف:</span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              🇪🇬 جمهورية مصر العربية (COD + Safqa)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3 text-emerald-600" /> الدخول محمي بالرمز السري
            </span>
          </div>

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

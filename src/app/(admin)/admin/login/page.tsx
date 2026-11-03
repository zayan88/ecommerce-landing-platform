"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Lock, KeyRound, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get("redirect") || "/admin";

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("يرجى كتابة رمز الدخول");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "رمز الدخول غير صحيح");
      }

      // Success, route to destination
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      {/* Brand & Lock Icon */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black font-heading text-white tracking-tight">
            لوحة التحكم المركزية | RexRack
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            الوصول مشفر ومحمي. يرجى إدخال الرمز السري الخاص بالمسؤول.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            رمز الدخول السري (Access PIN)
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              autoFocus
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="أدخل الرمز السري هنا..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-center text-lg font-mono tracking-widest outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute left-3 top-3.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showPin ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري التحقق...</span>
            </div>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>تسجيل الدخول إلى لوحة التحكم</span>
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
        <span>جلسة الدخول آمنة ومشفرة لمدة 30 يوماً على هذا الجهاز.</span>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white font-sans"
      dir="rtl"
    >
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-white text-center">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  total: number;
  page: number; // 1-based
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function TablePagination({ total, page, pageSize, onPageChange, onPageSizeChange }: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600" dir="rtl">
      <label className="flex items-center gap-2">
        <span>الصفوف لكل صفحة:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <span className="font-mono">
          {from}-{to} من {total}
        </span>
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="الصفحة السابقة">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="الصفحة التالية">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

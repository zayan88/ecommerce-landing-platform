"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { useEdit } from "./EditContext";

/**
 * Edit-mode only helpers (render nothing on the public site).
 * ERemove: a small red × on the top corner of its (relative) parent. EAdd: a dashed "+ add" button.
 */
export function ERemove({ onRemove, label = "حذف", className = "" }: { onRemove: () => void; label?: string; className?: string }) {
  const { editMode } = useEdit();
  if (!editMode) return null;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove();
      }}
      className={`absolute -top-2 -start-2 z-30 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md flex items-center justify-center cursor-pointer ${className}`}
    >
      <X className="w-4 h-4" />
    </button>
  );
}

export function EAdd({ onAdd, label = "إضافة", className = "" }: { onAdd: () => void; label?: string; className?: string }) {
  const { editMode } = useEdit();
  if (!editMode) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAdd();
      }}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl border-2 border-dashed border-sky-400 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer ${className}`}
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

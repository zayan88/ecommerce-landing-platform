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

/**
 * An element the merchant can delete and bring back. Public site: renders its children (nothing at all when deleted),
 * with no extra markup. Editor: a red × on the element, and a "+ add" button in its place once deleted.
 * `flag` is the content_config path that stores "deleted" (e.g. "hidden.hero_image").
 */
export function Removable({ flag, hidden, label, className = "", children }: { flag: string; hidden: boolean; label: string; className?: string; children: React.ReactNode }) {
  const { editMode, setField } = useEdit();
  if (!editMode) return hidden ? null : <>{children}</>;
  if (hidden) return <EAdd label={`إضافة ${label}`} onAdd={() => setField(flag, undefined)} className={className} />;
  return (
    <div className={`relative ${className}`}>
      <ERemove label={`حذف ${label}`} onRemove={() => setField(flag, true)} />
      {children}
    </div>
  );
}

/** A × on one list item (the item must be `relative` in the editor). Hidden when the list would become empty (empty lists fall back to defaults). */
export function ItemRemove({ field, items, index, min = 1, map }: { field: string; items: any[]; index: number; min?: number; map?: (rest: any[]) => any[] }) {
  const { editMode, setField } = useEdit();
  if (!editMode || items.length <= min) return null;
  return (
    <ERemove
      label="حذف"
      onRemove={() => {
        const rest = items.filter((_, i) => i !== index);
        setField(field, map ? map(rest) : rest);
      }}
    />
  );
}

/** "+ add" under a list: appends make(currentLength) to the visible items. */
export function ItemAdd({ field, items, make, label, max = 20, className = "" }: { field: string; items: any[]; make: (n: number) => any; label: string; max?: number; className?: string }) {
  const { editMode, setField } = useEdit();
  if (!editMode || items.length >= max) return null;
  return (
    <div className={`flex justify-center pt-1 ${className}`}>
      <EAdd label={label} onAdd={() => setField(field, [...items, make(items.length)])} />
    </div>
  );
}

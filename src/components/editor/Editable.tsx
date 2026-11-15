"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { ImagePlus, X } from "lucide-react";
import { useEdit } from "./EditContext";

// Loaded lazily so the public page bundle never carries the uploader
const ImageUploader = dynamic(
  () => import("@/components/admin/ImageUploader").then((m) => m.ImageUploader),
  { ssr: false }
);

interface ETextProps {
  /** Dot path into content_config, e.g. "hero_headline" or "hero_bullets.1". Omit for static text. */
  field?: string;
  /** The text shown on the page (already resolved with its fallback/default). */
  value: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  id?: string;
  multiline?: boolean;
  /** Resolved array root for indexed paths (first edit materialises the visible array). */
  base?: unknown;
  /** Static text before/after the value. Public: separate children (or one string with `merge`). */
  prefix?: string;
  suffix?: string;
  merge?: boolean;
}

/**
 * Text bound to a content_config field.
 * Public / view mode: renders exactly `<as className>{value}</as>` (no wrapper, no extra attributes).
 * Edit mode: same tag, contentEditable plain text, commits on blur / Enter.
 */
export function EText({ field, value, as = "span", className, id, multiline, base, prefix, suffix, merge }: ETextProps) {
  const { editMode, setField, selected, select } = useEdit();
  const ref = useRef<HTMLElement | null>(null);
  const [version, setVersion] = useState(0);

  if (!editMode || !field) {
    const children = merge
      ? [`${prefix || ""}${value}${suffix || ""}`]
      : [prefix, value, suffix].filter((x) => x !== undefined);
    return React.createElement(as, id ? { id, className } : { className }, ...(children as React.ReactNode[]));
  }

  const isSelected = selected?.field === field && selected.kind === "text";
  const outline = isSelected
    ? "outline outline-2 outline-offset-2 outline-sky-600"
    : "outline outline-2 outline-offset-2 outline-transparent hover:outline-dashed hover:outline-sky-400";
  const decor = `${prefix ? " before:content-[attr(data-prefix)]" : ""}${suffix ? " after:content-[attr(data-suffix)]" : ""}`;

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const next = (el.innerText || "").replace(/ /g, " ").replace(multiline ? /[ \t]+\n/g : /\s*\n\s*/g, multiline ? "\n" : " ").trim();
    if (next !== value) {
      setField(field, next, base);
    } else {
      el.textContent = value; // drop any stray formatting
    }
    setVersion((v) => v + 1);
  };

  return React.createElement(
    as,
    {
      key: `${field}:${version}:${value}`,
      ref: (el: HTMLElement | null) => {
        ref.current = el;
      },
      id,
      className: `${className || ""} ${outline} cursor-text transition-[outline-color]${decor}`.trim(),
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: false,
      "data-edit-field": field,
      "data-prefix": prefix,
      "data-suffix": suffix,
      onFocus: () => select({ field, kind: "text", value, base, multiline }),
      onClick: (e: React.MouseEvent) => {
        // keep <summary>/<a>/<button> parents from toggling while editing
        e.preventDefault();
        e.stopPropagation();
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter" && !(multiline && e.shiftKey)) {
          e.preventDefault();
          if (multiline) (e.currentTarget as HTMLElement).ownerDocument.execCommand("insertLineBreak");
          else (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          if (ref.current) ref.current.textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      },
      onKeyUp: (e: React.KeyboardEvent) => e.stopPropagation(),
      onPaste: (e: React.ClipboardEvent) => {
        e.preventDefault();
        let text = e.clipboardData.getData("text/plain");
        if (!multiline) text = text.replace(/\s*\n\s*/g, " ");
        (e.currentTarget as HTMLElement).ownerDocument.execCommand("insertText", false, text);
      },
      onBlur: commit,
    },
    value
  );
}

interface EImageProps {
  field: string;
  /** Currently displayed image URL (may be a product-image fallback). */
  value: string;
  label?: string;
}

/**
 * Edit-mode overlay for an image container. Place it INSIDE the existing relative container, next to
 * the <Image>. Public / view mode renders nothing at all, so the public DOM is untouched.
 */
export function EImage({ field, value, label = "تغيير الصورة" }: EImageProps) {
  const { editMode, setField, selected, select } = useEdit();
  const [open, setOpen] = useState(false);
  if (!editMode) return null;

  const isSelected = selected?.field === field && selected.kind === "image";

  return (
    <>
      <button
        type="button"
        data-edit-field={field}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          select({ field, kind: "image", value });
          setOpen(true);
        }}
        className={`absolute top-2 right-2 z-20 min-h-[40px] px-3 rounded-xl bg-white/95 text-slate-900 text-xs font-black shadow-md border flex items-center gap-1.5 cursor-pointer hover:bg-sky-50 ${
          isSelected ? "border-sky-600 ring-2 ring-sky-500/40" : "border-sky-300"
        }`}
      >
        <ImagePlus className="w-4 h-4 text-sky-700" />
        <span>{label}</span>
      </button>

      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          dir="rtl"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-3 text-right shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">{label}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-11 h-11 -m-2 flex items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <ImageUploader
              value={value}
              onChange={(url: string) => {
                setField(field, url);
                select({ field, kind: "image", value: url });
                setOpen(false);
              }}
              heightClass="h-56"
              hint="اختر صورة من جهازك أو الصق رابطاً"
            />
          </div>
        </div>,
        // Render the modal in the host admin window (not inside the preview iframe)
        window.parent !== window ? window.parent.document.body : document.body
      )}
    </>
  );
}

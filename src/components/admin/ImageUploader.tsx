"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Link2, X } from "lucide-react";
import { compressImage } from "@/lib/image-compress";

const MAX_SIDE = 1600; // (kept for readers: the shared compressor defaults to the same size)

/** Compress + upload. Returns the public URL (/api/media/<id>) or throws an Arabic message. */
export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("اختار صورة (JPG أو PNG أو WebP)");
  if (file.size > 25_000_000) throw new Error("الصورة كبيرة جداً (أكتر من 25 ميجا)");
  let blob: Blob;
  try {
    blob = await compressImage(file);
  } catch {
    throw new Error("تعذر قراءة الصورة، جرّب صورة تانية");
  }
  const form = new FormData();
  form.append("file", blob, "image");
  const res = await fetch("/api/media", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || "تعذر رفع الصورة");
  return data.url as string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  /** Tailwind height classes for the preview box. Explicit height keeps the preview from collapsing. */
  heightClass?: string;
}

/** One image: pick from gallery/camera (or drag a file), preview, replace, remove, or paste a URL instead. */
export function ImageUploader({ value, onChange, label, hint, heightClass = "h-40" }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImageFile(file));
    } catch (e: any) {
      setError(e?.message || "تعذر رفع الصورة");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 text-right" dir="rtl">
      {label && <p className="text-sm font-bold text-slate-800">{label}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative w-full ${heightClass} rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-slate-50 transition ${
          dragOver ? "border-orange-500 bg-orange-50" : "border-slate-300"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-contain bg-white" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center gap-1.5 text-slate-500 p-4 min-h-[48px]"
          >
            <ImagePlus className="w-8 h-8" aria-hidden="true" />
            <span className="text-sm font-bold">اضغط لاختيار صورة من جهازك</span>
            <span className="text-xs">أو اسحب الصورة وسيبها هنا</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> جاري تجهيز ورفع الصورة...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60"
        >
          <ImagePlus className="w-4 h-4" aria-hidden="true" /> {value ? "تغيير الصورة" : "رفع صورة"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="min-h-[44px] px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> حذف
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="min-h-[44px] px-3 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5"
        >
          <Link2 className="w-4 h-4" aria-hidden="true" /> {showUrl ? "إخفاء الرابط" : "أو الصق رابط صورة"}
        </button>
      </div>

      {showUrl && (
        <input
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
        />
      )}

      {hint && !error && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

interface ImageGalleryEditorProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

/** Several images (product gallery): upload many at once, remove, make any image the main one. */
export function ImageGalleryEditor({ value, onChange, max = 8, label }: ImageGalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    const next = [...value];
    try {
      for (const f of Array.from(files)) {
        if (next.length >= max) break;
        next.push(await uploadImageFile(f));
        onChange([...next]);
      }
    } catch (e: any) {
      setError(e?.message || "تعذر رفع الصورة");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const makeMain = (i: number) => {
    const next = [...value];
    const [item] = next.splice(i, 1);
    onChange([item, ...next]);
  };

  return (
    <div className="space-y-2 text-right" dir="rtl">
      {label && <p className="text-sm font-bold text-slate-800">{label}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative rounded-xl border border-slate-200 overflow-hidden bg-white h-24 sm:h-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 right-1 text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                الرئيسية
              </span>
            )}
            <button
              type="button"
              aria-label="حذف الصورة"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 left-1 w-7 h-7 rounded-full bg-white/90 text-rose-700 flex items-center justify-center shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makeMain(i)}
                className="absolute bottom-1 right-1 text-[10px] font-bold bg-white/90 text-slate-800 px-1.5 py-0.5 rounded-full shadow-sm"
              >
                اجعلها رئيسية
              </button>
            )}
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-24 sm:h-28 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-orange-400 flex flex-col items-center justify-center gap-1 text-xs font-bold disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-6 h-6" aria-hidden="true" />}
            {busy ? "جاري الرفع..." : "إضافة صور"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

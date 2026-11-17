"use client";

import React from "react";
import Image from "next/image";
import { EImage } from "./Editable";
import { EAdd, ERemove } from "./EditTools";
import { useEdit } from "./EditContext";

export interface ImageBlock {
  url: string;
  after: string;
}

const MAX_BLOCKS = 12;

/**
 * Images the merchant added after a section. Public: only the ones that have a picture (explicit-height box, never collapses).
 * Editor: every block with change/remove buttons, plus a "+ add image here" button.
 */
export function ImageBlocks({ after, blocks }: { after: string; blocks?: ImageBlock[] }) {
  const { editMode, setField } = useEdit();
  const all = blocks || [];
  const mine = all.map((b, i) => ({ b, i })).filter(({ b }) => b.after === after && (editMode || !!b.url));
  if (mine.length === 0 && !editMode) return null;
  return (
    <>
      {mine.map(({ b, i }) => (
        <div key={i} className="relative">
          <ERemove label="حذف الصورة" onRemove={() => setField("image_blocks", all.filter((_, k) => k !== i))} />
          <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-sm">
            {b.url ? (
              <Image src={b.url} alt="" fill sizes="(max-width: 768px) 100vw, 896px" className="object-contain p-2" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400">صورة جديدة: اضغط على تغيير الصورة</div>
            )}
            <EImage field={`image_blocks.${i}.url`} value={b.url} />
          </div>
        </div>
      ))}
      {editMode && all.length < MAX_BLOCKS && (
        <div className="flex justify-center">
          <EAdd label="إضافة صورة هنا" onAdd={() => setField("image_blocks", [...all, { url: "", after }])} />
        </div>
      )}
    </>
  );
}

"use client";

import React from "react";
import { LandingPageSectionConfig } from "@/types";
import { Check, Sliders, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

interface SectionsPanelProps {
  customSections: LandingPageSectionConfig[];
  isSavingSections: boolean;
  sectionSaveSuccess: boolean;
  handleToggleSection: (id: string) => void;
  handleMoveSection: (index: number, direction: "up" | "down") => void;
  handleResetSections: () => void;
  handleSaveSections: () => void | Promise<void>;
}

export default function SectionsPanel({
  customSections,
  isSavingSections,
  sectionSaveSuccess,
  handleToggleSection,
  handleMoveSection,
  handleResetSections,
  handleSaveSections,
}: SectionsPanelProps) {
  return (
    <div>
      <div className="bg-white rounded-3xl w-full p-5 sm:p-7 shadow-sm border border-gray-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 font-heading flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>تخصيص وترتيب أقسام صفحة الهبوط</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              تحكّم في إظهار أو إخفاء أي قسم، واستخدم الأسهم لتغيير مكان وترتيب كل قسم
            </p>
          </div>
        </div>

        {/* List of Sections */}
        <div className="space-y-2 py-1">
          {customSections.map((sec, index) => {
            const isFirst = index === 0;
            const isLast = index === customSections.length - 1;

            return (
              <div
                key={sec.id}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  sec.enabled
                    ? "bg-slate-50 border-slate-200"
                    : "bg-gray-100/60 border-gray-200 opacity-60"
                }`}
              >
                {/* Index & Title */}
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-700 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${sec.enabled ? "text-slate-900" : "text-gray-500 line-through"}`}>
                      {sec.name_ar}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ID: {sec.id}
                    </span>
                  </div>
                </div>

                {/* Controls (Move Up/Down & Toggle) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveSection(index, "up")}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveSection(index, "down")}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(sec.id)}
                    className={`min-h-[44px] py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      sec.enabled
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300"
                    }`}
                  >
                    {sec.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>ظاهر</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                        <span>مخفي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetSections}
            className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>الترتيب الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSavingSections}
              onClick={handleSaveSections}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {sectionSaveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>تم الحفظ والتطبيق!</span>
                </>
              ) : isSavingSections ? (
                <span>جاري الحفظ...</span>
              ) : (
                <span>حفظ وتطبيق التغييرات</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

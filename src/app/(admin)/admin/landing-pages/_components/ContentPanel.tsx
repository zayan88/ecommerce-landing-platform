"use client";

import React from "react";
import { LandingPageContentConfig } from "@/types";
import { Check, Edit3 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface ContentPanelProps {
  contentForm: LandingPageContentConfig;
  setContentForm: React.Dispatch<React.SetStateAction<LandingPageContentConfig>>;
  activeContentTab: "hero" | "comparison" | "box" | "steps" | "reviews";
  setActiveContentTab: React.Dispatch<React.SetStateAction<"hero" | "comparison" | "box" | "steps" | "reviews">>;
  isSavingContent: boolean;
  contentSaveSuccess: boolean;
  handleSaveContent: () => void | Promise<void>;
}

export default function ContentPanel({
  contentForm,
  setContentForm,
  activeContentTab,
  setActiveContentTab,
  isSavingContent,
  contentSaveSuccess,
  handleSaveContent,
}: ContentPanelProps) {
  return (
    <div>
      <div className="bg-white rounded-3xl w-full p-5 sm:p-7 shadow-sm border border-gray-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 font-heading flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-600" />
              <span>تعديل نصوص وصور صفحة الهبوط</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              غيّر العناوين، النصوص، والميديا بحرية كاملة مع بقاء هيكل وتصميم القالب ثابت بدون أي كسر
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveContentTab("hero")}
            className={`min-h-[44px] min-h-[44px] py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeContentTab === "hero"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            1. الهيرو والإعلان
          </button>
          <button
            type="button"
            onClick={() => setActiveContentTab("comparison")}
            className={`min-h-[44px] min-h-[44px] py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeContentTab === "comparison"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            2. قسم المقارنة
          </button>
          <button
            type="button"
            onClick={() => setActiveContentTab("box")}
            className={`min-h-[44px] min-h-[44px] py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeContentTab === "box"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            3. محتويات العلبة
          </button>
          <button
            type="button"
            onClick={() => setActiveContentTab("steps")}
            className={`min-h-[44px] min-h-[44px] py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeContentTab === "steps"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            4. طريقة الاستخدام
          </button>
          <button
            type="button"
            onClick={() => setActiveContentTab("reviews")}
            className={`min-h-[44px] min-h-[44px] py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeContentTab === "reviews"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            5. آراء العملاء
          </button>
        </div>

        {/* Tab Panels */}
        <div className="space-y-4 py-2 text-xs">
          {/* TAB 1: HERO */}
          {activeContentTab === "hero" && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  نص شريط الإعلان العلوي (Announcement Bar)
                </label>
                <input
                  type="text"
                  value={contentForm.announcement_bar || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, announcement_bar: e.target.value })
                  }
                  placeholder="عرض الشتاء: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  عنوان الهيرو الرئيسي (Headline)
                </label>
                <input
                  type="text"
                  value={contentForm.hero_headline || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, hero_headline: e.target.value })
                  }
                  placeholder="اسم المنتج والعنوان الجذاب في أعلى الصفحة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  العنوان الفرعي الإقناعي (Subheadline)
                </label>
                <textarea
                  rows={2}
                  value={contentForm.hero_subheadline || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, hero_subheadline: e.target.value })
                  }
                  placeholder="شرح سريع لمشكلة العميل وكيف يحلها المنتج"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    شارة التقييم والمصداقية (Hero Badge)
                  </label>
                  <input
                    type="text"
                    value={contentForm.hero_badge || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, hero_badge: e.target.value })
                    }
                    placeholder="4.9 / 5.0 (أكثر من 400 تقييم)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none"
                  />
                </div>

                <ImageUploader
                  label="صورة الهيرو الأساسية"
                  value={contentForm.hero_image || ""}
                  onChange={(url) => setContentForm({ ...contentForm, hero_image: url })}
                  hint="اختار الصورة من جهازك وهتترفع تلقائياً."
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1.5">
                  نقاط الهيرو البارزة (4 مميزات رئيسية)
                </label>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={contentForm.hero_bullets?.[idx] || ""}
                      onChange={(e) => {
                        const newBullets = [...(contentForm.hero_bullets || ["", "", "", ""])];
                        newBullets[idx] = e.target.value;
                        setContentForm({ ...contentForm, hero_bullets: newBullets });
                      }}
                      placeholder={`الميزة رقم ${idx + 1}`}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 text-gray-800 text-xs outline-none"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPARISON */}
          {activeContentTab === "comparison" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    شارة قسم المقارنة
                  </label>
                  <input
                    type="text"
                    value={contentForm.comparison_badge || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, comparison_badge: e.target.value })
                    }
                    placeholder="ليه ده أفضل اختيار؟"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    عنوان المقارنة الرئيسي
                  </label>
                  <input
                    type="text"
                    value={contentForm.comparison_title || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, comparison_title: e.target.value })
                    }
                    placeholder="الفرق بين المنتجات التقليدية وجهازنا"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              {/* Old vs New Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Old (Flaws) */}
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="block font-bold text-rose-800">
                    عنوان البدائل التقليدية:
                  </label>
                  <input
                    type="text"
                    value={contentForm.comparison_old_title || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, comparison_old_title: e.target.value })
                    }
                    placeholder="أجهزة النيبولايزر التقليدية القديمة"
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-rose-900 text-xs bg-white outline-none"
                  />
                  <label className="block font-bold text-rose-800 pt-1">3 عيوب للقديم:</label>
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={contentForm.comparison_old_points?.[idx] || ""}
                      onChange={(e) => {
                        const pts = [...(contentForm.comparison_old_points || ["", "", ""])];
                        pts[idx] = e.target.value;
                        setContentForm({ ...contentForm, comparison_old_points: pts });
                      }}
                      placeholder={`عيب رقم ${idx + 1}`}
                      className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-900 text-xs bg-white outline-none"
                    />
                  ))}
                </div>

                {/* New (Strengths) */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <label className="block font-bold text-emerald-800">
                    عنوان منتجنا الأصلي:
                  </label>
                  <input
                    type="text"
                    value={contentForm.comparison_new_title || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, comparison_new_title: e.target.value })
                    }
                    placeholder="جهاز Mesh Nebulizer الصامت المحمول"
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 text-xs bg-white outline-none"
                  />
                  <label className="block font-bold text-emerald-800 pt-1">3 مميزات لمنتجنا:</label>
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={contentForm.comparison_new_points?.[idx] || ""}
                      onChange={(e) => {
                        const pts = [...(contentForm.comparison_new_points || ["", "", ""])];
                        pts[idx] = e.target.value;
                        setContentForm({ ...contentForm, comparison_new_points: pts });
                      }}
                      placeholder={`ميزة رقم ${idx + 1}`}
                      className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-900 text-xs bg-white outline-none"
                    />
                  ))}
                </div>
              </div>

              {/* Comparison Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ImageUploader
                  label="صورة المقارنة"
                  value={contentForm.comparison_image || ""}
                  onChange={(url) => setContentForm({ ...contentForm, comparison_image: url })}
                  hint="اختار الصورة من جهازك وهتترفع تلقائياً."
                />
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    شارة الصورة (Image Badge Overlay)
                  </label>
                  <input
                    type="text"
                    value={contentForm.comparison_image_badge || ""}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, comparison_image_badge: e.target.value })
                    }
                    placeholder="صوت معدوم < 25dB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOX CONTENTS */}
          {activeContentTab === "box" && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  عنوان محتويات العلبة (Box Title)
                </label>
                <input
                  type="text"
                  value={contentForm.box_title || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, box_title: e.target.value })
                  }
                  placeholder="محتويات العلبة الأصلية (طقم كامل متكامل):"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  محتويات العلبة (كل عنصر في سطر منفصل)
                </label>
                <textarea
                  rows={5}
                  value={contentForm.box_items?.join("\n") || ""}
                  onChange={(e) =>
                    setContentForm({
                      ...contentForm,
                      box_items: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                    })
                  }
                  placeholder="1× الجهاز الأصلي...&#10;1× ماسك للأطفال...&#10;1× ماسك للكبار...&#10;1× كابل USB..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none leading-relaxed font-sans"
                />
              </div>

              <ImageUploader
                label="صورة محتويات العلبة"
                value={contentForm.box_image || ""}
                onChange={(url) => setContentForm({ ...contentForm, box_image: url })}
                hint="اختار الصورة من جهازك وهتترفع تلقائياً."
              />
            </div>
          )}

          {/* TAB 4: HOW TO USE / SPECS */}
          {activeContentTab === "steps" && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  عنوان طريقة الاستخدام والمواصفات
                </label>
                <input
                  type="text"
                  value={contentForm.how_to_use_title || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, how_to_use_title: e.target.value })
                  }
                  placeholder="طريقة الاستخدام السريعة والمواصفات:"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="block font-bold text-gray-800">الخطوات الثلاث:</label>
                {[0, 1, 2].map((idx) => {
                  const curStep = contentForm.how_to_use_steps?.[idx] || {
                    step_num: idx + 1,
                    title: `الخطوة ${idx + 1}:`,
                    desc: "",
                  };
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={curStep.title}
                          onChange={(e) => {
                            const steps = [...(contentForm.how_to_use_steps || [])];
                            steps[idx] = { ...curStep, title: e.target.value };
                            setContentForm({ ...contentForm, how_to_use_steps: steps });
                          }}
                          placeholder={`عنوان الخطوة ${idx + 1}`}
                          className="w-1/3 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-900 text-xs bg-white outline-none"
                        />
                        <input
                          type="text"
                          value={curStep.desc}
                          onChange={(e) => {
                            const steps = [...(contentForm.how_to_use_steps || [])];
                            steps[idx] = { ...curStep, desc: e.target.value };
                            setContentForm({ ...contentForm, how_to_use_steps: steps });
                          }}
                          placeholder={`شرح الخطوة ${idx + 1}`}
                          className="w-2/3 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <ImageUploader
                label="صورة طريقة الاستخدام"
                value={contentForm.how_to_use_image || ""}
                onChange={(url) => setContentForm({ ...contentForm, how_to_use_image: url })}
                hint="اختار الصورة من جهازك وهتترفع تلقائياً."
              />
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeContentTab === "reviews" && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  عنوان قسم آراء العملاء
                </label>
                <input
                  type="text"
                  value={contentForm.reviews_title || ""}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, reviews_title: e.target.value })
                  }
                  placeholder="تجارب حقيقية لعملاء في مصر:"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-none font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="block font-bold text-gray-800">3 تقييمات واقعية:</label>
                {[0, 1, 2].map((idx) => {
                  const curRev = contentForm.reviews?.[idx] || {
                    name: `عميل ${idx + 1}`,
                    location: "القاهرة",
                    comment: "",
                    rating: 5,
                  };
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={curRev.name}
                          onChange={(e) => {
                            const revs = [...(contentForm.reviews || [])];
                            revs[idx] = { ...curRev, name: e.target.value };
                            setContentForm({ ...contentForm, reviews: revs });
                          }}
                          placeholder="اسم العميل (مثال: أم سليم)"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-900 text-xs bg-white outline-none"
                        />
                        <input
                          type="text"
                          value={curRev.location}
                          onChange={(e) => {
                            const revs = [...(contentForm.reviews || [])];
                            revs[idx] = { ...curRev, location: e.target.value };
                            setContentForm({ ...contentForm, reviews: revs });
                          }}
                          placeholder="المنطقة (مثال: التجمع، القاهرة)"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-none"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={curRev.comment}
                        onChange={(e) => {
                          const revs = [...(contentForm.reviews || [])];
                          revs[idx] = { ...curRev, comment: e.target.value };
                          setContentForm({ ...contentForm, reviews: revs });
                        }}
                        placeholder="نص التقييم وتجربة العميل مع المنتج..."
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-none leading-relaxed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500">
            💡 التعديلات تُحفظ وتظهر فوراً على صفحة الهبوط بدون الحاجة لإعادة نشر
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSavingContent}
              onClick={handleSaveContent}
              className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {contentSaveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>تم الحفظ والتطبيق فوراً!</span>
                </>
              ) : isSavingContent ? (
                <span>جاري الحفظ...</span>
              ) : (
                <span>حفظ وتطبيق النصوص والصور</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

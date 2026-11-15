"use client";

import React from "react";
import { Product, LandingPageContentConfig } from "@/types";
import { Copy, Check, X, AlertCircle, Zap, Wand2, Edit3, Code, ChevronDown, ChevronUp } from "lucide-react";

interface CreateLandingPageModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  products: Product[];
  createMode: "quick" | "ai_prompt" | "safka";
  setCreateMode: React.Dispatch<React.SetStateAction<"quick" | "ai_prompt" | "safka">>;
  newTitle: string;
  setNewTitle: React.Dispatch<React.SetStateAction<string>>;
  newSlug: string;
  setNewSlug: React.Dispatch<React.SetStateAction<string>>;
  newProductId: string;
  newPixelId: string;
  setNewPixelId: React.Dispatch<React.SetStateAction<string>>;
  customHeadScripts: string;
  setCustomHeadScripts: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  copiedPrompt: boolean;
  aiInputText: string;
  setAiInputText: React.Dispatch<React.SetStateAction<string>>;
  aiParseMessage: string | null;
  setAiParseMessage: React.Dispatch<React.SetStateAction<string | null>>;
  showContentEditorInCreate: boolean;
  setShowContentEditorInCreate: React.Dispatch<React.SetStateAction<boolean>>;
  activeCreateTab: "hero" | "comparison" | "box" | "steps" | "reviews";
  setActiveCreateTab: React.Dispatch<React.SetStateAction<"hero" | "comparison" | "box" | "steps" | "reviews">>;
  creationContent: LandingPageContentConfig;
  setCreationContent: React.Dispatch<React.SetStateAction<LandingPageContentConfig>>;
  handleProductChange: (prodId: string) => void;
  handleCopyPrompt: () => void;
  handleParseAiResponse: () => void;
  handleCreateLandingPage: (e: React.FormEvent) => void | Promise<void>;
}

export default function CreateLandingPageModal({
  isModalOpen,
  setIsModalOpen,
  products,
  createMode,
  setCreateMode,
  newTitle,
  setNewTitle,
  newSlug,
  setNewSlug,
  newProductId,
  newPixelId,
  setNewPixelId,
  customHeadScripts,
  setCustomHeadScripts,
  isSubmitting,
  copiedPrompt,
  aiInputText,
  setAiInputText,
  aiParseMessage,
  setAiParseMessage,
  showContentEditorInCreate,
  setShowContentEditorInCreate,
  activeCreateTab,
  setActiveCreateTab,
  creationContent,
  setCreationContent,
  handleProductChange,
  handleCopyPrompt,
  handleParseAiResponse,
  handleCreateLandingPage,
}: CreateLandingPageModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 font-heading">
              إنشاء صفحة هبوط جديدة
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">اختر الطريقة الأسهل والأنسب لك</p>
          </div>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setCreateMode("quick")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              createMode === "quick" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>الوضع السريع التلقائي (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateMode("ai_prompt")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              createMode === "ai_prompt" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Wand2 className="w-4 h-4 text-indigo-600" />
            <span>برومبت الـ AI المجاني</span>
          </button>
        </div>

        <form onSubmit={handleCreateLandingPage} className="space-y-4">
          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اختر المنتج المراد إنشاء صفحة هبوط له
            </label>
            <select
              value={newProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title_ar} — ({p.base_price} ج.م)
                </option>
              ))}
            </select>
          </div>

          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                عنوان الصفحة
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                رابط الصفحة (Slug)
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-right"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">/p/{newSlug || "slug"}</span>
            </div>
          </div>

          {/* Mode Specific Helpers */}
          {createMode === "quick" ? (
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>توليد تلقائي فوري 100%</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-700">
                السيستم هيسحب صور المنتج وأسعاره ومواصفاته أوتوماتيك ويولّد صفحة هبوط رشيقة متطابقة مع معايير الـ COD (سلايدر صور + باقات عروض + فورم طلب مباشر + إشعار تليجرام). يمكنك أيضاً فتح قسم التخصيص بالأسفل لتعديل أي كلام أو صور قبل النشر.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Step 1: Copy AI Prompt */}
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <span>الخطوة 1: انسخ برومبت الـ AI لـ ChatGPT أو Claude</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? "تم النسخ!" : "نسخ البرومبت"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  البرومبت يطلب من الذكاء الاصطناعي تجهيز محتوى بيعي مقنع باللهجة المصرية وإخراجه في كود JSON منظم لملء الصفحة بنقرة واحدة.
                </p>
              </div>

              {/* Step 2: Paste AI Response Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    الخطوة 2: الصق كود الـ JSON أو الرد الذي نسخته من ChatGPT هنا:
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">يدعم JSON أو نصوص</span>
                </div>

                <textarea
                  rows={4}
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  placeholder='الصق الرد هنا... مثلاً: {"hero_headline": "...", "hero_bullets": [...]} أو النص المكتوب'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-900 bg-white outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleParseAiResponse}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>استخراج وتطبيق كود الذكاء الاصطناعي على نصوص الصفحة</span>
                  </button>

                  {aiInputText && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiInputText("");
                        setAiParseMessage(null);
                      }}
                      className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {aiParseMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      aiParseMessage.startsWith("✓")
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {aiParseMessage.startsWith("✓") ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{aiParseMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Section 1: Content & Copy Editor (Before Creation) */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowContentEditorInCreate(!showContentEditorInCreate)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-gray-800 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-600" />
                <span>تخصيص ومراجعة نصوص وصور الصفحة (محتوى الأقسام)</span>
                <span className="text-[10px] text-cyan-700 font-normal bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                  اختياري
                </span>
              </span>
              {showContentEditorInCreate ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showContentEditorInCreate && (
              <div className="p-4 space-y-4 border-t border-gray-200 text-xs">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveCreateTab("hero")}
                    className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeCreateTab === "hero"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    الهيرو والإعلان
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreateTab("comparison")}
                    className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeCreateTab === "comparison"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    المقارنة
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreateTab("box")}
                    className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeCreateTab === "box"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    محتويات العلبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreateTab("steps")}
                    className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeCreateTab === "steps"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    طريقة الاستخدام
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreateTab("reviews")}
                    className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeCreateTab === "reviews"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    آراء العملاء
                  </button>
                </div>

                {/* Tab 1: Hero */}
                {activeCreateTab === "hero" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        نص شريط الإعلان العلوي
                      </label>
                      <input
                        type="text"
                        value={creationContent.announcement_bar || ""}
                        onChange={(e) =>
                          setCreationContent({
                            ...creationContent,
                            announcement_bar: e.target.value,
                          })
                        }
                        placeholder="عرض خاص: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        عنوان الهيرو الرئيسي
                      </label>
                      <input
                        type="text"
                        value={creationContent.hero_headline || ""}
                        onChange={(e) =>
                          setCreationContent({
                            ...creationContent,
                            hero_headline: e.target.value,
                          })
                        }
                        placeholder="اسم المنتج والعنوان الجذاب"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 font-bold text-xs text-gray-900 bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        العنوان الفرعي الإقناعي
                      </label>
                      <textarea
                        rows={2}
                        value={creationContent.hero_subheadline || ""}
                        onChange={(e) =>
                          setCreationContent({
                            ...creationContent,
                            hero_subheadline: e.target.value,
                          })
                        }
                        placeholder="شرح سريع لمشكلة العميل وكيف يحلها المنتج"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          رابط صورة الهيرو الأساسية
                        </label>
                        <input
                          type="text"
                          value={creationContent.hero_image || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              hero_image: e.target.value,
                            })
                          }
                          placeholder="/landing-pages/... أو https://..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          شارة التقييم والمصداقية
                        </label>
                        <input
                          type="text"
                          value={creationContent.hero_badge || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              hero_badge: e.target.value,
                            })
                          }
                          placeholder="4.9 / 5.0 (أكثر من 400 تقييم)"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        نقاط الهيرو البارزة (4 مميزات رئيسية)
                      </label>
                      <div className="space-y-1.5">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={creationContent.hero_bullets?.[idx] || ""}
                            onChange={(e) => {
                              const bullets = [
                                ...(creationContent.hero_bullets || ["", "", "", ""]),
                              ];
                              bullets[idx] = e.target.value;
                              setCreationContent({
                                ...creationContent,
                                hero_bullets: bullets,
                              });
                            }}
                            placeholder={`الميزة رقم ${idx + 1}`}
                            className="w-full px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Comparison */}
                {activeCreateTab === "comparison" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          عنوان المقارنة
                        </label>
                        <input
                          type="text"
                          value={creationContent.comparison_title || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              comparison_title: e.target.value,
                            })
                          }
                          placeholder="الفرق بين المنتجات التقليدية وجهازنا"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          رابط صورة المقارنة
                        </label>
                        <input
                          type="text"
                          value={creationContent.comparison_image || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              comparison_image: e.target.value,
                            })
                          }
                          placeholder="/landing-pages/..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                        <span className="block font-bold text-rose-800">3 عيوب للمنتجات التقليدية:</span>
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={creationContent.comparison_old_points?.[idx] || ""}
                            onChange={(e) => {
                              const pts = [
                                ...(creationContent.comparison_old_points || ["", "", ""]),
                              ];
                              pts[idx] = e.target.value;
                              setCreationContent({
                                ...creationContent,
                                comparison_old_points: pts,
                              });
                            }}
                            placeholder={`عيب رقم ${idx + 1}`}
                            className="w-full px-2.5 py-1 rounded-md border border-rose-200 text-rose-900 text-xs bg-white outline-none"
                          />
                        ))}
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                        <span className="block font-bold text-emerald-800">3 مميزات لمنتجنا:</span>
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={creationContent.comparison_new_points?.[idx] || ""}
                            onChange={(e) => {
                              const pts = [
                                ...(creationContent.comparison_new_points || ["", "", ""]),
                              ];
                              pts[idx] = e.target.value;
                              setCreationContent({
                                ...creationContent,
                                comparison_new_points: pts,
                              });
                            }}
                            placeholder={`ميزة رقم ${idx + 1}`}
                            className="w-full px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900 text-xs bg-white outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Box Contents */}
                {activeCreateTab === "box" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          عنوان محتويات العلبة
                        </label>
                        <input
                          type="text"
                          value={creationContent.box_title || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              box_title: e.target.value,
                            })
                          }
                          placeholder="محتويات العلبة الأصلية:"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          رابط صورة العلبة والملحقات
                        </label>
                        <input
                          type="text"
                          value={creationContent.box_image || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              box_image: e.target.value,
                            })
                          }
                          placeholder="/landing-pages/..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        محتويات العلبة (كل عنصر في سطر)
                      </label>
                      <textarea
                        rows={3}
                        value={creationContent.box_items?.join("\n") || ""}
                        onChange={(e) =>
                          setCreationContent({
                            ...creationContent,
                            box_items: e.target.value
                              .split("\n")
                              .filter((l) => l.trim().length > 0),
                          })
                        }
                        placeholder="1× الجهاز الأصلي...&#10;1× الملحقات...&#10;1× كارت الضمان..."
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 4: Steps */}
                {activeCreateTab === "steps" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          عنوان طريقة الاستخدام
                        </label>
                        <input
                          type="text"
                          value={creationContent.how_to_use_title || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              how_to_use_title: e.target.value,
                            })
                          }
                          placeholder="طريقة الاستخدام السريعة:"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          رابط صورة المواصفات
                        </label>
                        <input
                          type="text"
                          value={creationContent.how_to_use_image || ""}
                          onChange={(e) =>
                            setCreationContent({
                              ...creationContent,
                              how_to_use_image: e.target.value,
                            })
                          }
                          placeholder="/landing-pages/..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {[0, 1, 2].map((idx) => {
                        const curStep = creationContent.how_to_use_steps?.[idx] || {
                          step_num: idx + 1,
                          title: `الخطوة ${idx + 1}:`,
                          desc: "",
                        };
                        return (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={curStep.title}
                              onChange={(e) => {
                                const steps = [
                                  ...(creationContent.how_to_use_steps || []),
                                ];
                                steps[idx] = { ...curStep, title: e.target.value };
                                setCreationContent({
                                  ...creationContent,
                                  how_to_use_steps: steps,
                                });
                              }}
                              placeholder={`عنوان الخطوة ${idx + 1}`}
                              className="w-1/3 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 font-bold bg-white outline-none"
                            />
                            <input
                              type="text"
                              value={curStep.desc}
                              onChange={(e) => {
                                const steps = [
                                  ...(creationContent.how_to_use_steps || []),
                                ];
                                steps[idx] = { ...curStep, desc: e.target.value };
                                setCreationContent({
                                  ...creationContent,
                                  how_to_use_steps: steps,
                                });
                              }}
                              placeholder={`شرح الخطوة ${idx + 1}`}
                              className="w-2/3 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 5: Reviews */}
                {activeCreateTab === "reviews" && (
                  <div className="space-y-3">
                    <label className="block font-bold text-gray-700">3 تقييمات واقعية:</label>
                    {[0, 1, 2].map((idx) => {
                      const curRev = creationContent.reviews?.[idx] || {
                        name: `عميل ${idx + 1}`,
                        location: "القاهرة",
                        comment: "",
                        rating: 5,
                      };
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={curRev.name}
                              onChange={(e) => {
                                const revs = [...(creationContent.reviews || [])];
                                revs[idx] = { ...curRev, name: e.target.value };
                                setCreationContent({
                                  ...creationContent,
                                  reviews: revs,
                                });
                              }}
                              placeholder="اسم العميل"
                              className="px-2.5 py-1 rounded-md border border-gray-300 text-xs font-bold text-gray-900 bg-white outline-none"
                            />
                            <input
                              type="text"
                              value={curRev.location}
                              onChange={(e) => {
                                const revs = [...(creationContent.reviews || [])];
                                revs[idx] = { ...curRev, location: e.target.value };
                                setCreationContent({
                                  ...creationContent,
                                  reviews: revs,
                                });
                              }}
                              placeholder="المحافظة أو المنطقة"
                              className="px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-800 bg-white outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            value={curRev.comment}
                            onChange={(e) => {
                              const revs = [...(creationContent.reviews || [])];
                              revs[idx] = { ...curRev, comment: e.target.value };
                              setCreationContent({
                                ...creationContent,
                                reviews: revs,
                              });
                            }}
                            placeholder="نص رأي وتجربة العميل..."
                            className="w-full px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 bg-white outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Section 2: Custom Head Scripts / Pixels */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>أكواد وتتبع إضافي (بيكسل فيسبوك / تيك توك / Custom Scripts)</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    معرف بيكسل فيسبوك مخصص للحملة (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newPixelId}
                    onChange={(e) => setNewPixelId(e.target.value)}
                    placeholder="اتركه فارغاً لاستخدام البيكسل الافتراضي للمتجر"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    أكواد تتبع في الـ Head (تيك توك، سناب شات، جوجل، أو CSS مخصص)
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={customHeadScripts}
                    onChange={(e) => setCustomHeadScripts(e.target.value)}
                    placeholder="<script>...أكواد بيكسل تيك توك أو جوجل تاج...</script>"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-left leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? "جاري النشر..." : "🚀 إنشاء ونشر صفحة الهبوط فوراً"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

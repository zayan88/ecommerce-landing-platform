"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LandingPage,
  LandingPageSectionConfig,
  LandingPageContentConfig,
  DEFAULT_LANDING_PAGE_SECTIONS,
  mergeSections,
} from "@/types";

export type ContentTabKey = "hero" | "comparison" | "box" | "steps" | "reviews";

export function buildContentDefaults(lp: LandingPage): LandingPageContentConfig {
  const existing = lp.content_config || {};
  const prod = lp.product;

  return {
    announcement_bar:
      existing.announcement_bar ||
      "عرض خاص: شحن مجاني لجميع المحافظات + حق فتح الشحنة والتجربة قبل الدفع 💵",
    hero_headline: existing.hero_headline || prod?.title_ar || lp.title,
    hero_subheadline:
      existing.hero_subheadline ||
      (prod?.description_ar?.slice(0, 140) ||
        "💡 احصل على أفضل تجربة مع المنتج الأصلي المعتمد وبأعلى معايير الجودة."),
    hero_badge:
      existing.hero_badge || "4.9 / 5.0 (أكثر من 400 تقييم موثق في مصر)",
    hero_image: existing.hero_image || prod?.images?.[0] || "",
    hero_bullets:
      existing.hero_bullets && existing.hero_bullets.length > 0
        ? existing.hero_bullets
        : [
            "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
            "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
            "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
            "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب.",
          ],

    comparison_badge: existing.comparison_badge || "ليه ده أفضل اختيار؟",
    comparison_title:
      existing.comparison_title || "الفرق بين المنتجات التقليدية والمنتج الأصلي",
    comparison_old_title:
      existing.comparison_old_title || "المنتجات والبدائل التقليدية",
    comparison_old_points: existing.comparison_old_points || [
      "خامات رديئة وضعيفة تتلف بسرعة بعد فترة قصيرة.",
      "بدون ضمان أو معاينة حقيقية قبل الدفع.",
      "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة.",
    ],
    comparison_new_title:
      existing.comparison_new_title || "المنتج الأصلي من متجرنا",
    comparison_new_points: existing.comparison_new_points || [
      "خامات أصلية 100% مختبرة ومضمونة الجودة.",
      "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
      "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة.",
    ],
    comparison_image:
      existing.comparison_image ||
      (prod?.images && prod.images.length > 1 ? prod.images[1] : ""),
    comparison_image_badge:
      existing.comparison_image_badge || "صوت معدوم < 25dB",

    box_title:
      existing.box_title || "محتويات الشحنة الأصلية (طقم كامل متكامل):",
    box_items: existing.box_items || [
      "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
      "كتالوج ودليل الاستخدام السريع باللغة العربية.",
      "كارت الضمان الرسمي وحق الاستبدال والمعاينة.",
    ],
    box_image:
      existing.box_image ||
      (prod?.images && prod.images.length > 2 ? prod.images[2] : ""),

    how_to_use_title:
      existing.how_to_use_title || "طريقة الاستخدام السريعة والمواصفات:",
    how_to_use_steps: existing.how_to_use_steps || [
      { step_num: 1, title: "الخطوة الأولى:", desc: "تجهيز المنتج وتركيب الملحق المناسب بسهولة." },
      { step_num: 2, title: "الخطوة الثانية:", desc: "التشغيل بضغطة زر واحدة واختيار الوضع المطلوب." },
      { step_num: 3, title: "الخطوة الثالثة:", desc: "الاستمتاع بالنتيجة الفورية وبراحة تامة." },
    ],
    how_to_use_image:
      existing.how_to_use_image ||
      (prod?.images && prod.images.length > 3 ? prod.images[3] : ""),

    reviews_title: existing.reviews_title || "تجارب حقيقية لعملائنا في مصر:",
    reviews: existing.reviews || [
      { name: "أم سليم", location: "التجمع، القاهرة", comment: "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.", rating: 5 },
      { name: "د. محمود كمال", location: "الجيزة", comment: "الخامات ممتازة وخدمة العملاء محترمة وعاينت وجربت مع المندوب قبل ما أدفع.", rating: 5 },
      { name: "هدى عبد الرحمن", location: "الإسكندرية", comment: "اشتريت عرض التوفير والتغليف فندقي ومحترم وأنصح أي حد يشتري منهم.", rating: 5 },
    ],
  };
}

/**
 * Editing state + save handlers for a single landing page (sections order/visibility and content/media).
 * `onSaved` receives the patch that was persisted so the caller can update its local copy of the page.
 */
export function useLandingPageEditor(
  lp: LandingPage | null,
  onSaved?: (patch: Partial<LandingPage>) => void
) {
  const [customSections, setCustomSections] = useState<LandingPageSectionConfig[]>([]);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [sectionSaveSuccess, setSectionSaveSuccess] = useState(false);

  const [contentForm, setContentForm] = useState<LandingPageContentConfig>({});
  const [activeContentTab, setActiveContentTab] = useState<ContentTabKey>("hero");
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentSaveSuccess, setContentSaveSuccess] = useState(false);

  const lpId = lp?.id;

  // (Re)initialise the forms whenever a different page is loaded
  useEffect(() => {
    if (!lp) return;
    // Merge so sections added after this page was saved (social_proof, faq) show up and can be toggled/moved
    setCustomSections(JSON.parse(JSON.stringify(mergeSections(lp.sections_config))));
    setSectionSaveSuccess(false);
    setContentForm(buildContentDefaults(lp));
    setContentSaveSuccess(false);
    setActiveContentTab("hero");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lpId]);

  const handleToggleSection = useCallback((id: string) => {
    setCustomSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const handleMoveSection = useCallback((index: number, direction: "up" | "down") => {
    setCustomSections((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }, []);

  const handleResetSections = useCallback(() => {
    setCustomSections(JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS)));
  }, []);

  const handleSaveSections = async () => {
    if (!lp) return;
    setIsSavingSections(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, sections_config: customSections }),
      });
      const data = await res.json();
      if (data.success) {
        setSectionSaveSuccess(true);
        onSaved?.({ sections_config: customSections });
        setTimeout(() => setSectionSaveSuccess(false), 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSections(false);
    }
  };

  const handleSaveContent = async () => {
    if (!lp) return;
    setIsSavingContent(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, content_config: contentForm }),
      });
      const data = await res.json();
      if (data.success) {
        setContentSaveSuccess(true);
        onSaved?.({ content_config: contentForm });
        setTimeout(() => setContentSaveSuccess(false), 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingContent(false);
    }
  };

  return {
    customSections,
    isSavingSections,
    sectionSaveSuccess,
    handleToggleSection,
    handleMoveSection,
    handleResetSections,
    handleSaveSections,
    contentForm,
    setContentForm,
    activeContentTab,
    setActiveContentTab,
    isSavingContent,
    contentSaveSuccess,
    handleSaveContent,
  };
}

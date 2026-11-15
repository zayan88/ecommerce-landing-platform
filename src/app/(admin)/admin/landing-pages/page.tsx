"use client";

import React, { useEffect, useState } from "react";
import { LandingPage, Product, LandingPageSectionConfig, LandingPageContentConfig, DEFAULT_LANDING_PAGE_SECTIONS, mergeSections } from "@/types";
import { Plus, ExternalLink, Copy, Check, Trash2, Sliders, Edit3 } from "lucide-react";
import SectionCustomizerModal from "./_components/SectionCustomizerModal";
import ContentEditorModal from "./_components/ContentEditorModal";
import CreateLandingPageModal from "./_components/CreateLandingPageModal";

export default function AdminLandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Section Customizer State
  const [customizingLp, setCustomizingLp] = useState<LandingPage | null>(null);
  const [customSections, setCustomSections] = useState<LandingPageSectionConfig[]>([]);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [sectionSaveSuccess, setSectionSaveSuccess] = useState(false);

  // Content & Media Editor State
  const [editingContentLp, setEditingContentLp] = useState<LandingPage | null>(null);
  const [contentForm, setContentForm] = useState<LandingPageContentConfig>({});
  const [activeContentTab, setActiveContentTab] = useState<"hero" | "comparison" | "box" | "steps" | "reviews">("hero");
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentSaveSuccess, setContentSaveSuccess] = useState(false);

  // Creation Mode: "quick" | "ai_prompt" | "safka"
  const [createMode, setCreateMode] = useState<"quick" | "ai_prompt" | "safka">("quick");

  // New Landing Page Form
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [customHeadScripts, setCustomHeadScripts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // AI Code / Content Input State
  const [aiInputText, setAiInputText] = useState("");
  const [aiParseMessage, setAiParseMessage] = useState<string | null>(null);
  const [showContentEditorInCreate, setShowContentEditorInCreate] = useState(false);
  const [activeCreateTab, setActiveCreateTab] = useState<"hero" | "comparison" | "box" | "steps" | "reviews">("hero");
  const [creationContent, setCreationContent] = useState<LandingPageContentConfig>({});

  const initCreationContentForProduct = (prod: Product) => {
    return {
      announcement_bar: "عرض خاص: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع 💵",
      hero_headline: prod.title_ar,
      hero_subheadline:
        prod.description_ar?.slice(0, 140) ||
        "💡 احصل على أفضل تجربة مع المنتج الأصلي المعتمد وبأعلى معايير الجودة.",
      hero_badge: "4.9 / 5.0 (أكثر من 400 تقييم موثق في مصر)",
      hero_image: prod.images?.[0] || "",
      hero_bullets: [
        "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
        "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
        "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
        "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب.",
      ],
      comparison_badge: "ليه ده أفضل اختيار؟",
      comparison_title: "الفرق بين المنتجات التقليدية والمنتج الأصلي",
      comparison_old_title: "المنتجات والبدائل التقليدية",
      comparison_old_points: [
        "خامات رديئة وضعيفة تتلف بسرعة.",
        "بدون ضمان أو معاينة حقيقية قبل الدفع.",
        "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة.",
      ],
      comparison_new_title: "المنتج الأصلي من متجرنا",
      comparison_new_points: [
        "خامات أصلية 100% مختبرة ومضمونة الجودة.",
        "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
        "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة.",
      ],
      comparison_image: prod.images && prod.images.length > 1 ? prod.images[1] : "",
      comparison_image_badge: "أعلى جودة واعتمادية",
      box_title: "محتويات الشحنة الأصلية (طقم كامل متكامل):",
      box_items: [
        "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
        "كتالوج ودليل الاستخدام السريع باللغة العربية.",
        "كارت الضمان الرسمي وحق الاستبدال والمعاينة.",
      ],
      box_image: prod.images && prod.images.length > 2 ? prod.images[2] : "",
      how_to_use_title: "طريقة الاستخدام السريعة والمواصفات:",
      how_to_use_steps: [
        { step_num: 1, title: "الخطوة الأولى:", desc: "تجهيز المنتج وتركيب الملحق المناسب بسهولة." },
        { step_num: 2, title: "الخطوة الثانية:", desc: "التشغيل بضغطة زر واحدة واختيار الوضع المطلوب." },
        { step_num: 3, title: "الخطوة الثالثة:", desc: "الاستمتاع بالنتيجة الفورية وبراحة تامة." },
      ],
      how_to_use_image: prod.images && prod.images.length > 3 ? prod.images[3] : "",
      reviews_title: "تجارب حقيقية لعملائنا في مصر:",
      reviews: [
        { name: "أم سليم", location: "التجمع، القاهرة", comment: "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.", rating: 5 },
        { name: "د. محمود كمال", location: "الجيزة", comment: "الخامات ممتازة وخدمة العملاء محترمة وعاينت وجربت مع المندوب قبل ما أدفع.", rating: 5 },
        { name: "هدى عبد الرحمن", location: "الإسكندرية", comment: "اشتريت عرض التوفير والتغليف فندقي ومحترم وأنصح أي حد يشتري منهم.", rating: 5 },
      ],
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lpRes, prodRes] = await Promise.all([
        fetch("/api/landing-pages"),
        fetch("/api/products"),
      ]);
      const [lpJson, prodJson] = await [await lpRes.json(), await prodRes.json()];

      if (lpJson.success) setLandingPages(lpJson.landingPages);
      if (prodJson.success) {
        setProducts(prodJson.products);
        if (prodJson.products.length > 0 && !newProductId) {
          const first = prodJson.products[0];
          setNewProductId(first.id);
          setNewTitle(`صفحة ${first.title_ar}`);
          setNewSlug(first.slug || "new-product");
          setCreationContent(initCreationContentForProduct(first));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (prodId: string) => {
    setNewProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setNewTitle(`صفحة ${prod.title_ar}`);
      setNewSlug(prod.slug || `offer-${Date.now().toString().slice(-4)}`);
      setCreationContent(initCreationContentForProduct(prod));
    }
  };

  const handleCopyPrompt = () => {
    const selectedProd = products.find((p) => p.id === newProductId);
    const prodName = selectedProd?.title_ar || "المنتج";
    const promptText = `أنت خبير كتابة صفحات هبوط احترافية ومقنعة (Direct Response Copywriting) للتجارة الإلكترونية في مصر بنظام الدفع عند الاستلام.
المنتج المطلوب هو: "${prodName}".

المطلوب: توليد محتوى كامل ومقنع باللهجة المصرية في صيغة كود JSON فقط لتوليد صفحة هبوط ذات معدل تحويل مرتفع، بالهيكل التالي:

\`\`\`json
{
  "announcement_bar": "عرض خاص: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع 💵",
  "hero_headline": "${prodName} الأصلي في مصر",
  "hero_subheadline": "جلسة مريحة وحل عملي ونهائي لمشاكل الاستخدام اليومي مع ضمان كامل.",
  "hero_badge": "4.9 / 5.0 (أكثر من 450 تقييم موثق في مصر)",
  "hero_bullets": [
    "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
    "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
    "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
    "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب."
  ],
  "comparison_title": "الفرق بين المنتجات التقليدية والمنتج الأصلي",
  "comparison_old_points": [
    "خامات رديئة وضعيفة تتلف بسرعة.",
    "بدون ضمان أو معاينة حقيقية قبل الدفع.",
    "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة."
  ],
  "comparison_new_points": [
    "خامات أصلية 100% مختبرة ومضمونة الجودة.",
    "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
    "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة."
  ],
  "box_title": "محتويات الشحنة الأصلية (طقم كامل متكامل):",
  "box_items": [
    "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
    "كتالوج ودليل الاستخدام السريع باللغة العربية.",
    "كارت الضمان الرسمي وحق الاستبدال والمعاينة."
  ],
  "how_to_use_title": "طريقة الاستخدام السريعة والمواصفات:",
  "how_to_use_steps": [
    {"step_num": 1, "title": "الخطوة الأولى:", "desc": "تجهيز المنتج وتركيب الملحق المناسب بسهولة."},
    {"step_num": 2, "title": "الخطوة الثانية:", "desc": "التشغيل بضغطة زر واحدة واختيار الوضع المطلوب."},
    {"step_num": 3, "title": "الخطوة الثالثة:", "desc": "الاستمتاع بالنتيجة الفورية وبراحة تامة."}
  ],
  "reviews_title": "تجارب حقيقية لعملائنا في مصر:",
  "reviews": [
    {"name": "أم سليم", "location": "التجمع، القاهرة", "comment": "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.", "rating": 5},
    {"name": "د. محمود كمال", "location": "الجيزة", "comment": "الخامات ممتازة وخدمة العملاء محترمة وعاينت وجربت مع المندوب قبل ما أدفع.", "rating": 5},
    {"name": "هدى عبد الرحمن", "location": "الإسكندرية", "comment": "اشتريت عرض التوفير والتغليف فندقي ومحترم وأنصح أي حد يشتري منهم.", "rating": 5}
  ]
}
\`\`\`
قم بتخصيص النصوص بدقة للمنتج وأخرج كود الـ JSON فقط بدون أي مقدمات أو كلام خارجي.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleParseAiResponse = () => {
    if (!aiInputText.trim()) {
      setAiParseMessage("يرجى لصق الرد أو الكود أولاً في الصندوق");
      return;
    }

    try {
      let jsonStr = "";
      const jsonBlockMatch = aiInputText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStr = jsonBlockMatch[1].trim();
      } else {
        const firstBrace = aiInputText.indexOf("{");
        const lastBrace = aiInputText.lastIndexOf("}");
        if (firstBrace > -1 && lastBrace > firstBrace) {
          jsonStr = aiInputText.substring(firstBrace, lastBrace + 1);
        }
      }

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === "object" && parsed !== null) {
          setCreationContent((prev) => ({
            ...prev,
            ...parsed,
          }));
          if (parsed.hero_headline && !newTitle) {
            setNewTitle(parsed.hero_headline);
          }
          setAiParseMessage("✓ تم استخراج كود الـ JSON بنجاح وتعبئة جميع أقسام صفحة الهبوط!");
          setShowContentEditorInCreate(true);
          return;
        }
      }
    } catch {}

    // Fallback: Smart Arabic text extraction
    const lines = aiInputText.split("\n").map((l) => l.trim()).filter(Boolean);
    const extracted: LandingPageContentConfig = { ...creationContent };
    const bullets: string[] = [];

    lines.forEach((line) => {
      if (/^[-•*]\s*(.+)/.test(line) || /^\d+[\.\-\)]\s*(.+)/.test(line)) {
        const clean = line.replace(/^[-•*\d\.\)\s]+/, "").trim();
        if (clean.length > 5 && bullets.length < 4) {
          bullets.push(clean);
        }
      }
      if (line.includes("العنوان:") || line.includes("عنوان:")) {
        extracted.hero_headline = line.replace(/.*(?:العنوان|عنوان)\s*[:：]/, "").trim();
      }
    });

    if (bullets.length > 0) {
      extracted.hero_bullets = bullets;
    }

    setCreationContent(extracted);
    setAiParseMessage("✓ تم استخراج النصوص وتطبيقها على أقسام الصفحة!");
    setShowContentEditorInCreate(true);
  };

  const handleCreateLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !newTitle || !newProductId) return;

    setIsSubmitting(true);
    try {
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const payload = {
        title: newTitle.trim(),
        slug: cleanSlug,
        component_key: "starter-template", // Automatically uses the Universal High-Converting COD Template
        product_id: newProductId,
        meta_pixel_id: newPixelId.trim() || undefined,
        head_scripts: customHeadScripts.trim() || undefined,
        content_config: creationContent,
        status: "active",
        deployment_url: `/p/${cleanSlug}`,
        deployment_status: "published",
        sections_config: DEFAULT_LANDING_PAGE_SECTIONS,
      };

      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setAiInputText("");
        setAiParseMessage(null);
        setShowContentEditorInCreate(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/p/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDeleteLandingPage = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف صفحة الهبوط "${title}"؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/landing-pages?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Section Customizer Methods
  const openSectionCustomizer = (lp: LandingPage) => {
    setCustomizingLp(lp);
    // Merge so sections added after this page was saved (social_proof, faq) show up and can be toggled/moved
    setCustomSections(JSON.parse(JSON.stringify(mergeSections(lp.sections_config))));
    setSectionSaveSuccess(false);
  };

  const handleToggleSection = (id: string) => {
    setCustomSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    setCustomSections((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetSections = () => {
    setCustomSections(JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS)));
  };

  const handleSaveSections = async () => {
    if (!customizingLp) return;
    setIsSavingSections(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customizingLp.id,
          sections_config: customSections,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSectionSaveSuccess(true);
        setLandingPages((prev) =>
          prev.map((lp) =>
            lp.id === customizingLp.id ? { ...lp, sections_config: customSections } : lp
          )
        );
        setTimeout(() => {
          setCustomizingLp(null);
          setSectionSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSections(false);
    }
  };

  // Content & Media Editor Methods
  const openContentEditor = (lp: LandingPage) => {
    setEditingContentLp(lp);
    setContentSaveSuccess(false);
    setActiveContentTab("hero");

    const existing = lp.content_config || {};
    const prod = lp.product;

    const initialContent: LandingPageContentConfig = {
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

    setContentForm(initialContent);
  };

  const handleSaveContent = async () => {
    if (!editingContentLp) return;
    setIsSavingContent(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContentLp.id,
          content_config: contentForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContentSaveSuccess(true);
        setLandingPages((prev) =>
          prev.map((lp) =>
            lp.id === editingContentLp.id ? { ...lp, content_config: contentForm } : lp
          )
        );
        setTimeout(() => {
          setEditingContentLp(null);
          setContentSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingContent(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            إدارة صفحات الهبوط المستقلة (COD Funnels)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ صفحات هبوط احترافية ومستقلة لإعلانات فيسبوك وتيك توك مع التحكم الكامل في إظهار وإخفاء وترتيب الأقسام
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة هبوط جديدة</span>
        </button>
      </div>

      {/* Landing Pages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {landingPages.map((lp) => {
          const fullUrl = `/p/${lp.slug}`;
          const isCopied = copiedSlug === lp.slug;
          const mergedSections = mergeSections(lp.sections_config);
          const activeSectionsCount = mergedSections.filter((s) => s.enabled).length;
          const totalSectionsCount = mergedSections.length;

          return (
            <div
              key={lp.id}
              className={`bg-white rounded-3xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                lp.status === "active" ? "border-gray-200 hover:border-emerald-300" : "border-amber-200 bg-amber-50/20"
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      قالب COD رشيق ومعدّل
                    </span>
                    <h3 className="text-base font-bold text-gray-900 leading-snug pt-1">
                      {lp.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteLandingPage(lp.id, lp.title)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="حذف صفحة الهبوط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الرابط المباشر:</span>
                    <span className="font-mono text-slate-800 font-bold dir-ltr">/p/{lp.slug}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>المنتج المرتبط:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">{lp.product?.title_ar || "منتج"}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>السعر:</span>
                    <span className="font-bold text-emerald-600 font-mono">{lp.product?.base_price || 0} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleCopyUrl(lp.slug)}
                    className="py-1.5 px-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openSectionCustomizer(lp)}
                    className="py-1.5 px-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 shadow-sm transition cursor-pointer"
                    title="تخصيص وترتيب أقسام الصفحة"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تخصيص الأقسام ({activeSectionsCount}/{totalSectionsCount})</span>
                  </button>

                  <button
                    onClick={() => openContentEditor(lp)}
                    className="py-1.5 px-2.5 rounded-xl bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-xs font-bold text-cyan-800 flex items-center gap-1 shadow-sm transition cursor-pointer"
                    title="تعديل نصوص وصور الصفحة مع الحفاظ على القالب"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                    <span>تعديل النصوص والصور</span>
                  </button>
                </div>

                <a
                  href={fullUrl}
                  target="_blank"
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-sm transition"
                >
                  <span>معاينة</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <SectionCustomizerModal
        customizingLp={customizingLp}
        setCustomizingLp={setCustomizingLp}
        customSections={customSections}
        isSavingSections={isSavingSections}
        sectionSaveSuccess={sectionSaveSuccess}
        handleToggleSection={handleToggleSection}
        handleMoveSection={handleMoveSection}
        handleResetSections={handleResetSections}
        handleSaveSections={handleSaveSections}
      />

      <ContentEditorModal
        editingContentLp={editingContentLp}
        setEditingContentLp={setEditingContentLp}
        contentForm={contentForm}
        setContentForm={setContentForm}
        activeContentTab={activeContentTab}
        setActiveContentTab={setActiveContentTab}
        isSavingContent={isSavingContent}
        contentSaveSuccess={contentSaveSuccess}
        handleSaveContent={handleSaveContent}
      />

      <CreateLandingPageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        products={products}
        createMode={createMode}
        setCreateMode={setCreateMode}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newSlug={newSlug}
        setNewSlug={setNewSlug}
        newProductId={newProductId}
        newPixelId={newPixelId}
        setNewPixelId={setNewPixelId}
        customHeadScripts={customHeadScripts}
        setCustomHeadScripts={setCustomHeadScripts}
        isSubmitting={isSubmitting}
        copiedPrompt={copiedPrompt}
        aiInputText={aiInputText}
        setAiInputText={setAiInputText}
        aiParseMessage={aiParseMessage}
        setAiParseMessage={setAiParseMessage}
        showContentEditorInCreate={showContentEditorInCreate}
        setShowContentEditorInCreate={setShowContentEditorInCreate}
        activeCreateTab={activeCreateTab}
        setActiveCreateTab={setActiveCreateTab}
        creationContent={creationContent}
        setCreationContent={setCreationContent}
        handleProductChange={handleProductChange}
        handleCopyPrompt={handleCopyPrompt}
        handleParseAiResponse={handleParseAiResponse}
        handleCreateLandingPage={handleCreateLandingPage}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LandingPage, Product, LandingPageSectionConfig, LandingPageContentConfig, DEFAULT_LANDING_PAGE_SECTIONS } from "@/types";
import {
  Layers,
  Plus,
  ExternalLink,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Calendar,
  Globe,
  Tag,
  X,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Zap,
  Wand2,
  Package,
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Edit3,
  Image as ImageIcon,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
    const existing =
      lp.sections_config && lp.sections_config.length > 0
        ? JSON.parse(JSON.stringify(lp.sections_config))
        : JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS));
    setCustomSections(existing);
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
          const activeSectionsCount = lp.sections_config
            ? lp.sections_config.filter((s) => s.enabled).length
            : DEFAULT_LANDING_PAGE_SECTIONS.length;
          const totalSectionsCount = lp.sections_config
            ? lp.sections_config.length
            : DEFAULT_LANDING_PAGE_SECTIONS.length;

          return (
            <div
              key={lp.id}
              className={`bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
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
                    className="py-1.5 px-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition"
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
                    className="py-1.5 px-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    title="تخصيص وترتيب أقسام الصفحة"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تخصيص الأقسام ({activeSectionsCount}/{totalSectionsCount})</span>
                  </button>

                  <button
                    onClick={() => openContentEditor(lp)}
                    className="py-1.5 px-2.5 rounded-xl bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-xs font-bold text-cyan-800 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    title="تعديل نصوص وصور الصفحة مع الحفاظ على القالب"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                    <span>تعديل النصوص والصور</span>
                  </button>
                </div>

                <a
                  href={fullUrl}
                  target="_blank"
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <span>معاينة</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION CUSTOMIZER MODAL */}
      {customizingLp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
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
              <button
                onClick={() => setCustomizingLp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Sections */}
            <div className="overflow-y-auto pr-1 space-y-2 py-1 max-h-[50vh]">
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
                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveSection(index, "down")}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
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
                  onClick={() => setCustomizingLp(null)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
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
      )}

      {/* Content & Media Editor Modal */}
      {editingContentLp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 font-heading flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-600" />
                  <span>تعديل نصوص وصور صفحة الهبوط ({editingContentLp.title})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  غيّر العناوين، النصوص، والميديا بحرية كاملة مع بقاء هيكل وتصميم القالب ثابت بدون أي كسر
                </p>
              </div>
              <button
                onClick={() => setEditingContentLp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveContentTab("hero")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeContentTab === "hero"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                1. الهيرو والإعلان
              </button>
              <button
                type="button"
                onClick={() => setActiveContentTab("comparison")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeContentTab === "comparison"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                2. قسم المقارنة
              </button>
              <button
                type="button"
                onClick={() => setActiveContentTab("box")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeContentTab === "box"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                3. محتويات العلبة
              </button>
              <button
                type="button"
                onClick={() => setActiveContentTab("steps")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeContentTab === "steps"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                4. طريقة الاستخدام
              </button>
              <button
                type="button"
                onClick={() => setActiveContentTab("reviews")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeContentTab === "reviews"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                5. آراء العملاء
              </button>
            </div>

            {/* Tab Panels */}
            <div className="overflow-y-auto pr-1 space-y-4 py-2 max-h-[52vh] text-xs">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-hidden"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-hidden font-bold"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 text-xs outline-hidden leading-relaxed"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-800 mb-1">
                        رابط صورة الهيرو الأساسية
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={contentForm.hero_image || ""}
                          onChange={(e) =>
                            setContentForm({ ...contentForm, hero_image: e.target.value })
                          }
                          placeholder="/landing-pages/... أو https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-mono"
                        />
                        {contentForm.hero_image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-slate-100 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={contentForm.hero_image}
                              alt="Hero thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
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
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 text-gray-800 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-bold"
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
                        className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-rose-900 text-xs bg-white outline-hidden"
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
                          className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-900 text-xs bg-white outline-hidden"
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
                        className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 text-xs bg-white outline-hidden"
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
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-900 text-xs bg-white outline-hidden"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comparison Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-800 mb-1">
                        رابط صورة قسم المقارنة (Visual Demonstration)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={contentForm.comparison_image || ""}
                          onChange={(e) =>
                            setContentForm({ ...contentForm, comparison_image: e.target.value })
                          }
                          placeholder="/landing-pages/... أو رابط صورة"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-mono"
                        />
                        {contentForm.comparison_image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-slate-100 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={contentForm.comparison_image}
                              alt="Comparison thumb"
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-bold"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      رابط صورة محتويات العلبة والملحقات
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={contentForm.box_image || ""}
                        onChange={(e) =>
                          setContentForm({ ...contentForm, box_image: e.target.value })
                        }
                        placeholder="/landing-pages/... أو رابط صورة خارجية"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-mono"
                      />
                      {contentForm.box_image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-slate-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contentForm.box_image}
                            alt="Box thumb"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-bold"
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
                              className="w-1/3 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-900 text-xs bg-white outline-hidden"
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
                              className="w-2/3 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-hidden"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      رابط صورة المواصفات والشرح (Anatomy Graphic)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={contentForm.how_to_use_image || ""}
                        onChange={(e) =>
                          setContentForm({ ...contentForm, how_to_use_image: e.target.value })
                        }
                        placeholder="/landing-pages/... أو رابط صورة"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-mono"
                      />
                      {contentForm.how_to_use_image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-slate-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contentForm.how_to_use_image}
                            alt="How to use thumb"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-gray-900 text-xs outline-hidden font-bold"
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
                              className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-900 text-xs bg-white outline-hidden"
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
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-hidden"
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
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs bg-white outline-hidden leading-relaxed"
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
                  onClick={() => setEditingContentLp(null)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  إلغاء
                </button>
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
      )}

      {/* Multi-Mode Create Modal */}
      {isModalOpen && (
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
                  createMode === "quick" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>الوضع السريع التلقائي (1-Click)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateMode("ai_prompt")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  createMode === "ai_prompt" ? "bg-white text-indigo-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-right"
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
                        className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-900 bg-white outline-hidden leading-relaxed"
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
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 font-bold text-xs text-gray-900 bg-white outline-hidden"
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
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden leading-relaxed"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                                className="w-full px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-hidden"
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
                                className="w-full px-2.5 py-1 rounded-md border border-rose-200 text-rose-900 text-xs bg-white outline-hidden"
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
                                className="w-full px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900 text-xs bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-hidden"
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
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 font-mono bg-white outline-hidden"
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
                                  className="w-1/3 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 font-bold bg-white outline-hidden"
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
                                  className="w-2/3 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                                  className="px-2.5 py-1 rounded-md border border-gray-300 text-xs font-bold text-gray-900 bg-white outline-hidden"
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
                                  className="px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-800 bg-white outline-hidden"
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
                                className="w-full px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-900 bg-white outline-hidden"
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
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-right"
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
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-left leading-relaxed"
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
      )}
    </div>
  );
}

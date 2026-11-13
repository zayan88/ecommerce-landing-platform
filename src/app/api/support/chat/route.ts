import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ProductSuggestion {
  id: string;
  title_ar: string;
  slug: string;
  base_price: number;
  compare_at_price?: number;
  image: string;
  discount_label?: string;
  offer_text?: string;
}

interface ChatResponseData {
  reply: string;
  product?: ProductSuggestion;
  quickReplies?: string[];
  orderInfo?: {
    order_number: string;
    customer_name: string;
    status: string;
    final_amount: number;
    created_at: string;
    governorate: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = (body.message || "").trim();
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "الرجاء كتابة رسالتك" },
        { status: 400 }
      );
    }

    const [products, settings, orders] = await Promise.all([
      dbStore.getProducts(),
      dbStore.getSettings(),
      dbStore.getOrders(),
    ]);

    const activeProducts = products.filter((p) => p.status === "active");

    // 1. Check for Order Tracking (Phone number or order number in message)
    const phoneMatch = message.match(/(?:01[0125]\d{8})/);
    const orderNumberMatch = message.match(/(?:ord-[a-zA-Z0-9]+|\d{4,8})/i);

    if (
      message.includes("تتبع") ||
      message.includes("أوردر") ||
      message.includes("اوردر") ||
      message.includes("طلبي") ||
      message.includes("فين طلبي") ||
      phoneMatch ||
      orderNumberMatch
    ) {
      const searchPhone = phoneMatch ? phoneMatch[0] : null;
      const searchOrder = orderNumberMatch ? orderNumberMatch[0] : null;

      const matchedOrder = orders.find((ord) => {
        if (searchPhone && ord.customer_phone.includes(searchPhone)) return true;
        if (searchOrder && (ord.id === searchOrder || ord.order_number === searchOrder)) return true;
        return false;
      });

      if (matchedOrder) {
        const statusMap: Record<string, string> = {
          pending: "قيد المراجعة والتأكيد مع شركة الشحن",
          confirmed: "تم تأكيد طلبك وجاري التجهيز",
          shipped: "تم تسليمه للمندوب وهو في الطريق إليك 🚚",
          delivered: "تم التسليم بنجاح ✅",
          cancelled: "ملغي ❌",
          returned: "مرتجع",
        };

        const statusAr = statusMap[matchedOrder.status] || matchedOrder.status;

        return NextResponse.json({
          reply: `أهلاً بحضرتك يا فندم! تم العثور على بيانات طلبك برقم (${matchedOrder.order_number || matchedOrder.id}):\n\n📌 **الاسم:** ${matchedOrder.customer_name}\n📌 **المحافظة:** ${matchedOrder.governorate}\n📌 **الحالة الحالية:** ${statusAr}\n📌 **المبلغ الإجمالي عند الاستلام:** ${matchedOrder.final_amount} ج.م\n\nتذكّر أن بإمكانك فحص ومعاينة المنتج بالكامل مع المندوب قبل دفع أي مبلغ 🇪🇬. لو حابب تستفسر عن تفاصيل إضافية أنا معاك!`,
          orderInfo: {
            order_number: matchedOrder.order_number || matchedOrder.id,
            customer_name: matchedOrder.customer_name,
            status: statusAr,
            final_amount: matchedOrder.final_amount,
            created_at: matchedOrder.created_at,
            governorate: matchedOrder.governorate,
          },
          quickReplies: [
            "متى يصل المندوب بالظبط؟",
            "هل يمكن تعديل العنوان؟",
            "التحدث مع خدمة العملاء على واتساب",
          ],
        } satisfies ChatResponseData);
      } else if (phoneMatch || orderNumberMatch) {
        return NextResponse.json({
          reply: `بحثت لحضرتك بالرقم المدخل لكن لم أجد طلباً مسجلاً بهذا الرقم حتى الآن. تأكد من إدخال رقم الهاتف المصري الصحيح (01xxxxxxxxx) أو رقم الطلب، أو تواصل معنا مباشرة عبر واتساب للمساعدة الفورية.`,
          quickReplies: [
            "التحدث مع الدعم عبر واتساب",
            "تصفح عروض المنتجات المتاحة",
          ],
        } satisfies ChatResponseData);
      }
    }

    // 2. Try Gemini API if GEMINI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const systemPrompt = `أنت المساعد الذكي لخدمة عملاء متجر "RexRack" المصري (RexRack AI Assistant).
أنت ترد على العملاء باللهجة المصرية الودية المحترمة والواضحة (مثال: "أهلاً بحضرتك يا فندم"، "تحت أمرك"، "شرفتنا").

بيانات المتجر وسياساته:
- الدفع عند الاستلام (COD) 100%، يحق للعميل فتح الطرد وفحص ومعاينة المنتج بالكامل بحضور المندوب قبل دفع أي جنيه.
- الشحن لجميع محافظات مصر (القاهرة، الجيزة، الإسكندرية، الدلتا، القناة، والصعيد) خلال 5 إلى 7 أيام عمل.
- ضمان استبدال واسترجاع 14 يوماً مجاناً في حالة وجود أي عيب صناعة.
- الشحن مجاني على أي عرض من قطعتين فأكثر.

قائمة المنتجات الحالية:
${activeProducts
  .map(
    (p) => `- ${p.title_ar} (Slug: /p/${p.slug})
  السعر: ${p.base_price} ج.م (قبل الخصم: ${p.compare_at_price || p.base_price} ج.م)
  الوصف: ${p.description_ar}
  العروض: ${p.offers?.map((o) => `${o.title_ar}: ${o.price} ج.م`).join(" | ") || "قطعة واحدة"}`
  )
  .join("\n\n")}

تعليماتك:
1. أجب باختصار وبأسلوب مقنع ومهني.
2. إذا سأل العميل عن منتج معين، رشح له العرض المزدوج (قطعتين) للاستفادة من الشحن المجاني والتوفير.
3. وجه العميل إلى رابط المنتج المباشر إذا كان يريد الشراء.
4. طمئن العميل دائماً بشأن المعاينة قبل الدفع والضمان.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\nرسالة العميل: ${message}` }],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidateText =
            data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            // Find matched product if any
            const matchedP = activeProducts.find(
              (p) =>
                message.toLowerCase().includes(p.slug) ||
                message.includes(p.title_ar.slice(0, 10)) ||
                candidateText.includes(p.slug)
            );

            return NextResponse.json({
              reply: candidateText,
              product: matchedP
                ? {
                    id: matchedP.id,
                    title_ar: matchedP.title_ar,
                    slug: matchedP.slug,
                    base_price: matchedP.base_price,
                    compare_at_price: matchedP.compare_at_price,
                    image: matchedP.images[0] || "",
                    offer_text: "شحن مجاني على القطعتين",
                  }
                : undefined,
              quickReplies: [
                "عايز أطلب قطعتين مع شحن مجاني",
                "هل في معاينة مع المندوب؟",
                "مدة التوصيل للمحافظات؟",
              ],
            } satisfies ChatResponseData);
          }
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to smart intent engine", err);
      }
    }

    // 3. Ultra-Smart Native Intent & Knowledge Engine
    const lower = message.toLowerCase();

    // Check specific products
    const isNebulizer =
      lower.includes("نيبولايزر") ||
      lower.includes("بخار") ||
      lower.includes("استنشاق") ||
      lower.includes("nebulizer") ||
      lower.includes("تنفس") ||
      lower.includes("اطفال") ||
      lower.includes("أطفال");

    const isMassager =
      lower.includes("مساج") ||
      lower.includes("تدليك") ||
      lower.includes("عضلات") ||
      lower.includes("رقبة") ||
      lower.includes("massager") ||
      lower.includes("ظهر") ||
      lower.includes("ركبة");

    const isCarOrganizer =
      lower.includes("عربية") ||
      lower.includes("سيارة") ||
      lower.includes("منظم") ||
      lower.includes("شنطة") ||
      lower.includes("مقاعد") ||
      lower.includes("organizer");

    const isCushion =
      lower.includes("وسادة") ||
      lower.includes("مخدة") ||
      lower.includes("cushion") ||
      lower.includes("كرسي");

    const isAstroBeam =
      lower.includes("بروجكتور") ||
      lower.includes("فضاء") ||
      lower.includes("نجوم") ||
      lower.includes("رائد") ||
      lower.includes("astrobeam") ||
      lower.includes("أسترو");

    // Check Topics
    const isShipping =
      lower.includes("شحن") ||
      lower.includes("توصيل") ||
      lower.includes("كام يوم") ||
      lower.includes("بيوصل امتى") ||
      lower.includes("محافظات") ||
      lower.includes("مصاريف");

    const isInspection =
      lower.includes("معاينة") ||
      lower.includes("افتح") ||
      lower.includes("افحص") ||
      lower.includes("اشوف") ||
      lower.includes("اجرب") ||
      lower.includes("مندوب");

    const isWarranty =
      lower.includes("ضمان") ||
      lower.includes("استرجاع") ||
      lower.includes("استبدال") ||
      lower.includes("عيب") ||
      lower.includes("بايظ");

    const isHumanAgent =
      lower.includes("انسان") ||
      lower.includes("بشري") ||
      lower.includes("موظف") ||
      lower.includes("تليفون") ||
      lower.includes("واتساب") ||
      lower.includes("whatsapp") ||
      lower.includes("رقم");

    const isGreeting =
      lower.includes("سلام") ||
      lower.includes("مرحبا") ||
      lower.includes("ازيك") ||
      lower.includes("صباح") ||
      lower.includes("مساء") ||
      lower.includes("مين معايا");

    // Product response: Nebulizer
    if (isNebulizer) {
      const p = activeProducts.find((item) => item.slug === "mesh-nebulizer");
      return NextResponse.json({
        reply: `أهلاً بحضرتك يا فندم! بخصوص **جهاز استنشاق البخار المحمول ميني (Mesh Nebulizer)** الصامت 🩺:\n\n• **المميزات:** جهاز محمول بتقنية الشبكة الطبية المتطورة (Mesh)، صامت تماماً بدون أي صوت مزعج، حجمه صغير جداً في كف اليد، ويعمل بكابل USB أو ببطاريات.\n• **المحتويات:** بيجي معاه ماسك طبي للكبار، ماسك مخصص للأطفال، وقطعة استنشاق للفم.\n• **الأسعار والعروض الحالية:**\n  - قطعة واحدة: **599 ج.م** (بدلاً من 850 ج.م)\n  - 🔥 **عرض القطعتين (الأكثر طلباً):** **990 ج.م** بدلاً من 1700 ج.م + **شحن مجاني** (لتوفير جهاز للبيت وجهاز للشنطة/الحضانة).\n\nوالأهم أنك بتعاين المنتج بالكامل مع المندوب قبل دفع أي مليم 🇪🇬!`,
        product: p
          ? {
              id: p.id,
              title_ar: p.title_ar,
              slug: p.slug,
              base_price: p.base_price,
              compare_at_price: p.compare_at_price,
              image: p.images[0] || "",
              offer_text: "وفر 710 ج.م مع عرض القطعتين + شحن مجاني",
            }
          : undefined,
        quickReplies: [
          "اطلب عرض القطعتين (990 ج.م)",
          "هل يعمل ببطاريات أم شحن؟",
          "مدة التوصيل للقاهرة والمحافظات؟",
        ],
      } satisfies ChatResponseData);
    }

    // Product response: Body Massager
    if (isMassager) {
      const p = activeProducts.find((item) => item.slug === "body-massager");
      return NextResponse.json({
        reply: `يا هلا بحضرتك! **جهاز المساج والتدليك الشامل 5×1 اللاسلكي** بالحرارة والاهتزاز ⚡:\n\n• **الاستخدامات:** مثالي لتخفيف آلام الرقبة، الأكتاف، أسفل الظهر، البطن، والركبة والمفاصل.\n• **المواصفات:** شاشة ديجيتال للتحكم، 3 مستويات تدليك اهتزازي عميق + تدفئة حرارية بالأشعة تحت الحمراء، بطارية لاسلكية قوية تدوم لساعات.\n• **السعر والعروض:**\n  - قطعة واحدة: **799 ج.م** (بدلاً من 1200 ج.م)\n  - 🔥 **قطعتين:** **1390 ج.م** بدلاً من 2400 ج.م + **شحن مجاني**.\n\nطبعاً مع ضمان 14 يوماً واستلام ودفع كاش عند الباب بعد المعاينة!`,
        product: p
          ? {
              id: p.id,
              title_ar: p.title_ar,
              slug: p.slug,
              base_price: p.base_price,
              compare_at_price: p.compare_at_price,
              image: p.images[0] || "",
              offer_text: "خصم 35% + شحن مجاني عند طلب قطعتين",
            }
          : undefined,
        quickReplies: [
          "اطلب جهاز المساج الآن",
          "هل مناسب لكبار السن والركبة؟",
          "طريقة الاستخدام والشحن؟",
        ],
      } satisfies ChatResponseData);
    }

    // Product response: Car Organizer
    if (isCarOrganizer) {
      const p = activeProducts.find((item) => item.slug === "car-organizer");
      return NextResponse.json({
        reply: `تمام يا فندم! **منظم مقاعد السيارة الجلد الفاخر متعدد الجيوب** 🚗:\n\n• خامات جلد فاخرة ومقاومة للماء والخدش وسهلة التنظيف.\n• بيحتوي على طاولة قابلة للطي لوضع اللابتوب أو طعام الأطفال، وجيوب للتابلت والمناديل والمشروبات والموبايلات.\n• **السعر:** **449 ج.م** للقطعة، وعرض القطعتين بـ **799 ج.م** مع **شحن مجاني** لكل مصر!`,
        product: p
          ? {
              id: p.id,
              title_ar: p.title_ar,
              slug: p.slug,
              base_price: p.base_price,
              compare_at_price: p.compare_at_price,
              image: p.images[0] || "",
              offer_text: "طاولة قابلة للطي + خامات جلد فاخرة",
            }
          : undefined,
        quickReplies: [
          "اطلب منظم السيارة الآن",
          "هل يركب على جميع أنواع السيارات؟",
          "مدة الشحن؟",
        ],
      } satisfies ChatResponseData);
    }

    // Product response: AstroBeam
    if (isAstroBeam) {
      const p = activeProducts.find((item) => item.slug === "astrobeam");
      return NextResponse.json({
        reply: `أهلاً بحضرتك! **بروجكتور رائد الفضاء الذكي AstroBeam** 🌌:\n\n• بيحول أي غرفة لقبة سماوية خيالية من النجوم والمجرات والسدم المضيئة بألوان مختلفة.\n• رأس رائد الفضاء مغناطيسي يدور 360 درجة لتوجيه الإضاءة في أي مكان.\n• معاه ريموت كنترول للتحكم في الألوان والسرعة ومؤقت زمني للنوم.\n• **السعر الحالي:** **649 ج.م** (بدلاً من 950 ج.م).`,
        product: p
          ? {
              id: p.id,
              title_ar: p.title_ar,
              slug: p.slug,
              base_price: p.base_price,
              compare_at_price: p.compare_at_price,
              image: p.images[0] || "",
              offer_text: "ريموت كنترول + تحكم 360 درجة",
            }
          : undefined,
        quickReplies: [
          "اطلب بروجكتور الفضاء",
          "هل معاه ضمان؟",
          "هل يناسب غرف نوم الأطفال؟",
        ],
      } satisfies ChatResponseData);
    }

    // Policy response: Shipping
    if (isShipping) {
      return NextResponse.json({
        reply: `🚚 **تفاصيل الشحن والتوصيل في متجر RexRack:**\n\n• **التغطية:** بنشحن لجميع محافظات مصر الـ 27 (القاهرة، الجيزة، الإسكندرية، القليوبية، محافظات الدلتا، القناة، والصعيد).\n• **مدة التوصيل:** من **5 إلى 7 أيام عمل** كحد أقصى حتى باب منزلك.\n• **مصاريف الشحن:** رمزية تبدأ من 45 إلى 65 ج.م حسب المحافظة.\n• 🎁 **العرض المميز:** الشحن **مجاني 100%** تلقائياً عند طلب أي عرض مكون من قطعتين أو أكثر!`,
        quickReplies: [
          "هل يمكن معاينة الشحنة قبل الدفع؟",
          "عايز اتتبع طلبي برقم الهاتف",
          "تصفح المنتجات المتاحة",
        ],
      } satisfies ChatResponseData);
    }

    // Policy response: Inspection before payment
    if (isInspection) {
      return NextResponse.json({
        reply: `🛡️ **نعم بالطبع، وبكل ثقة!**\n\nفي RexRack، حق العميل هو أولويتنا الأولى: يحق لحضرتك **فتح الطرد بالكامل ومعاينة وفحص المنتج** بحضور مندوب الشحن قبل دفع مليم واحد.\n\nلو المنتج فيه أي اختلاف عن الصور أو المواصفات، يحق لك رفض الاستلام فوراً وبدون أي التزام عليك 🇪🇬.`,
        quickReplies: [
          "ما هي سياسة الضمان والاسترجاع؟",
          "مدة الشحن لمحافظتي؟",
          "تصفح عروض RexRack",
        ],
      } satisfies ChatResponseData);
    }

    // Policy response: Warranty & Returns
    if (isWarranty) {
      return NextResponse.json({
        reply: `🔄 **سياسة الضمان والاسترجاع المعتمدة:**\n\n• نوفر لحضرتك **ضمان استبدال واسترجاع لمدة 14 يوماً** ضد أي عيوب صناعة.\n• في حالة وجود أي عيب، يتم استبدال المنتج بقطعة جديدة فوراً أو استرداد كامل المبلغ دون أي تعقيد.\n• بالإضافة إلى إمكانية المعاينة والفحص المسبق عند الاستلام مع المندوب.`,
        quickReplies: [
          "طريقة طلب الاستبدال أو الصيانة؟",
          "التواصل مع الدعم عبر واتساب",
          "الرجوع لصفحة المنتجات",
        ],
      } satisfies ChatResponseData);
    }

    // Human Support
    if (isHumanAgent) {
      const whatsapp = settings.support_whatsapp || "201000000000";
      const phone = settings.support_phone || "01000000000";
      return NextResponse.json({
        reply: `تحت أمر حضرتك يا فندم! إذا كنت تفضل التحدث مباشرة مع موظف خدمة عملاء بشري من فريق RexRack:\n\n💬 **واتساب المباشر:** [اضغط هنا للمحادثة الفورية على واتساب](https://wa.me/${whatsapp})\n📞 **الاتصال الهاتفي:** \`${phone}\`\n\nفريقنا متواجد يومياً من 10 صباحاً وحتى 10 مساءً للرد على كل استفساراتكم.`,
        quickReplies: [
          "أنا هكمل معاك هنا واسألك",
          "تتبع طلبي الحالي",
          "عروض المتجر الحالية",
        ],
      } satisfies ChatResponseData);
    }

    // Greetings
    if (isGreeting) {
      return NextResponse.json({
        reply: `أهلاً وسهلاً بحضرتك في متجر **RexRack**! أنا مساعدك الذكي لخدمة العملاء 🤖🇪🇬.\n\nأنا هنا لمساعدتك على مدار الساعة في أي استفسار بخصوص:\n1. مواصفات وأسعار وعروض المنتجات الذكية.\n2. مدة ومصاريف الشحن لمحافظتك.\n3. سياسة المعاينة قبل الدفع وضمان الـ 14 يوم.\n4. تتبع حالة أوردرك الحالي برقم الهاتف.\n\nقولي تحب نساعدك في إيه النهاردة؟`,
        quickReplies: [
          "💨 مواصفات وسعر جهاز استنشاق البخار",
          "💆‍♂️ تفاصيل جهاز تدليك الجسم 5×1",
          "🚚 مدة الشحن والمعاينة مع المندوب",
          "📦 تتبع طلبي برقم الهاتف",
        ],
      } satisfies ChatResponseData);
    }

    // General fallback: helpful and proactive
    return NextResponse.json({
      reply: `أهلاً بحضرتك يا فندم! يسعدني دائماً مساعدتك في متجر **RexRack**.\n\nبخصوص استفسارك، نحن نوفر لك أفضل المنتجات الذكية المعتمدة مع:\n• **دفع عند الاستلام كاش (COD)**\n• **معاينة الطرد مع المندوب قبل دفع أي مليم**\n• **شحن لجميع محافظات مصر خلال 5 إلى 7 أيام**\n• **ضمان استبدال واسترجاع 14 يوماً**\n\nتقدر تختار أحد الخيارات السريعة بالأسفل أو تسألني عن أي منتج محدد!`,
      quickReplies: [
        "جهاز استنشاق البخار النيبولايزر",
        "جهاز المساج والتدليك الشامل",
        "منظم مقاعد السيارة الجلد",
        "مدة الشحن لجميع المحافظات",
        "تتبع طلبي برقم الهاتف",
      ],
    } satisfies ChatResponseData);
  } catch (error: any) {
    console.error("Support Chat API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة المحادثة. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}

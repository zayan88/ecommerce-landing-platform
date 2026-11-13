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
      (phoneMatch && !message.includes("واتساب")) ||
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

    // 2. Define System Prompt & Store Knowledge
    const systemPrompt = `أنت المساعد الذكي متعدد المهام لمتجر "RexRack" المصري وشات بوت ذكاء اصطناعي عام وممتع ولطيف.
أنت تتحدث بلباقة وود وذكاء فائق باللهجة المصرية المحترمة أو العربية الفصحى المبسطة حسب رغبة المستخدم.

تعليماتك الأساسية:
1. تجيب على أي سؤال يطرحه المستخدم (سواء كان في العلوم، البرمجة، الحياة، الدردشة العامة، النكت، الألغاز، المعلومات العامة، أو اختبار النظام) كشات بوت ذكي متكامل مثل ChatGPT و Gemini تماماً. لا ترفض أي سؤال عام وتفاعل معه بحيوية وذكاء وطبيعية وبدون تكلف.
2. إذا سأل المستخدم عن متجر RexRack أو منتجاته، فأنت خبير المتجر وتوضح له كل التفاصيل بدقة:
   - الدفع عند الاستلام (COD) متاح 100%.
   - معاينة وفحص الشحنة بالكامل مع المندوب قبل دفع مليم واحد.
   - شحن لجميع محافظات مصر الـ 27 (خلال 5 إلى 7 أيام عمل).
   - ضمان استبدال واسترجاع 14 يوماً مجاناً ضد عيوب الصناعة.
   - الشحن مجاني على أي عرض من قطعتين فأكثر.

المنتجات المتوفرة في المتجر:
${activeProducts
  .map(
    (p) => `- ${p.title_ar} (رابط الشراء: /p/${p.slug})
  السعر: ${p.base_price} ج.م (قبل الخصم: ${p.compare_at_price || p.base_price} ج.م)
  الوصف: ${p.description_ar}
  العروض: ${p.offers?.map((o) => `${o.title_ar}: ${o.price} ج.م`).join(" | ") || "قطعة واحدة"}`
  )
  .join("\n\n")}`;

    // 3. Try FreeLLMAPI Desktop (Local Endpoint on Device: 127.0.0.1:31415)
    const localLLMEndpoint = process.env.LOCAL_LLM_URL || "http://127.0.0.1:31415/v1";
    const localLLMKey = process.env.LOCAL_LLM_KEY || "freellmapi-5b1dfb896b96b0ebef236da94071dc05d5839bb65a489913";

    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 4000);
      const localRes = await fetch(`${localLLMEndpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localLLMKey}`,
        },
        body: JSON.stringify({
          model: "auto",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-6).map((h) => ({
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.content,
            })),
            { role: "user", content: message },
          ],
        }),
        signal: abortCtrl.signal,
      });
      clearTimeout(timeoutId);

      if (localRes.ok) {
        const localData = await localRes.json();
        const reply = localData.choices?.[0]?.message?.content;
        if (reply) {
          const matchedP = activeProducts.find(
            (p) =>
              message.toLowerCase().includes(p.slug) ||
              message.includes(p.title_ar.slice(0, 10))
          );

          return NextResponse.json({
            reply: reply + "\n\n*(⚡ رد فوري عبر FreeLLMAPI من جهازك)*",
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
              "💨 عروض جهاز استنشاق البخار",
              "💆‍♂️ تفاصيل جهاز المساج 5×1",
              "🚚 مدة الشحن والمعاينة",
            ],
          } satisfies ChatResponseData);
        }
      } else {
        console.warn("FreeLLMAPI non-ok status:", localRes.status, await localRes.text());
      }
    } catch (err) {
      console.warn("FreeLLMAPI catch error:", err);
    }

    // 4. Fallback to Google Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (geminiKey) {
      // Cascade through available models to prevent any 503 / 429 temporary spikes
      const candidateModels = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ];

      for (const modelName of candidateModels) {
        try {
          // Build contents with history if available
          const contentsPayload = [
            {
              role: "user",
              parts: [{ text: `تعليمات النظام:\n${systemPrompt}` }],
            },
            {
              role: "model",
              parts: [{ text: "أهلاً بك! أنا جاهز تماماً كمساعد ذكي عام وشات بوت RexRack." }],
            },
          ];

          // Append recent history (up to last 6 messages)
          const recentHistory = history.slice(-6);
          for (const h of recentHistory) {
            contentsPayload.push({
              role: h.role === "assistant" ? "model" : "user",
              parts: [{ text: h.content }],
            });
          }

          // Append current message
          contentsPayload.push({
            role: "user",
            parts: [{ text: message }],
          });

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: contentsPayload }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const matchedP = activeProducts.find(
                (p) =>
                  message.toLowerCase().includes(p.slug) ||
                  message.includes(p.title_ar.slice(0, 10))
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
                  "💨 عروض جهاز استنشاق البخار",
                  "💆‍♂️ تفاصيل جهاز المساج 5×1",
                  "🚚 مدة الشحن والمعاينة",
                ],
              } satisfies ChatResponseData);
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`Gemini model ${modelName} returned status ${geminiRes.status}:`, errText);
            // Continue to next candidate model
          }
        } catch (err) {
          console.warn(`Gemini API error on model ${modelName}:`, err);
        }
      }
    }

    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              reply,
              quickReplies: ["اسألني عن أي حاجة تانية", "عروض RexRack الحالية"],
            });
          }
        }
      } catch (err) {
        console.warn("Groq API error:", err);
      }
    }

    // 3. Ultra-Smart Native Intent & Knowledge Engine (Rich Multipurpose Chatbot)
    const lower = message.toLowerCase();

    // Check Testing & Greeting keywords
    const isTest =
      lower === "test" ||
      lower === "تيست" ||
      lower.includes("تجربة") ||
      lower.includes("بجرب") ||
      lower.includes("الو") ||
      lower.includes("سامعني") ||
      lower.includes("شغال") ||
      lower.includes("ping");

    const isHowAreYou =
      lower.includes("عامل ايه") ||
      lower.includes("اخبارك") ||
      lower.includes("ازيك") ||
      lower.includes("كيف حالك") ||
      lower.includes("شخبارك");

    const isWhoAreYou =
      lower.includes("مين انت") ||
      lower.includes("انت مين") ||
      lower.includes("اسمك ايه") ||
      lower.includes("عرفني بنفسك") ||
      lower.includes("مين صنعك") ||
      lower.includes("ذكاء اصطناعي");

    const isJoke =
      lower.includes("نكتة") ||
      lower.includes("نكته") ||
      lower.includes("ضحكني") ||
      lower.includes("حاجة تضحك");

    const isThanks =
      lower.includes("شكرا") ||
      lower.includes("شكراً") ||
      lower.includes("تسلم") ||
      lower.includes("حبيبي") ||
      lower.includes("ربنا يخليك") ||
      lower.includes("تمام") ||
      lower.includes("اوك") ||
      lower.includes("أوك") ||
      lower.includes("ماشي");

    const isCapabilities =
      lower.includes("تقدر تعمل ايه") ||
      lower.includes("بتعرف تعمل ايه") ||
      lower.includes("بتساعدني في ايه") ||
      lower.includes("خدماتك");

    // Handling Test & Ping
    if (isTest) {
      return NextResponse.json({
        reply: `أهلاً بيك يا فندم! النظام شغال 100% وفي أتم الاستعداد 🚀.\n\nأنا سامعك وشايف رسايلك كلها لحظة بلحظة. تقدر تسألني أو تختبرني في أي حاجة:\n• اسألني عن أي منتج من منتجات RexRack وأسعاره وعروضه.\n• اسألني عن الشحن، المعاينة قبل الدفع، أو الضمان.\n• أو حتى دردش معايا في أي موضوع عام تحبه!`,
        quickReplies: [
          "قولي نكتة كدة اختبرك بها",
          "جهاز استنشاق البخار النيبولايزر",
          "جهاز التدليك والمساج 5×1",
          "شغال ازاي في السحاب؟",
        ],
      } satisfies ChatResponseData);
    }

    // Handling "عامل ايه"
    if (isHowAreYou) {
      return NextResponse.json({
        reply: `الحمد لله كله تمام وفي أفضل حال! تسلم على سؤالك ولطفك يا فندم ❤️.\n\nأنا جاهز ومتحمس أرد على أي سؤال ييجي في بالك، سواء بخصوص منتجاتنا وعروض التوفير في RexRack، أو أي حاجة تانية حابب ندردش فيها!`,
        quickReplies: [
          "تقدر تعمل ايه بالظبط؟",
          "إيه أفضل منتج عليه خصم النهاردة؟",
          "قولي نكتة سريعة",
        ],
      } satisfies ChatResponseData);
    }

    // Handling "مين انت"
    if (isWhoAreYou) {
      return NextResponse.json({
        reply: `أنا المساعد الذكي لمتجر **RexRack** المصري 🇪🇬🤖!\n\nتم تطويري وتدريبي بنماذج الذكاء الاصطناعي السحابية علشان أرد عليك فوري وبشكل تفاعلي:\n1. الإجابة عن مواصفات المنتجات الذكية، عروض التوفير، والأسعار.\n2. شرح سياسات المتجر (الدفع عند الاستلام، المعاينة الكاملة للطرد قبل الدفع، وضمان 14 يوم).\n3. تتبع شحنتك وأوردرك برقم الهاتف في ثواني.\n4. وإجراء محادثات ذكية وسريعة معاك زي أي شات بوت متطور!`,
        quickReplies: [
          "تقدر تتبع طلبي؟",
          "عايز جهاز استنشاق البخار",
          "عايز أكلم خدمة العملاء واتساب",
        ],
      } satisfies ChatResponseData);
    }

    // Handling Jokes
    if (isJoke) {
      const jokes = [
        `مرة مبرمج دخل سوبر ماركت، مراته قالتله: "هات كيس لبن، ولو لقيت بيض هات عشرة".. رجع البيت معاه 10 أكياس لبن! قالتله: "ليه جبت 10 أكياس لبن؟!" قالها: "لأني لقيت بيض!" 😂`,
        `واحد راح لدكتور قاله: "يا دكتور، أنا كل ما أشرب شاي عيني اليمين بتوجعني جداً!".. الدكتور فحص وقاله: "ابقى شيل المعلقة من الكوباية وأنت بتشرب يا فندم!" 🤣`,
        `مرة واحد سأل كمبيوتر: "مين أحسن شات بوت في العالم؟".. الكمبيوتر قاله: "أنا، بس متقولش لـ RexRack لحسن يزعل!" 😉`,
      ];
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

      return NextResponse.json({
        reply: `${randomJoke}\n\nضحكت؟ قول بقى، عايز ندردش في إيه تاني، ولا حابب تستغل عروض المتجر والشحن المجاني النهاردة؟ 😄`,
        quickReplies: [
          "نكتة تانية سريعة",
          "وريني عروض RexRack",
          "جهاز المساج عليه خصم؟",
        ],
      } satisfies ChatResponseData);
    }

    // Handling Thanks
    if (isThanks) {
      return NextResponse.json({
        reply: `العفو يا فندم، أنا تحت أمرك وفي خدمتك في أي وقت! يسعدني جداً دائماً التحدث معاك ومساعدتك 🌟.\n\nلو عندك أي سؤال تاني في أي وقت أنا دايماً متواجد 24/7.`,
        quickReplies: [
          "تصفح عروض المنتجات",
          "مدة الشحن لجميع المحافظات",
          "تتبع طلبي برقم الهاتف",
        ],
      } satisfies ChatResponseData);
    }

    // Handling Capabilities
    if (isCapabilities) {
      return NextResponse.json({
        reply: `أقدر أساعدك في حاجات كتير جداً:\n\n1. 🩺 **تفاصيل الأجهزة الطبية:** مواصفات جهاز استنشاق البخار النيبولايزر الصامت للأطفال والكبار ومقارنة الأسعار.\n2. 💆‍♂️ **أجهزة المساج والراحة:** جهاز التدليك 5×1 اللاسلكي بالحرارة والاهتزاز للمفاصل والظهر.\n3. 🚗 **إكسسوارات السيارات والديكور:** منظم مقاعد السيارة الفاخر، وبروجكتور رائد الفضاء الذكي.\n4. 🚚 **الشحن والمحافظات:** شرح مدة التوصيل وتكاليف الشحن لكل محافظات مصر.\n5. 🛡️ **فحص الطرد والضمان:** شرح إمكانية معاينة الطرد مع المندوب قبل دفع أي مليم، وضمان الـ 14 يوم.\n6. 📦 **تتبع الشحنات:** اكتب رقم تليفونك وسأبحث لك عن أوردرك فوراً!`,
        quickReplies: [
          "جهاز استنشاق البخار النيبولايزر",
          "جهاز المساج والتدليك الشامل",
          "منظم مقاعد السيارة الجلد",
          "تتبع طلبي برقم الهاتف",
        ],
      } satisfies ChatResponseData);
    }

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
      lower.includes("صباح") ||
      lower.includes("مساء") ||
      lower.includes("أهلا") ||
      lower.includes("اهلين") ||
      lower.includes("هاي") ||
      lower.includes("hello") ||
      lower.includes("hi");

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
        reply: `أهلاً وسهلاً بحضرتك يا فندم! نورت متجر **RexRack** 🇪🇬✨.\n\nأنا مساعدك وشات بوت المتجر الذكي، جاهز أرد عليك في أي حاجة، سواء بخصوص منتجاتنا وعروضنا الحالية، أو ندردش ونجاوب على أي سؤال تحبه!\n\nتحب نبدأ بإيه؟`,
        quickReplies: [
          "💨 عروض جهاز استنشاق البخار",
          "💆‍♂️ تفاصيل جهاز مساج وتدليك الجسم",
          "قولي نكتة كدة اختبرك بها",
          "🚚 مدة الشحن وهل يوجد معاينة؟",
        ],
      } satisfies ChatResponseData);
    }

    // General conversational response (Chatbot mode)
    return NextResponse.json({
      reply: `أهلاً بحضرتك يا فندم! أنا معاك وسامعك كويس جداً 🤖.\n\nبخصوص رسالتك: "${message}"\nأنا جاهز أساعدك وأتفاعل معاك في أي استفسار أو تجربة حابب تعملها. سواء كنت بتجرب الشات، أو عندك استفسار عن المنتجات الذكية والأسعار وعروض التوفير والشحن في RexRack، قولي وخليني أجاوبك فوراً!`,
      quickReplies: [
          "💨 جهاز استنشاق البخار",
          "💆‍♂️ جهاز تدليك الجسم",
          "قولي نكتة سريعة",
          "🚚 تفاصيل الشحن والمعاينة",
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

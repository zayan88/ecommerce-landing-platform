# إيميل احترافي مجاني للتاجر (ورقة تسليم)

الهدف: الزبون يشوف `support@domain.com`، والتاجر يستقبل ويرد من **Gmail بتاعه عادي**، ومن غير أي اشتراك.
الأدوات (كلها مجانية): **Cloudflare Email Routing** للاستقبال، و**Brevo** للإرسال، و**Gmail** كواجهة.
الخطوات دي بتتعمل **مرة واحدة وقت التسليم**، على حساب التاجر هو (إيميله وكلمة سره، ما تحتفظش بيهم).

> تصحيح: النسخة الأولى من الشرح كانت بتقترح SMTP بتاع Gmail للإرسال. الأفضل Brevo لأنه بيوثّق الدومين نفسه (SPF وDKIM) فالرسايل ما بتتكتبش «via gmail.com» وبتقل احتمالية السبام.

## قبل ما تبدأ
- الدومين مشتري باسم التاجر (مثلاً `.store` من Hostinger).
- حساب Cloudflare بتاع التاجر (المجاني) والدومين مضاف عليه وحالته **Active** (الـnameservers اتغيّرت عند المسجّل، وده بياخد من دقايق لساعات).
- Gmail بتاع التاجر.

## 1) الاستقبال: Cloudflare Email Routing
1. Cloudflare > اختار الدومين > **Email > Email Routing > Get started**.
2. **Custom address**: اكتب `support` (أو `contact`). **Destination**: Gmail التاجر.
3. Cloudflare هيبعت للـGmail رسالة تأكيد، اضغط **Verify**. لما يبقى الـStatus **Verified** كمّل.
4. اضغط **Add records and enable** (هيضيف سجلات MX وSPF لوحده).
5. من **Routing rules** فعّل **Catch-all** وخليه يحوّل لنفس الـGmail، عشان أي عنوان غلط أو تاني على الدومين (مثلاً `info@`) ما يضيعش.
6. جرّب: ابعت من أي إيميل لـ`support@domain.com` وتأكد إنها وصلت Gmail.

## 2) الإرسال: Brevo (مجاني، حوالي 300 رسالة يومياً)
1. اعمل حساب على **brevo.com** بإيميل التاجر، واختار الخطة **Free**.
2. **Settings > Senders, Domains & IPs > Domains > Add a domain** واكتب الدومين، واضغط **Authenticate automatically** (لأن الدومين على Cloudflare بيتربط SPF وDKIM تلقائياً)، لحد ما يبقى **Verified**.
3. **Senders**: اتأكد إن فيه Sender بـ`support@domain.com` وباسم المتجر (**From name**) وحالته خضرا. لو فيه تحذير أصفر، عدّله بنفس الإيميل والاسم.
4. **SMTP & API > Generate a new SMTP key**: اسمه أي حاجة، **No expiration**. انسخ المفتاح (بيظهر مرة واحدة) واحفظه عند التاجر.

## 3) الواجهة: Gmail (Send mail as)
1. Gmail > الترس > **See all settings > Accounts and Import > Send mail as > Add another email address**.
2. الاسم: اسم المتجر. الإيميل: `support@domain.com`. سيب **Treat as an alias** معلّم. **Next**.
3. بيانات الـSMTP:
   - **SMTP server:** `smtp-relay.brevo.com`
   - **Port:** `587`، مع **Secured connection using TLS**
   - **Username:** إيميل حساب Brevo
   - **Password:** مفتاح الـSMTP اللي نسخته (من غير مسافات)
4. **Add Account**. Google هيبعت كود تأكيد على `support@domain.com`، وهيوصل Gmail بفضل Cloudflare. افتح الرسالة وأكّد.
5. في نفس الصفحة اختار **Reply from the same address the message was sent to**، عشان أي ردّ على رسالة جاية لـ`support@` يخرج منه هو مش من Gmail الشخصي.

## الاختبار قبل التسليم
- اكتب رسالة جديدة في Gmail، واختار **From** = `support@domain.com`، وابعتها لإيميل تاني. تأكد إنها وصلت واسم المرسل صح.
- ردّ على رسالة جاية للعنوان الاحترافي، وتأكد إن الرد طالع منه.
- ابعت لـGmail تاني وشوف إنها مش في السبام.

## ملاحظات
- حد الإرسال المجاني ما بيأثرش على الاستقبال، وده كافي لدعم متجر صغير.
- المتجر نفسه: في **الإعدادات > إعدادات المتجر** حط `support@domain.com` كإيميل التواصل، وبيظهر في الفوتر.
- لو التاجر لسه معندوش دومين، يبدأ بالدومين المجاني ويعمل الخطوات دي أول ما يشتري واحد.

"use client";

import React, { useState } from "react";
import type { PopupConfig } from "@/lib/commerce";
import { SettingsShell, Field, Toggle, inputCls, cardCls } from "../../_components/settings-ui";

const EMPTY: PopupConfig = { enabled: false, title: "", body: "", button_text: "اطلب دلوقتي", button_target: "checkout", delay_seconds: 5, image_url: "", frequency: "session" };
const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v)) || 0));

export default function PopupPage() {
  const [popup, setPopup] = useState<PopupConfig>(EMPTY);
  return (
    <SettingsShell
      title="النافذة المنبثقة (Popup)"
      description="رسالة بتظهر للزائر في صفحاتك، مثلاً عرض أو إعلان. بتتقفل بسهولة."
      load={(s) => setPopup({ ...EMPTY, ...(s.popup || {}) })}
      payload={() => ({ popup })}
    >
      <section className={cardCls}>
        <Toggle label="تفعيل النافذة" checked={popup.enabled} onChange={(v) => setPopup({ ...popup, enabled: v })} />
        {popup.enabled && (
          <>
            <Field label="العنوان">
              <input className={inputCls} maxLength={80} value={popup.title} onChange={(e) => setPopup({ ...popup, title: e.target.value })} />
            </Field>
            <Field label="النص">
              <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} maxLength={300} value={popup.body} onChange={(e) => setPopup({ ...popup, body: e.target.value })} />
            </Field>
            <Field label="رابط صورة (اختياري)" hint="الصورة دي بتتحسب ضمن الصور اللي الصفحة بتحمّلها.">
              <input className={inputCls} dir="ltr" placeholder="https://..." value={popup.image_url} onChange={(e) => setPopup({ ...popup, image_url: e.target.value.trim() })} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="نص الزرار">
                <input className={inputCls} maxLength={30} value={popup.button_text} onChange={(e) => setPopup({ ...popup, button_text: e.target.value })} />
              </Field>
              <Field label="الزرار يعمل إيه">
                <select className={inputCls} value={popup.button_target} onChange={(e) => setPopup({ ...popup, button_target: e.target.value === "close" ? "close" : "checkout" })}>
                  <option value="checkout">ينزّل لفورم الطلب</option>
                  <option value="close">يقفل النافذة</option>
                </select>
              </Field>
              <Field label="تظهر بعد (ثواني)">
                <input className={inputCls} inputMode="numeric" value={popup.delay_seconds} onChange={(e) => setPopup({ ...popup, delay_seconds: num(e.target.value) })} />
              </Field>
              <Field label="كام مرة">
                <select className={inputCls} value={popup.frequency} onChange={(e) => setPopup({ ...popup, frequency: e.target.value === "always" ? "always" : "session" })}>
                  <option value="session">مرة في كل جلسة</option>
                  <option value="always">كل ما الصفحة تتفتح</option>
                </select>
              </Field>
            </div>
          </>
        )}
      </section>
    </SettingsShell>
  );
}

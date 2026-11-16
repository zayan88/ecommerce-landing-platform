"use client";

import React, { useState } from "react";
import type { DownsellConfig } from "@/lib/commerce";
import { SettingsShell, Field, Toggle, inputCls, cardCls } from "../../_components/settings-ui";

const EMPTY: DownsellConfig = { on_exit: false, auto: false, delay_seconds: 30, coupon_code: "", message: "" };
const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v)) || 0));

export default function DownsellPage() {
  const [d, setD] = useState<DownsellConfig>(EMPTY);
  const [codes, setCodes] = useState<string[]>([]);
  return (
    <SettingsShell
      title="كوبون قبل المغادرة (Downsell)"
      description="نافذة بتعرض كوبون خصم للزائر قبل ما يمشي. بتظهر مرة واحدة بس في كل جلسة، وزرار «استخدم الكوبون» بيطبّقه في الفورم."
      load={(s) => {
        setD({ ...EMPTY, ...(s.downsell || {}) });
        setCodes((s.coupons || []).map((c: any) => c.code).filter(Boolean));
      }}
      payload={() => ({ downsell: d })}
      onSaved={(s) => setD({ ...EMPTY, ...(s.downsell || {}) })}
    >
      <section className={cardCls}>
        <Toggle label="اظهار الكوبون لما الزائر يحاول يغادر (على الكمبيوتر)" checked={d.on_exit} onChange={(v) => setD({ ...d, on_exit: v })} />
        <Toggle label="اظهار الكوبون تلقائياً بعد وقت" checked={d.auto} onChange={(v) => setD({ ...d, auto: v })} />
        {d.auto && (
          <Field label="الوقت بالثواني" hint="الموصى به 30 ثانية.">
            <input className={inputCls} inputMode="numeric" value={d.delay_seconds} onChange={(e) => setD({ ...d, delay_seconds: num(e.target.value) })} />
          </Field>
        )}
        <Field label="الكوبون المعروض" hint={codes.length === 0 ? "ضيف كوبون الأول من «الكوبونات»." : undefined}>
          <select className={inputCls} value={d.coupon_code} onChange={(e) => setD({ ...d, coupon_code: e.target.value })}>
            <option value="">اختار كوبون</option>
            {codes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="رسالة الكوبون" hint="مثال: خد خصم 50 جنيه لو طلبك أكتر من 1500 جنيه.">
          <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} maxLength={200} value={d.message} onChange={(e) => setD({ ...d, message: e.target.value })} />
        </Field>
        {(d.on_exit || d.auto) && !d.coupon_code && (
          <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">اختار الكوبون عشان النافذة تظهر.</p>
        )}
      </section>
    </SettingsShell>
  );
}

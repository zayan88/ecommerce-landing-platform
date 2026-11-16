"use client";

import React, { useState } from "react";
import { SettingsShell, Field, Toggle, inputCls, cardCls } from "../../_components/settings-ui";

export default function PaymentsSettingsPage() {
  const [vf, setVf] = useState({ enabled: false, number: "", holder: "" });
  const [ip, setIp] = useState({ enabled: false, address: "", holder: "" });

  return (
    <SettingsShell
      title="طرق الدفع"
      description="الدفع عند الاستلام شغال دايماً. فعّل فودافون كاش أو إنستاباي لو عاوز العميل يقدر يحوّل. بتظهر في فورم الطلب، وانت بتأكد التحويل من تفاصيل الطلب."
      load={(s) => {
        const v = s.payment_methods?.vodafone_cash || {};
        const i = s.payment_methods?.instapay || {};
        setVf({ enabled: Boolean(v.enabled), number: v.number || "", holder: v.holder || "" });
        setIp({ enabled: Boolean(i.enabled), address: i.address || "", holder: i.holder || "" });
      }}
      payload={() => ({ payment_methods: { vodafone_cash: vf, instapay: ip } })}
    >
      <section className={cardCls}>
        <Toggle label="فودافون كاش" checked={vf.enabled} onChange={(v) => setVf({ ...vf, enabled: v })} />
        {vf.enabled && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="رقم المحفظة">
              <input className={inputCls} dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={vf.number} onChange={(e) => setVf({ ...vf, number: e.target.value })} />
            </Field>
            <Field label="الاسم المسجل (اختياري)">
              <input className={inputCls} maxLength={60} value={vf.holder} onChange={(e) => setVf({ ...vf, holder: e.target.value })} />
            </Field>
          </div>
        )}
      </section>
      <section className={cardCls}>
        <Toggle label="إنستاباي" checked={ip.enabled} onChange={(v) => setIp({ ...ip, enabled: v })} />
        {ip.enabled && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="عنوان إنستاباي أو الرقم">
              <input className={inputCls} dir="ltr" placeholder="name@instapay أو رقم موبايل" value={ip.address} onChange={(e) => setIp({ ...ip, address: e.target.value })} />
            </Field>
            <Field label="الاسم المسجل (اختياري)">
              <input className={inputCls} maxLength={60} value={ip.holder} onChange={(e) => setIp({ ...ip, holder: e.target.value })} />
            </Field>
          </div>
        )}
      </section>
    </SettingsShell>
  );
}

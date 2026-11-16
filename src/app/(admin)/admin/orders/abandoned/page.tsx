"use client";

import React from "react";
import AbandonedList from "../AbandonedList";

/** Visitors who typed their name + phone in the checkout but did not place the order. */
export default function AbandonedOrdersPage() {
  return (
    <div className="space-y-5 text-right font-sans max-w-6xl mx-auto pb-16" dir="rtl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">الطلبات المفقودة</h1>
        <p className="text-sm text-gray-500 mt-1">عملاء بدأوا الطلب ومكمّلوش. كلّمهم وكمّل معاهم.</p>
      </div>
      <AbandonedList />
    </div>
  );
}

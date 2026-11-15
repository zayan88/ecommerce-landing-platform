import React from "react";
import type { Metadata } from "next";
import { ThankYouClient } from "./ThankYouClient";

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false, follow: false },
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  return <ThankYouClient slug={params.slug} />;
}

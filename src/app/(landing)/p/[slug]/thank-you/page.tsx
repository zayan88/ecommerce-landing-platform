import React from "react";
import type { Metadata } from "next";
import { ThankYouClient } from "./ThankYouClient";
import { LazyStorePopups, LazyStoreChat } from "@/components/shared/LazyExtras";
import { StoreHeader } from "@/components/shared/StoreHeader";

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false, follow: false },
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <StoreHeader />
      <ThankYouClient slug={params.slug} />
      <LazyStorePopups />
      <LazyStoreChat />
    </>
  );
}

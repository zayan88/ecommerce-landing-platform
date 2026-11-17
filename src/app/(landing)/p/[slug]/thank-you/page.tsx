import React from "react";
import type { Metadata } from "next";
import { ThankYouClient } from "./ThankYouClient";
import { StorePopups } from "@/components/shared/StorePopups";
import { StoreChat } from "@/components/shared/StoreChat";

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false, follow: false },
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <ThankYouClient slug={params.slug} />
      <StorePopups />
      <StoreChat />
    </>
  );
}

import React from "react";
import { ThankYouClient } from "./ThankYouClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  return <ThankYouClient slug={params.slug} />;
}

import React from "react";
import { getBrand } from "@/lib/brand";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreChromeGate } from "@/components/store/StoreChromeGate";

export const runtime = "edge";

/**
 * Landing mode: children are returned untouched (no wrapper element, HTML identical to before).
 * Catalog mode: store header/footer around product/policy pages (hidden on thank-you by the gate).
 */
export default async function LandingGroupLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  if (brand.store_mode !== "catalog") return <>{children}</>;
  return (
    <StoreChromeGate header={<StoreHeader />} footer={<StoreFooter />}>
      {children}
    </StoreChromeGate>
  );
}

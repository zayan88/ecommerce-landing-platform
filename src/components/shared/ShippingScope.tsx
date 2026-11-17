"use client";

import React, { createContext, useContext } from "react";
import { useBrand } from "@/components/brand/BrandProvider";
import { shippingHint } from "@/lib/commerce";

/** The product a page is about, so the shipping text ("free shipping" / the fee) follows THAT product's own fee. */
const ShippingProductCtx = createContext<string | undefined>(undefined);

export function ShippingScope({ productId, children }: { productId: string; children: React.ReactNode }) {
  return <ShippingProductCtx.Provider value={productId}>{children}</ShippingProductCtx.Provider>;
}

/** Customer-facing shipping text for the current page's product (store-wide text when there is no product scope). */
export function useShippingHint(): { free: boolean; text: string } {
  const productId = useContext(ShippingProductCtx);
  return shippingHint(useBrand().commerce.shipping, productId);
}

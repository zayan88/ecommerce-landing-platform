"use client";

import React, { createContext, useContext } from "react";
import { BRAND_DEFAULTS, type PublicBrand } from "@/lib/brand";

const BrandContext = createContext<PublicBrand>(BRAND_DEFAULTS);

/** Gives client components the merchant's brand without prop drilling. */
export function BrandProvider({ brand, children }: { brand: PublicBrand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): PublicBrand {
  return useContext(BrandContext);
}

"use client";

import { useEffect } from "react";
import type { ChatFaq } from "@/lib/chat";

/**
 * The product page tells the chat which product it is on, so the chat can answer that product's own Q&A.
 * Kept in its own tiny module: the chat widget itself is loaded lazily after the page is interactive.
 */
export interface ProductCtx {
  name: string;
  faq: ChatFaq[];
}
let productCtx: ProductCtx | null = null;
const listeners = new Set<() => void>();
const setProductCtx = (c: ProductCtx | null) => {
  productCtx = c;
  listeners.forEach((l) => l());
};
export const subscribeProductCtx = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getProductCtx = () => productCtx;

/** Rendered by the product page (renders nothing). */
export function ChatProduct({ name, faq }: ProductCtx) {
  useEffect(() => {
    setProductCtx({ name, faq });
    return () => setProductCtx(null);
  }, [name, JSON.stringify(faq)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

"use client";

import dynamic from "next/dynamic";

/** The chat bubble and the marketing popups are not needed to read the page and order: they load after it is interactive. */
export const LazyStoreChat = dynamic(() => import("./StoreChat").then((m) => m.StoreChat), { ssr: false });
export const LazyStorePopups = dynamic(() => import("./StorePopups").then((m) => m.StorePopups), { ssr: false });

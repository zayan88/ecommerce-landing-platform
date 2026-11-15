"use client";

import React from "react";
import { usePathname } from "next/navigation";

/**
 * Wraps product routes with the store header/footer, except on the thank-you page
 * (kept clean). Header/footer are server components passed as props.
 */
export function StoreChromeGate({ header, footer, children }: { header: React.ReactNode; footer: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const bare = /\/thank-you\/?$/.test(pathname);
  if (bare) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}

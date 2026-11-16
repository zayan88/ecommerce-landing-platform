import React from "react";
import { StorePopups } from "@/components/shared/StorePopups";

export const runtime = "edge";

/** Landing pages render on their own (no store header / footer), plus the merchant's popups. */
export default function LandingGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StorePopups />
    </>
  );
}

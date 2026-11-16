import React from "react";
import { StorePopups } from "@/components/shared/StorePopups";
import { StoreChat } from "@/components/shared/StoreChat";

export const runtime = "edge";

/** Landing pages render on their own (no store header / footer), plus the merchant's popups. */
export default function LandingGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StorePopups />
      <StoreChat />
    </>
  );
}

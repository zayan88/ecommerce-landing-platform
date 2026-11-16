import React from "react";

export const runtime = "edge";

/** Landing pages render on their own (no store header / footer around them). */
export default function LandingGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

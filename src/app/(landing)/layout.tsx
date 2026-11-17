import React from "react";

export const runtime = "edge";

/** Landing pages render on their own (no store header / footer). Each page adds the chat and popups itself, in its language scope. */
export default function LandingGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import React from "react";

/** Settings pages are listed in the sidebar (Settings group), so the pages render on their own. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

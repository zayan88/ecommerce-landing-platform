"use client";

import React from "react";

/** App-level client providers. (A UI kit provider used to wrap the app but no component of it is used: it only added JS.) */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

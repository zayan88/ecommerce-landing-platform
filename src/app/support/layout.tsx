import { notFound } from "next/navigation";
import { CHAT_ENABLED } from "@/lib/features";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  if (!CHAT_ENABLED) notFound();
  return <>{children}</>;
}

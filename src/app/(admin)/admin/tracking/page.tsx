import { redirect } from "next/navigation";

/** The old "visitor tracking" page was removed; its pixel settings are in the Tracking & Marketing menu. */
export default function TrackingRedirect() {
  redirect("/admin/marketing/pixels");
}

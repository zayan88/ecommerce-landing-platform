import { redirect } from "next/navigation";

/** Moved: pixels and tracking now live under the main "Tracking & Marketing" menu. */
export default function SettingsTrackingRedirect() {
  redirect("/admin/marketing/pixels");
}

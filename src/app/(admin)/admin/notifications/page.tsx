import { redirect } from "next/navigation";

/** Moved: sales notifications now live under Settings. Kept so old links and bookmarks still work. */
export default function NotificationsRedirect() {
  redirect("/admin/settings/notifications");
}

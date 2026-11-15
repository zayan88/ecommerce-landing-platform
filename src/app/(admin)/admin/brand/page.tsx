import { redirect } from "next/navigation";

/** Moved: store identity now lives under Settings. Kept so old links and bookmarks still work. */
export default function BrandRedirect() {
  redirect("/admin/settings");
}

import { redirect } from "next/navigation";

/** Moved: shipping is under Settings > Shipping; coupons, downsell and popup are under Marketing. */
export default function CommerceMoved() {
  redirect("/admin/settings/shipping");
}

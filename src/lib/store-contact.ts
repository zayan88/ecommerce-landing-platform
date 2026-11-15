/** Builds wa.me / tel: links from the merchant's raw numbers (digits and +). Egypt local 01xxxxxxxxx -> 20 prefix. */
export function whatsappUrl(raw: string): string {
  let d = (raw || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "20" + d.slice(1);
  return `https://wa.me/${d}`;
}
export function telUrl(raw: string): string {
  const d = (raw || "").replace(/[^\d+]/g, "");
  return d ? `tel:${d}` : "";
}

/**
 * Image budget of a landing page. Every uploaded image is served by a Pages Function (one invocation per
 * image on a visitor's first visit), so a page is limited to MAX_PAGE_IMAGES distinct images:
 * the product gallery (only its first 4 pictures are ever shown) plus the images the merchant set on
 * the page itself (hero / comparison / contents). The same URL used twice counts once.
 */
export const MAX_PAGE_IMAGES = 5;
export const GALLERY_SHOWN = 4;

const IMAGE_FIELDS = ["hero_image", "comparison_image", "box_image"] as const;

export function pageImageSet(
  productImages: string[] | undefined,
  content: Partial<Record<(typeof IMAGE_FIELDS)[number], string>> | undefined,
  /** Count as if this field held `value` instead (used to check an upload before applying it). */
  override?: { field: string; value: string }
): Set<string> {
  const set = new Set<string>();
  for (const img of (productImages || []).slice(0, GALLERY_SHOWN)) if (img) set.add(img);
  for (const f of IMAGE_FIELDS) {
    const v = override && override.field === f ? override.value : content?.[f];
    if (typeof v === "string" && v) set.add(v);
  }
  return set;
}

export function pageImageCount(productImages: string[] | undefined, content: Parameters<typeof pageImageSet>[1]): number {
  return pageImageSet(productImages, content).size;
}

/** True when setting `field` to `value` would put the page over the limit (it never blocks removing or reusing a picture). */
export function wouldExceedImageLimit(
  productImages: string[] | undefined,
  content: Parameters<typeof pageImageSet>[1],
  field: string,
  value: string
): boolean {
  if (!value) return false;
  const before = pageImageSet(productImages, content);
  const after = pageImageSet(productImages, content, { field, value });
  return after.size > MAX_PAGE_IMAGES && after.size > before.size;
}

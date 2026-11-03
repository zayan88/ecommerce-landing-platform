export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  fbp?: string;
  fbc?: string;
}

export function captureUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};

  const searchParams = new URLSearchParams(window.location.search);
  const utms: UtmParams = {};

  const source = searchParams.get("utm_source");
  const medium = searchParams.get("utm_medium");
  const campaign = searchParams.get("utm_campaign");
  const content = searchParams.get("utm_content");
  const term = searchParams.get("utm_term");

  if (source) utms.utm_source = source;
  if (medium) utms.utm_medium = medium;
  if (campaign) utms.utm_campaign = campaign;
  if (content) utms.utm_content = content;
  if (term) utms.utm_term = term;

  if (document.referrer) {
    utms.referrer = document.referrer;
  }

  // Get Meta cookies
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith("_fbp=")) {
      utms.fbp = cookie.substring(5);
    }
    if (cookie.startsWith("_fbc=")) {
      utms.fbc = cookie.substring(5);
    }
  }

  // Fallback to cached UTM in sessionStorage if direct hit on subpage
  if (!source && !medium) {
    try {
      const cached = sessionStorage.getItem("landing_utm_cache");
      if (cached) {
        return { ...JSON.parse(cached), fbp: utms.fbp, fbc: utms.fbc };
      }
    } catch {}
  } else {
    try {
      sessionStorage.setItem("landing_utm_cache", JSON.stringify(utms));
    } catch {}
  }

  return utms;
}

export function generateEventId(prefix = "evt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

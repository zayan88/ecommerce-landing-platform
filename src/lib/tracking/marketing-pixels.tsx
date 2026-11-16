"use client";

import Script from "next/script";
import React from "react";
import { validGa4, validGtm, validSnapPixel, validTiktokPixel } from "./tag-ids";

declare global {
  interface Window {
    ttq?: any;
    snaptr?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface MarketingPixelsProps {
  tiktokPixelIds?: string[];
  snapPixelIds?: string[];
  ga4Id?: string;
  gtmId?: string;
}

/** TikTok Pixel, Google Analytics 4 and Google Tag Manager. Ids are validated again here before any script is built. */
export function MarketingPixels({ tiktokPixelIds, snapPixelIds, ga4Id, gtmId }: MarketingPixelsProps) {
  const tts = Array.from(new Set((tiktokPixelIds || []).filter(validTiktokPixel)));
  const snaps = Array.from(new Set((snapPixelIds || []).filter(validSnapPixel)));
  const ga = validGa4(ga4Id) ? ga4Id : "";
  const gtm = validGtm(gtmId) ? gtmId : "";
  if (!tts.length && !snaps.length && !ga && !gtm) return null;

  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`,
            }}
          />
        </>
      )}
      {gtm && (
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
          }}
        />
      )}
      {snaps.length > 0 && (
        <Script
          id="snap-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s="script";var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,"https://sc-static.net/scevent.min.js");${snaps.map((id) => `snaptr("init","${id}");`).join("")}snaptr("track","PAGE_VIEW");`,
          }}
        />
      )}
      {tts.length > 0 && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};${tts.map((id) => `ttq.load("${id}");`).join("")}ttq.page();}(window,document,'ttq');`,
          }}
        />
      )}
    </>
  );
}

type StoreEvent = "ViewContent" | "InitiateCheckout" | "Purchase";

/** Sends the same store event to TikTok / GA4 / GTM when they are installed (no-op otherwise). */
export function trackMarketingEvent(event: StoreEvent, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const value = typeof params.value === "number" ? params.value : undefined;
  const currency = typeof params.currency === "string" ? params.currency : "EGP";
  const contentId = params.content_ids?.[0] ?? params.content_id;
  const contentName = params.content_name;

  try {
    window.ttq?.track?.(event === "Purchase" ? "PlaceAnOrder" : event, {
      value,
      currency,
      content_id: contentId,
      content_name: contentName,
    });
  } catch {}

  try {
    window.snaptr?.("track", event === "Purchase" ? "PURCHASE" : event === "InitiateCheckout" ? "START_CHECKOUT" : "VIEW_CONTENT", {
      price: value,
      currency,
      ...(contentId ? { item_ids: [String(contentId)] } : {}),
      ...(event === "Purchase" && params.transaction_id ? { transaction_id: params.transaction_id } : {}),
    });
  } catch {}

  const ga4Name = event === "Purchase" ? "purchase" : event === "InitiateCheckout" ? "begin_checkout" : "view_item";
  try {
    window.gtag?.("event", ga4Name, {
      currency,
      value,
      ...(contentId ? { items: [{ item_id: String(contentId), item_name: contentName }] } : {}),
      ...(event === "Purchase" && params.transaction_id ? { transaction_id: params.transaction_id } : {}),
    });
  } catch {}

  try {
    window.dataLayer?.push({ event: `store_${event}`, value, currency, content_id: contentId, content_name: contentName });
  } catch {}
}

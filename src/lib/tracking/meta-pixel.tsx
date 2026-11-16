"use client";

import Script from "next/script";
import React from "react";
import { validMetaPixel } from "./tag-ids";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface MetaPixelProps {
  pixelId?: string;
  /** Several pixels can be installed at once (each one is initialised; events go to all of them). */
  pixelIds?: string[];
}

export function MetaPixel({ pixelId, pixelIds }: MetaPixelProps) {
  // The ids go into an inline script: only numeric Meta pixel ids are accepted.
  const ids = Array.from(new Set((pixelIds && pixelIds.length ? pixelIds : [pixelId]).filter(validMetaPixel)));
  if (ids.length === 0) return null;
  const pixelId0 = ids[0];

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            ${ids.map((id) => `fbq('init', '${id}');`).join("")}
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId0}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Fires a Meta Pixel event on the browser with an event_id for CAPI deduplication
 */
export function trackMetaEvent(
  eventName: "PageView" | "ViewContent" | "InitiateCheckout" | "AddToCart" | "Purchase",
  params?: Record<string, any>,
  eventId?: string
) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    const options = eventId ? { eventID: eventId } : undefined;
    window.fbq("track", eventName, params || {}, options);
  }
}

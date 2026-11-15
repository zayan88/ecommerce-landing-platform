"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children inside an isolated same-origin iframe so Tailwind breakpoints (sm:/md:) react to the
 * DEVICE width being previewed (390px phone vs full desktop) instead of the admin window width.
 * Page styles/fonts/theme variables are mirrored from the host document.
 */
export function PreviewFrame({ width, children }: { width: number | "100%"; children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const setup = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      const htmlSrc = document.documentElement;
      doc.documentElement.lang = htmlSrc.lang || "ar";
      doc.documentElement.dir = "rtl";
      doc.documentElement.className = htmlSrc.className;
      doc.documentElement.setAttribute("style", htmlSrc.getAttribute("style") || "");
      doc.body.className = document.body.className;
      doc.body.style.margin = "0";

      const syncStyles = () => {
        doc.head.querySelectorAll("[data-mirrored]").forEach((n) => n.remove());
        document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
          const clone = n.cloneNode(true) as HTMLElement;
          clone.setAttribute("data-mirrored", "1");
          doc.head.appendChild(clone);
        });
      };
      syncStyles();
      observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(syncStyles, 250);
      });
      observer.observe(document.head, { childList: true, subtree: true, characterData: true });

      let root = doc.getElementById("preview-root");
      if (!root) {
        root = doc.createElement("div");
        root.id = "preview-root";
        doc.body.appendChild(root);
      }
      setMount(root);
    };

    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.body) setup();
    iframe.addEventListener("load", setup);
    return () => {
      iframe.removeEventListener("load", setup);
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
    <iframe
      ref={iframeRef}
      title="معاينة الصفحة"
      srcDoc='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'
      className="block h-full bg-white border-0"
      style={{ width, maxWidth: "100%" }}
    />
    {mount ? createPortal(children, mount) : null}
    </>
  );
}

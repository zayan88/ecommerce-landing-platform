"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global tracking helper
declare global {
  interface Window {
    storeTrack?: (eventName: string, metadata?: Record<string, any>) => void;
  }
}

// Events are queued and sent together (one Worker invocation instead of one per event):
// after 15 s, when the queue holds 12, when the tab is hidden / closed, and on route change.
let queue: Record<string, any>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let listenersAdded = false;

function flushQueue() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.slice(0, 20) });
  queue = queue.slice(20);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // tracking must never break the page
  }
  if (queue.length > 0) flushQueue();
}

function enqueue(payload: Record<string, any>) {
  queue.push(payload);
  if (queue.length >= 12) flushQueue();
  else if (!flushTimer) flushTimer = setTimeout(flushQueue, 15000);
  if (!listenersAdded && typeof window !== "undefined") {
    listenersAdded = true;
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushQueue());
    window.addEventListener("pagehide", flushQueue);
  }
}

export function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollMilestones = useRef<{ [key: number]: boolean }>({ 50: false, 90: false });
  const formStarted = useRef(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // 1. Resolve or create persistent Visitor ID
    let visitorId = localStorage.getItem("sf_vid");
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("sf_vid", visitorId);
    }

    // 2. Resolve or create Session ID
    let sessionId = sessionStorage.getItem("sf_sid");
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("sf_sid", sessionId);
    }

    // 3. Resolve Device Type
    const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };

    // 4. Resolve UTMs & Referrer
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source") || undefined;
    const utm_medium = params.get("utm_medium") || undefined;
    const utm_campaign = params.get("utm_campaign") || undefined;
    const utm_content = params.get("utm_content") || undefined;
    const referrer = document.referrer || undefined;

    // Helper to send event to /api/analytics
    const sendEvent = (eventName: string, metadata: Record<string, any> = {}) => {
      try {
        const landingSlug = pathname?.startsWith("/p/")
          ? pathname.replace(/^\/p\//, "").split("/")[0]
          : pathname === "/"
          ? "home"
          : pathname?.replace(/^\//, "");

        const payload = {
          visitor_id: visitorId,
          session_id: sessionId,
          event_name: eventName,
          page_url: window.location.pathname + window.location.search,
          page_title: document.title,
          landing_page_slug: landingSlug,
          device_type: getDeviceType(),
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          referrer,
          metadata,
          created_at: new Date().toISOString(),
        };

        enqueue(payload);
      } catch (err) {
        // Silent catch for resilience
      }
    };

    // Expose global tracker
    window.storeTrack = sendEvent;

    // Reset scroll milestones on route change
    scrollMilestones.current = { 50: false, 90: false };
    formStarted.current = false;

    // Fire initial PageView event
    sendEvent("PageView", {
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    });

    // 5. Track Scroll Depth (50% and 90%)
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent >= 50 && !scrollMilestones.current[50]) {
        scrollMilestones.current[50] = true;
        sendEvent("ScrollDepth", { depth: "50%", scrollPercent });
      }

      if (scrollPercent >= 90 && !scrollMilestones.current[90]) {
        scrollMilestones.current[90] = true;
        sendEvent("ScrollDepth", { depth: "90%", scrollPercent });
      }
    };

    // 6. Track CTA Click
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const btn = target.closest("button, a");
      if (!btn) return;

      const text = btn.textContent?.trim() || "";
      const isCta =
        btn.getAttribute("data-tracking") === "cta" ||
        /اطلب الآن|شراء|احصل عليه|أكد طلبك|سجل الطلب|تأكيد الشراء/i.test(text);

      if (isCta) {
        sendEvent("ClickCTA", {
          label: text.substring(0, 50),
          tag: btn.tagName.toLowerCase(),
        });
      }
    };

    // 7. Track Form Interaction (focus on checkout inputs)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target || target.tagName !== "INPUT") return;

      if (!formStarted.current && (target.name || target.placeholder || target.id)) {
        formStarted.current = true;
        sendEvent("FormInteraction", {
          field: target.name || target.placeholder || target.id,
          action: "focused_field",
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("focusin", handleFocusIn, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("focusin", handleFocusIn);
      flushQueue(); // leaving the page / route: send what is queued
    };
  }, [pathname, searchParams]);

  return null;
}

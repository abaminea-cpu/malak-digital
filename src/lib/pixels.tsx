import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PixelConfig = {
  meta_pixel_id?: string;
  tiktok_pixel_id?: string;
  ga4_measurement_id?: string;
  gtm_id?: string;
  snap_pixel_id?: string;
};

const PixelContext = createContext<PixelConfig>({});

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    snaptr?: (...args: any[]) => void;
  }
}

export function PixelProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<PixelConfig>({});

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "pixels")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setCfg(data.value as PixelConfig);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Meta (Facebook) Pixel
    if (cfg.meta_pixel_id && !window.fbq) {
      (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq!("init", cfg.meta_pixel_id);
      window.fbq!("track", "PageView");
    }

    // TikTok Pixel
    if (cfg.tiktok_pixel_id && !window.ttq) {
      (function (w: any, d: any, t: string) {
        w.TiktokAnalyticsObject = t; const ttq = (w[t] = w[t] || []);
        ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer = function (e: any, t: string) { e[t] = function () { e.push([t].concat(Array.prototype.slice.call(arguments, 0))); }; };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (e: any) { const n = ttq._i[e] || []; for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(n, ttq.methods[i]); return n; };
        ttq.load = function (e: string) {
          const n = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = n; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {};
          const o = d.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = n + "?sdkid=" + e + "&lib=" + t;
          const a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
        };
        ttq.load(cfg.tiktok_pixel_id); ttq.page();
      })(window, document, "ttq");
    }

    // GA4
    if (cfg.ga4_measurement_id && !window.gtag) {
      const s = document.createElement("script"); s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4_measurement_id}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", cfg.ga4_measurement_id);
    }

    // GTM
    if (cfg.gtm_id && !window.dataLayer?.find((d: any) => d["gtm.start"])) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const s = document.createElement("script"); s.async = true;
      s.src = `https://www.googletagmanager.com/gtm.js?id=${cfg.gtm_id}`;
      document.head.appendChild(s);
    }

    // Snap Pixel
    if (cfg.snap_pixel_id && !window.snaptr) {
      (function (e: any, t: any, n: string) {
        if (e.snaptr) return; const a: any = e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); };
        a.queue = []; const s = "script"; const r = t.createElement(s); r.async = !0; r.src = n;
        const u = t.getElementsByTagName(s)[0]; u.parentNode.insertBefore(r, u);
      })(window, document, "https://sc-static.net/scevent.min.js");
      window.snaptr!("init", cfg.snap_pixel_id); window.snaptr!("track", "PAGE_VIEW");
    }
  }, [cfg]);

  return <PixelContext.Provider value={cfg}>{children}</PixelContext.Provider>;
}

export const usePixels = () => useContext(PixelContext);

export type EcomEvent =
  | { name: "ViewContent"; value?: number; currency?: string; content_ids?: string[]; content_name?: string }
  | { name: "AddToCart"; value: number; currency?: string; content_ids: string[]; content_name?: string }
  | { name: "InitiateCheckout"; value: number; currency?: string }
  | { name: "Purchase"; value: number; currency?: string; content_ids?: string[]; order_id?: string };

export function trackEvent(evt: EcomEvent) {
  if (typeof window === "undefined") return;
  const currency = evt.currency ?? "DZD";
  const payload: any = { ...evt, currency };

  try { window.fbq?.("track", evt.name, payload); } catch {}
  try { window.ttq?.track(evt.name, payload); } catch {}
  try {
    const map: Record<string, string> = { ViewContent: "view_item", AddToCart: "add_to_cart", InitiateCheckout: "begin_checkout", Purchase: "purchase" };
    window.gtag?.("event", map[evt.name], { value: (evt as any).value, currency, transaction_id: (evt as any).order_id });
  } catch {}
  try { window.snaptr?.("track", evt.name.toUpperCase(), payload); } catch {}
}

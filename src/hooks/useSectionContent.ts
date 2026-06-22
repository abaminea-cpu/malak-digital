import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDefault, type ML } from "@/lib/editorDefaults";

type Key = string; // `${portal}|${pageKey}|${sectionKey}`
const k = (p: string, pg: string, s: string): Key => `${p}|${pg}|${s}`;

const cache = new Map<Key, unknown>();
const pending = new Map<Key, Array<(v: unknown) => void>>();
let queue: Key[] = [];
let scheduled = false;
const bus = new EventTarget();

function deepMerge<T>(a: unknown, b: unknown): T {
  if (a && typeof a === "object" && !Array.isArray(a) && b && typeof b === "object" && !Array.isArray(b)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const key of Object.keys(b as Record<string, unknown>)) {
      out[key] = deepMerge((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]);
    }
    return out as T;
  }
  return (b === undefined ? a : b) as T;
}

async function flush() {
  scheduled = false;
  const batch = Array.from(new Set(queue));
  queue = [];
  if (!batch.length) return;
  const orClause = batch
    .map((key) => {
      const [portal, pageKey, sectionKey] = key.split("|");
      return `and(portal.eq.${portal},page_key.eq.${pageKey},section_key.eq.${sectionKey})`;
    })
    .join(",");
  try {
    const { data } = await supabase
      .from("site_content")
      .select("portal,page_key,section_key,content")
      .or(orClause);
    const found = new Map<Key, unknown>();
    for (const row of data ?? []) {
      found.set(k(row.portal, row.page_key, row.section_key), row.content);
    }
    for (const key of batch) {
      const [portal, pageKey, sectionKey] = key.split("|");
      const def = getDefault(portal, pageKey, sectionKey);
      const dbContent = found.get(key);
      const merged = dbContent ? deepMerge(def, dbContent) : def;
      cache.set(key, merged);
      const subs = pending.get(key) ?? [];
      pending.delete(key);
      subs.forEach((cb) => cb(merged));
    }
  } catch (e) {
    console.error("[useSectionContent] batch fetch failed", e);
    for (const key of batch) {
      const [portal, pageKey, sectionKey] = key.split("|");
      const def = getDefault(portal, pageKey, sectionKey);
      cache.set(key, def);
      (pending.get(key) ?? []).forEach((cb) => cb(def));
      pending.delete(key);
    }
  }
}

function request(key: Key): Promise<unknown> {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  return new Promise((resolve) => {
    const list = pending.get(key) ?? [];
    list.push(resolve);
    pending.set(key, list);
    queue.push(key);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => void flush());
    }
  });
}

// --- Singleton realtime channel ---
let channelInit = false;
function ensureRealtime() {
  if (channelInit || typeof window === "undefined") return;
  channelInit = true;
  supabase
    .channel("site_content_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_content" },
      (payload) => {
        const row = (payload.new ?? payload.old) as { portal: string; page_key: string; section_key: string; content?: unknown } | undefined;
        if (!row) return;
        const key = k(row.portal, row.page_key, row.section_key);
        const def = getDefault(row.portal, row.page_key, row.section_key);
        const content = (payload.new as { content?: unknown } | undefined)?.content;
        const merged = content ? deepMerge(def, content) : def;
        cache.set(key, merged);
        bus.dispatchEvent(new CustomEvent(key, { detail: merged }));
      },
    )
    .subscribe();
}

// --- Live preview via postMessage (?editor=1) ---
let previewInit = false;
function ensurePreview() {
  if (previewInit || typeof window === "undefined") return;
  previewInit = true;
  const isEditor = new URLSearchParams(window.location.search).has("editor");
  if (!isEditor) return;
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data as { type?: string; portal?: string; pageKey?: string; sectionKey?: string; content?: unknown } | null;
    if (!msg || msg.type !== "cms-preview-update") return;
    if (!msg.portal || !msg.pageKey || !msg.sectionKey) return;
    const key = k(msg.portal, msg.pageKey, msg.sectionKey);
    const def = getDefault(msg.portal, msg.pageKey, msg.sectionKey);
    const merged = deepMerge(def, msg.content);
    cache.set(key, merged);
    bus.dispatchEvent(new CustomEvent(key, { detail: merged }));
  });
}

export function useSectionContent<T = unknown>(portal: string, pageKey: string, sectionKey: string): T | null {
  const key = k(portal, pageKey, sectionKey);
  const [value, setValue] = useState<T | null>(() => (cache.get(key) as T | undefined) ?? (getDefault<T>(portal, pageKey, sectionKey)));

  useEffect(() => {
    let mounted = true;
    ensureRealtime();
    ensurePreview();
    request(key).then((v) => {
      if (mounted) setValue(v as T);
    });
    const handler = (e: Event) => {
      const ce = e as CustomEvent<T>;
      if (mounted) setValue(ce.detail);
    };
    bus.addEventListener(key, handler);
    return () => {
      mounted = false;
      bus.removeEventListener(key, handler);
    };
  }, [key]);

  return value;
}

export function mlValue(obj: ML | string | undefined | null, lang: string): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return (obj as Record<string, string>)[lang] ?? obj.fr ?? obj.en ?? "";
}

export function invalidateContentCache(portal: string, pageKey: string, sectionKey: string) {
  cache.delete(k(portal, pageKey, sectionKey));
}
export function invalidateAllContentCache() {
  cache.clear();
}

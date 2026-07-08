import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_sheets/v4";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

function extractSpreadsheetId(v?: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s;
  return null;
}

async function loadConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("sheets_config")
    .select("*")
    .eq("id", "global")
    .maybeSingle();
  if (data) {
    data.orders_spreadsheet_id = extractSpreadsheetId(data.orders_spreadsheet_id);
    data.exchanges_spreadsheet_id = extractSpreadsheetId(data.exchanges_spreadsheet_id);
  }
  return data;
}

function gatewayHeaders() {
  const lovable = process.env.LOVABLE_API_KEY;
  const sheets = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovable || !sheets) {
    throw new Error("Google Sheets non configuré (secrets manquants).");
  }
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": sheets,
    "Content-Type": "application/json",
  };
}

async function appendRows(spreadsheetId: string, sheetName: string, rows: any[][]) {
  const range = `${sheetName}!A:Z`;
  const url = `${GATEWAY_BASE}/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: gatewayHeaders(),
    body: JSON.stringify({ values: rows }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sheets append failed (${res.status}): ${t.slice(0, 300)}`);
  }
  return res.json();
}

async function ensureHeaders(spreadsheetId: string, sheetName: string, headers: string[]) {
  // Read first row; if empty, write the header row.
  const getUrl = `${GATEWAY_BASE}/spreadsheets/${spreadsheetId}/values/${sheetName}!1:1`;
  const res = await fetch(getUrl, { headers: gatewayHeaders() });
  if (res.ok) {
    const j: any = await res.json();
    if (j?.values && j.values[0]?.length) return;
  }
  const url = `${GATEWAY_BASE}/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: "PUT",
    headers: gatewayHeaders(),
    body: JSON.stringify({ values: [headers] }),
  });
}

const ORDER_HEADERS = [
  "N° Commande", "Date", "Statut", "Client", "Téléphone", "Téléphone 2",
  "Email", "Wilaya", "Commune", "Adresse", "Livraison", "Frais", "Sous-total", "Total",
  "Produits", "Quantités", "Notes",
];

const EXCHANGE_HEADERS = [
  "N° Demande", "Date", "Statut", "N° Commande", "Client", "Téléphone",
  "Produits", "Motif", "Nb Photos", "Photos",
];

function orderRow(o: any): any[] {
  const items = o.order_items ?? [];
  const produits = items.map((i: any) => i.product_name).join(" | ");
  const quantites = items.map((i: any) => i.quantity).join(" | ");
  return [
    o.order_number, new Date(o.created_at).toLocaleString("fr-FR"), o.status,
    `${o.customer_first_name ?? ""} ${o.customer_last_name ?? ""}`.trim(),
    o.customer_phone ?? "", o.customer_phone_alt ?? "", o.customer_email ?? "",
    o.wilayas?.name_fr ?? o.wilaya_id ?? "", o.commune ?? "", o.address ?? "",
    o.shipping_method ?? "", Number(o.shipping_cost ?? 0), Number(o.subtotal ?? 0), Number(o.total ?? 0),
    produits, quantites, o.notes ?? "",
  ];
}

async function signPhotos(photos: string[] | null | undefined): Promise<string[]> {
  const arr = photos ?? [];
  if (!arr.length) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: string[] = [];
  const EXPIRES = 60 * 60 * 24 * 365 * 10; // ~10 years
  for (const p of arr) {
    if (/^https?:\/\//.test(p)) { out.push(p); continue; }
    const { data: s } = await supabaseAdmin.storage.from("exchange-photos").createSignedUrl(p, EXPIRES);
    if (s?.signedUrl) out.push(s.signedUrl);
  }
  return out;
}

function exchangeRow(r: any, signedPhotos: string[]): any[] {
  const items = r.orders?.order_items ?? [];
  const produits = items.map((i: any) => `${i.quantity}× ${i.product_name}`).join(" | ");
  return [
    r.request_number, new Date(r.created_at).toLocaleString("fr-FR"), r.status,
    r.orders?.order_number ?? "", r.customer_name ?? "", r.customer_phone ?? "",
    produits, r.reason ?? "", (r.photos ?? []).length,
    signedPhotos.join(" | "),
  ];
}


/** Fire-and-forget style: called from other server fns. Never throws. */
export async function syncOrderToSheetsSafe(orderId: string) {
  try {
    const cfg = await loadConfig();
    if (!cfg?.orders_enabled || !cfg.orders_spreadsheet_id) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("*, wilayas(name_fr), order_items(product_name, quantity)")
      .eq("id", orderId)
      .maybeSingle();
    if (!o) return;
    await ensureHeaders(cfg.orders_spreadsheet_id, cfg.orders_sheet_name, ORDER_HEADERS);
    await appendRows(cfg.orders_spreadsheet_id, cfg.orders_sheet_name, [orderRow(o)]);
  } catch (e) {
    console.error("[sheets] syncOrder error:", e);
  }
}

export async function syncExchangeToSheetsSafe(exchangeId: string) {
  try {
    const cfg = await loadConfig();
    if (!cfg?.exchanges_enabled || !cfg.exchanges_spreadsheet_id) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin
      .from("exchange_requests")
      .select("*, orders(order_number, order_items(product_name, quantity))")
      .eq("id", exchangeId)
      .maybeSingle();
    if (!r) return;
    const signed = await signPhotos(r.photos);
    await ensureHeaders(cfg.exchanges_spreadsheet_id, cfg.exchanges_sheet_name, EXCHANGE_HEADERS);
    await appendRows(cfg.exchanges_spreadsheet_id, cfg.exchanges_sheet_name, [exchangeRow(r, signed)]);
  } catch (e) {
    console.error("[sheets] syncExchange error:", e);
  }
}

/** ADMIN: load config */
export const getSheetsConfigFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    return (await loadConfig()) ?? null;
  });

const SaveCfg = z.object({
  orders_spreadsheet_id: z.string().trim().max(120).nullable().optional(),
  orders_sheet_name: z.string().trim().min(1).max(80),
  orders_enabled: z.boolean(),
  exchanges_spreadsheet_id: z.string().trim().max(120).nullable().optional(),
  exchanges_sheet_name: z.string().trim().min(1).max(80),
  exchanges_enabled: z.boolean(),
});

export const saveSheetsConfigFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveCfg.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      id: "global",
      orders_spreadsheet_id: extractSpreadsheetId(data.orders_spreadsheet_id ?? null),
      orders_sheet_name: data.orders_sheet_name,
      orders_enabled: data.orders_enabled,
      exchanges_spreadsheet_id: extractSpreadsheetId(data.exchanges_spreadsheet_id ?? null),
      exchanges_sheet_name: data.exchanges_sheet_name,
      exchanges_enabled: data.exchanges_enabled,
    };
    const { error } = await supabaseAdmin.from("sheets_config").upsert(patch, { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  });

/** ADMIN: test connexion en écrivant un header */
export const testSheetsConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ target: z.enum(["orders", "exchanges"]) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const cfg = await loadConfig();
    if (!cfg) throw new Error("Configuration introuvable.");
    const sid = data.target === "orders" ? cfg.orders_spreadsheet_id : cfg.exchanges_spreadsheet_id;
    const name = data.target === "orders" ? cfg.orders_sheet_name : cfg.exchanges_sheet_name;
    if (!sid) throw new Error("Spreadsheet ID manquant.");
    const headers = data.target === "orders" ? ORDER_HEADERS : EXCHANGE_HEADERS;
    await ensureHeaders(sid, name, headers);
    return { ok: true };
  });

/** ADMIN: backfill export */
export const backfillOrdersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const cfg = await loadConfig();
    if (!cfg?.orders_spreadsheet_id) throw new Error("Configurez d'abord le Google Sheet des commandes.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("*, wilayas(name_fr), order_items(product_name, quantity)")
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw error;
    await ensureHeaders(cfg.orders_spreadsheet_id, cfg.orders_sheet_name, ORDER_HEADERS);
    if (!rows?.length) return { ok: true, count: 0 };
    // batch by 200
    const values = rows.map(orderRow);
    for (let i = 0; i < values.length; i += 200) {
      await appendRows(cfg.orders_spreadsheet_id, cfg.orders_sheet_name, values.slice(i, i + 200));
    }
    return { ok: true, count: rows.length };
  });

export const backfillExchangesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const cfg = await loadConfig();
    if (!cfg?.exchanges_spreadsheet_id) throw new Error("Configurez d'abord le Google Sheet des échanges.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("exchange_requests")
      .select("*, orders(order_number)")
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw error;
    await ensureHeaders(cfg.exchanges_spreadsheet_id, cfg.exchanges_sheet_name, EXCHANGE_HEADERS);
    if (!rows?.length) return { ok: true, count: 0 };
    const values = rows.map(exchangeRow);
    for (let i = 0; i < values.length; i += 200) {
      await appendRows(cfg.exchanges_spreadsheet_id, cfg.exchanges_sheet_name, values.slice(i, i + 200));
    }
    return { ok: true, count: rows.length };
  });

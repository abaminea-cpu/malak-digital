import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

/** Normalise phone: strip spaces, dashes, parentheses. Keep leading +. */
function normalizePhone(p: string): string {
  return p.replace(/[\s().-]/g, "").trim();
}

/** Public exchange config (deadline hours, enabled) — safe to expose. */
export const getExchangeConfigFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "exchange").maybeSingle();
  const v = (data?.value ?? {}) as any;
  return {
    deadline_hours: Number(v.deadline_hours ?? 48),
    enabled: v.enabled !== false,
  };
});

/** Search public orders by phone. Returns minimal safe fields. */
export const searchOrdersByPhoneFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ phone: z.string().min(6).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total, created_at, delivered_at, customer_first_name, customer_last_name, order_items(product_name, quantity, product_image)")
      .or(`customer_phone.eq.${phone},customer_phone_alt.eq.${phone}`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return orders ?? [];
  });

/** Create an exchange request. Enforces the deadline window on the server. */
export const createExchangeRequestFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      order_id: z.string().uuid(),
      phone: z.string().min(6).max(30),
      reason: z.string().max(1000).optional(),
      photos: z.array(z.string().min(1)).min(1).max(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load exchange config
    const { data: cfg } = await supabaseAdmin.from("site_settings").select("value").eq("key", "exchange").maybeSingle();
    const cfgV = (cfg?.value ?? {}) as any;
    if (cfgV.enabled === false) throw new Error("La demande d'échange est temporairement désactivée.");
    const deadlineHours = Number(cfgV.deadline_hours ?? 48);

    // Load & verify order ownership by phone
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, customer_phone, customer_phone_alt, customer_first_name, customer_last_name, delivered_at, created_at")
      .eq("id", data.order_id)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!order) throw new Error("Commande introuvable.");
    if (normalizePhone(order.customer_phone) !== phone && normalizePhone(order.customer_phone_alt ?? "") !== phone) {
      throw new Error("Ce numéro ne correspond pas à cette commande.");
    }

    // Deadline: computed from delivered_at if present, otherwise from created_at (per spec: date de commande)
    const start = new Date(order.delivered_at ?? order.created_at).getTime();
    const elapsedH = (Date.now() - start) / 36e5;
    if (elapsedH > deadlineHours) {
      throw new Error(`Le délai autorisé pour demander un échange est dépassé (${deadlineHours}h). Contactez notre service client.`);
    }

    const customerName = `${order.customer_first_name} ${order.customer_last_name}`.trim();

    const { data: inserted, error } = await supabaseAdmin
      .from("exchange_requests")
      .insert({
        order_id: data.order_id,
        customer_phone: phone,
        customer_name: customerName,
        reason: data.reason ?? null,
        photos: data.photos,
      })
      .select("id, request_number")
      .single();
    if (error) throw error;
    return inserted;
  });

/** Admin: list all exchange requests with joined order + items + signed photo URLs. */
export const adminListExchangesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("exchange_requests")
      .select("*, orders!inner(order_number, customer_first_name, customer_last_name, customer_phone, delivered_at, created_at, order_items(product_name, quantity, product_image))")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;

    // Generate signed URLs (1 week) for photos stored as storage paths.
    const results: any[] = [];
    for (const row of data ?? []) {
      const photos: string[] = row.photos ?? [];
      const signed: string[] = [];
      for (const p of photos) {
        if (/^https?:\/\//.test(p)) { signed.push(p); continue; }
        const { data: s } = await supabaseAdmin.storage.from("exchange-photos").createSignedUrl(p, 60 * 60 * 24 * 7);
        if (s?.signedUrl) signed.push(s.signedUrl);
      }
      results.push({ ...row, photos_signed: signed });
    }
    return results;
  });

const UpdateExchange = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "validated", "rejected", "processed"]).optional(),
  admin_note: z.string().max(2000).nullable().optional(),
});

export const adminUpdateExchangeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateExchange.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;
    const { error } = await supabaseAdmin.from("exchange_requests").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const UpsertExchangeConfig = z.object({
  deadline_hours: z.number().int().min(1).max(24 * 60),
  enabled: z.boolean(),
});

export const adminUpsertExchangeConfigFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertExchangeConfig.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "exchange", value: data }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

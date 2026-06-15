import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

// ============= Shipments =============
export const adminListShipmentsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("shipments")
      .select("*, orders(order_number, customer_first_name, customer_last_name, total, wilayas(name_fr))")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

const UpsertShipment = z.object({
  id: z.string().uuid().optional(),
  order_id: z.string().uuid(),
  provider_code: z.string().min(1),
  tracking_number: z.string().max(80).optional().or(z.literal("")),
  status: z.string().min(1),
  shipping_cost: z.number().min(0).nullable().optional(),
  label_url: z.string().url().nullable().optional().or(z.literal("")),
});

export const adminUpsertShipmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertShipment.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      order_id: data.order_id,
      provider_code: data.provider_code,
      tracking_number: data.tracking_number || null,
      status: data.status,
      shipping_cost: data.shipping_cost ?? null,
      label_url: data.label_url || null,
      last_event_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("shipments").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("shipments").insert(payload).select("id").single();
    if (error) throw error;
    await supabaseAdmin.from("orders").update({ shipment_id: row.id, status: "shipped", shipped_at: new Date().toISOString() }).eq("id", data.order_id);
    return { ok: true, id: row.id };
  });

export const adminDeleteShipmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("shipments").delete().eq("id", data.id);
    return { ok: true };
  });

// ============= Stock movements =============
export const adminListStockMovementsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("stock_movements")
      .select("*, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

const StockMove = z.object({
  product_id: z.string().uuid(),
  type: z.enum(["in", "out", "adjust", "return"]),
  quantity: z.number().int(),
  reason: z.string().max(200).optional().or(z.literal("")),
});

export const adminAddStockMovementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StockMove.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", data.product_id).single();
    const current = Number(p?.stock ?? 0);
    let next = current;
    if (data.type === "in" || data.type === "return") next = current + Math.abs(data.quantity);
    else if (data.type === "out") next = Math.max(0, current - Math.abs(data.quantity));
    else next = Math.max(0, data.quantity); // adjust = absolute
    await supabaseAdmin.from("products").update({ stock: next }).eq("id", data.product_id);
    await supabaseAdmin.from("stock_movements").insert({
      product_id: data.product_id,
      type: data.type,
      quantity: data.type === "adjust" ? next - current : Math.abs(data.quantity) * (data.type === "out" ? -1 : 1),
      reason: data.reason || null,
      created_by: context.userId,
    });
    return { ok: true, new_stock: next };
  });

export const adminLowStockFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, stock, low_stock_threshold, images")
      .filter("stock", "lte", "low_stock_threshold" as any)
      .order("stock", { ascending: true })
      .limit(50);
    // Supabase filter doesn't support column-to-column; do it client side
    const all = data ?? [];
    return all.filter((p: any) => Number(p.stock) <= Number(p.low_stock_threshold ?? 5));
  });

// ============= CSV export =============
export const adminExportOrdersCsvFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("orders")
      .select("order_number, status, payment_method, payment_status, customer_first_name, customer_last_name, customer_phone, commune, wilayas(name_fr), subtotal, shipping_cost, total, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    const rows = data ?? [];
    const headers = ["N°", "Statut", "Paiement", "Statut paiement", "Prénom", "Nom", "Téléphone", "Commune", "Wilaya", "Sous-total", "Livraison", "Total", "Date"];
    const lines = [headers.join(";")];
    for (const r of rows as any[]) {
      lines.push([
        r.order_number, r.status, r.payment_method, r.payment_status,
        r.customer_first_name, r.customer_last_name, r.customer_phone,
        r.commune, r.wilayas?.name_fr ?? "",
        r.subtotal, r.shipping_cost, r.total,
        new Date(r.created_at).toLocaleString("fr-FR"),
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"));
    }
    return { csv: lines.join("\n"), count: rows.length };
  });

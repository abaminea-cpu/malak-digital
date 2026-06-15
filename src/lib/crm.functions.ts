import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

const STATUS_TIMESTAMPS: Record<string, string | null> = {
  confirmed: "confirmed_at",
  shipped: "shipped_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

const UpdateOrderCRM = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"]).optional(),
  internal_notes: z.string().max(2000).nullable().optional(),
  tracking_number: z.string().max(80).nullable().optional(),
  increment_call: z.boolean().optional(),
});

export const adminUpdateOrderCRMFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateOrderCRM.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) {
      patch.status = data.status;
      const ts = STATUS_TIMESTAMPS[data.status];
      if (ts) patch[ts] = new Date().toISOString();
    }
    if (data.internal_notes !== undefined) patch.internal_notes = data.internal_notes;
    if (data.tracking_number !== undefined) patch.tracking_number = data.tracking_number;
    if (data.increment_call) {
      const { data: cur } = await supabaseAdmin.from("orders").select("call_attempts").eq("id", data.id).single();
      patch.call_attempts = (cur?.call_attempts ?? 0) + 1;
      patch.last_contact_at = new Date().toISOString();
    }
    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListAbandonedFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*, wilayas(name_fr)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  });

const UpdateAbandoned = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "recovered", "lost"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
  increment_attempt: z.boolean().optional(),
});

export const adminUpdateAbandonedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateAbandoned.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.increment_attempt) {
      const { data: cur } = await supabaseAdmin.from("abandoned_checkouts").select("recovery_attempts").eq("id", data.id).single();
      patch.recovery_attempts = (cur?.recovery_attempts ?? 0) + 1;
      patch.last_contact_at = new Date().toISOString();
    }
    const { error } = await supabaseAdmin.from("abandoned_checkouts").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminCustomer360Fn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ phone: z.string().min(6).max(30) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*, wilayas(name_fr), order_items(*)")
      .eq("customer_phone", data.phone)
      .order("created_at", { ascending: false });
    const totalSpent = (orders ?? []).filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
    return { orders: orders ?? [], totalSpent, orderCount: orders?.length ?? 0 };
  });

const UpsertPixels = z.object({
  meta_pixel_id: z.string().max(40).optional().or(z.literal("")),
  tiktok_pixel_id: z.string().max(40).optional().or(z.literal("")),
  ga4_measurement_id: z.string().max(40).optional().or(z.literal("")),
  gtm_id: z.string().max(40).optional().or(z.literal("")),
  snap_pixel_id: z.string().max(40).optional().or(z.literal("")),
});

export const adminUpsertPixelsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertPixels.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "pixels", value: data }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

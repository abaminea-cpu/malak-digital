import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public: validate a coupon code against an order subtotal.
export const validateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; subtotal: number }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("code", data.code.trim())
      .eq("is_active", true)
      .maybeSingle();
    if (!c) return { ok: false as const, reason: "Code invalide" };
    const now = new Date();
    if (c.starts_at && new Date(c.starts_at) > now) return { ok: false as const, reason: "Code non encore actif" };
    if (c.expires_at && new Date(c.expires_at) < now) return { ok: false as const, reason: "Code expiré" };
    if (c.max_uses && c.used_count >= c.max_uses) return { ok: false as const, reason: "Code épuisé" };
    if (data.subtotal < Number(c.min_order_amount ?? 0))
      return { ok: false as const, reason: `Minimum ${c.min_order_amount} DA requis` };
    const discount = c.type === "percentage"
      ? Math.round((data.subtotal * Number(c.value)) / 100)
      : Math.min(Number(c.value), data.subtotal);
    return { ok: true as const, coupon_id: c.id, code: c.code, discount, type: c.type, value: Number(c.value) };
  });

// Admin: list / upsert / delete coupons
export const adminListCouponsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminUpsertCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, code: String(data.code).toUpperCase().trim() };
    const { data: row, error } = await supabaseAdmin.from("coupons").upsert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const adminDeleteCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    return { ok: true };
  });

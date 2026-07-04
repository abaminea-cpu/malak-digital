import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminListOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, wilayas(name_fr), order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  });

const UpdateOrderStatus = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"]),
});

export const adminUpdateOrderStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateOrderStatus.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const UpsertProduct = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, digits, hyphens"),
  description: z.string().max(5000).optional().or(z.literal("")),
  short_description: z.string().max(500).optional().or(z.literal("")),
  price: z.number().min(0),
  compare_at_price: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  category_id: z.string().uuid().nullable().optional(),
  images: z.array(z.string().url()).max(10),
  video_url: z.string().url().nullable().optional().or(z.literal("")),
  options: z.record(z.string(), z.array(z.string())).optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  landing_mode: z.boolean().optional(),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
});

export const adminUpsertProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertProduct.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      short_description: data.short_description || null,
      price: data.price,
      compare_at_price: data.compare_at_price ?? null,
      stock: data.stock,
      category_id: data.category_id ?? null,
      images: data.images,
      video_url: data.video_url || null,
      options: data.options ?? {},
      is_active: data.is_active,
      is_featured: data.is_featured,
      landing_mode: data.landing_mode ?? false,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("products").insert(payload).select("id").single();
      if (error) throw error;
      return { ok: true, id: row.id };
    }
  });


const DeleteProduct = z.object({ id: z.string().uuid() });
export const adminDeleteProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteProduct.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const UpdateWilaya = z.object({
  id: z.number().int().min(1).max(69),
  home_price: z.number().min(0),
  office_price: z.number().min(0),
  home_enabled: z.boolean(),
  office_enabled: z.boolean(),
});

export const adminUpdateWilayaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateWilaya.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("wilayas")
      .update({
        home_price: data.home_price,
        office_price: data.office_price,
        home_enabled: data.home_enabled,
        office_enabled: data.office_enabled,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminStatsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, created_at, customer_first_name, customer_last_name, wilaya_id, wilayas(name_fr)")
      .order("created_at", { ascending: false });
    const all = orders ?? [];
    const nonCancelled = all.filter((o) => o.status !== "cancelled");
    const totalRevenue = nonCancelled.reduce((s, o) => s + Number(o.total), 0);

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const start7 = startToday - 6 * 86400000;
    const start30 = startToday - 29 * 86400000;
    const ts = (o: any) => new Date(o.created_at).getTime();

    const todayOrders = all.filter((o) => ts(o) >= startToday);
    const revenueToday = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const revenue7 = all.filter((o) => ts(o) >= start7 && o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const revenue30 = all.filter((o) => ts(o) >= start30 && o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);

    const totalOrders = all.length;
    const newOrders = all.filter((o) => o.status === "new").length;
    const preparingOrders = all.filter((o) => o.status === "preparing" || o.status === "confirmed").length;
    const deliveredOrders = all.filter((o) => o.status === "delivered").length;
    const cancelledOrders = all.filter((o) => o.status === "cancelled").length;
    const avgBasket = nonCancelled.length ? Math.round(totalRevenue / nonCancelled.length) : 0;

    const [{ count: productCount }, { count: userCount }, { count: exchangesPending }, { data: lowStock }] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("exchange_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("products").select("id, name, stock").lte("stock", 5).order("stock", { ascending: true }).limit(5),
    ]);

    // 7-day chart
    const chart: { day: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startToday - i * 86400000);
      const next = d.getTime() + 86400000;
      const rows = all.filter((o) => ts(o) >= d.getTime() && ts(o) < next && o.status !== "cancelled");
      chart.push({
        day: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        revenue: rows.reduce((s, o) => s + Number(o.total), 0),
        count: rows.length,
      });
    }

    return {
      totalRevenue, revenueToday, revenue7, revenue30,
      totalOrders, newOrders, preparingOrders, deliveredOrders, cancelledOrders, avgBasket,
      productCount: productCount ?? 0,
      userCount: userCount ?? 0,
      exchangesPending: exchangesPending ?? 0,
      lowStock: lowStock ?? [],
      recentOrders: all.slice(0, 8),
      chart,
    };
  });

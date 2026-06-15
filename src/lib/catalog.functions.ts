import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

// ---- Categories ----
const UpsertCategory = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(400).optional().or(z.literal("")),
  image_url: z.string().url().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).default(0),
});

export const adminUpsertCategoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertCategory.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      parent_id: data.parent_id ?? null,
      is_active: data.is_active,
      sort_order: data.sort_order ?? 0,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("categories").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteCategoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---- Variants ----
const VariantInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  sku: z.string().max(80).optional().or(z.literal("")),
  price_delta: z.number().default(0),
  stock: z.number().int().min(0).default(0),
  option1_name: z.string().max(40).optional().or(z.literal("")),
  option1_value: z.string().max(60).optional().or(z.literal("")),
  option2_name: z.string().max(40).optional().or(z.literal("")),
  option2_value: z.string().max(60).optional().or(z.literal("")),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
});

const ReplaceVariants = z.object({
  product_id: z.string().uuid(),
  variants: z.array(VariantInput).max(60),
});

export const adminReplaceVariantsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReplaceVariants.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Wipe & re-insert (simple & safe for small variant counts)
    const del = await supabaseAdmin.from("product_variants").delete().eq("product_id", data.product_id);
    if (del.error) throw del.error;
    if (data.variants.length === 0) return { ok: true, count: 0 };
    const rows = data.variants.map((v, i) => ({
      product_id: data.product_id,
      name: v.name,
      sku: v.sku || null,
      price_delta: v.price_delta,
      stock: v.stock,
      option1_name: v.option1_name || null,
      option1_value: v.option1_value || null,
      option2_name: v.option2_name || null,
      option2_value: v.option2_value || null,
      image_url: v.image_url || null,
      is_active: v.is_active,
      sort_order: i,
    }));
    const { error } = await supabaseAdmin.from("product_variants").insert(rows);
    if (error) throw error;
    return { ok: true, count: rows.length };
  });

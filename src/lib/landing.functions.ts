import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

const SectionSchema = z.object({
  type: z.enum(["benefits", "testimonials", "faq", "gallery", "video", "comparison", "guarantee"]),
  title: z.string().max(200).optional(),
  items: z.array(z.any()).optional(),
  content: z.string().max(5000).optional(),
});

const UpsertLanding = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  hero_title: z.string().max(200).optional().or(z.literal("")),
  hero_subtitle: z.string().max(400).optional().or(z.literal("")),
  hero_image: z.string().url().nullable().optional().or(z.literal("")),
  cta_text: z.string().max(80).optional().or(z.literal("")),
  sections: z.array(SectionSchema).max(20),
  show_countdown: z.boolean(),
  countdown_end: z.string().nullable().optional(),
  theme: z.enum(["gold-dark", "minimal-light", "urgent-red"]),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
  is_published: z.boolean(),
});

export const adminUpsertLandingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertLanding.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      product_id: data.product_id,
      slug: data.slug,
      title: data.title,
      hero_title: data.hero_title || null,
      hero_subtitle: data.hero_subtitle || null,
      hero_image: data.hero_image || null,
      cta_text: data.cta_text || "Commander maintenant",
      sections: data.sections,
      show_countdown: data.show_countdown,
      countdown_end: data.countdown_end || null,
      theme: data.theme,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      is_published: data.is_published,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("landing_pages").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("landing_pages").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteLandingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("landing_pages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

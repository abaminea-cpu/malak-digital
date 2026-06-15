import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public: list approved reviews for a product
export const listProductReviewsFn = createServerFn({ method: "GET" })
  .inputValidator((d: { product_id: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("product_reviews")
      .select("id, author_name, rating, title, comment, image_url, created_at")
      .eq("product_id", data.product_id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    const reviews = rows ?? [];
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    return { reviews, average: avg, count: reviews.length };
  });

// Authenticated: create a review (goes to pending moderation)
export const createReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    product_id: string;
    rating: number;
    title?: string;
    comment?: string;
    author_name: string;
    image_url?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("product_reviews").insert({
      product_id: data.product_id,
      user_id: context.userId,
      author_name: data.author_name,
      rating: Math.max(1, Math.min(5, data.rating)),
      title: data.title,
      comment: data.comment,
      image_url: data.image_url,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true };
  });

// Admin: moderate reviews
export const adminListAllReviewsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("product_reviews")
      .select("*, products(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const adminSetReviewStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "pending" }) => d)
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("product_reviews").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

// ============= Wishlist (auth user only) =============
export const listWishlistFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wishlists")
      .select("product_id, products(id, slug, name, price, image_url)")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const toggleWishlistFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("wishlists")
      .select("id")
      .eq("product_id", data.product_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("wishlists").delete().eq("id", existing.id);
      return { ok: true, in_wishlist: false };
    }
    await context.supabase.from("wishlists").insert({ user_id: context.userId, product_id: data.product_id });
    return { ok: true, in_wishlist: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Strict input validation
const OrderItemInput = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

const CreateOrderInput = z.object({
  items: z.array(OrderItemInput).min(1).max(20),
  customer_first_name: z.string().trim().min(1).max(80),
  customer_last_name: z.string().trim().min(1).max(80),
  customer_phone: z.string().trim().min(7).max(20),
  customer_phone_alt: z.string().trim().max(20).optional().or(z.literal("")),
  customer_email: z.string().trim().email().max(160).optional().or(z.literal("")),
  wilaya_id: z.number().int().min(1).max(69),
  commune: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  shipping_method: z.enum(["home", "office"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateOrderInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch wilaya
    const { data: wilaya, error: wErr } = await supabaseAdmin
      .from("wilayas")
      .select("id, name_fr, home_price, office_price, home_enabled, office_enabled")
      .eq("id", data.wilaya_id)
      .single();
    if (wErr || !wilaya) throw new Error("Wilaya invalide");

    if (data.shipping_method === "home" && !wilaya.home_enabled) {
      throw new Error("Livraison à domicile non disponible pour cette wilaya");
    }
    if (data.shipping_method === "office" && !wilaya.office_enabled) {
      throw new Error("Livraison au bureau non disponible pour cette wilaya");
    }

    const shippingCost = Number(
      data.shipping_method === "home" ? wilaya.home_price : wilaya.office_price,
    );

    // Fetch products (server-side prices — never trust client)
    const productIds = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, images, is_active, stock")
      .in("id", productIds);
    if (pErr || !products || products.length !== productIds.length) {
      throw new Error("Produit introuvable");
    }

    let subtotal = 0;
    const itemsToInsert = data.items.map((it) => {
      const p = products.find((pr) => pr.id === it.product_id)!;
      if (!p.is_active) throw new Error(`Produit indisponible: ${p.name}`);
      const lineTotal = Number(p.price) * it.quantity;
      subtotal += lineTotal;
      return {
        product_id: p.id,
        product_name: p.name,
        product_image: p.images?.[0] ?? null,
        unit_price: Number(p.price),
        quantity: it.quantity,
        line_total: lineTotal,
      };
    });

    const total = subtotal + shippingCost;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_first_name: data.customer_first_name,
        customer_last_name: data.customer_last_name,
        customer_phone: data.customer_phone,
        customer_phone_alt: data.customer_phone_alt || null,
        customer_email: data.customer_email || null,
        wilaya_id: data.wilaya_id,
        commune: data.commune,
        address: data.address || null,
        shipping_method: data.shipping_method,
        shipping_cost: shippingCost,
        subtotal,
        total,
        payment_method: "cod",
        status: "new",
        notes: data.notes || null,
      })
      .select("id, order_number, total")
      .single();

    if (oErr || !order) throw new Error("Erreur lors de la création de la commande");

    const itemsWithOrderId = itemsToInsert.map((i) => ({ ...i, order_id: order.id }));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemsWithOrderId);
    if (iErr) throw new Error("Erreur lors de l'enregistrement des produits");

    return {
      ok: true as const,
      order_number: order.order_number,
      total: Number(order.total),
    };
  });

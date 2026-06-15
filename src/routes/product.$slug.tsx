import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import { createOrderFn } from "@/lib/orders.functions";
import { toast } from "sonner";
import { Loader2, Minus, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Malak Digital` },
      { property: "og:url", content: `/product/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/product/${params.slug}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const createOrder = useServerFn(createOrderFn);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product!.id)
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: wilayas = [] } = useQuery({
    queryKey: ["wilayas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("wilayas")
        .select("id, name_fr, name_ar, home_price, office_price, home_enabled, office_enabled")
        .order("id");
      return data ?? [];
    },
  });

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [wilayaId, setWilayaId] = useState<string>("");
  const [shipping, setShipping] = useState<"home" | "office">("home");
  const [submitting, setSubmitting] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);

  const variant = useMemo(() => (variants as any[]).find((v) => v.id === variantId) ?? null, [variants, variantId]);
  const wilaya = useMemo(() => (wilayas as any[]).find((w) => String(w.id) === wilayaId), [wilayas, wilayaId]);

  // Auto-select first variant
  useEffect(() => {
    if (variants.length > 0 && !variantId) setVariantId((variants as any[])[0].id);
  }, [variants, variantId]);

  // Switch image when variant has one
  useEffect(() => {
    if (variant?.image_url && product?.images) {
      const i = (product.images as string[]).indexOf(variant.image_url);
      if (i >= 0) setImgIdx(i);
    }
  }, [variant, product]);

  // Auto-fallback if chosen shipping method is disabled
  useEffect(() => {
    if (!wilaya) return;
    if (shipping === "home" && !wilaya.home_enabled && wilaya.office_enabled) setShipping("office");
    if (shipping === "office" && !wilaya.office_enabled && wilaya.home_enabled) setShipping("home");
  }, [wilaya, shipping]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></main>
        <Footer />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 grid place-items-center text-muted-foreground">Produit introuvable</main>
        <Footer />
      </div>
    );
  }

  const shippingCost = !wilaya ? 0 : Number(shipping === "home" ? wilaya.home_price : wilaya.office_price);
  const subtotal = Number(product.price) * qty;
  const total = subtotal + shippingCost;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    const form = new FormData(e.currentTarget);

    if (!wilayaId) { toast.error("Veuillez sélectionner une wilaya"); return; }

    setSubmitting(true);
    try {
      const result = await createOrder({
        data: {
          items: [{ product_id: product.id, quantity: qty }],
          customer_first_name: String(form.get("first_name") || ""),
          customer_last_name: String(form.get("last_name") || ""),
          customer_phone: String(form.get("phone") || ""),
          customer_phone_alt: String(form.get("phone_alt") || ""),
          customer_email: String(form.get("email") || ""),
          wilaya_id: Number(wilayaId),
          commune: String(form.get("commune") || ""),
          address: String(form.get("address") || ""),
          shipping_method: shipping,
          notes: String(form.get("notes") || ""),
        },
      });
      toast.success(t("checkout.success"), { description: `${t("checkout.success_desc")} (${result.order_number})` });
      navigate({ to: "/order-confirmed", search: { n: result.order_number, total: result.total } });
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-surface">
              {product.images?.[imgIdx] ? (
                <img src={product.images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">Aucune image</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((src: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`h-20 w-20 flex-none overflow-hidden rounded-lg border ${i === imgIdx ? "border-gold" : "border-border/60"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + COD form */}
          <div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <div className="text-3xl font-semibold text-gold">{formatPrice(Number(product.price), locale)}</div>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                <div className="text-lg text-muted-foreground line-through">{formatPrice(Number(product.compare_at_price), locale)}</div>
              )}
            </div>
            {product.short_description && (
              <p className="mt-4 text-muted-foreground">{product.short_description}</p>
            )}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs text-success">
              <Check className="h-3 w-3" /> {product.stock > 0 ? t("product.in_stock") : t("product.out_of_stock")}
            </div>

            {/* COD form */}
            <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-gold/20 bg-card p-6 shadow-card">
              <h2 className="font-display text-xl text-gradient-gold">{t("checkout.title")}</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t("checkout.firstname")} name="first_name" required />
                <Field label={t("checkout.lastname")} name="last_name" required />
                <Field label={t("checkout.phone")} name="phone" required type="tel" />
                <Field label={t("checkout.phone_alt")} name="phone_alt" type="tel" />
              </div>
              <Field label={t("checkout.email")} name="email" type="email" />

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("checkout.wilaya")} *</Label>
                  <Select value={wilayaId} onValueChange={setWilayaId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(wilayas as any[]).map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.id.toString().padStart(2, "0")} — {w.name_fr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Field label={t("checkout.commune")} name="commune" required />
              </div>
              <Field label={t("checkout.address")} name="address" />

              {wilaya && (
                <div>
                  <Label className="mb-2 block">{t("checkout.shipping_method")} *</Label>
                  <RadioGroup value={shipping} onValueChange={(v) => setShipping(v as any)} className="grid gap-2 md:grid-cols-2">
                    <ShippingOpt disabled={!wilaya.home_enabled} value="home" label={t("checkout.home")} price={Number(wilaya.home_price)} locale={locale} />
                    <ShippingOpt disabled={!wilaya.office_enabled} value="office" label={t("checkout.office")} price={Number(wilaya.office_price)} locale={locale} />
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label>{t("checkout.quantity")}</Label>
                <div className="mt-1.5 inline-flex items-center rounded-md border border-border">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:text-gold"><Minus className="h-4 w-4" /></button>
                  <span className="w-12 text-center text-sm">{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} className="p-2 hover:text-gold"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <div>
                <Label>{t("checkout.notes")}</Label>
                <Textarea name="notes" className="mt-1.5" maxLength={500} />
              </div>

              {/* Totals */}
              <div className="space-y-1 rounded-lg bg-surface p-4 text-sm">
                <Row label={t("checkout.subtotal")} value={formatPrice(subtotal, locale)} />
                <Row label={t("checkout.shipping_cost")} value={wilaya ? formatPrice(shippingCost, locale) : "—"} />
                <div className="my-2 h-px bg-border" />
                <Row label={t("checkout.total")} value={formatPrice(total, locale)} bold />
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t("checkout.submit")}
              </Button>
            </form>

            {product.description && (
              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold">{t("product.description")}</h3>
                <div className="mt-3 whitespace-pre-wrap text-muted-foreground">{product.description}</div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, name, required, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <Input name={name} type={type} required={required} className="mt-1.5" maxLength={200} />
    </div>
  );
}

function ShippingOpt({ value, label, price, disabled, locale }: { value: string; label: string; price: number; disabled: boolean; locale: any }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${disabled ? "opacity-40 cursor-not-allowed" : "border-border hover:border-gold/40"}`}>
      <span className="flex items-center gap-2">
        <RadioGroupItem value={value} disabled={disabled} />
        <span className="text-sm">{label}</span>
      </span>
      <span className="text-sm font-semibold text-gold">{formatPrice(price, locale)}</span>
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-lg font-semibold text-gold" : ""}>{value}</span>
    </div>
  );
}

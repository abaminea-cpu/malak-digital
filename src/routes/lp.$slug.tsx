import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDA } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOrderFn } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";
import { trackEvent } from "@/lib/pixels";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Truck, Phone, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/$slug")({
  loader: async ({ params }) => {
    const { data: lp } = await supabase
      .from("landing_pages")
      .select("*, products(*)")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!lp) throw notFound();
    return { lp };
  },
  head: ({ loaderData }) => {
    const lp: any = loaderData?.lp;
    if (!lp) return { meta: [{ title: "Landing — Malak Digital" }] };
    return {
      meta: [
        { title: lp.meta_title || lp.title },
        { name: "description", content: lp.meta_description || lp.hero_subtitle || "" },
        { property: "og:title", content: lp.meta_title || lp.title },
        { property: "og:description", content: lp.meta_description || lp.hero_subtitle || "" },
        { property: "og:image", content: lp.hero_image || lp.products?.images?.[0] || "" },
        { property: "og:url", content: `/lp/${lp.slug}` },
      ],
      links: [{ rel: "canonical", href: `/lp/${lp.slug}` }],
    };
  },
  component: LandingPage,
});

function Countdown({ endIso }: { endIso: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const end = new Date(endIso).getTime();
  const diff = Math.max(0, end - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (diff === 0) return null;
  return (
    <div className="flex items-center justify-center gap-3 text-foreground">
      {[["J", d], ["H", h], ["M", m], ["S", s]].map(([l, v]) => (
        <div key={l as string} className="min-w-16 rounded-lg border border-gold/30 bg-surface/80 px-3 py-2 text-center">
          <div className="font-display text-2xl text-gold">{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}

function LandingPage() {
  const { lp } = Route.useLoaderData() as any;
  const product = lp.products;
  const navigate = useNavigate();
  const createOrder = useServerFn(createOrderFn);
  const { data: wilayas = [] } = useQuery({
    queryKey: ["wilayas"],
    queryFn: async () => (await supabase.from("wilayas").select("*").order("id")).data ?? [],
  });
  const [wilayaId, setWilayaId] = useState<string>("");
  const [shipMethod, setShipMethod] = useState<"home" | "office">("home");
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackEvent({ name: "ViewContent", value: Number(product.price), content_ids: [product.id], content_name: product.name });
  }, [product.id, product.name, product.price]);

  const wilaya: any = wilayas.find((w: any) => String(w.id) === wilayaId);
  const shipping = wilaya ? Number(shipMethod === "home" ? wilaya.home_price : wilaya.office_price) : 0;
  const subtotal = Number(product.price) * qty;
  const total = subtotal + shipping;

  async function onOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wilaya) { toast.error("Choisissez une wilaya"); return; }
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      trackEvent({ name: "InitiateCheckout", value: total });
      const res = await createOrder({ data: {
        customer_first_name: String(f.get("first_name") || ""),
        customer_last_name: String(f.get("last_name") || ""),
        customer_phone: String(f.get("phone") || ""),
        customer_phone_alt: String(f.get("phone_alt") || "") || null,
        customer_email: String(f.get("email") || "") || null,
        wilaya_id: Number(wilayaId),
        commune: String(f.get("commune") || ""),
        address: String(f.get("address") || "") || null,
        shipping_method: shipMethod,
        notes: String(f.get("notes") || "") || null,
        items: [{ product_id: product.id, quantity: qty }],
      } });
      trackEvent({ name: "Purchase", value: total, order_id: res.order_number });
      navigate({ to: "/order-confirmed", search: { n: res.order_number } });
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally { setSubmitting(false); }
  }

  const heroBg = lp.hero_image || product.images?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/40">
        {heroBg && <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-3 inline-block w-fit rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs uppercase tracking-widest text-gold">Offre exclusive</span>
            <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">{lp.hero_title || product.name}</h1>
            {lp.hero_subtitle && <p className="mt-4 text-lg text-muted-foreground">{lp.hero_subtitle}</p>}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl text-gradient-gold">{formatDA(Number(product.price))}</span>
              {product.compare_at_price && <span className="text-lg text-muted-foreground line-through">{formatDA(Number(product.compare_at_price))}</span>}
            </div>
            {lp.show_countdown && lp.countdown_end && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-gold" /> Offre se termine dans</div>
                <Countdown endIso={lp.countdown_end} />
              </div>
            )}
            <a href="#order" className="mt-8 inline-flex w-fit items-center justify-center rounded-md bg-gradient-gold px-8 py-4 text-base font-medium text-primary-foreground hover:opacity-90">
              {lp.cta_text || "Commander maintenant"} →
            </a>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-gold" /> Paiement à la livraison</span>
              <span className="flex items-center gap-1"><Truck className="h-4 w-4 text-gold" /> Livraison 69 wilayas</span>
              <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-gold" /> Support 7j/7</span>
            </div>
          </div>
          {heroBg && (
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-surface">
              <img src={heroBg} alt={product.name} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      {/* SECTIONS */}
      {Array.isArray(lp.sections) && lp.sections.map((s: any, i: number) => (
        <section key={i} className="border-b border-border/40">
          <div className="container mx-auto px-4 py-16 md:px-6">
            {s.title && <h2 className="mb-8 text-center font-display text-3xl">{s.title}</h2>}
            {s.type === "benefits" && (
              <div className="grid gap-6 md:grid-cols-3">
                {(s.items || []).map((it: any, j: number) => (
                  <div key={j} className="rounded-xl border border-border/60 bg-card p-6">
                    <CheckCircle2 className="mb-3 h-6 w-6 text-gold" />
                    <h3 className="font-display text-lg">{it.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{it.description}</p>
                  </div>
                ))}
              </div>
            )}
            {s.type === "testimonials" && (
              <div className="grid gap-6 md:grid-cols-3">
                {(s.items || []).map((it: any, j: number) => (
                  <div key={j} className="rounded-xl border border-border/60 bg-card p-6">
                    <div className="text-gold">{"★".repeat(it.rating || 5)}</div>
                    <p className="mt-3 text-sm italic">"{it.text}"</p>
                    <div className="mt-4 text-xs text-muted-foreground">— {it.name}{it.city ? `, ${it.city}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
            {s.type === "faq" && (
              <div className="mx-auto max-w-3xl space-y-3">
                {(s.items || []).map((it: any, j: number) => (
                  <details key={j} className="rounded-lg border border-border/60 bg-card p-4">
                    <summary className="cursor-pointer font-medium">{it.q}</summary>
                    <p className="mt-2 text-sm text-muted-foreground">{it.a}</p>
                  </details>
                ))}
              </div>
            )}
            {s.type === "gallery" && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(s.items || []).map((url: string, j: number) => (
                  <img key={j} src={url} alt="" className="aspect-square rounded-lg object-cover" />
                ))}
              </div>
            )}
            {s.type === "video" && s.content && (
              <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-xl border border-border/60">
                <iframe src={s.content} className="h-full w-full" allowFullScreen />
              </div>
            )}
            {s.type === "guarantee" && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-gold" />
                <p className="mt-4 text-lg">{s.content}</p>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ORDER FORM */}
      <section id="order" className="border-b border-border/40 bg-surface/40">
        <div className="container mx-auto px-4 py-16 md:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl">Commander maintenant</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Paiement à la livraison — Aucun versement à l'avance</p>
            <form onSubmit={onOrder} className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Prénom *</Label><Input name="first_name" required maxLength={50} /></div>
                <div><Label>Nom *</Label><Input name="last_name" required maxLength={50} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Téléphone *</Label><Input name="phone" required maxLength={20} placeholder="06 / 05 / 07" /></div>
                <div><Label>Téléphone secondaire</Label><Input name="phone_alt" maxLength={20} /></div>
              </div>
              <div><Label>Email (facultatif)</Label><Input name="email" type="email" maxLength={120} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Wilaya *</Label>
                  <Select value={wilayaId} onValueChange={setWilayaId}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {(wilayas as any[]).filter((w) => w.home_enabled || w.office_enabled).map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>{String(w.id).padStart(2, "0")} — {w.name_fr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Commune *</Label><Input name="commune" required maxLength={100} /></div>
              </div>
              <div><Label>Adresse</Label><Input name="address" maxLength={200} /></div>
              <div>
                <Label>Mode de livraison</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setShipMethod("home")} className={`rounded-lg border p-3 text-sm ${shipMethod === "home" ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground"}`} disabled={!wilaya?.home_enabled}>
                    Domicile {wilaya?.home_enabled && `(${formatDA(Number(wilaya.home_price))})`}
                  </button>
                  <button type="button" onClick={() => setShipMethod("office")} className={`rounded-lg border p-3 text-sm ${shipMethod === "office" ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground"}`} disabled={!wilaya?.office_enabled}>
                    Bureau {wilaya?.office_enabled && `(${formatDA(Number(wilaya.office_price))})`}
                  </button>
                </div>
              </div>
              <div>
                <Label>Quantité</Label>
                <Input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-24" />
              </div>
              <div><Label>Notes (facultatif)</Label><Textarea name="notes" rows={2} maxLength={500} /></div>

              <div className="space-y-1 rounded-lg border border-border/60 bg-surface p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatDA(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatDA(shipping)}</span></div>
                <div className="mt-2 flex justify-between border-t border-border/40 pt-2 text-base"><span>Total</span><span className="text-gold">{formatDA(total)}</span></div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-gradient-gold py-6 text-base text-primary-foreground hover:opacity-90">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : `${lp.cta_text || "Confirmer la commande"} — ${formatDA(total)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">🔒 Vos données sont sécurisées. Aucun paiement en ligne.</p>
            </form>
            <div className="mt-6 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-gold">← Retour au site</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, Wallet, Headphones, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malak Digital — Boutique en ligne premium en Algérie" },
      { name: "description", content: "Achetez en ligne en toute confiance. Paiement à la livraison dans les 58 wilayas d'Algérie. Produits soigneusement sélectionnés." },
      { property: "og:title", content: "Malak Digital — Boutique premium en Algérie" },
      { property: "og:description", content: "Paiement à la livraison dans les 58 wilayas. Une expérience d'achat haut de gamme." },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, locale } = useI18n();

  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: newest } = useQuery({
    queryKey: ["new-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="" width={1920} height={1080} className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          </div>
          <div className="container relative mx-auto grid min-h-[88vh] items-center px-4 py-20 md:px-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
                <Sparkles className="h-3 w-3" />
                {t("hero.tagline")}
              </div>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-foreground md:text-7xl">
                {t("hero.title").split(",").map((part, i) =>
                  i === 1 ? <span key={i} className="text-gradient-gold">{part}</span> : <span key={i}>{part}{i === 0 ? "," : ""}</span>
                )}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop">
                  <Button size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                    {t("hero.cta")}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button size="lg" variant="outline" className="border-gold/40 text-foreground hover:bg-gold/10 hover:text-gold">
                    {t("hero.cta_secondary")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="border-y border-border/60 bg-surface/50">
          <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-4 md:px-6">
            {[
              { icon: Wallet, k: "cod" as const },
              { icon: Truck, k: "shipping" as const },
              { icon: ShieldCheck, k: "quality" as const },
              { icon: Headphones, k: "support" as const },
            ].map(({ icon: Icon, k }) => (
              <div key={k} className="flex items-start gap-4">
                <div className="rounded-lg bg-gold/10 p-3 text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{t(`why.${k}.title` as any)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t(`why.${k}.desc` as any)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED */}
        {featured && featured.length > 0 && (
          <section className="container mx-auto px-4 py-20 md:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold md:text-4xl">{t("section.featured")}</h2>
                <div className="mt-2 h-px w-16 bg-gradient-gold" />
              </div>
              <Link to="/shop" className="text-sm font-medium text-gold hover:underline">
                {t("nav.shop")} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* NEW */}
        {newest && newest.length > 0 && (
          <section className="container mx-auto px-4 pb-20 md:px-6">
            <div className="mb-10">
              <h2 className="font-display text-3xl font-semibold md:text-4xl">{t("section.new")}</h2>
              <div className="mt-2 h-px w-16 bg-gradient-gold" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {newest.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* EMPTY-STATE CTA when no products */}
        {(!featured || featured.length === 0) && (!newest || newest.length === 0) && (
          <section className="container mx-auto px-4 py-20 text-center md:px-6">
            <h2 className="font-display text-3xl">Le catalogue arrive bientôt</h2>
            <p className="mt-3 text-muted-foreground">L'administrateur peut ajouter des produits depuis l'espace admin.</p>
            <Link to="/auth" className="mt-6 inline-block">
              <Button variant="outline" className="border-gold/40">Accéder à l'admin</Button>
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ProductCard({ product, locale }: { product: any; locale: "fr" | "ar" | "en" }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-gold/40 hover:shadow-gold"
    >
      <div className="aspect-square overflow-hidden bg-surface">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">—</div>
        )}
      </div>
      <div className="p-4">
        <div className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="font-semibold text-gold">{formatPrice(Number(product.price), locale)}</div>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <div className="text-xs text-muted-foreground line-through">{formatPrice(Number(product.compare_at_price), locale)}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

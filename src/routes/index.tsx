import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ArrowRight, ArrowUpRight, Heart, Plus, Wallet, Truck, ShieldCheck, Headphones, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useSectionContent, mlValue } from "@/hooks/useSectionContent";
import type { HeroContent, ItemsListContent, CTAContent } from "@/lib/editorDefaults";
import heroImg from "@/assets/hero.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malak Digital — Boutique en ligne premium en Algérie" },
      { name: "description", content: "Achetez en ligne en toute confiance. Paiement à la livraison dans les 69 wilayas d'Algérie. Une expérience d'achat haut de gamme." },
      { property: "og:title", content: "Malak Digital — Boutique premium en Algérie" },
      { property: "og:description", content: "Paiement à la livraison dans les 69 wilayas. Une expérience d'achat haut de gamme." },
      { property: "og:url", content: "/" },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { locale } = useI18n();
  const lang = locale === "ar" ? "fr" : locale;
  const hero = useSectionContent<HeroContent>("storefront", "home", "hero");
  const trust = useSectionContent<ItemsListContent>("storefront", "home", "trust");
  const ctaBlock = useSectionContent<CTAContent>("storefront", "home", "cta");


  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: newest } = useQuery({
    queryKey: ["new-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const showcase = (featured && featured.length > 0 ? featured : newest) ?? [];
  const hasProducts = showcase.length > 0;

  return (
    <div
      className="flex min-h-screen flex-col bg-[#0a0a1a] text-white selection:bg-indigo-500/30"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <Header />
      <main className="relative flex-1 overflow-hidden">
        {/* Animated mesh background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[20%] h-[60%] w-[60%] rounded-full bg-[#1e1e5a]/40 opacity-50 blur-[120px] animate-mesh-drift" />
          <div className="absolute -right-[5%] top-[10%] h-[50%] w-[40%] rounded-full bg-[#4f46e5]/20 opacity-50 blur-[100px] animate-mesh-drift-slow" />
          <div className="absolute bottom-[10%] left-[30%] h-[30%] w-[30%] rounded-full bg-[#141432] blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20">
          {/* HERO */}
          <section className="grid min-h-[70vh] items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7 animate-fade-in">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-indigo-300 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                </span>
                {mlValue(hero?.tagline, lang) || "L'EXCELLENCE DIGITALE ALGÉRIENNE"}
              </div>

              <h1
                className="mb-8 text-6xl font-bold leading-[0.85] tracking-tighter md:text-8xl"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <span className="bg-gradient-to-r from-indigo-400 via-white to-indigo-500 bg-clip-text text-transparent animate-gradient-x">
                  {mlValue(hero?.title, lang) || "Le luxe, livré chez vous."}
                </span>
              </h1>

              <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl">
                {mlValue(hero?.subtitle, lang) || "Une expérience d'achat haut de gamme, pensée pour l'Algérie."}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to={(hero?.ctaLink || "/shop") as string}
                  className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
                >
                  {mlValue(hero?.ctaText, lang) || "Découvrir la boutique"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/shop"
                  className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
                >
                  Nos nouveautés
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative lg:col-span-5">
              <div className="group relative z-20 [perspective:1000px]">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl transition-transform duration-700 group-hover:[transform:rotateY(-5deg)_rotateX(2deg)] animate-float">
                  <img
                    src={hero?.image || heroImg}

                    alt="Produit premium Malak Digital"
                    width={800}
                    height={1000}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a]/80 via-transparent to-transparent" />
                  {/* Decorative ring */}
                  <div className="absolute -inset-px rounded-[2.5rem] ring-1 ring-inset ring-indigo-400/20" />
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-8 -left-8 z-30 rounded-2xl border border-white/10 bg-[#141432]/70 p-6 shadow-2xl backdrop-blur-xl animate-float-delayed">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-600/40">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                        Service
                      </p>
                      <p className="text-lg font-bold">Qualité garantie</p>
                    </div>
                  </div>
                </div>

                {/* Floating top-right pill */}
                <div className="absolute -right-4 -top-4 z-30 rounded-full border border-white/10 bg-[#141432]/70 px-4 py-2 text-xs font-bold backdrop-blur-xl animate-float">
                  <span className="text-indigo-300">69</span>{" "}
                  <span className="text-slate-300">wilayas</span>
                </div>
              </div>

              {/* Background layered frames */}
              <div className="absolute -inset-6 -z-0 rounded-[3rem] border border-indigo-500/10 [transform:rotate(3deg)]" />
              <div className="absolute -inset-2 -z-0 rounded-[2.75rem] bg-indigo-500/5 [transform:rotate(-2deg)]" />
            </div>
          </section>

          {/* TRUST BAR */}
          <section className="mt-24 grid grid-cols-2 gap-8 border-t border-white/5 pt-12 md:grid-cols-4">
            {(trust?.items?.length
              ? trust.items.map((it, i) => ({
                  icon: [Wallet, Truck, ShieldCheck, Headphones][i % 4],
                  title: mlValue(it.title, lang),
                  desc: mlValue(it.description, lang),
                  key: it.id,
                }))
              : [
                  { icon: Wallet, title: "Paiement à la livraison", desc: "Payez en espèces dès réception de votre colis.", key: "w" },
                  { icon: Truck, title: "Livraison 69 wilayas", desc: "Partout en Algérie sous 24h à 72h.", key: "t" },
                  { icon: ShieldCheck, title: "Sélection premium", desc: "Uniquement des produits authentiques vérifiés.", key: "s" },
                  { icon: Headphones, title: "Assistance 7j/7", desc: "Une équipe dédiée à votre entière écoute.", key: "h" },
                ]
            ).map(({ icon: Icon, title, desc, key }) => (
              <div key={key} className="group flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-indigo-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}

          </section>

          {/* PRODUCTS */}
          <section className="mt-32">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {featured && featured.length > 0 ? "Sélection" : "Nouveautés"}
                </h2>
                <p className="mt-2 text-slate-400">
                  Les dernières pièces sélectionnées pour vous
                </p>
              </div>
              <Link
                to="/shop"
                className="group flex shrink-0 items-center gap-2 font-bold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                <span className="hidden sm:inline">Voir le catalogue</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hasProducts
                ? showcase.map((p: any, i: number) => (
                    <ProductCard key={p.id} product={p} locale={locale} isNew={i === 0} />
                  ))
                : Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} index={i} />)}
            </div>

            {!hasProducts && (
              <div className="mt-12 text-center">
                <p className="text-slate-400">
                  Le catalogue arrive bientôt — l'administrateur peut ajouter des produits depuis l'espace admin.
                </p>
                <Link
                  to="/auth"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-white/10"
                >
                  Accéder à l'admin
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="mt-32 mb-12">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-white/[0.02] to-transparent p-12 text-center backdrop-blur-md">
              <h2 className="text-4xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                {mlValue(ctaBlock?.title, lang) || "Prêt à commander ?"}
              </h2>
              <p className="mt-3 text-slate-400">
                {mlValue(ctaBlock?.subtitle, lang) || "Paiement à la livraison, partout en Algérie."}
              </p>
              <Link
                to={(ctaBlock?.ctaLink || "/shop") as string}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:bg-indigo-500"
              >
                {mlValue(ctaBlock?.ctaText, lang) || "Voir la boutique"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProductCard({
  product,
  locale,
  isNew,
}: {
  product: any;
  locale: "fr" | "ar" | "en";
  isNew?: boolean;
}) {
  const category = product.categories?.name as string | undefined;
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group relative block rounded-3xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-white/[0.05] hover:shadow-[0_20px_60px_-20px_rgba(79,70,229,0.3)]"
    >
      <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-2xl bg-[#141432]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-700">—</div>
        )}
        {isNew && (
          <span className="absolute left-4 top-4 rounded-lg bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/30">
            Nouveau
          </span>
        )}
        <button
          type="button"
          aria-label="Favori"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:text-indigo-400"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="px-2">
        {category && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            {category}
          </p>
        )}
        <h4 className="line-clamp-1 text-lg font-bold">{product.name}</h4>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              {formatPrice(Number(product.price), locale)}
            </span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <span className="text-xs text-slate-500 line-through">
                {formatPrice(Number(product.compare_at_price), locale)}
              </span>
            )}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-colors group-hover:bg-indigo-500">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 opacity-60">
      <div
        className="mb-6 flex aspect-[4/5] items-center justify-center rounded-2xl bg-[#141432] text-xs italic text-slate-600"
        style={{ animation: `pulse 2.5s ease-in-out ${index * 0.2}s infinite` }}
      >
        Bientôt
      </div>
      <div className="space-y-2 px-2">
        <div className="h-2 w-16 rounded-full bg-white/5" />
        <div className="h-4 w-32 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

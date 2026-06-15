import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Boutique — Malak Digital" },
      { name: "description", content: "Tous nos produits premium. Livraison dans les 58 wilayas d'Algérie." },
      { property: "og:title", content: "Boutique — Malak Digital" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("new");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, category_id, created_at")
        .eq("is_active", true);
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, is_active")
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
  });


  const filtered = useMemo(() => {
    let list = products as any[];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(needle));
    }
    if (category !== "all") list = list.filter((p) => p.category_id === category);
    if (sort === "price_asc") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    else list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [products, q, category, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">{t("shop.title")}</h1>
          <div className="mt-2 h-px w-16 bg-gradient-gold" />
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("shop.search")} className="ps-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder={t("shop.category")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("shop.all")}</SelectItem>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Plus récents</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
            {t("shop.no_results")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group block overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-gold/40 hover:shadow-gold"
              >
                <div className="aspect-square overflow-hidden bg-surface">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">—</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="font-semibold text-gold">{formatPrice(Number(p.price), locale)}</div>
                    {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                      <div className="text-xs text-muted-foreground line-through">{formatPrice(Number(p.compare_at_price), locale)}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

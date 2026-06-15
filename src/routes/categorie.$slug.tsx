import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/categorie/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Malak Digital` },
      { property: "og:url", content: `/categorie/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/categorie/${params.slug}` }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { locale } = useI18n();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["category-products", category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images")
        .eq("is_active", true)
        .eq("category_id", category!.id);
      return data ?? [];
    },
  });

  if (!category) {
    return <div className="flex min-h-screen flex-col"><Header /><main className="flex-1 grid place-items-center text-muted-foreground">Catégorie introuvable</main><Footer /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">{category.name}</h1>
          <div className="mt-2 h-px w-16 bg-gradient-gold" />
          {category.description && <p className="mt-4 max-w-2xl text-muted-foreground">{category.description}</p>}
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">Aucun produit dans cette catégorie.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(products as any[]).map((p) => (
              <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-gold/40">
                <div className="aspect-square overflow-hidden bg-surface">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-muted-foreground">—</div>}
                </div>
                <div className="p-4">
                  <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
                  <div className="mt-2 font-semibold text-gold">{formatPrice(Number(p.price), locale)}</div>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Malak Digital" },
      { name: "description", content: "Conseils, guides et nouveautés Malak Digital." },
      { property: "og:title", content: "Blog — Malak Digital" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogList,
});

function BlogList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, reading_time, published_at, category_id, blog_categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("id, name, slug").order("sort_order");
      return data ?? [];
    },
  });

  const filtered = (posts as any[]).filter((p) => {
    if (cat && p.category_id !== cat) return false;
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">Le Journal</h1>
          <div className="mx-auto mt-3 h-px w-16 bg-gradient-gold" />
          <p className="mt-4 text-muted-foreground">Inspirations, conseils et nouveautés.</p>
        </header>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-80">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article…" className="ps-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCat(null)} className={`rounded-full border px-3 py-1 text-xs ${!cat ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>Tous</button>
            {(categories as any[]).map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full border px-3 py-1 text-xs ${cat === c.id ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>{c.name}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">Aucun article.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: any) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="aspect-[16/10] overflow-hidden bg-surface">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (<div className="grid h-full place-items-center text-muted-foreground">—</div>)}
                </div>
                <div className="p-5">
                  {p.blog_categories?.name && <div className="text-xs uppercase tracking-wide text-gold">{p.blog_categories.name}</div>}
                  <h2 className="mt-1 font-display text-lg font-semibold text-foreground group-hover:text-gold">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {p.published_at && new Date(p.published_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })} · {p.reading_time} min
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

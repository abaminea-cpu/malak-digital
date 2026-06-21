import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Blog Malak Digital` },
      { property: "og:url", content: `/blog/${params.slug}` },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
  }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></main>
        <Footer />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 grid place-items-center text-muted-foreground">Article introuvable</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <article className="mx-auto max-w-3xl">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-gold">← Tous les articles</Link>
          {post.blog_categories?.name && (
            <div className="mt-4 text-xs uppercase tracking-wide text-gold">{post.blog_categories.name}</div>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-5xl">{post.title}</h1>
          <div className="mt-4 text-sm text-muted-foreground">
            {post.published_at && new Date(post.published_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })} · {post.reading_time} min de lecture
          </div>
          {post.cover_image && (
            <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border/60">
              <img src={post.cover_image} alt={post.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="prose prose-invert mt-8 max-w-none prose-headings:font-display prose-headings:text-foreground prose-a:text-gold prose-strong:text-foreground prose-img:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
          </div>
          {post.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border/60 pt-6">
              {post.tags.map((t: string) => (
                <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          image: post.cover_image ? [post.cover_image] : undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          description: post.excerpt || post.meta_description || undefined,
        }) }} />
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Sparkles, Target, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Malak Digital" },
      { name: "description", content: "L'histoire, la mission et les valeurs de Malak Digital, boutique premium algérienne." },
      { property: "og:title", content: "À propos — Malak Digital" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">
            Notre <span className="text-gradient-gold">histoire</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Malak Digital est née d'une conviction : l'Algérie mérite une expérience d'achat en ligne digne des plus grandes marques mondiales. Nous combinons curation rigoureuse, design soigné et logistique fiable pour offrir à chaque Algérien une nouvelle façon d'acheter.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Notre mission", body: "Démocratiser le commerce de qualité partout en Algérie, du nord au sud, du domicile au bureau." },
            { icon: Sparkles, title: "Notre vision", body: "Devenir la référence du e-commerce premium en Afrique du Nord, fière de ses racines." },
            { icon: Heart, title: "Nos valeurs", body: "Honnêteté, qualité, respect du client. Chaque commande compte." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-6">
              <Icon className="h-6 w-6 text-gold" />
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

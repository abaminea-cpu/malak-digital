import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { formatDA } from "@/lib/format";

const search = z.object({
  n: z.string().optional(),
  total: z.coerce.number().optional(),
});

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Commande confirmée — Malak Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { n, total } = Route.useSearch();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto grid flex-1 place-items-center px-4 py-20 md:px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold">Commande confirmée !</h1>
          <p className="mt-3 text-muted-foreground">
            Merci pour votre confiance. Notre équipe vous appellera très bientôt pour confirmer la livraison.
          </p>
          {n && (
            <div className="mt-6 rounded-xl border border-gold/30 bg-card p-4">
              <div className="text-xs text-muted-foreground">N° de commande</div>
              <div className="mt-1 font-display text-xl text-gold">{n}</div>
              {typeof total === "number" && <div className="mt-2 text-sm">Total : <span className="font-semibold text-foreground">{formatDA(total)}</span></div>}
            </div>
          )}
          <Link to="/shop" className="mt-8 inline-block">
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">Continuer mes achats</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

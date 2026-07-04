import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDA } from "@/lib/format";
import { isAdminFn } from "@/lib/roles.functions";
import { toast } from "sonner";
import { LogOut, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Mon compte — Malak Digital" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(isAdminFn);

  const { data: admin } = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin({}) });
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, wilayas(name_fr)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-12 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold">Mon compte</h1>
          <div className="flex gap-2">
            {admin?.isAdmin && (
              <Link to="/admin"><Button variant="outline" className="border-gold/40"><Crown className="me-2 h-4 w-4 text-gold" /> Admin</Button></Link>
            )}
            <Button variant="ghost" onClick={signOut}><LogOut className="me-2 h-4 w-4" /> Déconnexion</Button>
          </div>
        </div>


        <h2 className="mb-4 font-display text-xl">Mes commandes</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucune commande pour le moment.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
                <div>
                  <div className="font-medium text-gold">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")} • {o.wilayas?.name_fr}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatDA(Number(o.total))}</div>
                  <div className="text-xs text-muted-foreground capitalize">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

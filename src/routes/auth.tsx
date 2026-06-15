import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Malak Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Connecté");
    navigate({ to: "/account" });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: String(form.get("full_name") || ""), phone: String(form.get("phone") || "") },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Compte créé ! Vérifiez votre email.");
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setLoading(false); toast.error("Erreur Google: " + (result.error as any)?.message); return; }
    if (result.redirected) return;
    navigate({ to: "/account" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto grid flex-1 place-items-center px-4 py-12 md:px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl text-gradient-gold">Bienvenue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous ou créez un compte</p>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="mt-6 w-full border-gold/30 hover:bg-gold/10">
            <svg className="me-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.43-1.65 4.2-5.35 4.2-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.77 1.45l2.57-2.48C16.93 3.95 14.7 3 12 3 6.98 3 3 7 3 12s3.98 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.07-1.05-.15-1.55Z"/></svg>
            Continuer avec Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <Field name="email" label="Email" type="email" required />
                <Field name="password" label="Mot de passe" type="password" required />
                <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
                  {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />} Connexion
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <Field name="full_name" label="Nom complet" required />
                <Field name="phone" label="Téléphone" type="tel" />
                <Field name="email" label="Email" type="email" required />
                <Field name="password" label="Mot de passe (min. 6)" type="password" required />
                <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
                  {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />} Créer mon compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <Input className="mt-1.5" name={name} type={type} required={required} maxLength={200} />
    </div>
  );
}

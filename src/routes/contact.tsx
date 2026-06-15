import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Malak Digital" },
      { name: "description", content: "Contactez Malak Digital : téléphone, WhatsApp, email. Une équipe à votre écoute." },
      { property: "og:title", content: "Contact — Malak Digital" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-16 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">Contactez-nous</h1>
          <p className="mt-3 text-muted-foreground">Une question ? Notre équipe vous répond rapidement.</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {[
              { icon: Phone, label: "Téléphone", value: "+213 555 000 000" },
              { icon: MessageCircle, label: "WhatsApp", value: "+213 555 000 000" },
              { icon: Mail, label: "Email", value: "contact@malakdigital.dz" },
              { icon: MapPin, label: "Adresse", value: "Alger, Algérie" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4">
                <div className="rounded-lg bg-gold/10 p-3 text-gold"><Icon className="h-5 w-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Message envoyé ! Nous reviendrons vers vous rapidement."); (e.target as HTMLFormElement).reset(); }}
            className="space-y-4 rounded-2xl border border-border/60 bg-card p-6"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Nom *</Label><Input className="mt-1.5" name="name" required maxLength={120} /></div>
              <div><Label>Email *</Label><Input className="mt-1.5" name="email" type="email" required maxLength={200} /></div>
            </div>
            <div><Label>Sujet</Label><Input className="mt-1.5" name="subject" maxLength={200} /></div>
            <div><Label>Message *</Label><Textarea className="mt-1.5" name="message" required maxLength={2000} rows={6} /></div>
            <Button type="submit" className="bg-gradient-gold text-primary-foreground hover:opacity-90">Envoyer</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

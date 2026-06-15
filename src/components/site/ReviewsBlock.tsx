import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  listProductReviewsFn,
  createReviewFn,
  toggleWishlistFn,
} from "@/lib/engagement.functions";
import { Star, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WishlistButton({ productId }: { productId: string }) {
  const toggle = useServerFn(toggleWishlistFn);
  const [signedIn, setSignedIn] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setSignedIn(true);
      const { data: row } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", data.user.id)
        .eq("product_id", productId)
        .maybeSingle();
      setActive(!!row);
    });
  }, [productId]);

  async function onClick() {
    if (!signedIn) { toast.error("Connectez-vous pour utiliser la wishlist"); return; }
    setBusy(true);
    try {
      const r = await toggle({ data: { product_id: productId } });
      setActive(r.in_wishlist);
      toast.success(r.in_wishlist ? "Ajouté à votre wishlist" : "Retiré");
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
    finally { setBusy(false); }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="Wishlist"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:text-gold hover:border-gold/40"
      }`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    </button>
  );
}

export function ReviewsBlock({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listProductReviewsFn);
  const create = useServerFn(createReviewFn);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  const { data } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => list({ data: { product_id: productId } }),
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await create({
        data: {
          product_id: productId,
          rating,
          author_name: String(fd.get("name") || "Client"),
          title: String(fd.get("title") || ""),
          comment: String(fd.get("comment") || ""),
        },
      });
      toast.success("Merci ! Votre avis est en cours de modération.");
      (e.currentTarget as HTMLFormElement).reset();
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
    finally { setBusy(false); }
  }

  const avg = data?.average ?? 0;
  const count = data?.count ?? 0;

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold">Avis clients</h3>
        {count > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={avg} />
            <span>{avg.toFixed(1)} / 5 ({count})</span>
          </div>
        )}
      </div>

      {count > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AggregateRating",
              ratingValue: avg.toFixed(1),
              reviewCount: count,
            }),
          }}
        />
      )}

      <div className="mt-6 space-y-4">
        {(data?.reviews ?? []).map((r: any) => (
          <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.author_name}</div>
              <Stars value={r.rating} />
            </div>
            {r.title && <div className="mt-1 text-sm font-medium text-gold">{r.title}</div>}
            {r.comment && <div className="mt-1 text-sm text-muted-foreground">{r.comment}</div>}
            <div className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
          </div>
        ))}
        {count === 0 && <div className="text-sm text-muted-foreground">Soyez le premier à donner votre avis.</div>}
      </div>

      {signedIn ? (
        <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl border border-gold/20 bg-card p-5">
          <h4 className="font-display text-lg">Laisser un avis</h4>
          <div>
            <Label>Note</Label>
            <div className="mt-1.5 flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`}>
                  <Star className={`h-6 w-6 transition-colors ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div><Label>Nom</Label><Input name="name" required maxLength={80} className="mt-1.5" /></div>
          <div><Label>Titre</Label><Input name="title" maxLength={120} className="mt-1.5" /></div>
          <div><Label>Commentaire</Label><Textarea name="comment" maxLength={1000} className="mt-1.5" rows={4} /></div>
          <Button type="submit" disabled={busy} className="bg-gradient-gold text-primary-foreground">
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />} Envoyer
          </Button>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Connectez-vous pour laisser un avis.
        </div>
      )}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

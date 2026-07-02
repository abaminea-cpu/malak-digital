import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Camera, Upload, Package, CheckCircle2, AlertTriangle, X, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import {
  getExchangeConfigFn,
  searchOrdersByPhoneFn,
  createExchangeRequestFn,
} from "@/lib/exchange.functions";
import { uploadExchangePhoto } from "@/lib/exchange-upload";
import { formatDA } from "@/lib/format";

export const Route = createFileRoute("/echange")({
  head: () => ({
    meta: [
      { title: "Demande d'échange — Malak Digital" },
      { name: "description", content: "Demandez l'échange d'un produit commandé sur Malak Digital." },
    ],
  }),
  component: ExchangePage,
});

type OrderRow = Awaited<ReturnType<typeof searchOrdersByPhoneFn>>[number];

function ExchangePage() {
  const searchFn = useServerFn(searchOrdersByPhoneFn);
  const submitFn = useServerFn(createExchangeRequestFn);
  const { data: cfg } = useQuery({
    queryKey: ["exchange-config"],
    queryFn: () => useServerFn(getExchangeConfigFn)({}),
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ number: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const deadlineHours = cfg?.deadline_hours ?? 48;

  const timeLeft = useMemo(() => {
    if (!selected) return null;
    const start = new Date(selected.delivered_at ?? selected.created_at).getTime();
    const elapsedH = (Date.now() - start) / 36e5;
    const remaining = deadlineHours - elapsedH;
    return { elapsedH, remaining, expired: remaining <= 0 };
  }, [selected, deadlineHours]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSearching(true);
    try {
      const rows = await searchFn({ data: { phone: phone.trim() } });
      setOrders(rows);
      setStep(2);
      if (!rows.length) toast.info("Aucune commande trouvée pour ce numéro.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur de recherche");
    } finally {
      setSearching(false);
    }
  }

  function pickOrder(o: OrderRow) {
    setSelected(o);
    setStep(3);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const uploaded: { path: string; preview: string }[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 8 Mo`);
          continue;
        }
        const path = await uploadExchangePhoto(file);
        uploaded.push({ path, preview: URL.createObjectURL(file) });
      }
      setPhotos((p) => [...p, ...uploaded]);
    } catch (err: any) {
      toast.error(err?.message ?? "Échec du téléversement");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!selected || photos.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitFn({
        data: {
          order_id: selected.id,
          phone: phone.trim(),
          reason: reason.trim() || undefined,
          photos: photos.map((p) => p.path),
        },
      });
      setConfirmation({ number: res.request_number });
      setStep(4);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setPhone("");
    setOrders([]);
    setSelected(null);
    setReason("");
    setPhotos([]);
    setConfirmation(null);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold md:text-4xl">Demande d'échange</h1>
            <div className="mx-auto mt-3 h-px w-16 bg-gradient-gold" />
            <p className="mt-4 text-muted-foreground">
              Retrouvez votre commande, ajoutez quelques photos, notre équipe vous rappelle rapidement.
            </p>
          </div>

          <Stepper current={step} />

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur md:p-8">
            {step === 1 && (
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Numéro de téléphone utilisé lors de la commande</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="0555 12 34 56"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button type="submit" disabled={searching || !phone.trim()} className="bg-gradient-gold text-primary-foreground">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Rechercher</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Délai d'échange autorisé : <strong>{deadlineHours} heures</strong> à compter de la livraison (ou de la commande si non livrée).
                </p>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Sélectionnez la commande concernée</h2>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Modifier
                  </Button>
                </div>
                {orders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                    Aucune commande trouvée pour <strong>{phone}</strong>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <OrderCard key={o.id} order={o} deadlineHours={deadlineHours} onPick={() => pickOrder(o)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && selected && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Commande {selected.order_number}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Changer
                  </Button>
                </div>

                {timeLeft?.expired ? (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p>
                      Le délai autorisé pour demander un échange ({deadlineHours}h) est dépassé.
                      Si vous avez une question, veuillez contacter notre service client.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      <div>
                        <p className="font-medium">Délai encore valide</p>
                        <p className="text-muted-foreground">
                          Il vous reste environ <strong>{Math.max(0, Math.floor(timeLeft?.remaining ?? 0))}h</strong> pour soumettre votre demande.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Photos du produit (obligatoire)</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ajoutez une ou plusieurs photos montrant clairement le produit à échanger.
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => camRef.current?.click()}
                          disabled={uploading}
                          className="h-auto justify-start py-3"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Prendre une photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="h-auto justify-start py-3"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choisir depuis l'appareil
                        </Button>
                        <input
                          ref={camRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                      </div>

                      {uploading && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Téléversement en cours…
                        </p>
                      )}

                      {photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {photos.map((p, i) => (
                            <div key={p.path} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60">
                              <img src={p.preview} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                                aria-label="Supprimer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="reason">Motif (optionnel)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Décrivez brièvement le problème…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || photos.length === 0}
                      className="w-full bg-gradient-gold text-primary-foreground"
                    >
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                      Envoyer la demande
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === 4 && confirmation && (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold">Demande envoyée avec succès</h2>
                <p className="text-muted-foreground">
                  Votre demande <strong className="text-foreground">{confirmation.number}</strong> a bien été enregistrée.
                  Notre équipe l'examinera dans les plus brefs délais et vous contactera par téléphone.
                </p>
                <Button variant="outline" onClick={reset} className="mt-4">
                  Faire une autre demande
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ["Téléphone", "Commande", "Photos", "Confirmation"];
  return (
    <ol className="flex items-center justify-between gap-2 text-xs sm:text-sm">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                done
                  ? "border-gold bg-gold text-primary-foreground"
                  : active
                  ? "border-gold text-gold"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              {n}
            </span>
            <span className={`truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 hidden h-px flex-1 bg-border/60 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order, deadlineHours, onPick }: { order: OrderRow; deadlineHours: number; onPick: () => void }) {
  const start = new Date(order.delivered_at ?? order.created_at).getTime();
  const elapsedH = (Date.now() - start) / 36e5;
  const expired = elapsedH > deadlineHours;
  const date = new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={`rounded-xl border p-4 transition ${expired ? "border-border/40 opacity-60" : "border-border/60 hover:border-gold/50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gold" />
            <strong className="font-mono text-sm">{order.order_number}</strong>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Passée le {date} • {formatDA(Number(order.total))}</p>
        </div>
        <Button size="sm" onClick={onPick} disabled={expired} className={expired ? "" : "bg-gradient-gold text-primary-foreground"}>
          {expired ? "Délai dépassé" : "Demander un échange"}
        </Button>
      </div>
      {order.order_items?.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {order.order_items.slice(0, 4).map((it: any, idx: number) => (
            <li key={idx}>• {it.quantity} × {it.product_name}</li>
          ))}
          {order.order_items.length > 4 && <li>+ {order.order_items.length - 4} autre(s)</li>}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "Nouvelle",
    confirmed: "Confirmée",
    preparing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
    returned: "Retournée",
  };
  return (
    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {map[status] ?? status}
    </span>
  );
}

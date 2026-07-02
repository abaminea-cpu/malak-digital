import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Phone, MessageCircle, Save, Clock } from "lucide-react";
import {
  adminListExchangesFn,
  adminUpdateExchangeFn,
  adminUpsertExchangeConfigFn,
  getExchangeConfigFn,
} from "@/lib/exchange.functions";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  validated: "Validée",
  rejected: "Refusée",
  processed: "Traitée",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  validated: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  processed: "bg-sky-500/15 text-sky-500 border-sky-500/30",
};

export function ExchangesTab() {
  const listFn = useServerFn(adminListExchangesFn);
  const updateFn = useServerFn(adminUpdateExchangeFn);
  const upsertCfgFn = useServerFn(adminUpsertExchangeConfigFn);
  const getCfgFn = useServerFn(getExchangeConfigFn);
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery({ queryKey: ["admin-exchanges"], queryFn: () => listFn({}) });
  const { data: cfg } = useQuery({ queryKey: ["admin-exchange-config"], queryFn: () => getCfgFn({}) });

  const [filter, setFilter] = useState<string>("all");
  const [deadline, setDeadline] = useState<number>(48);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [savingCfg, setSavingCfg] = useState(false);

  useEffect(() => {
    if (cfg) {
      setDeadline(cfg.deadline_hours);
      setEnabled(cfg.enabled);
    }
  }, [cfg]);


  const filtered = useMemo(() => {
    if (!rows) return [];
    if (filter === "all") return rows;
    return rows.filter((r: any) => r.status === filter);
  }, [rows, filter]);

  async function updateStatus(id: string, status: string) {
    try {
      await updateFn({ data: { id, status: status as any } });
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-exchanges"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
  }

  async function saveNote(id: string, note: string) {
    try {
      await updateFn({ data: { id, admin_note: note } });
      toast.success("Note enregistrée");
      qc.invalidateQueries({ queryKey: ["admin-exchanges"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
  }

  async function saveConfig() {
    setSavingCfg(true);
    try {
      await upsertCfgFn({ data: { deadline_hours: Number(deadline), enabled } });
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["admin-exchange-config"] });
      qc.invalidateQueries({ queryKey: ["exchange-config"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally { setSavingCfg(false); }
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4 text-gold" /> Paramètres d'échange
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="deadline">Délai maximum (heures)</Label>
            <Input
              id="deadline"
              type="number"
              min={1}
              max={720}
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <Label htmlFor="enabled">Fonctionnalité activée</Label>
              <div className="mt-2 flex items-center gap-2">
                <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                <span className="text-sm text-muted-foreground">{enabled ? "Active" : "Désactivée"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={saveConfig} disabled={savingCfg} className="bg-gradient-gold text-primary-foreground">
              {savingCfg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "pending", "validated", "processed", "rejected"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className={filter === s ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {s === "all" ? "Toutes" : STATUS_LABEL[s]}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} demande(s)</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          Aucune demande d'échange à afficher.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <ExchangeCard key={r.id} row={r} onStatus={(s) => updateStatus(r.id, s)} onSaveNote={(n) => saveNote(r.id, n)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExchangeCard({
  row, onStatus, onSaveNote,
}: {
  row: any;
  onStatus: (s: string) => void;
  onSaveNote: (n: string) => void;
}) {
  const [note, setNote] = useState(row.admin_note ?? "");
  const order = row.orders;
  const deliveredAt = order?.delivered_at ? new Date(order.delivered_at) : null;
  const createdAt = new Date(row.created_at);
  const sinceDelivery = deliveredAt
    ? `${Math.floor((Date.now() - deliveredAt.getTime()) / 36e5)}h depuis livraison`
    : "Non livrée";

  const waHref = `https://wa.me/${row.customer_phone.replace(/^\+/, "").replace(/\D/g, "")}`;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-mono text-sm">{row.request_number}</strong>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_COLOR[row.status]}`}>
              {STATUS_LABEL[row.status]}
            </span>
            <span className="text-xs text-muted-foreground">
              Commande <strong className="font-mono">{order?.order_number}</strong>
            </span>
          </div>
          <p className="mt-1 text-sm">
            {row.customer_name || `${order?.customer_first_name ?? ""} ${order?.customer_last_name ?? ""}`.trim()}
            <span className="ml-2 text-muted-foreground">• {row.customer_phone}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Demande le {createdAt.toLocaleString("fr-FR")} • {deliveredAt ? `Livrée ${deliveredAt.toLocaleDateString("fr-FR")}` : "Pas encore livrée"} • {sinceDelivery}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href={`tel:${row.customer_phone}`}>
            <Button variant="outline" size="icon" title="Appeler"><Phone className="h-4 w-4" /></Button>
          </a>
          <a href={waHref} target="_blank" rel="noreferrer">
            <Button variant="outline" size="icon" title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
          </a>
          <Select value={row.status} onValueChange={onStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {order?.order_items?.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
          {order.order_items.map((it: any, i: number) => (
            <li key={i}>• {it.quantity} × {it.product_name}</li>
          ))}
        </ul>
      )}

      {row.reason && (
        <p className="mt-3 rounded-md border border-border/60 bg-background/50 p-2 text-xs">
          <strong>Motif :</strong> {row.reason}
        </p>
      )}

      {row.photos_signed?.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Photos ({row.photos_signed.length})</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {row.photos_signed.map((url: string, i: number) => (
              <Dialog key={i}>
                <DialogTrigger asChild>
                  <button className="aspect-square overflow-hidden rounded-md border border-border/60 hover:border-gold">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Photo {i + 1}</DialogTitle></DialogHeader>
                  <img src={url} alt="" className="w-full rounded-md" />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Label htmlFor={`note-${row.id}`} className="text-xs">Note interne</Label>
        <div className="mt-1 flex gap-2">
          <Textarea id={`note-${row.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => onSaveNote(note)}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

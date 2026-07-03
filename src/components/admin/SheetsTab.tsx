import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, TestTube2, Download, ExternalLink, FileSpreadsheet } from "lucide-react";
import {
  getSheetsConfigFn,
  saveSheetsConfigFn,
  testSheetsConnectionFn,
  backfillOrdersFn,
  backfillExchangesFn,
} from "@/lib/sheets.functions";

export function SheetsTab() {
  const getFn = useServerFn(getSheetsConfigFn);
  const saveFn = useServerFn(saveSheetsConfigFn);
  const testFn = useServerFn(testSheetsConnectionFn);
  const backOrdersFn = useServerFn(backfillOrdersFn);
  const backExchangesFn = useServerFn(backfillExchangesFn);
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({ queryKey: ["sheets-config"], queryFn: () => getFn({}) });

  const [oId, setOId] = useState("");
  const [oName, setOName] = useState("Commandes");
  const [oEnabled, setOEnabled] = useState(false);
  const [eId, setEId] = useState("");
  const [eName, setEName] = useState("Echanges");
  const [eEnabled, setEEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (cfg) {
      setOId(cfg.orders_spreadsheet_id ?? "");
      setOName(cfg.orders_sheet_name ?? "Commandes");
      setOEnabled(!!cfg.orders_enabled);
      setEId(cfg.exchanges_spreadsheet_id ?? "");
      setEName(cfg.exchanges_sheet_name ?? "Echanges");
      setEEnabled(!!cfg.exchanges_enabled);
    }
  }, [cfg]);

  async function save() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          orders_spreadsheet_id: oId.trim() || null,
          orders_sheet_name: oName.trim() || "Commandes",
          orders_enabled: oEnabled,
          exchanges_spreadsheet_id: eId.trim() || null,
          exchanges_sheet_name: eName.trim() || "Echanges",
          exchanges_enabled: eEnabled,
        },
      });
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["sheets-config"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setSaving(false); }
  }

  async function test(target: "orders" | "exchanges") {
    setBusy(`test-${target}`);
    try {
      await testFn({ data: { target } });
      toast.success("Connexion OK — en-têtes créés si vides");
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBusy(null); }
  }

  async function backfill(kind: "orders" | "exchanges") {
    setBusy(`back-${kind}`);
    try {
      const res = kind === "orders" ? await backOrdersFn({}) : await backExchangesFn({});
      toast.success(`${res.count} lignes exportées`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBusy(null); }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card/50 p-5">
        <div className="mb-4 flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-gold" />
          <div>
            <h3 className="font-medium">Google Sheets — Export temps réel</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Chaque nouvelle commande / demande d'échange est ajoutée automatiquement à votre Google Sheet.
              L'ID du spreadsheet se trouve dans l'URL : <code>docs.google.com/spreadsheets/d/<b>[ID]</b>/edit</code>
            </p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <SheetBlock
        title="Commandes"
        idValue={oId} onId={setOId}
        nameValue={oName} onName={setOName}
        enabled={oEnabled} onEnabled={setOEnabled}
        onTest={() => test("orders")}
        onBackfill={() => backfill("orders")}
        busyKey={busy}
        target="orders"
      />

      {/* Exchanges */}
      <SheetBlock
        title="Demandes d'échange"
        idValue={eId} onId={setEId}
        nameValue={eName} onName={setEName}
        enabled={eEnabled} onEnabled={setEEnabled}
        onTest={() => test("exchanges")}
        onBackfill={() => backfill("exchanges")}
        busyKey={busy}
        target="exchanges"
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gradient-gold text-primary-foreground">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}

function SheetBlock({
  title, idValue, onId, nameValue, onName, enabled, onEnabled, onTest, onBackfill, busyKey, target,
}: {
  title: string;
  idValue: string; onId: (v: string) => void;
  nameValue: string; onName: (v: string) => void;
  enabled: boolean; onEnabled: (v: boolean) => void;
  onTest: () => void; onBackfill: () => void;
  busyKey: string | null; target: "orders" | "exchanges";
}) {
  const sheetUrl = idValue ? `https://docs.google.com/spreadsheets/d/${idValue}/edit` : null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={onEnabled} />
          <span className="text-xs text-muted-foreground">{enabled ? "Sync active" : "Sync désactivée"}</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label>Spreadsheet ID</Label>
          <Input value={idValue} onChange={(e) => onId(e.target.value)} placeholder="1abc...xyz" className="mt-1 font-mono text-xs" />
        </div>
        <div>
          <Label>Nom de l'onglet</Label>
          <Input value={nameValue} onChange={(e) => onName(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onTest} disabled={busyKey === `test-${target}` || !idValue}>
          {busyKey === `test-${target}` ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <TestTube2 className="mr-2 h-3 w-3" />}
          Tester & créer en-têtes
        </Button>
        <Button variant="outline" size="sm" onClick={onBackfill} disabled={busyKey === `back-${target}` || !idValue}>
          {busyKey === `back-${target}` ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
          Exporter l'historique
        </Button>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="mr-2 h-3 w-3" /> Ouvrir
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

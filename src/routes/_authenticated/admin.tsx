import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDA } from "@/lib/format";
import { toast } from "sonner";
import { isAdminFn } from "@/lib/roles.functions";
import {
  adminListOrdersFn, adminUpdateOrderStatusFn,
  adminUpsertProductFn, adminDeleteProductFn,
  adminUpdateWilayaFn, adminStatsFn,
} from "@/lib/admin.functions";
import { Loader2, Plus, Trash2, Pencil, ShoppingBag, Package, Truck, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Malak Digital" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const STATUSES = ["new","confirmed","preparing","shipped","delivered","cancelled","returned"] as const;

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(isAdminFn);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    check({}).then((r) => {
      if (!r.isAdmin) { toast.error("Accès refusé"); navigate({ to: "/account" }); }
      else setAllowed(true);
    });
  }, [check, navigate]);

  if (!allowed) {
    return <div className="flex min-h-screen flex-col"><Header /><main className="flex-1 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></main><Footer /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">Administration</h1>
          <div className="mt-2 h-px w-16 bg-gradient-gold" />
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="shipping">Livraison</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
          <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
          <TabsContent value="shipping" className="mt-6"><ShippingTab /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function DashboardTab() {
  const stats = useServerFn(adminStatsFn);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats({}) });
  const cards = [
    { label: "Revenus totaux", value: data ? formatDA(data.totalRevenue) : "—", icon: DollarSign },
    { label: "Commandes", value: data?.totalOrders ?? "—", icon: ShoppingBag },
    { label: "Nouvelles", value: data?.newOrders ?? "—", icon: Package },
    { label: "Produits", value: data?.productCount ?? "—", icon: Truck },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
            <c.icon className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-3 font-display text-2xl text-foreground">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function ProductsTab() {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertProductFn);
  const del = useServerFn(adminDeleteProductFn);
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(p: any) { setEditing(p); setOpen(true); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const imagesRaw = String(f.get("images") || "").trim();
    const images = imagesRaw ? imagesRaw.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    try {
      await upsert({
        data: {
          id: editing?.id,
          name: String(f.get("name") || ""),
          slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
          description: String(f.get("description") || ""),
          short_description: String(f.get("short_description") || ""),
          price: Number(f.get("price") || 0),
          compare_at_price: f.get("compare_at_price") ? Number(f.get("compare_at_price")) : null,
          stock: Number(f.get("stock") || 0),
          images,
          is_active: f.get("is_active") === "on",
          is_featured: f.get("is_featured") === "on",
        },
      });
      toast.success("Produit enregistré");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["featured-products"] });
    } catch (err: any) { toast.error(err.message ?? "Erreur"); }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    try { await del({ data: { id } }); toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Nom *</Label><Input name="name" required defaultValue={editing?.name} maxLength={200} /></div>
                <div><Label>Slug (url) *</Label><Input name="slug" required defaultValue={editing?.slug} maxLength={200} placeholder="mon-produit" /></div>
              </div>
              <div><Label>Description courte</Label><Input name="short_description" defaultValue={editing?.short_description ?? ""} maxLength={500} /></div>
              <div><Label>Description</Label><Textarea name="description" rows={5} defaultValue={editing?.description ?? ""} maxLength={5000} /></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div><Label>Prix (DA) *</Label><Input name="price" type="number" min="0" step="1" required defaultValue={editing?.price ?? ""} /></div>
                <div><Label>Prix barré</Label><Input name="compare_at_price" type="number" min="0" step="1" defaultValue={editing?.compare_at_price ?? ""} /></div>
                <div><Label>Stock</Label><Input name="stock" type="number" min="0" step="1" defaultValue={editing?.stock ?? 0} /></div>
              </div>
              <div><Label>Images (une URL par ligne)</Label><Textarea name="images" rows={3} defaultValue={editing?.images?.join("\n") ?? ""} /></div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} /> <span className="text-sm">Actif</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={!!editing?.is_featured} /> <span className="text-sm">Vedette</span></label>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-start">Nom</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Statut</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products as any[]).map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3"><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">/{p.slug}</div></td>
                <td className="p-3 text-center text-gold">{formatDA(Number(p.price))}</td>
                <td className="p-3 text-center">{p.stock}</td>
                <td className="p-3 text-center"><span className={`text-xs ${p.is_active ? "text-success" : "text-muted-foreground"}`}>{p.is_active ? "Actif" : "Inactif"}</span></td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Aucun produit. Cliquez sur « Ajouter ».</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListOrdersFn);
  const update = useServerFn(adminUpdateOrderStatusFn);
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list({}) });

  async function changeStatus(id: string, status: any) {
    try { await update({ data: { id, status } }); toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase text-muted-foreground">
          <tr><th className="p-3 text-start">N°</th><th className="p-3 text-start">Client</th><th className="p-3 text-start">Wilaya</th><th className="p-3">Total</th><th className="p-3">Statut</th><th className="p-3">Date</th></tr>
        </thead>
        <tbody>
          {(orders as any[]).map((o) => (
            <tr key={o.id} className="border-t border-border/60">
              <td className="p-3 font-mono text-xs text-gold">{o.order_number}</td>
              <td className="p-3"><div>{o.customer_first_name} {o.customer_last_name}</div><div className="text-xs text-muted-foreground">{o.customer_phone}</div></td>
              <td className="p-3 text-xs">{o.wilayas?.name_fr} — {o.commune}</td>
              <td className="p-3 text-center">{formatDA(Number(o.total))}</td>
              <td className="p-3">
                <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
                  <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Aucune commande.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ShippingTab() {
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateWilayaFn);
  const { data: wilayas = [] } = useQuery({
    queryKey: ["admin-wilayas"],
    queryFn: async () => {
      const { data } = await supabase.from("wilayas").select("*").order("id");
      return data ?? [];
    },
  });

  async function save(w: any, patch: any) {
    try {
      await update({ data: { id: w.id, home_price: patch.home_price ?? Number(w.home_price), office_price: patch.office_price ?? Number(w.office_price), home_enabled: patch.home_enabled ?? w.home_enabled, office_enabled: patch.office_enabled ?? w.office_enabled } });
      qc.invalidateQueries({ queryKey: ["admin-wilayas"] });
      qc.invalidateQueries({ queryKey: ["wilayas"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase text-muted-foreground">
          <tr><th className="p-3 text-start">Wilaya</th><th className="p-3">Domicile (DA)</th><th className="p-3">Bureau (DA)</th><th className="p-3">Dom. actif</th><th className="p-3">Bur. actif</th></tr>
        </thead>
        <tbody>
          {(wilayas as any[]).map((w) => (
            <tr key={w.id} className="border-t border-border/60">
              <td className="p-3">{String(w.id).padStart(2,"0")} — {w.name_fr}</td>
              <td className="p-3"><Input type="number" defaultValue={w.home_price} className="h-8 w-24 mx-auto" onBlur={(e) => save(w, { home_price: Number(e.target.value) })} /></td>
              <td className="p-3"><Input type="number" defaultValue={w.office_price} className="h-8 w-24 mx-auto" onBlur={(e) => save(w, { office_price: Number(e.target.value) })} /></td>
              <td className="p-3 text-center"><Switch defaultChecked={w.home_enabled} onCheckedChange={(v) => save(w, { home_enabled: v })} /></td>
              <td className="p-3 text-center"><Switch defaultChecked={w.office_enabled} onCheckedChange={(v) => save(w, { office_enabled: v })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

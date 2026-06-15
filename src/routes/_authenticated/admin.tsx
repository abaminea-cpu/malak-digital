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
import { adminUpsertCategoryFn, adminDeleteCategoryFn, adminReplaceVariantsFn } from "@/lib/catalog.functions";
import { adminUpsertPostFn, adminDeletePostFn, adminUpsertBlogCategoryFn, adminDeleteBlogCategoryFn } from "@/lib/blog.functions";
import { ImageUploader, SingleImageUploader } from "@/components/admin/ImageUploader";
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
          <TabsList className="flex-wrap">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="shipping">Livraison</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
          <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
          <TabsContent value="shipping" className="mt-6"><ShippingTab /></TabsContent>
          <TabsContent value="blog" className="mt-6"><BlogTab /></TabsContent>
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
  const replaceVariants = useServerFn(adminReplaceVariantsFn);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("sort_order");
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");

  async function openNew() { setEditing(null); setImages([]); setVariants([]); setCategoryId(""); setOpen(true); }
  async function openEdit(p: any) {
    setEditing(p); setImages(p.images ?? []); setCategoryId(p.category_id ?? "");
    const { data: vs } = await supabase.from("product_variants").select("*").eq("product_id", p.id).order("sort_order");
    setVariants(vs ?? []);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const result = await upsert({
        data: {
          id: editing?.id,
          name: String(f.get("name") || ""),
          slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
          description: String(f.get("description") || ""),
          short_description: String(f.get("short_description") || ""),
          price: Number(f.get("price") || 0),
          compare_at_price: f.get("compare_at_price") ? Number(f.get("compare_at_price")) : null,
          stock: Number(f.get("stock") || 0),
          category_id: categoryId && categoryId !== "__none" ? categoryId : null,
          images,
          video_url: String(f.get("video_url") || "") || null,
          is_active: f.get("is_active") === "on",
          is_featured: f.get("is_featured") === "on",
          landing_mode: f.get("landing_mode") === "on",
          meta_title: String(f.get("meta_title") || ""),
          meta_description: String(f.get("meta_description") || ""),
        },
      });
      if (variants.length > 0 || editing?.id) {
        await replaceVariants({ data: { product_id: result.id, variants: variants.map((v) => ({
          name: v.name, sku: v.sku || "", price_delta: Number(v.price_delta) || 0, stock: Number(v.stock) || 0,
          option1_name: v.option1_name || "", option1_value: v.option1_value || "",
          option2_name: v.option2_name || "", option2_value: v.option2_value || "",
          image_url: v.image_url || null, is_active: v.is_active !== false,
        })) } });
      }
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

  function addVariant() {
    setVariants([...variants, { name: "Nouveau", sku: "", price_delta: 0, stock: 0, option1_name: "", option1_value: "", option2_name: "", option2_value: "", image_url: null, is_active: true }]);
  }
  function updateVariant(i: number, patch: any) {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  }
  function removeVariant(i: number) {
    setVariants(variants.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
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

              <div>
                <Label>Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Aucune —</SelectItem>
                    {(categories as any[]).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div><Label>Vidéo (URL YouTube/MP4)</Label><Input name="video_url" defaultValue={editing?.video_url ?? ""} /></div>

              <div>
                <Label>Images</Label>
                <ImageUploader bucket="product-images" value={images} onChange={setImages} max={10} />
              </div>

              <div className="rounded-lg border border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-base">Variantes ({variants.length})</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addVariant}><Plus className="me-1 h-3 w-3" /> Ajouter</Button>
                </div>
                {variants.length === 0 && <p className="text-xs text-muted-foreground">Aucune variante. Le produit utilisera le prix et stock principaux.</p>}
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={i} className="grid gap-2 rounded-md border border-border bg-surface p-3 md:grid-cols-12">
                      <Input className="md:col-span-3" placeholder="Nom (ex: Or - Taille M)" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} />
                      <Input className="md:col-span-2" placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                      <Input className="md:col-span-2" type="number" placeholder="±Prix" value={v.price_delta} onChange={(e) => updateVariant(i, { price_delta: e.target.value })} />
                      <Input className="md:col-span-2" type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} />
                      <Input className="md:col-span-2" placeholder="URL image" value={v.image_url ?? ""} onChange={(e) => updateVariant(i, { image_url: e.target.value || null })} />
                      <Button type="button" size="icon" variant="ghost" className="md:col-span-1" onClick={() => removeVariant(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Meta title (SEO)</Label><Input name="meta_title" defaultValue={editing?.meta_title ?? ""} maxLength={200} /></div>
                <div><Label>Meta description (SEO)</Label><Input name="meta_description" defaultValue={editing?.meta_description ?? ""} maxLength={300} /></div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} /> <span className="text-sm">Actif</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={!!editing?.is_featured} /> <span className="text-sm">Vedette</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="landing_mode" defaultChecked={!!editing?.landing_mode} /> <span className="text-sm">Landing page</span></label>
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

function CategoriesTab() {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertCategoryFn);
  const del = useServerFn(adminDeleteCategoryFn);
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  function openNew() { setEditing(null); setImage(null); setOpen(true); }
  function openEdit(c: any) { setEditing(c); setImage(c.image_url ?? null); setOpen(true); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await upsert({ data: {
        id: editing?.id,
        slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
        name: String(f.get("name") || ""),
        description: String(f.get("description") || ""),
        image_url: image,
        parent_id: null,
        is_active: f.get("is_active") === "on",
        sort_order: Number(f.get("sort_order") || 0),
      } });
      toast.success("Catégorie enregistrée");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try { await del({ data: { id } }); toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["admin-categories-full"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} catégorie</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Nom *</Label><Input name="name" required defaultValue={editing?.name} maxLength={100} /></div>
                <div><Label>Slug *</Label><Input name="slug" required defaultValue={editing?.slug} maxLength={80} /></div>
              </div>
              <div><Label>Description</Label><Textarea name="description" defaultValue={editing?.description ?? ""} maxLength={400} rows={3} /></div>
              <div><Label>Image</Label><SingleImageUploader bucket="product-images" value={image} onChange={setImage} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Ordre</Label><Input name="sort_order" type="number" min="0" defaultValue={editing?.sort_order ?? 0} /></div>
                <label className="flex items-center gap-2 pt-6"><input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} /> <span className="text-sm">Actif</span></label>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-start">Nom</th><th className="p-3 text-start">Slug</th><th className="p-3">Ordre</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(categories as any[]).map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-xs text-muted-foreground">/categorie/{c.slug}</td>
                <td className="p-3 text-center">{c.sort_order}</td>
                <td className="p-3 text-center"><span className={`text-xs ${c.is_active ? "text-success" : "text-muted-foreground"}`}>{c.is_active ? "Actif" : "Inactif"}</span></td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Aucune catégorie.</td></tr>}
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

function BlogTab() {
  return (
    <Tabs defaultValue="posts">
      <TabsList>
        <TabsTrigger value="posts">Articles</TabsTrigger>
        <TabsTrigger value="cats">Catégories blog</TabsTrigger>
      </TabsList>
      <TabsContent value="posts" className="mt-4"><BlogPostsAdmin /></TabsContent>
      <TabsContent value="cats" className="mt-4"><BlogCategoriesAdmin /></TabsContent>
    </Tabs>
  );
}

function BlogPostsAdmin() {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertPostFn);
  const del = useServerFn(adminDeletePostFn);
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*, blog_categories(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["admin-blog-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("id, name").order("sort_order");
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [catId, setCatId] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  function openNew() { setEditing(null); setCover(null); setCatId(""); setStatus("draft"); setOpen(true); }
  function openEdit(p: any) { setEditing(p); setCover(p.cover_image ?? null); setCatId(p.category_id ?? ""); setStatus(p.status); setOpen(true); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const tagsRaw = String(f.get("tags") || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    try {
      await upsert({ data: {
        id: editing?.id,
        slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
        title: String(f.get("title") || ""),
        excerpt: String(f.get("excerpt") || ""),
        content: String(f.get("content") || ""),
        cover_image: cover,
        category_id: catId && catId !== "__none" ? catId : null,
        tags,
        status,
        meta_title: String(f.get("meta_title") || ""),
        meta_description: String(f.get("meta_description") || ""),
      } });
      toast.success("Article enregistré");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
    } catch (err: any) { toast.error(err.message); }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    try { await del({ data: { id } }); toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-posts"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Nouvel article</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvel"} article</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Titre *</Label><Input name="title" required defaultValue={editing?.title} maxLength={200} /></div>
                <div><Label>Slug *</Label><Input name="slug" required defaultValue={editing?.slug} maxLength={160} /></div>
              </div>
              <div><Label>Image de couverture</Label><SingleImageUploader bucket="blog-images" value={cover} onChange={setCover} /></div>
              <div><Label>Résumé</Label><Textarea name="excerpt" rows={2} defaultValue={editing?.excerpt ?? ""} maxLength={400} /></div>
              <div><Label>Contenu (Markdown)</Label><Textarea name="content" rows={12} defaultValue={editing?.content ?? ""} maxLength={50000} className="font-mono text-xs" /></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={catId} onValueChange={setCatId}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Aucune —</SelectItem>
                      {(cats as any[]).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Tags (virgule)</Label><Input name="tags" defaultValue={editing?.tags?.join(", ") ?? ""} /></div>
                <div>
                  <Label>Statut</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Meta title</Label><Input name="meta_title" defaultValue={editing?.meta_title ?? ""} maxLength={200} /></div>
                <div><Label>Meta description</Label><Input name="meta_description" defaultValue={editing?.meta_description ?? ""} maxLength={300} /></div>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-start">Titre</th><th className="p-3">Catégorie</th><th className="p-3">Statut</th><th className="p-3">Date</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(posts as any[]).map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3"><div className="font-medium">{p.title}</div><div className="text-xs text-muted-foreground">/blog/{p.slug}</div></td>
                <td className="p-3 text-xs text-center">{p.blog_categories?.name ?? "—"}</td>
                <td className="p-3 text-center"><span className={`text-xs ${p.status === "published" ? "text-success" : "text-muted-foreground"}`}>{p.status}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Aucun article.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlogCategoriesAdmin() {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertBlogCategoryFn);
  const del = useServerFn(adminDeleteBlogCategoryFn);
  const { data: cats = [] } = useQuery({
    queryKey: ["admin-blog-cats-full"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await upsert({ data: {
        id: editing?.id,
        slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
        name: String(f.get("name") || ""),
        description: String(f.get("description") || ""),
      } });
      toast.success("Enregistré"); setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-blog-cats-full"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-cats"] });
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} catégorie</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div><Label>Nom *</Label><Input name="name" required defaultValue={editing?.name} maxLength={100} /></div>
              <div><Label>Slug *</Label><Input name="slug" required defaultValue={editing?.slug} maxLength={80} /></div>
              <div><Label>Description</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} maxLength={400} /></div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">Nom</th><th className="p-3 text-start">Slug</th><th className="p-3"></th></tr></thead>
          <tbody>
            {(cats as any[]).map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.slug}</td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Supprimer ?")) { await del({ data: { id: c.id } }); qc.invalidateQueries({ queryKey: ["admin-blog-cats-full"] }); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">Aucune catégorie.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

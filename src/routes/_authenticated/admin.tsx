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
import { adminUpsertLandingFn, adminDeleteLandingFn } from "@/lib/landing.functions";
import { adminUpdateOrderCRMFn, adminListAbandonedFn, adminUpdateAbandonedFn, adminCustomer360Fn, adminUpsertPixelsFn } from "@/lib/crm.functions";
import { adminListCouponsFn, adminUpsertCouponFn, adminDeleteCouponFn } from "@/lib/coupons.functions";
import { adminListAllReviewsFn, adminSetReviewStatusFn } from "@/lib/engagement.functions";
import { ImageUploader, SingleImageUploader } from "@/components/admin/ImageUploader";
import { Loader2, Plus, Trash2, Pencil, ShoppingBag, Package, Truck, DollarSign, Phone, MessageCircle, Search, Star, Tag } from "lucide-react";

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
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="landing">Landing</TabsTrigger>
            <TabsTrigger value="shipping">Livraison</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="promo">Promo</TabsTrigger>
            <TabsTrigger value="reviews">Avis</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
          <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
          <TabsContent value="crm" className="mt-6"><CRMTab /></TabsContent>
          <TabsContent value="landing" className="mt-6"><LandingTab /></TabsContent>
          <TabsContent value="shipping" className="mt-6"><ShippingTab /></TabsContent>
          <TabsContent value="blog" className="mt-6"><BlogTab /></TabsContent>
          <TabsContent value="marketing" className="mt-6"><MarketingTab /></TabsContent>
          <TabsContent value="promo" className="mt-6"><PromoTab /></TabsContent>
          <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
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

// ====== CRM TAB ======
const CRM_STATUSES = [
  { id: "new", label: "Nouveau" },
  { id: "confirmed", label: "Confirmé" },
  { id: "preparing", label: "Préparé" },
  { id: "shipped", label: "Expédié" },
  { id: "delivered", label: "Livré" },
  { id: "cancelled", label: "Annulé" },
  { id: "returned", label: "Retourné" },
] as const;

function CRMTab() {
  const list = useServerFn(adminListOrdersFn);
  const { data: orders = [] } = useQuery({ queryKey: ["crm-orders"], queryFn: () => list({}) });
  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Pipeline</TabsTrigger>
        <TabsTrigger value="abandoned">Paniers abandonnés</TabsTrigger>
        <TabsTrigger value="customer">Client 360°</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban" className="mt-4"><KanbanBoard orders={orders as any[]} /></TabsContent>
      <TabsContent value="abandoned" className="mt-4"><AbandonedList /></TabsContent>
      <TabsContent value="customer" className="mt-4"><Customer360 /></TabsContent>
    </Tabs>
  );
}

function KanbanBoard({ orders }: { orders: any[] }) {
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateOrderCRMFn);
  const [selected, setSelected] = useState<any | null>(null);

  async function move(o: any, status: string) {
    try { await update({ data: { id: o.id, status: status as any } }); toast.success("Déplacé"); qc.invalidateQueries({ queryKey: ["crm-orders"] }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {CRM_STATUSES.map((col) => {
          const items = orders.filter((o) => o.status === col.id);
          return (
            <div key={col.id} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-gold">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((o) => (
                  <button key={o.id} onClick={() => setSelected(o)} className="w-full rounded-lg border border-border bg-surface p-3 text-start text-xs hover:border-gold/40">
                    <div className="font-mono text-gold">{o.order_number}</div>
                    <div className="mt-1 font-medium text-foreground">{o.customer_first_name} {o.customer_last_name}</div>
                    <div className="text-muted-foreground">{o.customer_phone}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">{o.wilayas?.name_fr}</span>
                      <span className="text-gold">{formatDA(Number(o.total))}</span>
                    </div>
                    {o.call_attempts > 0 && <div className="mt-1 text-[10px] text-muted-foreground">📞 {o.call_attempts} tentative{o.call_attempts > 1 ? "s" : ""}</div>}
                  </button>
                ))}
                {items.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">—</div>}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Client</Label><div className="text-foreground">{selected.customer_first_name} {selected.customer_last_name}</div></div>
                  <div><Label>Téléphone</Label><a href={`tel:${selected.customer_phone}`} className="block text-gold">{selected.customer_phone}</a></div>
                  <div><Label>Wilaya</Label><div>{selected.wilayas?.name_fr} — {selected.commune}</div></div>
                  <div><Label>Total</Label><div className="text-gold">{formatDA(Number(selected.total))}</div></div>
                </div>
                <div>
                  <Label>Articles</Label>
                  <div className="space-y-1 text-xs">
                    {(selected.order_items ?? []).map((it: any) => (
                      <div key={it.id} className="flex justify-between"><span>{it.product_name} × {it.quantity}</span><span>{formatDA(Number(it.line_total))}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select defaultValue={selected.status} onValueChange={(v) => move(selected, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CRM_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>N° de suivi</Label>
                  <Input defaultValue={selected.tracking_number ?? ""} placeholder="Tracking" id={`tn-${selected.id}`} />
                  <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
                    const v = (document.getElementById(`tn-${selected.id}`) as HTMLInputElement).value;
                    await update({ data: { id: selected.id, tracking_number: v } });
                    toast.success("Suivi enregistré");
                  }}>Enregistrer</Button>
                </div>
                <div>
                  <Label>Notes internes</Label>
                  <Textarea id={`notes-${selected.id}`} rows={3} defaultValue={selected.internal_notes ?? ""} />
                  <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
                    const v = (document.getElementById(`notes-${selected.id}`) as HTMLTextAreaElement).value;
                    await update({ data: { id: selected.id, internal_notes: v } });
                    toast.success("Notes enregistrées");
                  }}>Enregistrer</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${selected.customer_phone}`}><Button size="sm" variant="outline" onClick={() => update({ data: { id: selected.id, increment_call: true } }).catch(() => {})}><Phone className="me-2 h-3 w-3" /> Appeler</Button></a>
                  <a target="_blank" rel="noreferrer" href={`https://wa.me/${selected.customer_phone.replace(/[^0-9]/g, "")}`}><Button size="sm" variant="outline"><MessageCircle className="me-2 h-3 w-3" /> WhatsApp</Button></a>
                </div>
                <div className="text-xs text-muted-foreground">Tentatives: {selected.call_attempts ?? 0} · Dernier contact: {selected.last_contact_at ? new Date(selected.last_contact_at).toLocaleString("fr-FR") : "—"}</div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AbandonedList() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAbandonedFn);
  const update = useServerFn(adminUpdateAbandonedFn);
  const { data: items = [] } = useQuery({ queryKey: ["abandoned"], queryFn: () => list({}) });

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase text-muted-foreground">
          <tr><th className="p-3 text-start">Client</th><th className="p-3 text-start">Téléphone</th><th className="p-3 text-start">Wilaya</th><th className="p-3">Montant</th><th className="p-3">Statut</th><th className="p-3">Tentatives</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {(items as any[]).map((a) => (
            <tr key={a.id} className="border-t border-border/60">
              <td className="p-3">{a.customer_first_name} {a.customer_last_name}</td>
              <td className="p-3 text-xs">{a.customer_phone}</td>
              <td className="p-3 text-xs">{a.wilayas?.name_fr ?? "—"}</td>
              <td className="p-3 text-center text-gold">{formatDA(Number(a.subtotal))}</td>
              <td className="p-3 text-center">
                <Select defaultValue={a.status} onValueChange={async (v) => { await update({ data: { id: a.id, status: v as any } }); qc.invalidateQueries({ queryKey: ["abandoned"] }); }}>
                  <SelectTrigger className="h-8 w-32 mx-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouveau</SelectItem>
                    <SelectItem value="contacted">Contacté</SelectItem>
                    <SelectItem value="recovered">Récupéré</SelectItem>
                    <SelectItem value="lost">Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="p-3 text-center text-xs">{a.recovery_attempts}</td>
              <td className="p-3 text-end">
                <a target="_blank" rel="noreferrer" href={`https://wa.me/${a.customer_phone.replace(/[^0-9]/g, "")}`} onClick={async () => { await update({ data: { id: a.id, increment_attempt: true } }); qc.invalidateQueries({ queryKey: ["abandoned"] }); }}>
                  <Button size="sm" variant="outline"><MessageCircle className="me-1 h-3 w-3" /> Relancer</Button>
                </a>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Aucun panier abandonné.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Customer360() {
  const search = useServerFn(adminCustomer360Fn);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (phone.length < 6) return;
    setLoading(true);
    try { setResult(await search({ data: { phone } })); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <Input placeholder="Téléphone client (ex: 0555...)" value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-sm" />
        <Button onClick={go} disabled={loading} className="bg-gradient-gold text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="me-2 h-4 w-4" /> Rechercher</>}
        </Button>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">Commandes</div><div className="font-display text-2xl text-gold">{result.orderCount}</div></div>
            <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">Total dépensé (livrées)</div><div className="font-display text-2xl text-gold">{formatDA(result.totalSpent)}</div></div>
            <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">Téléphone</div><div className="font-mono">{phone}</div></div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">N°</th><th className="p-3 text-start">Date</th><th className="p-3">Wilaya</th><th className="p-3">Total</th><th className="p-3">Statut</th></tr></thead>
              <tbody>
                {result.orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="p-3 font-mono text-xs text-gold">{o.order_number}</td>
                    <td className="p-3 text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3 text-xs text-center">{o.wilayas?.name_fr}</td>
                    <td className="p-3 text-center">{formatDA(Number(o.total))}</td>
                    <td className="p-3 text-center text-xs">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== LANDING TAB ======
function LandingTab() {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertLandingFn);
  const del = useServerFn(adminDeleteLandingFn);
  const { data: pages = [] } = useQuery({
    queryKey: ["admin-landings"],
    queryFn: async () => (await supabase.from("landing_pages").select("*, products(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-min"],
    queryFn: async () => (await supabase.from("products").select("id, name").order("name")).data ?? [],
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [theme, setTheme] = useState<"gold-dark" | "minimal-light" | "urgent-red">("gold-dark");
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownEnd, setCountdownEnd] = useState("");
  const [published, setPublished] = useState(false);

  function openNew() {
    setEditing(null); setProductId(""); setTheme("gold-dark"); setHeroImage(null); setSections([]); setShowCountdown(false); setCountdownEnd(""); setPublished(false); setOpen(true);
  }
  function openEdit(p: any) {
    setEditing(p); setProductId(p.product_id); setTheme(p.theme); setHeroImage(p.hero_image); setSections(p.sections ?? []); setShowCountdown(p.show_countdown); setCountdownEnd(p.countdown_end?.slice(0, 16) ?? ""); setPublished(p.is_published); setOpen(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!productId) { toast.error("Choisissez un produit"); return; }
    try {
      await upsert({ data: {
        id: editing?.id,
        product_id: productId,
        slug: String(f.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
        title: String(f.get("title") || ""),
        hero_title: String(f.get("hero_title") || ""),
        hero_subtitle: String(f.get("hero_subtitle") || ""),
        hero_image: heroImage || "",
        cta_text: String(f.get("cta_text") || "Commander maintenant"),
        sections,
        show_countdown: showCountdown,
        countdown_end: countdownEnd ? new Date(countdownEnd).toISOString() : null,
        theme,
        meta_title: String(f.get("meta_title") || ""),
        meta_description: String(f.get("meta_description") || ""),
        is_published: published,
      } });
      toast.success("Landing enregistrée");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-landings"] });
    } catch (err: any) { toast.error(err.message); }
  }

  function addSection(type: string) {
    const defaults: any = {
      benefits: { type, title: "Pourquoi nous", items: [{ title: "Bénéfice 1", description: "Description" }] },
      testimonials: { type, title: "Avis clients", items: [{ name: "Amine", city: "Alger", rating: 5, text: "Super produit !" }] },
      faq: { type, title: "Questions fréquentes", items: [{ q: "Question ?", a: "Réponse." }] },
      gallery: { type, title: "Galerie", items: [] },
      video: { type, title: "Vidéo", content: "https://www.youtube.com/embed/VIDEO_ID" },
      guarantee: { type, title: "Garantie", content: "Satisfait ou remboursé 7 jours." },
    };
    setSections([...sections, defaults[type]]);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Nouvelle landing</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} landing page</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Titre admin *</Label><Input name="title" required defaultValue={editing?.title} maxLength={200} /></div>
                <div><Label>Slug URL *</Label><Input name="slug" required defaultValue={editing?.slug} placeholder="offre-speciale" maxLength={160} /></div>
              </div>
              <div>
                <Label>Produit *</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{(products as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Titre hero</Label><Input name="hero_title" defaultValue={editing?.hero_title ?? ""} maxLength={200} /></div>
                <div><Label>Texte du bouton</Label><Input name="cta_text" defaultValue={editing?.cta_text ?? "Commander maintenant"} maxLength={80} /></div>
              </div>
              <div><Label>Sous-titre hero</Label><Textarea name="hero_subtitle" rows={2} defaultValue={editing?.hero_subtitle ?? ""} maxLength={400} /></div>
              <div><Label>Image hero</Label><SingleImageUploader bucket="product-images" value={heroImage} onChange={setHeroImage} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Thème</Label>
                  <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold-dark">Gold Dark</SelectItem>
                      <SelectItem value="minimal-light">Minimal Light</SelectItem>
                      <SelectItem value="urgent-red">Urgent Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-6">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} /> <span className="text-sm">Compte à rebours</span></label>
                  {showCountdown && <Input type="datetime-local" value={countdownEnd} onChange={(e) => setCountdownEnd(e.target.value)} />}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-base">Sections ({sections.length})</Label>
                  <Select onValueChange={(v) => addSection(v)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="+ Ajouter section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benefits">Bénéfices</SelectItem>
                      <SelectItem value="testimonials">Témoignages</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="gallery">Galerie</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="guarantee">Garantie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {sections.map((s, i) => (
                    <div key={i} className="rounded-md border border-border bg-surface p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-gold">{s.type}</span>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setSections(sections.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                      <Input className="mb-2" value={s.title ?? ""} onChange={(e) => setSections(sections.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Titre section" />
                      <Textarea rows={4} className="font-mono text-xs" value={JSON.stringify(s.items ?? s.content ?? "", null, 2)} onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setSections(sections.map((x, idx) => idx === i ? { ...x, ...(Array.isArray(parsed) ? { items: parsed } : { content: parsed }) } : x));
                        } catch {}
                      }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Meta title</Label><Input name="meta_title" defaultValue={editing?.meta_title ?? ""} maxLength={200} /></div>
                <div><Label>Meta description</Label><Input name="meta_description" defaultValue={editing?.meta_description ?? ""} maxLength={300} /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> <span className="text-sm">Publier</span></label>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-start">Titre</th><th className="p-3 text-start">Produit</th><th className="p-3">Thème</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(pages as any[]).map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3"><div className="font-medium">{p.title}</div><a href={`/lp/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs text-gold hover:underline">/lp/{p.slug}</a></td>
                <td className="p-3 text-xs">{p.products?.name}</td>
                <td className="p-3 text-center text-xs">{p.theme}</td>
                <td className="p-3 text-center"><span className={`text-xs ${p.is_published ? "text-success" : "text-muted-foreground"}`}>{p.is_published ? "Publié" : "Brouillon"}</span></td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Supprimer ?")) { await del({ data: { id: p.id } }); toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["admin-landings"] }); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Aucune landing page.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====== MARKETING TAB ======
function MarketingTab() {
  const upsert = useServerFn(adminUpsertPixelsFn);
  const { data, refetch } = useQuery({
    queryKey: ["pixels-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("value").eq("key", "pixels").maybeSingle()).data?.value as any ?? {},
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await upsert({ data: {
        meta_pixel_id: String(f.get("meta_pixel_id") || ""),
        tiktok_pixel_id: String(f.get("tiktok_pixel_id") || ""),
        ga4_measurement_id: String(f.get("ga4_measurement_id") || ""),
        gtm_id: String(f.get("gtm_id") || ""),
        snap_pixel_id: String(f.get("snap_pixel_id") || ""),
      } });
      toast.success("Pixels enregistrés (rechargez pour activer)");
      refetch();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
        <p className="font-medium text-gold">Pixels marketing</p>
        <p className="mt-1 text-muted-foreground">Collez les identifiants. Les scripts sont chargés automatiquement et les événements e-commerce (ViewContent, AddToCart, InitiateCheckout, Purchase) sont envoyés en DZD.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
        <div><Label>Meta Pixel ID (Facebook + Instagram)</Label><Input name="meta_pixel_id" defaultValue={data?.meta_pixel_id ?? ""} placeholder="123456789012345" maxLength={40} /></div>
        <div><Label>TikTok Pixel ID</Label><Input name="tiktok_pixel_id" defaultValue={data?.tiktok_pixel_id ?? ""} placeholder="C0XXXXX..." maxLength={40} /></div>
        <div><Label>Google Analytics 4 (GA4)</Label><Input name="ga4_measurement_id" defaultValue={data?.ga4_measurement_id ?? ""} placeholder="G-XXXXXXXXXX" maxLength={40} /></div>
        <div><Label>Google Tag Manager</Label><Input name="gtm_id" defaultValue={data?.gtm_id ?? ""} placeholder="GTM-XXXXXX" maxLength={40} /></div>
        <div><Label>Snapchat Pixel ID</Label><Input name="snap_pixel_id" defaultValue={data?.snap_pixel_id ?? ""} maxLength={40} /></div>
        <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
      </form>
    </div>
  );
}

function PromoTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCouponsFn);
  const upsert = useServerFn(adminUpsertCouponFn);
  const del = useServerFn(adminDeleteCouponFn);
  const { data: coupons = [] } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => list({}) });
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      id: editing?.id,
      code: String(fd.get("code") || ""),
      description: String(fd.get("description") || ""),
      type: String(fd.get("type") || "percentage"),
      value: Number(fd.get("value") || 0),
      min_order_amount: Number(fd.get("min_order_amount") || 0),
      max_uses: fd.get("max_uses") ? Number(fd.get("max_uses")) : null,
      expires_at: fd.get("expires_at") ? new Date(String(fd.get("expires_at"))).toISOString() : null,
      is_active: fd.get("is_active") === "on",
    };
    try {
      await upsert({ data: payload });
      toast.success("Code enregistre");
      setOpen(false); setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl flex items-center gap-2"><Tag className="h-5 w-5 text-gold" /> Codes promo</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)} className="bg-gradient-gold text-primary-foreground"><Plus className="me-2 h-4 w-4" /> Nouveau code</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Modifier le code" : "Nouveau code promo"}</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div><Label>Code *</Label><Input name="code" required defaultValue={editing?.code} maxLength={40} placeholder="WELCOME10" /></div>
              <div><Label>Description</Label><Input name="description" defaultValue={editing?.description ?? ""} maxLength={200} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type *</Label>
                  <Select name="type" defaultValue={editing?.type ?? "percentage"}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (DA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Valeur *</Label><Input name="value" type="number" min="0" step="0.01" required defaultValue={editing?.value ?? 10} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Montant min. (DA)</Label><Input name="min_order_amount" type="number" min="0" defaultValue={editing?.min_order_amount ?? 0} /></div>
                <div><Label>Usages max.</Label><Input name="max_uses" type="number" min="1" defaultValue={editing?.max_uses ?? ""} placeholder="illimite" /></div>
              </div>
              <div><Label>Date d'expiration</Label><Input name="expires_at" type="date" defaultValue={editing?.expires_at ? String(editing.expires_at).slice(0,10) : ""} /></div>
              <div className="flex items-center gap-2"><Switch name="is_active" defaultChecked={editing?.is_active ?? true} /><Label>Actif</Label></div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {coupons.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucun code promo</div>}
        {(coupons as any[]).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-gold">{c.code}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {c.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {c.type === "percentage" ? `-${c.value}%` : `-${c.value} DA`}
                {c.min_order_amount > 0 && ` - min ${c.min_order_amount} DA`}
                {c.max_uses && ` - ${c.used_count}/${c.max_uses} utilises`}
                {c.expires_at && ` - expire ${new Date(c.expires_at).toLocaleDateString("fr-FR")}`}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm("Supprimer ce code ?")) return;
                await del({ data: { id: c.id } });
                qc.invalidateQueries({ queryKey: ["admin-coupons"] });
              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAllReviewsFn);
  const setStatus = useServerFn(adminSetReviewStatusFn);
  const { data: reviews = [] } = useQuery({ queryKey: ["admin-reviews"], queryFn: () => list({}) });

  async function changeStatus(id: string, status: "approved" | "rejected" | "pending") {
    await setStatus({ data: { id, status } });
    toast.success("Statut mis a jour");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl flex items-center gap-2"><Star className="h-5 w-5 text-gold" /> Moderation des avis</h2>
      <div className="space-y-2">
        {reviews.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucun avis</div>}
        {(reviews as any[]).map((r) => (
          <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.author_name}</span>
                  <span className="inline-flex">
                    {[1,2,3,4,5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Produit : {r.products?.name} - {new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                r.status === "approved" ? "bg-success/10 text-success" :
                r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              }`}>{r.status}</span>
            </div>
            {r.title && <div className="mt-2 text-sm font-medium">{r.title}</div>}
            {r.comment && <div className="mt-1 text-sm text-muted-foreground">{r.comment}</div>}
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && <Button size="sm" variant="outline" onClick={() => changeStatus(r.id, "approved")}>Approuver</Button>}
              {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => changeStatus(r.id, "rejected")}>Rejeter</Button>}
              {r.status !== "pending" && <Button size="sm" variant="ghost" onClick={() => changeStatus(r.id, "pending")}>En attente</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

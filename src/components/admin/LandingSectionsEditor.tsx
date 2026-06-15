import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";

export type Section = {
  type: "benefits" | "testimonials" | "faq" | "gallery" | "video" | "guarantee" | "comparison";
  title?: string;
  items?: any[];
  content?: string;
};

const TEMPLATES: { name: string; sections: Section[] }[] = [
  {
    name: "Produit physique (complet)",
    sections: [
      { type: "benefits", title: "Pourquoi nous choisir", items: [
        { title: "Qualité premium", description: "Matériaux sélectionnés rigoureusement." },
        { title: "Livraison rapide", description: "Sous 48-72h dans toutes les wilayas." },
        { title: "Garantie 7 jours", description: "Satisfait ou remboursé." },
      ]},
      { type: "testimonials", title: "Ils nous font confiance", items: [
        { name: "Amine", city: "Alger", rating: 5, text: "Excellent produit, livraison rapide !" },
        { name: "Sara", city: "Oran", rating: 5, text: "Je recommande à 100%." },
        { name: "Karim", city: "Constantine", rating: 4, text: "Très bon rapport qualité-prix." },
      ]},
      { type: "faq", title: "Questions fréquentes", items: [
        { q: "Comment se passe la livraison ?", a: "Livraison à domicile ou au bureau, paiement à la réception." },
        { q: "Combien de temps ?", a: "Entre 48h et 72h selon votre wilaya." },
      ]},
      { type: "guarantee", title: "Notre engagement", content: "Satisfait ou remboursé pendant 7 jours." },
    ],
  },
  {
    name: "Urgence / Promo flash",
    sections: [
      { type: "benefits", title: "Cette offre inclut", items: [
        { title: "-50% aujourd'hui", description: "Prix exclusif valable jusqu'à minuit." },
        { title: "Cadeau offert", description: "Un bonus surprise dans chaque colis." },
        { title: "Livraison gratuite", description: "Sur toutes les commandes du jour." },
      ]},
      { type: "testimonials", title: "Avis vérifiés", items: [
        { name: "Yacine", city: "Sétif", rating: 5, text: "J'ai commandé hier, déjà reçu !" },
      ]},
    ],
  },
  {
    name: "Vidéo + témoignages",
    sections: [
      { type: "video", title: "Découvrez en vidéo", content: "https://www.youtube.com/embed/VIDEO_ID" },
      { type: "testimonials", title: "Témoignages clients", items: [
        { name: "Nadia", city: "Annaba", rating: 5, text: "Magnifique, exactement comme décrit." },
      ]},
      { type: "faq", title: "FAQ", items: [{ q: "Question ?", a: "Réponse." }] },
    ],
  },
];

const DEFAULT_SECTION: Record<string, Section> = {
  benefits: { type: "benefits", title: "Pourquoi nous", items: [{ title: "Bénéfice", description: "Description" }] },
  testimonials: { type: "testimonials", title: "Avis clients", items: [{ name: "Amine", city: "Alger", rating: 5, text: "Super produit !" }] },
  faq: { type: "faq", title: "Questions fréquentes", items: [{ q: "Question ?", a: "Réponse." }] },
  gallery: { type: "gallery", title: "Galerie", items: [] },
  video: { type: "video", title: "Vidéo", content: "https://www.youtube.com/embed/VIDEO_ID" },
  guarantee: { type: "guarantee", title: "Garantie", content: "Satisfait ou remboursé 7 jours." },
};

export function LandingSectionsEditor({
  sections,
  onChange,
}: {
  sections: Section[];
  onChange: (s: Section[]) => void;
}) {
  function update(i: number, patch: Partial<Section>) {
    onChange(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function updateItem(i: number, j: number, patch: any) {
    const items = [...(sections[i].items ?? [])];
    items[j] = { ...items[j], ...patch };
    update(i, { items });
  }
  function addItem(i: number, item: any) {
    update(i, { items: [...(sections[i].items ?? []), item] });
  }
  function removeItem(i: number, j: number) {
    update(i, { items: (sections[i].items ?? []).filter((_, idx) => idx !== j) });
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function duplicate(i: number) {
    const next = [...sections];
    next.splice(i + 1, 0, JSON.parse(JSON.stringify(sections[i])));
    onChange(next);
  }
  function remove(i: number) {
    onChange(sections.filter((_, idx) => idx !== i));
  }
  function addSection(type: string) {
    onChange([...sections, JSON.parse(JSON.stringify(DEFAULT_SECTION[type]))]);
  }
  function applyTemplate(name: string) {
    const t = TEMPLATES.find((x) => x.name === name);
    if (!t) return;
    onChange([...sections, ...JSON.parse(JSON.stringify(t.sections))]);
  }

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base">Sections ({sections.length})</Label>
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className="w-56"><SelectValue placeholder="📋 Charger un template" /></SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={addSection}>
            <SelectTrigger className="w-48"><SelectValue placeholder="+ Ajouter bloc" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="benefits">✨ Bénéfices</SelectItem>
              <SelectItem value="testimonials">⭐ Témoignages</SelectItem>
              <SelectItem value="faq">❓ FAQ</SelectItem>
              <SelectItem value="gallery">🖼️ Galerie</SelectItem>
              <SelectItem value="video">▶️ Vidéo</SelectItem>
              <SelectItem value="guarantee">🛡️ Garantie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="rounded-md border border-border bg-surface p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                #{i + 1} · {s.type}
              </span>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === sections.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => duplicate(i)}><Copy className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>

            <div className="mb-3">
              <Label className="text-xs">Titre de la section</Label>
              <Input value={s.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} maxLength={200} />
            </div>

            {s.type === "benefits" && (
              <div className="space-y-2">
                {(s.items ?? []).map((it, j) => (
                  <div key={j} className="grid gap-2 rounded border border-border/60 p-2 md:grid-cols-[1fr_2fr_auto]">
                    <Input placeholder="Titre" value={it.title ?? ""} onChange={(e) => updateItem(i, j, { title: e.target.value })} />
                    <Input placeholder="Description" value={it.description ?? ""} onChange={(e) => updateItem(i, j, { description: e.target.value })} />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i, j)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addItem(i, { title: "", description: "" })}><Plus className="me-1 h-3 w-3" /> Bénéfice</Button>
              </div>
            )}

            {s.type === "testimonials" && (
              <div className="space-y-2">
                {(s.items ?? []).map((it, j) => (
                  <div key={j} className="space-y-2 rounded border border-border/60 p-2">
                    <div className="grid gap-2 md:grid-cols-3">
                      <Input placeholder="Nom" value={it.name ?? ""} onChange={(e) => updateItem(i, j, { name: e.target.value })} />
                      <Input placeholder="Ville" value={it.city ?? ""} onChange={(e) => updateItem(i, j, { city: e.target.value })} />
                      <Input type="number" min={1} max={5} placeholder="Note" value={it.rating ?? 5} onChange={(e) => updateItem(i, j, { rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)) })} />
                    </div>
                    <Textarea rows={2} placeholder="Témoignage" value={it.text ?? ""} onChange={(e) => updateItem(i, j, { text: e.target.value })} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i, j)}><Trash2 className="me-1 h-3 w-3 text-destructive" /> Supprimer</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addItem(i, { name: "", city: "", rating: 5, text: "" })}><Plus className="me-1 h-3 w-3" /> Témoignage</Button>
              </div>
            )}

            {s.type === "faq" && (
              <div className="space-y-2">
                {(s.items ?? []).map((it, j) => (
                  <div key={j} className="space-y-2 rounded border border-border/60 p-2">
                    <Input placeholder="Question" value={it.q ?? ""} onChange={(e) => updateItem(i, j, { q: e.target.value })} />
                    <Textarea rows={2} placeholder="Réponse" value={it.a ?? ""} onChange={(e) => updateItem(i, j, { a: e.target.value })} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i, j)}><Trash2 className="me-1 h-3 w-3 text-destructive" /> Supprimer</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addItem(i, { q: "", a: "" })}><Plus className="me-1 h-3 w-3" /> Question</Button>
              </div>
            )}

            {s.type === "gallery" && (
              <ImageUploader
                bucket="product-images"
                value={(s.items ?? []) as string[]}
                onChange={(urls) => update(i, { items: urls })}
                max={12}
              />
            )}

            {s.type === "video" && (
              <div>
                <Label className="text-xs">URL d'intégration (YouTube embed)</Label>
                <Input placeholder="https://www.youtube.com/embed/..." value={s.content ?? ""} onChange={(e) => update(i, { content: e.target.value })} />
              </div>
            )}

            {s.type === "guarantee" && (
              <div>
                <Label className="text-xs">Texte de la garantie</Label>
                <Textarea rows={3} value={s.content ?? ""} onChange={(e) => update(i, { content: e.target.value })} maxLength={500} />
              </div>
            )}
          </div>
        ))}

        {sections.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucun bloc. Choisissez un template ou ajoutez un bloc manuellement.
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminFn } from "@/lib/roles.functions";
import { editorConfig, findPage, findSection, type EditorType } from "@/lib/editorConfig";
import { getDefault } from "@/lib/editorDefaults";
import { invalidateContentCache } from "@/hooks/useSectionContent";
import { HeroEditor } from "@/components/editor/sections/HeroEditor";
import { ItemsListEditor } from "@/components/editor/sections/ItemsListEditor";
import { FAQEditor } from "@/components/editor/sections/FAQEditor";
import { TextBlockEditor } from "@/components/editor/sections/TextBlockEditor";
import { ProgrammesEditor } from "@/components/editor/sections/ProgrammesEditor";
import { CTAEditor } from "@/components/editor/sections/CTAEditor";
import { Loader2, Save, RotateCcw, Monitor, Tablet, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin_/cms")({
  head: () => ({ meta: [{ title: "CMS — Malak Digital" }, { name: "robots", content: "noindex" }] }),
  component: PageEditorPage,
});

const editorMap: Record<EditorType, React.ComponentType<{ value: any; onChange: (v: any) => void }>> = {
  hero: HeroEditor,
  "items-list": ItemsListEditor,
  faq: FAQEditor,
  "text-block": TextBlockEditor,
  programmes: ProgrammesEditor,
  cta: CTAEditor,
};

type Viewport = "desktop" | "tablet" | "mobile";

function PageEditorPage() {
  const navigate = useNavigate();
  const isAdmin = useServerFn(isAdminFn);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    isAdmin({}).then((r: { isAdmin: boolean }) => {
      if (!r.isAdmin) { toast.error("Accès refusé"); navigate({ to: "/" }); }
      else setAuthorized(true);
    }).catch(() => { navigate({ to: "/auth" }); });
  }, [isAdmin, navigate]);

  const [portal, setPortal] = useState(editorConfig[0]?.key ?? "");
  const pages = useMemo(() => editorConfig.find((p) => p.key === portal)?.pages ?? [], [portal]);
  const [pageKey, setPageKey] = useState(pages[0]?.key ?? "");
  const page = useMemo(() => findPage(portal, pageKey), [portal, pageKey]);
  const sections = page?.sections ?? [];
  const [sectionKey, setSectionKey] = useState(sections[0]?.key ?? "");
  const section = useMemo(() => findSection(portal, pageKey, sectionKey), [portal, pageKey, sectionKey]);

  const [draft, setDraft] = useState<any>(null);
  const [original, setOriginal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync when page changes
  useEffect(() => {
    const first = (editorConfig.find((p) => p.key === portal)?.pages ?? [])[0];
    if (first && !findPage(portal, pageKey)) setPageKey(first.key);
  }, [portal, pageKey]);
  useEffect(() => {
    const firstSection = page?.sections[0];
    if (firstSection && !findSection(portal, pageKey, sectionKey)) setSectionKey(firstSection.key);
  }, [page, portal, pageKey, sectionKey]);

  // Load content for current section
  useEffect(() => {
    if (!portal || !pageKey || !sectionKey) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("portal", portal).eq("page_key", pageKey).eq("section_key", sectionKey)
        .maybeSingle();
      if (cancelled) return;
      const def = getDefault(portal, pageKey, sectionKey);
      const merged = data?.content ? { ...(def as object), ...(data.content as object) } : def;
      setDraft(merged);
      setOriginal(JSON.parse(JSON.stringify(merged)));
    })();
    return () => { cancelled = true; };
  }, [portal, pageKey, sectionKey]);

  // Live preview postMessage on draft change
  useEffect(() => {
    if (!draft || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "cms-preview-update", portal, pageKey, sectionKey, content: draft },
      window.location.origin,
    );
  }, [draft, portal, pageKey, sectionKey]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(original);

  function safeSwitch(fn: () => void) {
    if (dirty && !confirm("Modifications non sauvegardées. Continuer ?")) return;
    fn();
  }

  async function onSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("site_content").upsert(
        { portal, page_key: pageKey, section_key: sectionKey, content: draft, updated_by: user?.id ?? null },
        { onConflict: "portal,page_key,section_key" },
      );
      if (error) throw error;
      invalidateContentCache(portal, pageKey, sectionKey);
      setOriginal(JSON.parse(JSON.stringify(draft)));
      toast.success("Sauvegardé");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const Editor = section ? editorMap[section.type] : null;
  const previewSrc = page ? `${page.previewPath}?editor=1` : "/";
  const vpWidth = viewport === "mobile" ? 375 : viewport === "tablet" ? 768 : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 grid grid-cols-[260px_1fr_380px] gap-4 p-4 max-w-[1800px] mx-auto w-full">
        {/* Selectors */}
        <aside className="space-y-4">
          <h1 className="text-lg font-display font-semibold">CMS</h1>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Portail</Label>
            <Select value={portal} onValueChange={(v) => safeSwitch(() => setPortal(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{editorConfig.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Page</Label>
            <Select value={pageKey} onValueChange={(v) => safeSwitch(() => setPageKey(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{pages.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Section</Label>
            <div className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => safeSwitch(() => setSectionKey(s.key))}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${sectionKey === s.key ? "bg-primary text-primary-foreground" : "hover:bg-surface"}`}
                >
                  {s.label}
                  <span className="ml-2 text-xs opacity-60">{s.type}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Preview */}
        <section className="flex flex-col rounded-lg border border-border bg-surface/30 overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <ToggleGroup type="single" value={viewport} onValueChange={(v) => v && setViewport(v as Viewport)}>
              <ToggleGroupItem value="desktop" size="sm"><Monitor className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="tablet" size="sm"><Tablet className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="mobile" size="sm"><Smartphone className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            <span className="text-xs text-muted-foreground truncate">{previewSrc}</span>
          </div>
          <div className="flex-1 overflow-auto bg-background flex justify-center">
            <iframe
              ref={iframeRef}
              src={previewSrc}
              title="Preview"
              className="h-full bg-background"
              style={{ width: vpWidth ? `${vpWidth}px` : "100%", maxWidth: "100%" }}
            />
          </div>
        </section>

        {/* Form */}
        <aside className="space-y-3 rounded-lg border border-border p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{section?.label ?? "—"}</h2>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setDraft(JSON.parse(JSON.stringify(original)))} disabled={!dirty}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Sauvegarder
              </Button>
            </div>
          </div>
          {Editor && draft ? <Editor value={draft} onChange={setDraft} /> : <div className="text-sm text-muted-foreground">Sélectionne une section.</div>}
        </aside>
      </main>
      <Footer />
    </div>
  );
}

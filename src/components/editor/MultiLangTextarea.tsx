import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import type { ML } from "@/lib/editorDefaults";

export function MultiLangTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label?: string;
  value: ML;
  onChange: (v: ML) => void;
  rows?: number;
}) {
  const v: ML = value ?? { fr: "", en: "" };
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <Tabs defaultValue="fr">
        <TabsList className="h-7">
          <TabsTrigger value="fr" className="text-xs h-5 px-2">FR</TabsTrigger>
          <TabsTrigger value="en" className="text-xs h-5 px-2">EN</TabsTrigger>
        </TabsList>
        <TabsContent value="fr" className="mt-1.5">
          <Textarea rows={rows} value={v.fr} onChange={(e) => onChange({ ...v, fr: e.target.value })} />
        </TabsContent>
        <TabsContent value="en" className="mt-1.5">
          <Textarea rows={rows} value={v.en} onChange={(e) => onChange({ ...v, en: e.target.value })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import type { ML } from "@/lib/editorDefaults";

export function MultiLangInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: ML;
  onChange: (v: ML) => void;
  placeholder?: string;
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
          <Input value={v.fr} placeholder={placeholder} onChange={(e) => onChange({ ...v, fr: e.target.value })} />
        </TabsContent>
        <TabsContent value="en" className="mt-1.5">
          <Input value={v.en} placeholder={placeholder} onChange={(e) => onChange({ ...v, en: e.target.value })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

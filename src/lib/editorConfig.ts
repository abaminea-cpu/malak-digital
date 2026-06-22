export type EditorType = "hero" | "items-list" | "faq" | "text-block" | "programmes" | "cta";

export interface SectionConfig {
  key: string;
  label: string;
  type: EditorType;
}

export interface PageConfig {
  key: string;
  label: string;
  /** Route à charger dans l'iframe preview (sans le ?editor=1) */
  previewPath: string;
  sections: SectionConfig[];
}

export interface PortalConfig {
  key: string;
  label: string;
  pages: PageConfig[];
}

export const editorConfig: PortalConfig[] = [
  {
    key: "storefront",
    label: "Boutique Malak",
    pages: [
      {
        key: "home",
        label: "Accueil",
        previewPath: "/",
        sections: [
          { key: "hero", label: "Hero", type: "hero" },
          { key: "trust", label: "Bandeau confiance", type: "items-list" },
          { key: "cta", label: "Bloc CTA", type: "cta" },
          { key: "faq", label: "FAQ", type: "faq" },
        ],
      },
      {
        key: "about",
        label: "À propos",
        previewPath: "/about",
        sections: [
          { key: "intro", label: "Introduction", type: "text-block" },
          { key: "values", label: "Valeurs", type: "items-list" },
        ],
      },
    ],
  },
];

export function findPage(portal: string, pageKey: string): PageConfig | undefined {
  return editorConfig.find((p) => p.key === portal)?.pages.find((pg) => pg.key === pageKey);
}
export function findSection(portal: string, pageKey: string, sectionKey: string): SectionConfig | undefined {
  return findPage(portal, pageKey)?.sections.find((s) => s.key === sectionKey);
}

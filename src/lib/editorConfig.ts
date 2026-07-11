export type EditorType =
  | "hero"
  | "items-list"
  | "faq"
  | "text-block"
  | "programmes"
  | "cta"
  | "banner"
  | "testimonials"
  | "gallery"
  | "video"
  | "seo";

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

const seoSection: SectionConfig = { key: "seo", label: "SEO / Meta", type: "seo" };

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
          seoSection,
          { key: "banner", label: "Bannière promo", type: "banner" },
          { key: "hero", label: "Hero", type: "hero" },
          { key: "trust", label: "Bandeau confiance", type: "items-list" },
          { key: "testimonials", label: "Témoignages", type: "testimonials" },
          { key: "gallery", label: "Galerie", type: "gallery" },
          { key: "video", label: "Vidéo", type: "video" },
          { key: "cta", label: "Bloc CTA", type: "cta" },
          { key: "faq", label: "FAQ", type: "faq" },
        ],
      },
      {
        key: "about",
        label: "À propos",
        previewPath: "/about",
        sections: [
          seoSection,
          { key: "intro", label: "Introduction", type: "text-block" },
          { key: "values", label: "Valeurs", type: "items-list" },
          { key: "testimonials", label: "Témoignages", type: "testimonials" },
        ],
      },
      {
        key: "shop",
        label: "Boutique",
        previewPath: "/shop",
        sections: [
          seoSection,
          { key: "banner", label: "Bannière promo", type: "banner" },
          { key: "header", label: "En-tête", type: "text-block" },
        ],
      },
      {
        key: "contact",
        label: "Contact",
        previewPath: "/contact",
        sections: [
          seoSection,
          { key: "intro", label: "Introduction", type: "text-block" },
          { key: "faq", label: "FAQ", type: "faq" },
        ],
      },
      {
        key: "echange",
        label: "Demande d'échange",
        previewPath: "/echange",
        sections: [
          seoSection,
          { key: "intro", label: "Introduction", type: "text-block" },
          { key: "faq", label: "FAQ", type: "faq" },
        ],
      },
      {
        key: "blog",
        label: "Blog",
        previewPath: "/blog",
        sections: [
          seoSection,
          { key: "header", label: "En-tête", type: "text-block" },
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

export type ML = { fr: string; en: string };

export type HeroContent = {
  tagline: ML;
  title: ML;
  subtitle: ML;
  ctaText: ML;
  ctaLink: string;
  image: string | null;
};

export type ItemsListContent = {
  title: ML;
  items: Array<{ id: string; title: ML; description: ML; image: string | null; link: string }>;
};

export type FAQContent = {
  title: ML;
  items: Array<{ id: string; question: ML; answer: ML }>;
};

export type TextBlockContent = {
  title: ML;
  body: ML;
};

export type ProgrammesContent = {
  title: ML;
  cards: Array<{ id: string; title: ML; description: ML; image: string | null; link: string }>;
};

export type CTAContent = {
  title: ML;
  subtitle: ML;
  ctaText: ML;
  ctaLink: string;
};

type AnyContent =
  | HeroContent
  | ItemsListContent
  | FAQContent
  | TextBlockContent
  | ProgrammesContent
  | CTAContent;

const ml = (fr: string, en: string): ML => ({ fr, en });
const uid = () => Math.random().toString(36).slice(2, 10);

export const editorDefaults: Record<string, Record<string, Record<string, AnyContent>>> = {
  storefront: {
    home: {
      hero: {
        tagline: ml("L'excellence digitale algérienne", "Algerian digital excellence"),
        title: ml("Le luxe, livré chez vous.", "Luxury, delivered to your door."),
        subtitle: ml(
          "Une expérience d'achat haut de gamme, pensée pour l'Algérie. Paiement à la livraison dans les 69 wilayas.",
          "A premium shopping experience built for Algeria. Cash on delivery across 69 wilayas.",
        ),
        ctaText: ml("Découvrir la boutique", "Browse the shop"),
        ctaLink: "/shop",
        image: null,
      } as HeroContent,
      trust: {
        title: ml("Pourquoi Malak Digital", "Why Malak Digital"),
        items: [
          { id: uid(), title: ml("Paiement à la livraison", "Cash on delivery"), description: ml("Réglez en espèces à réception.", "Pay cash on arrival."), image: null, link: "" },
          { id: uid(), title: ml("Livraison 69 wilayas", "Delivery to 69 wilayas"), description: ml("Domicile ou bureau.", "Home or office."), image: null, link: "" },
          { id: uid(), title: ml("Qualité garantie", "Quality guaranteed"), description: ml("Produits sélectionnés.", "Curated products."), image: null, link: "" },
          { id: uid(), title: ml("Support 7j/7", "Support 7/7"), description: ml("Une équipe à votre écoute.", "A team ready to help."), image: null, link: "" },
        ],
      } as ItemsListContent,
      cta: {
        title: ml("Prêt à commander ?", "Ready to order?"),
        subtitle: ml("Paiement à la livraison, partout en Algérie.", "Cash on delivery, anywhere in Algeria."),
        ctaText: ml("Voir la boutique", "Visit the shop"),
        ctaLink: "/shop",
      } as CTAContent,
      faq: {
        title: ml("Questions fréquentes", "Frequently asked questions"),
        items: [
          { id: uid(), question: ml("Comment payer ?", "How do I pay?"), answer: ml("Paiement à la livraison en espèces.", "Cash on delivery.") },
        ],
      } as FAQContent,
    },
    about: {
      intro: {
        title: ml("À propos de Malak Digital", "About Malak Digital"),
        body: ml("Notre mission est de rendre le luxe accessible.", "Our mission is to make luxury accessible."),
      } as TextBlockContent,
      values: {
        title: ml("Nos valeurs", "Our values"),
        items: [],
      } as ItemsListContent,
    },
  },
};

export function getDefault<T = AnyContent>(portal: string, pageKey: string, sectionKey: string): T | null {
  const v = editorDefaults[portal]?.[pageKey]?.[sectionKey];
  return (v as T | undefined) ?? null;
}

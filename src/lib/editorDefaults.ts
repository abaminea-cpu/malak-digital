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

export type BannerContent = {
  enabled: boolean;
  message: ML;
  ctaText: ML;
  ctaLink: string;
  bgColor: string;
  textColor: string;
};

export type TestimonialsContent = {
  title: ML;
  items: Array<{ id: string; author: string; role: string; avatar: string | null; rating: number; quote: ML }>;
};

export type GalleryContent = {
  title: ML;
  columns: number;
  images: Array<{ id: string; url: string; caption: ML }>;
};

export type VideoContent = {
  title: ML;
  subtitle: ML;
  videoUrl: string;
  poster: string | null;
  autoplay: boolean;
};

export type SEOContent = {
  metaTitle: ML;
  metaDescription: ML;
  ogImage: string | null;
  keywords: string;
  noindex: boolean;
};

type AnyContent =
  | HeroContent
  | ItemsListContent
  | FAQContent
  | TextBlockContent
  | ProgrammesContent
  | CTAContent
  | BannerContent
  | TestimonialsContent
  | GalleryContent
  | VideoContent
  | SEOContent;

const ml = (fr: string, en: string): ML => ({ fr, en });
const uid = () => Math.random().toString(36).slice(2, 10);

const seoDefault = (fr: string, en: string, desc: string): SEOContent => ({
  metaTitle: ml(fr, en),
  metaDescription: ml(desc, desc),
  ogImage: null,
  keywords: "",
  noindex: false,
});

export const editorDefaults: Record<string, Record<string, Record<string, AnyContent>>> = {
  storefront: {
    home: {
      seo: seoDefault("Malak Digital — Le luxe livré chez vous", "Malak Digital — Luxury delivered", "Boutique haut de gamme avec paiement à la livraison en Algérie."),
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
      banner: {
        enabled: false,
        message: ml("🎉 Livraison offerte à partir de 5000 DA", "🎉 Free delivery from 5000 DA"),
        ctaText: ml("Profiter", "Shop now"),
        ctaLink: "/shop",
        bgColor: "#D4AF37",
        textColor: "#000000",
      } as BannerContent,
      trust: {
        title: ml("Pourquoi Malak Digital", "Why Malak Digital"),
        items: [
          { id: uid(), title: ml("Paiement à la livraison", "Cash on delivery"), description: ml("Réglez en espèces à réception.", "Pay cash on arrival."), image: null, link: "" },
          { id: uid(), title: ml("Livraison 69 wilayas", "Delivery to 69 wilayas"), description: ml("Domicile ou bureau.", "Home or office."), image: null, link: "" },
          { id: uid(), title: ml("Qualité garantie", "Quality guaranteed"), description: ml("Produits sélectionnés.", "Curated products."), image: null, link: "" },
          { id: uid(), title: ml("Support 7j/7", "Support 7/7"), description: ml("Une équipe à votre écoute.", "A team ready to help."), image: null, link: "" },
        ],
      } as ItemsListContent,
      testimonials: {
        title: ml("Ils nous font confiance", "They trust us"),
        items: [
          { id: uid(), author: "Yasmine", role: "Alger", avatar: null, rating: 5, quote: ml("Livraison rapide et produit conforme !", "Fast delivery and matching product!") },
        ],
      } as TestimonialsContent,
      gallery: {
        title: ml("Notre univers", "Our world"),
        columns: 3,
        images: [],
      } as GalleryContent,
      video: {
        title: ml("Découvrez Malak", "Discover Malak"),
        subtitle: ml("En quelques secondes", "In a few seconds"),
        videoUrl: "",
        poster: null,
        autoplay: false,
      } as VideoContent,
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
      seo: seoDefault("À propos — Malak Digital", "About — Malak Digital", "Notre mission : rendre le luxe accessible."),
      intro: {
        title: ml("À propos de Malak Digital", "About Malak Digital"),
        body: ml("Notre mission est de rendre le luxe accessible.", "Our mission is to make luxury accessible."),
      } as TextBlockContent,
      values: {
        title: ml("Nos valeurs", "Our values"),
        items: [],
      } as ItemsListContent,
      testimonials: {
        title: ml("Témoignages", "Testimonials"),
        items: [],
      } as TestimonialsContent,
    },
    shop: {
      seo: seoDefault("Boutique — Malak Digital", "Shop — Malak Digital", "Découvrez tous nos produits."),
      header: {
        title: ml("Notre boutique", "Our shop"),
        body: ml("Explorez notre sélection de produits premium.", "Browse our premium selection."),
      } as TextBlockContent,
      banner: {
        enabled: false,
        message: ml("Nouvelle collection disponible", "New collection available"),
        ctaText: ml("Voir", "View"),
        ctaLink: "/shop",
        bgColor: "#D4AF37",
        textColor: "#000000",
      } as BannerContent,
    },
    contact: {
      seo: seoDefault("Contact — Malak Digital", "Contact — Malak Digital", "Contactez notre équipe."),
      intro: {
        title: ml("Contactez-nous", "Contact us"),
        body: ml("Notre équipe est à votre écoute 7j/7.", "Our team is here 7 days a week."),
      } as TextBlockContent,
      faq: {
        title: ml("Questions fréquentes", "Frequently asked questions"),
        items: [],
      } as FAQContent,
    },
    echange: {
      seo: seoDefault("Demande d'échange — Malak Digital", "Exchange request — Malak Digital", "Demandez l'échange d'un produit en quelques clics."),
      intro: {
        title: ml("Demande d'échange", "Exchange request"),
        body: ml("Sous 7 jours après réception, échangez votre produit facilement.", "Within 7 days after delivery, exchange your product easily."),
      } as TextBlockContent,
      faq: {
        title: ml("FAQ échange", "Exchange FAQ"),
        items: [],
      } as FAQContent,
    },
    blog: {
      seo: seoDefault("Blog — Malak Digital", "Blog — Malak Digital", "Actualités et conseils."),
      header: {
        title: ml("Le blog Malak", "The Malak blog"),
        body: ml("Astuces, tendances et actualités.", "Tips, trends and news."),
      } as TextBlockContent,
    },
  },
};

export function getDefault<T = AnyContent>(portal: string, pageKey: string, sectionKey: string): T | null {
  const v = editorDefaults[portal]?.[pageKey]?.[sectionKey];
  return (v as T | undefined) ?? null;
}

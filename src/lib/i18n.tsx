import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "fr" | "ar" | "en";

const DICT = {
  fr: {
    "nav.home": "Accueil",
    "nav.shop": "Boutique",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.account": "Mon compte",
    "nav.admin": "Admin",
    "nav.signin": "Connexion",
    "nav.signout": "Déconnexion",
    "hero.tagline": "L'excellence digitale algérienne",
    "hero.title": "Le luxe, livré chez vous.",
    "hero.subtitle": "Une expérience d'achat haut de gamme, pensée pour l'Algérie. Paiement à la livraison dans les 69 wilayas.",
    "hero.cta": "Découvrir la boutique",
    "hero.cta_secondary": "Nos nouveautés",
    "section.featured": "Produits vedettes",
    "section.new": "Nouveautés",
    "section.categories": "Catégories",
    "section.why": "Pourquoi Malak Digital",
    "why.cod.title": "Paiement à la livraison",
    "why.cod.desc": "Réglez en espèces quand vous recevez votre commande.",
    "why.shipping.title": "Livraison 69 wilayas",
    "why.shipping.desc": "Domicile ou bureau, partout en Algérie.",
    "why.quality.title": "Qualité garantie",
    "why.quality.desc": "Produits soigneusement sélectionnés.",
    "why.support.title": "Support 7j/7",
    "why.support.desc": "Une équipe à votre écoute.",
    "product.buy_now": "Commander maintenant",
    "product.add_to_cart": "Ajouter au panier",
    "product.in_stock": "En stock",
    "product.out_of_stock": "Rupture",
    "product.description": "Description",
    "product.shipping": "Livraison",
    "checkout.title": "Commande — Paiement à la livraison",
    "checkout.firstname": "Prénom",
    "checkout.lastname": "Nom",
    "checkout.phone": "Téléphone",
    "checkout.phone_alt": "Téléphone secondaire (optionnel)",
    "checkout.email": "Email (optionnel)",
    "checkout.wilaya": "Wilaya",
    "checkout.commune": "Commune",
    "checkout.address": "Adresse",
    "checkout.quantity": "Quantité",
    "checkout.notes": "Note client",
    "checkout.shipping_method": "Mode de livraison",
    "checkout.home": "Domicile",
    "checkout.office": "Bureau",
    "checkout.subtotal": "Sous-total",
    "checkout.shipping_cost": "Frais de livraison",
    "checkout.total": "Total",
    "checkout.submit": "Confirmer la commande",
    "checkout.success": "Commande confirmée !",
    "checkout.success_desc": "Nous vous appellerons bientôt pour confirmer la livraison.",
    "checkout.required": "Champ requis",
    "shop.title": "Notre boutique",
    "shop.filter": "Filtres",
    "shop.search": "Rechercher un produit…",
    "shop.no_results": "Aucun produit trouvé.",
    "shop.price": "Prix",
    "shop.category": "Catégorie",
    "shop.all": "Toutes",
    "footer.about": "Malak Digital — la boutique en ligne premium d'Algérie.",
    "footer.links": "Liens utiles",
    "footer.contact": "Contact",
    "footer.rights": "Tous droits réservés.",
    "currency": "DA",
  },
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.account": "My account",
    "nav.admin": "Admin",
    "nav.signin": "Sign in",
    "nav.signout": "Sign out",
    "hero.tagline": "Algerian digital excellence",
    "hero.title": "Luxury, delivered home.",
    "hero.subtitle": "A premium shopping experience for Algeria. Cash on delivery across all 69 wilayas.",
    "hero.cta": "Browse the shop",
    "hero.cta_secondary": "What's new",
    "section.featured": "Featured products",
    "section.new": "New arrivals",
    "section.categories": "Categories",
    "section.why": "Why Malak Digital",
    "why.cod.title": "Cash on delivery",
    "why.cod.desc": "Pay in cash when you receive your order.",
    "why.shipping.title": "69 wilayas covered",
    "why.shipping.desc": "Home or office, anywhere in Algeria.",
    "why.quality.title": "Quality guaranteed",
    "why.quality.desc": "Carefully curated products.",
    "why.support.title": "Support 7/7",
    "why.support.desc": "A team here for you.",
    "product.buy_now": "Order now",
    "product.add_to_cart": "Add to cart",
    "product.in_stock": "In stock",
    "product.out_of_stock": "Out of stock",
    "product.description": "Description",
    "product.shipping": "Shipping",
    "checkout.title": "Order — Cash on delivery",
    "checkout.firstname": "First name",
    "checkout.lastname": "Last name",
    "checkout.phone": "Phone",
    "checkout.phone_alt": "Alternate phone (optional)",
    "checkout.email": "Email (optional)",
    "checkout.wilaya": "Wilaya",
    "checkout.commune": "Commune",
    "checkout.address": "Address",
    "checkout.quantity": "Quantity",
    "checkout.notes": "Note",
    "checkout.shipping_method": "Shipping method",
    "checkout.home": "Home",
    "checkout.office": "Office",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping_cost": "Shipping",
    "checkout.total": "Total",
    "checkout.submit": "Confirm order",
    "checkout.success": "Order confirmed!",
    "checkout.success_desc": "We'll call you soon to confirm delivery.",
    "checkout.required": "Required",
    "shop.title": "Our shop",
    "shop.filter": "Filters",
    "shop.search": "Search products…",
    "shop.no_results": "No products found.",
    "shop.price": "Price",
    "shop.category": "Category",
    "shop.all": "All",
    "footer.about": "Malak Digital — Algeria's premium online shop.",
    "footer.links": "Useful links",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",
    "currency": "DA",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.about": "من نحن",
    "nav.contact": "اتصل بنا",
    "nav.account": "حسابي",
    "nav.admin": "الإدارة",
    "nav.signin": "تسجيل الدخول",
    "nav.signout": "تسجيل الخروج",
    "hero.tagline": "التميز الرقمي الجزائري",
    "hero.title": "الفخامة تُسلَّم إلى منزلك.",
    "hero.subtitle": "تجربة تسوق راقية مصممة للجزائر. الدفع عند الاستلام في جميع الولايات الـ58.",
    "hero.cta": "اكتشف المتجر",
    "hero.cta_secondary": "الجديد",
    "section.featured": "منتجات مميزة",
    "section.new": "وصل حديثاً",
    "section.categories": "الفئات",
    "section.why": "لماذا ملاك ديجيتال",
    "why.cod.title": "الدفع عند الاستلام",
    "why.cod.desc": "ادفع نقداً عند استلام طلبك.",
    "why.shipping.title": "توصيل 58 ولاية",
    "why.shipping.desc": "المنزل أو المكتب، في أي مكان بالجزائر.",
    "why.quality.title": "جودة مضمونة",
    "why.quality.desc": "منتجات منتقاة بعناية.",
    "why.support.title": "دعم 7/7",
    "why.support.desc": "فريق في خدمتك.",
    "product.buy_now": "اطلب الآن",
    "product.add_to_cart": "أضف للسلة",
    "product.in_stock": "متوفر",
    "product.out_of_stock": "نفذ",
    "product.description": "الوصف",
    "product.shipping": "التوصيل",
    "checkout.title": "الطلب — الدفع عند الاستلام",
    "checkout.firstname": "الاسم",
    "checkout.lastname": "اللقب",
    "checkout.phone": "الهاتف",
    "checkout.phone_alt": "هاتف ثانوي (اختياري)",
    "checkout.email": "البريد (اختياري)",
    "checkout.wilaya": "الولاية",
    "checkout.commune": "البلدية",
    "checkout.address": "العنوان",
    "checkout.quantity": "الكمية",
    "checkout.notes": "ملاحظة",
    "checkout.shipping_method": "طريقة التوصيل",
    "checkout.home": "للمنزل",
    "checkout.office": "للمكتب",
    "checkout.subtotal": "المجموع الفرعي",
    "checkout.shipping_cost": "التوصيل",
    "checkout.total": "الإجمالي",
    "checkout.submit": "تأكيد الطلب",
    "checkout.success": "تم تأكيد الطلب!",
    "checkout.success_desc": "سنتصل بك قريباً لتأكيد التوصيل.",
    "checkout.required": "مطلوب",
    "shop.title": "متجرنا",
    "shop.filter": "فلاتر",
    "shop.search": "ابحث عن منتج…",
    "shop.no_results": "لم يُعثر على منتجات.",
    "shop.price": "السعر",
    "shop.category": "الفئة",
    "shop.all": "الكل",
    "footer.about": "ملاك ديجيتال — المتجر الإلكتروني الراقي للجزائر.",
    "footer.links": "روابط مفيدة",
    "footer.contact": "اتصل بنا",
    "footer.rights": "جميع الحقوق محفوظة.",
    "currency": "دج",
  },
} as const;

type Dict = typeof DICT.fr;
type Key = keyof Dict;

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: Key) => string;
  dir: "ltr" | "rtl";
}>({
  locale: "fr",
  setLocale: () => {},
  t: (k) => DICT.fr[k] ?? k,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("malak.locale") as Locale | null);
    if (stored && ["fr", "ar", "en"].includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("malak.locale", l);
  };

  const dir = locale === "ar" ? "rtl" : "ltr";
  const dict = DICT[locale];
  const t = (k: Key) => (dict[k] as string) ?? DICT.fr[k] ?? k;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export function formatPrice(amount: number, locale: Locale = "fr"): string {
  const currency = DICT[locale].currency;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

# Malak Digital — Plan complet de construction

Plateforme e-commerce haut de gamme pour le marché algérien.
Stack: TanStack Start + React 19 + Tailwind v4 + Lovable Cloud (Postgres + Auth + Storage).

---

## Phase 1 — Fondations ✅ (terminée)

**Livré :**
- Charte premium dark gold (palette, typo Cormorant + Inter + Tajawal, gradients dorés)
- i18n FR / AR (RTL) / EN avec sélecteur dans le header
- Schéma DB : `products`, `categories`, `brands`, `orders`, `order_items`, `wilayas` (58 préchargées), `profiles`, `user_roles`, `site_settings`
- Auth Lovable Cloud (email + Google), rôles `admin` / `customer`
- Pages publiques : Accueil, Boutique, Produit, À propos, Contact, Auth
- Checkout COD (Cash On Delivery) avec calcul livraison par wilaya
- Compte client, espace admin (Produits / Commandes / Livraison)
- SEO de base : titres, descriptions, OG, sitemap.xml, robots.txt

---

## Phase 2A — Catalogue avancé + Blog ✅ (terminée)

**Livré :**
- **Variantes produit** (`product_variants`) : taille / couleur / option2, prix delta, stock par variante, image
- **Catégories hiérarchiques** (`parent_id`) avec pages `/categorie/$slug`
- **Upload d'images** (drag & drop) via Storage Cloud — buckets `product-images` + `blog-images` privés avec URLs signées 10 ans
- **Blog complet** : `blog_posts` (Markdown + GFM), `blog_categories`, filtres + recherche, SEO/JSON-LD par article
- **Admin** : éditeur variantes, gestionnaire catégories, éditeur Markdown blog

---

## Phase 2B — Landing Pages + Pixels + CRM ⚙️ (en cours)

**Objectif :** transformer la plateforme en machine à conversion.

### 2B.1 — Landing Pages produit (1 produit = 1 page optimisée)
- Table `landing_pages` : `product_id`, hero (titre/sous-titre/image), `sections` (JSONB), `cta_text`, compte à rebours, thème, SEO
- Route publique `/lp/$slug` (indépendante du `/product/$slug` classique)
- Sections modulaires : Hero plein écran, Bénéfices, Témoignages, FAQ, Galerie, Formulaire COD intégré, Comparatif
- Compte à rebours d'urgence (countdown) optionnel
- Thèmes prédéfinis (gold-dark, minimal-light, urgent-red)
- Création / édition depuis l'admin

### 2B.2 — Pixels marketing & tracking
- Clés stockées dans `site_settings.pixels` :
  - Meta Pixel (Facebook + Instagram)
  - TikTok Pixel
  - Google Analytics 4 (GA4)
  - Google Tag Manager (GTM)
  - Snapchat Pixel
- Provider React qui injecte les scripts uniquement si une clé est définie
- Helper `trackEvent()` côté client pour les événements e-commerce standards :
  - `PageView` (auto)
  - `ViewContent` (page produit/landing)
  - `AddToCart`
  - `InitiateCheckout`
  - `Purchase` (page order-confirmed avec valeur + currency DZD)
- Configuration depuis l'admin (onglet Marketing)

### 2B.3 — CRM & gestion clients
- Champs CRM ajoutés sur `orders` : `confirmed_at`, `shipped_at`, `delivered_at`, `cancelled_at`, `internal_notes`, `assigned_to`, `call_attempts`, `last_contact_at`, `tracking_number`
- **Pipeline Kanban** : Nouveau → Tenté → Confirmé → Préparé → Expédié → Livré (+ Annulé / Retourné)
- Vue **Client 360°** : historique commandes par numéro de téléphone, total dépensé, notes
- Table `abandoned_checkouts` : capture automatique quand un visiteur remplit son tel sans valider, relance manuelle WhatsApp en 1 clic
- Compteur de tentatives d'appel + date du dernier contact

---

## Phase 3 — Conversion & engagement (à venir)

### 3.1 — Éditeur visuel de pages
- Builder drag & drop pour créer Home / Landing sans code
- Bibliothèque de blocs (hero, grille produits, témoignages, bandeau urgence, FAQ, vidéo, formulaire)
- Sauvegarde versionnée

### 3.2 — Marketing automation
- **Codes promo** : `coupons` (% ou fixe, dates, limite usage, produits ciblés)
- **Upsell / Cross-sell** : produits suggérés au checkout, bundles
- **Reviews clients** avec photos, modération admin
- **Wishlist** persistante

### 3.3 — Notifications multi-canal
- Email transactionnel (Resend) : confirmation, expédition, livraison
- SMS Algérie (provider à choisir)
- WhatsApp Business API pour relances commerciales
- Notifications admin temps réel (nouvelle commande → son + toast)

---

## Phase 4 — Logistique & opérations (à venir)

### 4.1 — Intégrations livreurs Algérie
- Yalidine, Zr Express, Maystro, EcoTrack (au choix)
- Création bordereau automatique depuis l'admin
- Sync statut + numéro de suivi

### 4.2 — Paiement électronique
- BaridiMob (Algérie Poste)
- CIB / Edahabia (SATIM)
- Garde COD comme défaut

### 4.3 — Gestion stock avancée
- Multi-entrepôts
- Alertes seuil critique
- Historique mouvements
- Import/export CSV

---

## Phase 5 — Performance, sécurité, scale (à venir)

- Lazy loading images + composants
- CDN Cloudflare pour assets
- Compression WebP/AVIF automatique
- Cache intelligent (SWR loaders + Query)
- Optimisation Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Audit sécurité RLS complet
- Rate limiting endpoints publics
- Backups automatiques

---

## Phase 6 — Avancé (optionnel)

- App mobile (React Native ou PWA installable)
- Centre d'aide / Documentation publique
- Programme de fidélité (points, paliers)
- Multi-vendeurs (marketplace)
- IA : suggestions produits, génération descriptions, chat support

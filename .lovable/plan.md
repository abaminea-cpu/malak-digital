# Malak Digital — Plan complet de construction

Plateforme e-commerce haut de gamme pour le marché algérien.
Stack: TanStack Start + React 19 + Tailwind v4 + Lovable Cloud (Postgres + Auth + Storage).

---

## ✅ Phase 1 — Fondations (terminée)

- Charte premium dark gold (palette, typo Cormorant + Inter + Tajawal)
- i18n FR / AR (RTL) / EN
- Schéma DB de base : `products`, `categories`, `brands`, `orders`, `order_items`, `wilayas` (58), `profiles`, `user_roles`, `site_settings`
- Auth Lovable Cloud (email + Google), rôles `admin` / `customer`
- Pages publiques : Accueil, Boutique, Produit, À propos, Contact, Auth
- Checkout COD avec calcul livraison par wilaya
- Compte client + espace admin (Produits / Commandes / Livraison)
- SEO de base, sitemap, robots

---

## ✅ Phase 2A — Catalogue avancé + Blog (terminée)

- Variantes produit (`product_variants`) : taille / couleur, prix delta, stock, image
- Catégories hiérarchiques avec pages `/categorie/$slug`
- Upload d'images drag & drop (Storage : `product-images`, `blog-images`)
- Blog complet (Markdown + GFM), catégories, recherche, SEO/JSON-LD
- Admin : éditeur variantes, gestionnaire catégories, éditeur Markdown

---

## ✅ Phase 2B — Landing Pages + Pixels + CRM (terminée)

- Landing Pages produit `/lp/$slug` avec sections modulaires + countdown + 3 thèmes
- Pixels : Meta, TikTok, GA4, GTM, Snapchat + helper `trackEvent()` (DZD)
- CRM : champs `confirmed_at / shipped_at / delivered_at / call_attempts...`
- Kanban pipeline 7 étapes, Client 360°, abandons + relance WhatsApp 1 clic

---

## ⚙️ Phase 3 — Conversion & engagement (EN COURS)

### 3A — Marketing automation (en cours)
- **Codes promo** : table `coupons` (% ou fixe, min, dates, limite usage), validation au checkout, suivi `coupon_id` + `discount_amount` sur `orders`
- **Avis clients** : table `product_reviews` (note 1-5, photo, modération admin), affichage moyenne + JSON-LD `AggregateRating`
- **Wishlist** : table `wishlists` par utilisateur, bouton cœur sur fiches produit
- **Upsell / Cross-sell** : table `product_upsells`, suggestions au checkout

### 3B — Éditeur visuel de landing pages (terminé)
- Éditeur par blocs typés (bénéfices / témoignages / FAQ / galerie / vidéo / garantie)
- Réordonnancement ↑↓, duplication, suppression par bloc
- Bibliothèque de templates (produit complet, urgence flash, vidéo + témoignages)
- Aperçu live `/lp/$slug` depuis l'éditeur


### 3C — Notifications multi-canal (à venir)
- Email transactionnel (Resend) : confirmation, expédition, livraison
- SMS Algérie (provider à choisir : NetBeOpen / IdoomSMS)
- WhatsApp Business API (relances commerciales)
- Notifications admin temps réel (toast + son)

---

## ⚙️ Phase 4 — Logistique, paiement, stock (4A + 4C livré)

### 4A — Logistique
- Table `shipments` (transporteur, suivi, statut, étiquette, coût)
- Table `shipping_providers` (Yalidine / ZR / Maystro / EcoTrack / Manuel)
- Admin : création/édition/suppression de bordereaux, passage auto en "expédié"
- Export CSV des commandes (compatible Excel FR)
- **À activer** : clés API marchand Yalidine / ZR / Maystro / EcoTrack

### 4B — Paiement (à venir)
- Colonnes `payment_method` + `payment_status` déjà sur `orders`
- BaridiMob (Algérie Poste) — nécessite compte marchand SATIM
- CIB / Edahabia — nécessite compte marchand SATIM
- COD reste actif par défaut

### 4C — Stock
- Table `stock_movements` (entrée / sortie / ajustement / retour)
- Seuil d'alerte `low_stock_threshold` par produit
- Dashboard "Stock bas" + historique des mouvements


---

## ⚡ Phase 5 — Performance, sécurité, scale (à venir)

- Lazy loading images + composants
- CDN Cloudflare pour assets statiques
- Compression WebP / AVIF automatique
- Cache intelligent (SWR loaders + TanStack Query)
- Optimisation Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Audit RLS complet + pen-test basique
- Rate limiting endpoints publics
- Backups automatiques quotidiens
- Monitoring uptime + alerting

---

## 🚀 Phase 6 — Avancé (optionnel)

- **PWA installable** (app mobile sans stores)
- **App mobile native** (React Native, optionnel)
- **Centre d'aide / Documentation publique**
- **Programme de fidélité** (points, paliers, récompenses)
- **Multi-vendeurs** (marketplace)
- **IA** :
  - Suggestions produits personnalisées
  - Génération automatique de descriptions produit (FR/AR)
  - Chat support 24/7
  - Détection commandes frauduleuses
- **Analytics avancé** : cohortes, LTV, attribution multi-touch
- **A/B testing intégré** sur landing pages
- **Multi-devises** (DZD / EUR / USD) pour export

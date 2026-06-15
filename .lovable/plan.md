# Phase 2 — Plan d'implémentation

Vu l'ampleur (7 modules), je propose de découper en **2 sous-phases livrables**. Vous validez la 1re, je l'implémente, puis on enchaîne.

## Sous-phase 2A — Catalogue avancé + Blog (cette étape)

### Base de données
- **product_variants** : `id, product_id, name, sku, price_delta, stock, option1_name/value, option2_name/value, image_url, is_active`
- **product_options** (simple JSONB sur product : `{ "Taille": ["S","M","L"], "Couleur": ["Or","Noir"] }`)
- **blog_posts** : `id, slug, title, excerpt, content (markdown), cover_image, author_id, category, tags[], status (draft/published), published_at, meta_title, meta_description, reading_time`
- **blog_categories** : `id, slug, name, description`
- **Storage bucket public** `product-images` + `blog-images` (RLS : lecture publique, écriture admin)
- **categories** : déjà existant — exposer dans Shop + admin (parent_id pour hiérarchie)

### Frontend
- `/shop` : sidebar catégories + filtres prix
- `/categorie/$slug` : page catégorie dédiée (SEO)
- Page produit : sélecteur variantes (taille/couleur), prix dynamique, image qui change
- `/blog` : liste articles avec recherche/catégories
- `/blog/$slug` : article complet (SEO + JSON-LD Article)
- Admin : upload images (drag&drop), gestion variantes, gestion catégories, éditeur blog (textarea markdown + preview)

## Sous-phase 2B — Landing Pages + Pixels + CRM (étape suivante)

### Landing Pages produit
- `landing_pages` : `product_id, hero_title, hero_subtitle, hero_image, sections (JSONB: features, testimonials, faq, gallery, video), cta_text, show_countdown, countdown_end, theme`
- Route `/lp/$slug` : page mono-produit haute conversion (hero plein écran, formulaire COD sticky, témoignages, FAQ, urgence, garantie)
- Admin : éditeur sections drag-order

### Pixels marketing
- `site_settings` keys : `meta_pixel_id`, `tiktok_pixel_id`, `ga4_measurement_id`, `gtm_id`
- Injection dans `__root.tsx` (Script tags conditionnels)
- Helper `trackEvent(name, data)` côté client → ViewContent (page produit), AddToCart, InitiateCheckout, Purchase (page confirmation)
- Server-side : Meta Conversion API (optionnel, plus tard)

### CRM & gestion clients
- `orders` : ajout `confirmed_at, shipped_at, delivered_at, cancelled_at, internal_notes, assigned_to, call_attempts, last_contact_at`
- `customers` view dérivée des orders + profiles
- Admin **Pipeline kanban** : Nouveau → Tenté → Confirmé → Expédié → Livré → Retourné
- Vue **Client 360°** : commandes, valeur totale, fréquence, notes
- **Abandons** : enregistrement formulaire COD partiellement rempli (table `abandoned_checkouts`) + relance manuelle WhatsApp (lien `wa.me/...`)

## Détails techniques (pour info)

- Storage : 2 buckets publics avec policies RLS (`has_role(uid,'admin')` pour write, lecture publique)
- Variants : sélecteur dérive automatiquement du JSONB options + table variants pour stock/prix
- Blog : markdown rendu via `react-markdown` + `remark-gfm` (déjà compat Worker)
- Pixels : chargés via `<script>` dans `head()` de `__root` seulement si l'ID est défini dans site_settings
- CRM : pas de table customer séparée, agrégation SQL sur orders + profiles

## Question

Souhaitez-vous que je commence par **2A** (catalogue + blog) maintenant ?

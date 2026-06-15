-- 1. Landing pages
CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  hero_title text,
  hero_subtitle text,
  hero_image text,
  cta_text text DEFAULT 'Commander maintenant',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  show_countdown boolean NOT NULL DEFAULT false,
  countdown_end timestamptz,
  theme text NOT NULL DEFAULT 'gold-dark',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_pages TO anon, authenticated;
GRANT ALL ON public.landing_pages TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.landing_pages TO authenticated;

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published landing pages"
  ON public.landing_pages FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage landing pages"
  ON public.landing_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_product ON public.landing_pages(product_id);

-- 2. Abandoned checkouts
CREATE TABLE public.abandoned_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_first_name text,
  customer_last_name text,
  customer_phone text NOT NULL,
  customer_email text,
  wilaya_id integer REFERENCES public.wilayas(id),
  commune text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  recovery_attempts integer NOT NULL DEFAULT 0,
  last_contact_at timestamptz,
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recovered_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_checkouts TO authenticated;
GRANT INSERT ON public.abandoned_checkouts TO anon;
GRANT ALL ON public.abandoned_checkouts TO service_role;

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert an abandoned checkout"
  ON public.abandoned_checkouts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read abandoned checkouts"
  ON public.abandoned_checkouts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update abandoned checkouts"
  ON public.abandoned_checkouts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete abandoned checkouts"
  ON public.abandoned_checkouts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_abandoned_checkouts_updated_at
  BEFORE UPDATE ON public.abandoned_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_abandoned_checkouts_status ON public.abandoned_checkouts(status);
CREATE INDEX idx_abandoned_checkouts_phone ON public.abandoned_checkouts(customer_phone);

-- 3. CRM fields on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS call_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);

-- 4. Seed marketing pixel settings keys
INSERT INTO public.site_settings (key, value) VALUES
  ('pixels', '{"meta_pixel_id":"","tiktok_pixel_id":"","ga4_measurement_id":"","gtm_id":"","snap_pixel_id":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
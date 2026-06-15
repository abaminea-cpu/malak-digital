
-- ============= shipping_providers =============
CREATE TABLE public.shipping_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.shipping_providers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_providers TO authenticated;
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage shipping providers"
  ON public.shipping_providers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_shipping_providers BEFORE UPDATE ON public.shipping_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.shipping_providers (code, name, is_active) VALUES
  ('yalidine', 'Yalidine', false),
  ('zr_express', 'ZR Express', false),
  ('maystro', 'Maystro Delivery', false),
  ('ecotrack', 'EcoTrack', false),
  ('manual', 'Manuel (saisie libre)', true);

-- ============= shipments =============
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_code text NOT NULL,
  tracking_number text,
  status text NOT NULL DEFAULT 'created',
  label_url text,
  shipping_cost numeric(10,2),
  external_id text,
  last_event_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipments_order_id_idx ON public.shipments(order_id);
CREATE INDEX shipments_tracking_idx ON public.shipments(tracking_number);
GRANT ALL ON public.shipments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage shipments"
  ON public.shipments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer view own shipment"
  ON public.shipments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE TRIGGER set_updated_at_shipments BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= stock_movements =============
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in','out','adjust','return')),
  quantity integer NOT NULL,
  reason text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_idx ON public.stock_movements(product_id, created_at DESC);
GRANT ALL ON public.stock_movements TO service_role;
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage stock movements"
  ON public.stock_movements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= orders new columns =============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL;

-- ============= products new columns =============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS low_stock_alerted_at timestamptz;

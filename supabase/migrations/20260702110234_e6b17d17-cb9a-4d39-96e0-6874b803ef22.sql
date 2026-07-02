
-- Settings default for exchange window
INSERT INTO public.site_settings (key, value)
VALUES ('exchange', '{"deadline_hours": 48, "enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Exchange requests table
CREATE TABLE public.exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE DEFAULT ('ECH-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  customer_name text,
  reason text,
  photos text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','rejected','processed')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX exchange_requests_order_idx ON public.exchange_requests(order_id);
CREATE INDEX exchange_requests_phone_idx ON public.exchange_requests(customer_phone);
CREATE INDEX exchange_requests_status_idx ON public.exchange_requests(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_requests TO authenticated;
GRANT INSERT ON public.exchange_requests TO anon;
GRANT ALL ON public.exchange_requests TO service_role;

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange public insert" ON public.exchange_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "exchange admin read" ON public.exchange_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "exchange admin update" ON public.exchange_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "exchange admin delete" ON public.exchange_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER exchange_requests_updated_at
  BEFORE UPDATE ON public.exchange_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

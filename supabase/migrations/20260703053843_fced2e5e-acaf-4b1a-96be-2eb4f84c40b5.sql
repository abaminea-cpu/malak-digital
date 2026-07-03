
CREATE TABLE public.sheets_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  orders_spreadsheet_id TEXT,
  orders_sheet_name TEXT NOT NULL DEFAULT 'Commandes',
  orders_enabled BOOLEAN NOT NULL DEFAULT false,
  exchanges_spreadsheet_id TEXT,
  exchanges_sheet_name TEXT NOT NULL DEFAULT 'Echanges',
  exchanges_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sheets_config_singleton CHECK (id = 'global')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheets_config TO authenticated;
GRANT ALL ON public.sheets_config TO service_role;

ALTER TABLE public.sheets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sheets_config admin all" ON public.sheets_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER sheets_config_updated_at
  BEFORE UPDATE ON public.sheets_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.sheets_config (id) VALUES ('global') ON CONFLICT DO NOTHING;

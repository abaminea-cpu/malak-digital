GRANT INSERT, UPDATE ON public.communes TO sandbox_exec;
ALTER TABLE public.communes FORCE ROW LEVEL SECURITY;
CREATE POLICY "communes sandbox import" ON public.communes
  FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "communes sandbox import" ON public.communes;
REVOKE INSERT, UPDATE ON public.communes FROM sandbox_exec;
ALTER TABLE public.communes NO FORCE ROW LEVEL SECURITY;
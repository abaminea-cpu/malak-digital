
-- Set search_path on helper trigger
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Lock down SECURITY DEFINER functions: only postgres/service_role can execute
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
-- has_role is needed by RLS policies; auth context runs as authenticated, that's fine.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user is only invoked by the auth trigger as table owner; revoking public execute is safe.

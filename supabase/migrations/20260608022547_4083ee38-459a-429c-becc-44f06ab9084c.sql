
-- 1) Lock down public.participacoes: no direct client access.
--    Inserts happen via SECURITY DEFINER function registrar_participacao.
REVOKE ALL ON public.participacoes FROM anon, authenticated;
GRANT ALL ON public.participacoes TO service_role;

-- Explicit deny-all policies to clear "RLS enabled, no policy" linter
DROP POLICY IF EXISTS "no client access" ON public.participacoes;
CREATE POLICY "no client access"
  ON public.participacoes
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2) Storage: lock down notas-fiscais reads. Keep anon upload only.
DROP POLICY IF EXISTS "admin_read_nf" ON storage.objects;
CREATE POLICY "admin_read_nf"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'notas-fiscais');

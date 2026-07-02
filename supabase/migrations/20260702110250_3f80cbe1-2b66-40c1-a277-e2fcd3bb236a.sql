
CREATE POLICY "exchange photos anon upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'exchange-photos');

CREATE POLICY "exchange photos admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'exchange-photos' AND public.has_role(auth.uid(), 'admin'));

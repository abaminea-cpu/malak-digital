
CREATE POLICY "site-images read authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'site-images');
CREATE POLICY "site-images read anon" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'site-images');
CREATE POLICY "site-images admin write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site-images admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site-images admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));


-- 1) Add region + commune_count columns
ALTER TABLE public.wilayas
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS commune_count integer;

-- 2) Upsert region + commune_count for the 58 existing + insert 59..69
INSERT INTO public.wilayas (id, name_fr, name_ar, region, commune_count) VALUES
 (1,'Adrar','أدرار','Sahara',16),
 (2,'Chlef','الشلف','Nord',35),
 (3,'Laghouat','الأغواط','Sahara',15),
 (4,'Oum El Bouaghi','أم البواقي','Hauts Plateaux',29),
 (5,'Batna','باتنة','Hauts Plateaux',55),
 (6,'Béjaïa','بجاية','Nord',52),
 (7,'Biskra','بسكرة','Sahara',24),
 (8,'Béchar','بشار','Sahara',14),
 (9,'Blida','البليدة','Nord',25),
 (10,'Bouira','البويرة','Nord',45),
 (11,'Tamanrasset','تمنراست','Sahara',6),
 (12,'Tébessa','تبسة','Hauts Plateaux',24),
 (13,'Tlemcen','تلمسان','Hauts Plateaux',51),
 (14,'Tiaret','تيارت','Hauts Plateaux',36),
 (15,'Tizi Ouzou','تيزي وزو','Nord',67),
 (16,'Alger','الجزائر','Nord',57),
 (17,'Djelfa','الجلفة','Hauts Plateaux',24),
 (18,'Jijel','جيجل','Nord',28),
 (19,'Sétif','سطيف','Hauts Plateaux',60),
 (20,'Saïda','سعيدة','Hauts Plateaux',16),
 (21,'Skikda','سكيكدة','Nord',38),
 (22,'Sidi Bel Abbès','سيدي بلعباس','Hauts Plateaux',52),
 (23,'Annaba','عنابة','Nord',12),
 (24,'Guelma','قالمة','Nord',34),
 (25,'Constantine','قسنطينة','Nord',12),
 (26,'Médéa','المدية','Nord',58),
 (27,'Mostaganem','مستغانم','Nord',32),
 (28,'M''Sila','المسيلة','Hauts Plateaux',29),
 (29,'Mascara','معسكر','Hauts Plateaux',47),
 (30,'Ouargla','ورقلة','Sahara',9),
 (31,'Oran','وهران','Nord',26),
 (32,'El Bayadh','البيض','Sahara',16),
 (33,'Illizi','إليزي','Sahara',4),
 (34,'Bordj Bou Arréridj','برج بوعريريج','Hauts Plateaux',34),
 (35,'Boumerdès','بومرداس','Nord',32),
 (36,'El Tarf','الطارف','Nord',24),
 (37,'Tindouf','تندوف','Sahara',2),
 (38,'Tissemsilt','تيسمسيلت','Hauts Plateaux',22),
 (39,'El Oued','الوادي','Sahara',25),
 (40,'Khenchela','خنشلة','Hauts Plateaux',21),
 (41,'Souk Ahras','سوق أهراس','Hauts Plateaux',26),
 (42,'Tipaza','تيبازة','Nord',28),
 (43,'Mila','ميلة','Hauts Plateaux',32),
 (44,'Aïn Defla','عين الدفلى','Nord',36),
 (45,'Naâma','النعامة','Sahara',12),
 (46,'Aïn Témouchent','عين تموشنت','Nord',28),
 (47,'Ghardaïa','غرداية','Sahara',11),
 (48,'Relizane','غليزان','Nord',38),
 (49,'Timimoun','تيميمون','Sahara',20),
 (50,'Bordj Badji Mokhtar','برج باجي مختار','Sahara',4),
 (51,'Ouled Djellal','أولاد جلال','Sahara',11),
 (52,'In Salah','عين صالح','Sahara',17),
 (53,'In Guezzam','عين قزام','Sahara',6),
 (54,'Touggourt','تقرت','Sahara',3),
 (55,'Djanet','جانت','Sahara',25),
 (56,'El M''Ghair','المغير','Sahara',4),
 (57,'Béni Abbès','بني عباس','Sahara',13),
 (58,'El Meniaa','المنيعة','Sahara',5),
 (59,'Aflou','أفلو','Hauts Plateaux',21),
 (60,'Barika','بريكة','Hauts Plateaux',14),
 (61,'Ksar Chellala','قصر الشلالة','Hauts Plateaux',9),
 (62,'Messaad','مسعد','Hauts Plateaux',8),
 (63,'Aïn Oussara','عين وسارة','Hauts Plateaux',6),
 (64,'Bou Saâda','بوسعادة','Hauts Plateaux',12),
 (65,'El Abiodh Sidi Cheikh','الأبيض سيدي الشيخ','Sahara',18),
 (66,'El Kantara','القنطرة','Hauts Plateaux',12),
 (67,'Bir El Ater','بئر العاتر','Hauts Plateaux',27),
 (68,'Ksar El Boukhari','قصر البخاري','Hauts Plateaux',41),
 (69,'El Aricha','العريشة','Sahara',13)
ON CONFLICT (id) DO UPDATE
SET name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    region = EXCLUDED.region,
    commune_count = EXCLUDED.commune_count;

-- 3) Communes table
CREATE TABLE IF NOT EXISTS public.communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_id integer NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_ar text,
  postal_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wilaya_id, name_fr)
);

GRANT SELECT ON public.communes TO anon, authenticated;
GRANT ALL ON public.communes TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.communes TO authenticated;

ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communes public read" ON public.communes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "communes admin write" ON public.communes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS communes_wilaya_idx ON public.communes (wilaya_id);

CREATE TRIGGER communes_updated BEFORE UPDATE ON public.communes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

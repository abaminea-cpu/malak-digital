
-- =========== ROLES ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========== updated_at helper ===========
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== CATEGORIES ===========
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== BRANDS ===========
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands public read" ON public.brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "brands admin write" ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========== PRODUCTS ===========
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT,
  description TEXT,
  short_description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2),
  stock INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  landing_mode BOOLEAN NOT NULL DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_active_idx ON public.products(is_active);
CREATE INDEX products_featured_idx ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== WILAYAS ===========
CREATE TABLE public.wilayas (
  id INT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  home_price NUMERIC(8,2) NOT NULL DEFAULT 700,
  office_price NUMERIC(8,2) NOT NULL DEFAULT 400,
  home_enabled BOOLEAN NOT NULL DEFAULT true,
  office_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wilayas public read" ON public.wilayas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wilayas admin write" ON public.wilayas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER wilayas_updated BEFORE UPDATE ON public.wilayas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed 58 wilayas
INSERT INTO public.wilayas (id, name_fr, name_ar, home_price, office_price) VALUES
(1,'Adrar','أدرار',1400,800),(2,'Chlef','الشلف',800,450),(3,'Laghouat','الأغواط',900,500),
(4,'Oum El Bouaghi','أم البواقي',800,450),(5,'Batna','باتنة',800,450),(6,'Béjaïa','بجاية',800,450),
(7,'Biskra','بسكرة',900,500),(8,'Béchar','بشار',1200,700),(9,'Blida','البليدة',500,300),
(10,'Bouira','البويرة',700,400),(11,'Tamanrasset','تمنراست',1600,1000),(12,'Tébessa','تبسة',900,500),
(13,'Tlemcen','تلمسان',800,450),(14,'Tiaret','تيارت',800,450),(15,'Tizi Ouzou','تيزي وزو',700,400),
(16,'Alger','الجزائر',400,250),(17,'Djelfa','الجلفة',900,500),(18,'Jijel','جيجل',800,450),
(19,'Sétif','سطيف',700,400),(20,'Saïda','سعيدة',900,500),(21,'Skikda','سكيكدة',800,450),
(22,'Sidi Bel Abbès','سيدي بلعباس',800,450),(23,'Annaba','عنابة',800,450),(24,'Guelma','قالمة',800,450),
(25,'Constantine','قسنطينة',700,400),(26,'Médéa','المدية',600,400),(27,'Mostaganem','مستغانم',800,450),
(28,'M''Sila','المسيلة',800,450),(29,'Mascara','معسكر',800,450),(30,'Ouargla','ورقلة',1100,650),
(31,'Oran','وهران',700,400),(32,'El Bayadh','البيض',1000,600),(33,'Illizi','إليزي',1700,1100),
(34,'Bordj Bou Arreridj','برج بوعريريج',700,400),(35,'Boumerdès','بومرداس',500,300),(36,'El Tarf','الطارف',900,500),
(37,'Tindouf','تندوف',1700,1100),(38,'Tissemsilt','تيسمسيلت',800,450),(39,'El Oued','الوادي',1000,600),
(40,'Khenchela','خنشلة',800,450),(41,'Souk Ahras','سوق أهراس',900,500),(42,'Tipaza','تيبازة',500,300),
(43,'Mila','ميلة',800,450),(44,'Aïn Defla','عين الدفلى',700,400),(45,'Naâma','النعامة',1100,650),
(46,'Aïn Témouchent','عين تموشنت',800,450),(47,'Ghardaïa','غرداية',1000,600),(48,'Relizane','غليزان',800,450),
(49,'Timimoun','تيميمون',1500,900),(50,'Bordj Badji Mokhtar','برج باجي مختار',1700,1100),
(51,'Ouled Djellal','أولاد جلال',1000,600),(52,'Béni Abbès','بني عباس',1400,800),
(53,'In Salah','عين صالح',1700,1100),(54,'In Guezzam','عين قزام',1800,1200),
(55,'Touggourt','تقرت',1100,650),(56,'Djanet','جانت',1800,1200),
(57,'El M''Ghair','المغير',1100,650),(58,'El Meniaa','المنيعة',1200,700);

-- =========== ORDERS ===========
CREATE TYPE public.order_status AS ENUM ('new','confirmed','preparing','shipped','delivered','cancelled','returned');
CREATE TYPE public.shipping_method AS ENUM ('home','office');
CREATE TYPE public.payment_method AS ENUM ('cod','baridimob','bank_transfer');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('MD-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*100000))::text,5,'0')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'new',
  -- Customer info (always captured, even for guest checkout)
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_phone_alt TEXT,
  customer_email TEXT,
  -- Shipping
  wilaya_id INT NOT NULL REFERENCES public.wilayas(id),
  commune TEXT NOT NULL,
  address TEXT,
  shipping_method shipping_method NOT NULL DEFAULT 'home',
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Totals
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Payment
  payment_method payment_method NOT NULL DEFAULT 'cod',
  -- Misc
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);

GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can create an order (guest COD checkout)
CREATE POLICY "orders public insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Authenticated users see their own orders
CREATE POLICY "orders user select own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Admins see/manage everything
CREATE POLICY "orders admin all" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== ORDER ITEMS ===========
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items public insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order_items user select own" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items admin all" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========== SETTINGS (site-wide) ===========
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (key, value) VALUES
('payment', '{"cod_enabled": true, "baridimob_enabled": false, "bank_transfer_enabled": false}'),
('brand', '{"name": "Malak Digital", "tagline_fr": "L''excellence digitale algérienne", "phone": "+213 555 000 000", "email": "contact@malakdigital.dz"}');

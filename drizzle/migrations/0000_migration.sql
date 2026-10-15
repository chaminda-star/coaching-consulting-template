CREATE TABLE public.seo_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  site_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seo_settings TO anon, authenticated;
GRANT ALL ON public.seo_settings TO service_role;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read SEO settings" ON public.seo_settings FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.seo_admin (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.seo_admin TO service_role;
ALTER TABLE public.seo_admin ENABLE ROW LEVEL SECURITY;
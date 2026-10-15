import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSeo = createServerFn({ method: "GET" }).handler(async () => {
  const { loadSeo } = await import("./seo.server");
  return loadSeo();
});

const saveSchema = z.object({
  password: z.string().min(6).max(200),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(320),
  siteUrl: z.string().trim().url().max(200).refine((u) => u.startsWith("https://") || u.startsWith("http://")),
});

export const publishSeo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return { ok: false, error: "Online storage isn't set up for this site. Edit src/site.config.ts instead." };
    }
    const { pbkdf2 } = await import("./seo.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admin } = await supabaseAdmin.from("seo_admin").select("password_hash, salt").eq("id", 1).maybeSingle();
    if (admin) {
      if ((await pbkdf2(data.password, admin.salt)) !== admin.password_hash) return { ok: false, error: "Wrong admin password." };
    } else {
      // First publish claims the site: this password protects all future changes.
      const salt = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("seo_admin").insert({ id: 1, salt, password_hash: await pbkdf2(data.password, salt) });
      if (error) return { ok: false, error: "Could not save. Try again." };
    }
    const { error } = await supabaseAdmin.from("seo_settings").upsert({
      id: 1, title: data.title, description: data.description,
      site_url: data.siteUrl.replace(/\/+$/, ""), updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: "Could not save. Try again." };
    return { ok: true };
  });

import { createClient } from "@supabase/supabase-js";
import { SITE_CONFIG, type SeoSettings } from "@/site.config";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Online settings when available, otherwise the setup file. Never throws. */
export async function loadSeo(): Promise<SeoSettings> {
  try {
    const sb = publicClient();
    if (!sb) return SITE_CONFIG;
    const { data, error } = await sb.from("seo_settings").select("title, description, site_url").eq("id", 1).maybeSingle();
    if (error || !data) return SITE_CONFIG;
    return {
      title: data.title || SITE_CONFIG.title,
      description: data.description || SITE_CONFIG.description,
      siteUrl: (data.site_url || SITE_CONFIG.siteUrl).replace(/\/+$/, ""),
    };
  } catch {
    return SITE_CONFIG;
  }
}

export async function pbkdf2(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100_000 }, key, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { loadSeo } = await import("@/lib/seo.server");
        const { siteUrl } = await loadSeo();
        const body = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSeo, publishSeo } from "@/lib/seo.functions";

/** Publishes title, description and site address online so Google, the sitemap and link previews use them. */
export function SearchEnginePanel({ title: draftTitle, description: draftDesc }: { title: string; description: string }) {
  const load = useServerFn(getSeo);
  const publish = useServerFn(publishSeo);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load().then((s) => { setTitle(s.title); setDescription(s.description); setSiteUrl(s.siteUrl); }).catch(() => {});
  }, [load]);

  async function onPublish() {
    if (!password) { toast.error("Enter your admin password to publish."); return; }
    setBusy(true);
    try {
      const r = await publish({ data: { password, title, description, siteUrl } });
      if (r.ok) { toast.success("Published — search engines will see this on their next visit"); setPassword(""); }
      else toast.error(r.error ?? "Could not publish.");
    } catch {
      toast.error("Please check the fields: title, description and a full website address (https://…).");
    } finally { setBusy(false); }
  }

  return (
    <section className="glass rounded-3xl p-4 sm:p-6 md:p-8">
      <h2 className="flex items-center gap-2 text-2xl"><Globe className="size-5 text-primary" /> Publish to Search Engines</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what Google, link previews and your sitemap show. It's saved online, separately from Save Changes.
        The first time you publish, the password you enter becomes the password for this section.
      </p>
      <div className="mt-6 grid gap-5">
        <div className="grid gap-2"><Label>Google title</Label><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid gap-2"><Label>Google description</Label><Textarea rows={2} maxLength={320} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="grid gap-2"><Label>Website address</Label><Input value={siteUrl} placeholder="https://yourname.com" onChange={(e) => setSiteUrl(e.target.value)} /></div>
        <div className="grid gap-2 md:max-w-sm"><Label>Admin password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" type="button" onClick={() => { setTitle(draftTitle); setDescription(draftDesc); }}>Copy from browser tab fields</Button>
          <Button type="button" onClick={onPublish} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Globe />} Publish to search engines</Button>
        </div>
      </div>
    </section>
  );
}

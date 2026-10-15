import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Check, Download, ExternalLink, LayoutDashboard, Lock, LogOut, Mail, MessageCircle, Palette, Phone, Plus, Search,
  Settings, Trash2, User, Users, Package, Save, Undo2, Sparkles, BookOpen, Star, HelpCircle, RotateCcw, MessageSquare,
  CalendarCheck, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  hashPassword, newId, resetToDefaults, THEME_PRESETS, useAdmin, useBookings, useContent, useSession, useTheme,
  type Booking, type BookingStatus, type Service, type SiteContent,
} from "@/lib/site-store";
import { AiAssistant, leadToDetails } from "@/components/admin/AiAssistant";
import { SearchEnginePanel } from "@/components/admin/SearchEnginePanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard" },
      { name: "description", content: "Manage your site content, theme, services and bookings." },
      { property: "og:title", content: "Admin Dashboard" },
      { property: "og:description", content: "Private admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [admin, setAdmin, ready] = useAdmin();
  const [session, setSession] = useSession();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!admin) return <AuthCard mode="setup" onDone={(a) => { setAdmin(a); setSession(true); toast.success("Admin account created"); }} />;
  if (!session) return <AuthCard mode="login" expected={admin} onDone={() => setSession(true)} />;
  return <Dashboard onLogout={() => setSession(false)} />;
}

function AuthCard({ mode, expected, onDone }: {
  mode: "setup" | "login";
  expected?: { email: string; passwordHash: string };
  onDone: (a: { email: string; passwordHash: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim().toLowerCase();
    const pw = String(fd.get("password"));
    if (mode === "setup") {
      if (pw.length < 8) { toast.error("Password must be at least 8 characters."); return; }
      if (pw !== String(fd.get("confirm"))) { toast.error("Passwords don't match."); return; }
    }
    setBusy(true);
    const hash = await hashPassword(pw);
    setBusy(false);
    if (mode === "login" && (email !== expected?.email || hash !== expected.passwordHash)) {
      { toast.error("Incorrect email or password."); return; }
    }
    onDone({ email, passwordHash: hash });
  };
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="glass fade-up w-full max-w-md space-y-5 rounded-3xl p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl">{mode === "setup" ? "Welcome! Set up your admin account" : "Admin login"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "setup" ? "Create the credentials you'll use to manage your website." : "Sign in to manage your website."}
          </p>
        </div>
        <div className="grid gap-2"><Label htmlFor="a-email">Admin email</Label><Input id="a-email" name="email" type="email" required /></div>
        <div className="grid gap-2"><Label htmlFor="a-pw">Password</Label><Input id="a-pw" name="password" type="password" required minLength={mode === "setup" ? 8 : 1} /></div>
        {mode === "setup" && (
          <div className="grid gap-2"><Label htmlFor="a-c">Confirm password</Label><Input id="a-c" name="confirm" type="password" required /></div>
        )}
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
          {mode === "setup" ? "Create account & continue" : "Sign in"}
        </Button>
        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Back to website</Link>
      </form>
    </div>
  );
}

type Draft = SiteContent;
type SetDraft = (fn: (d: Draft) => Draft) => void;

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [bookings] = useBookings();
  const [content, setContent, ready] = useContent();
  const [draft, setDraftState] = useState<Draft | null>(null);
  const current = draft ?? content;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(content);
  const setDraft: SetDraft = (fn) => setDraftState((d) => fn(d ?? content));
  const save = () => {
    const clean: Draft = {
      ...current,
      about: { ...current.about, paragraphs: current.about.paragraphs.filter((p) => p.trim()), credentials: current.about.credentials.map((c) => c.trim()).filter(Boolean) },
      services: { ...current.services, items: current.services.items.map((s) => ({ ...s, features: s.features.map((f) => f.trim()).filter(Boolean) })) },
    };
    setContent(clean);
    setDraftState(null);
    toast.success("Changes saved — your website is updated");
  };
  const newCount = bookings.filter((b) => b.status === "new").length;
  if (!ready) return <div className="min-h-screen bg-background" />;
  const props = { d: current, set: setDraft };
  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-2 font-display text-lg"><LayoutDashboard className="h-5 w-5 text-primary" /> Dashboard</div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            {dirty && <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setDraftState(null)}><Undo2 /> Discard</Button>}
            <Button size="sm" onClick={save} disabled={!dirty} className="rounded-full"><Save /> Save Changes</Button>
            <Button variant="outline" size="sm" asChild className="rounded-full bg-transparent"><Link to="/"><ExternalLink /> View site</Link></Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full"><LogOut /> Log out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <Tabs defaultValue="brand">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl p-1.5">
            <TabsTrigger value="brand" className="rounded-xl"><User /> Brand</TabsTrigger>
            <TabsTrigger value="hero" className="rounded-xl"><Sparkles /> Hero</TabsTrigger>
            <TabsTrigger value="about" className="rounded-xl"><BookOpen /> About</TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl"><Package /> Services</TabsTrigger>
            <TabsTrigger value="testimonials" className="rounded-xl"><Star /> Testimonials</TabsTrigger>
            <TabsTrigger value="faqs" className="rounded-xl"><HelpCircle /> FAQs</TabsTrigger>
            <TabsTrigger value="contact" className="rounded-xl"><Mail /> Contact</TabsTrigger>
            <TabsTrigger value="booking" className="rounded-xl"><CalendarCheck /> Booking Form</TabsTrigger>
            <TabsTrigger value="theme" className="rounded-xl"><Palette /> Theme</TabsTrigger>
            <TabsTrigger value="leads" className="rounded-xl"><Users /> Leads {newCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{newCount}</span>}</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl"><Settings /> Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="booking" className="mt-6"><BookingTab {...props} /></TabsContent>
          <TabsContent value="brand" className="mt-6"><div className="space-y-6"><BrandTab {...props} /><LabelsPanel {...props} /></div></TabsContent>
          <TabsContent value="hero" className="mt-6"><HeroTab {...props} /></TabsContent>
          <TabsContent value="about" className="mt-6"><AboutTab {...props} /></TabsContent>
          <TabsContent value="services" className="mt-6"><ServicesTab {...props} /></TabsContent>
          <TabsContent value="testimonials" className="mt-6"><TestimonialsTab {...props} /></TabsContent>
          <TabsContent value="faqs" className="mt-6"><FaqsTab {...props} /></TabsContent>
          <TabsContent value="contact" className="mt-6"><ContactTab {...props} /></TabsContent>
          <TabsContent value="theme" className="mt-6"><ThemeTab /></TabsContent>
          <TabsContent value="leads" className="mt-6"><LeadsTab /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsTab onReset={() => setDraftState(null)} /></TabsContent>
        </Tabs>
      </main>
      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="glass-strong flex items-center gap-3 rounded-full px-5 py-2.5 shadow-lg">
            <span className="text-sm">You have unsaved changes</span>
            <Button size="sm" onClick={save} className="rounded-full"><Save /> Save Changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function F({ label, value, onChange, long, rows = 3, className = "", type = "text" }: {
  label: string; value: string | number; onChange: (v: string) => void; long?: boolean; rows?: number; className?: string; type?: string;
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <Label>{label}</Label>
      {long ? <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        : <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function Card({ title, onRemove, children }: { title: string; onRemove?: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{title}</span>
        {onRemove && <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive"><Trash2 /> Remove</Button>}
      </div>
      {children}
    </div>
  );
}

type TabProps = { d: Draft; set: SetDraft };
type Sec = keyof Draft;
function patch<K extends Sec>(set: SetDraft, k: K, p: Partial<Draft[K]>) {
  set((d) => ({ ...d, [k]: { ...d[k], ...p } }));
}
function replaceAt<T>(arr: T[], i: number, v: T) { return arr.map((x, j) => (j === i ? v : x)); }

function BrandTab({ d, set }: TabProps) {
  const b = d.brand; const u = (p: Partial<Draft["brand"]>) => patch(set, "brand", p);
  return (
    <Panel title="Brand & Profile" hint="Your name, title and photo shown in the navbar, hero card and footer.">
      <div className="grid gap-5 md:grid-cols-2">
        <F label="Brand / logo name" value={b.brandName} onChange={(v) => u({ brandName: v })} />
        <F label="Founder name" value={b.founderName} onChange={(v) => u({ founderName: v })} />
        <F label="Professional title" value={b.title} onChange={(v) => u({ title: v })} />
        <F label="Availability label" value={b.availability} onChange={(v) => u({ availability: v })} />
        <F label="Profile photo URL (blank = default photo)" value={b.photoUrl} onChange={(v) => u({ photoUrl: v })} className="md:col-span-2" />
      </div>
    </Panel>
  );
}

function BookingTab({ d, set }: TabProps) {
  const b = d.booking; const u = (p: Partial<Draft["booking"]>) => patch(set, "booking", p);
  const fields: [keyof Draft["booking"], string, boolean?][] = [
    ["title", "Form title"], ["subtitle", "Form subtitle", true],
    ["nameLabel", "Name label"], ["namePlaceholder", "Name placeholder"],
    ["emailLabel", "Email label"], ["emailPlaceholder", "Email placeholder"],
    ["phoneLabel", "Phone / WhatsApp label"], ["phonePlaceholder", "Phone placeholder"],
    ["serviceLabel", "Service label"], ["freeOption", "Free option name (first choice)"],
    ["dateLabel", "Date label"], ["messageLabel", "Message label"],
    ["messagePlaceholder", "Message placeholder", true],
    ["submitLabel", "Submit button text"], ["sendingLabel", "Button text while sending"],
    ["successTitle", "Success message title"], ["successMessage", "Success message text", true],
    ["errorMessage", "Error message (missing name/email)", true],
  ];
  return (
    <Panel title="Booking Form & Confirmation">
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(([k, label, long]) => (
          <F key={k} label={label} value={b[k]} onChange={(v) => u({ [k]: v } as Partial<Draft["booking"]>)} {...(long ? { long: true, rows: 2, className: "md:col-span-2" } : {})} />
        ))}
      </div>
    </Panel>
  );
}

function LabelsPanel({ d, set }: TabProps) {
  const l = d.labels; const u = (p: Partial<Draft["labels"]>) => patch(set, "labels", p);
  const s = d.seo; const us = (p: Partial<Draft["seo"]>) => patch(set, "seo", p);
  return (
    <>
      <Panel title="Browser Tab & Search (SEO)">
        <div className="grid gap-5">
          <F label="Page title (browser tab)" value={s.title} onChange={(v) => us({ title: v })} />
          <F label="Search description" value={s.description} onChange={(v) => us({ description: v })} long rows={2} />
        </div>
      </Panel>
      <SearchEnginePanel title={s.title} description={s.description} />
      <Panel title="Menu, Buttons & Footer Labels">
        <div className="grid gap-5 md:grid-cols-2">
          <F label="Menu: About" value={l.navAbout} onChange={(v) => u({ navAbout: v })} />
          <F label="Menu: Services" value={l.navServices} onChange={(v) => u({ navServices: v })} />
          <F label="Menu: Results" value={l.navResults} onChange={(v) => u({ navResults: v })} />
          <F label="Menu: FAQ" value={l.navFaq} onChange={(v) => u({ navFaq: v })} />
          <F label="Top button (navbar & FAQ)" value={l.navCta} onChange={(v) => u({ navCta: v })} />
          <F label="Package button" value={l.bookNow} onChange={(v) => u({ bookNow: v })} />
          <F label="Photo badge (e.g. certification)" value={l.floatingBadge} onChange={(v) => u({ floatingBadge: v })} />
          <F label="Availability card title" value={l.slotLabel} onChange={(v) => u({ slotLabel: v })} />
          <F label="Availability card text" value={l.slotValue} onChange={(v) => u({ slotValue: v })} />
          <F label="Footer: quick links title" value={l.quickLinksTitle} onChange={(v) => u({ quickLinksTitle: v })} />
          <F label="Footer: contact title" value={l.contactTitle} onChange={(v) => u({ contactTitle: v })} />
          <F label="Newsletter placeholder" value={l.newsletterPlaceholder} onChange={(v) => u({ newsletterPlaceholder: v })} />
          <F label="Newsletter button" value={l.subscribeLabel} onChange={(v) => u({ subscribeLabel: v })} />
          <F label="Copyright suffix" value={l.copyright} onChange={(v) => u({ copyright: v })} />
          <F label="Admin link text (footer)" value={l.adminLinkLabel} onChange={(v) => u({ adminLinkLabel: v })} />
        </div>
      </Panel>
      <Panel title="Lead Reply Buttons">
        <div className="grid gap-5 md:grid-cols-2">
          <F label="WhatsApp button text" value={l.leadWhatsAppLabel} onChange={(v) => u({ leadWhatsAppLabel: v })} />
          <F label="Email button text" value={l.leadEmailLabel} onChange={(v) => u({ leadEmailLabel: v })} />
          <F label="Email subject line" value={l.leadEmailSubject} onChange={(v) => u({ leadEmailSubject: v })} />
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Quick Email message template</label>
            <textarea rows={8} value={l.leadEmailBody ?? ""} onChange={(e) => u({ leadEmailBody: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">Use {"{name}"}, {"{service}"} and {"{email}"} — they are replaced with each lead's details (also works in the subject).</p>
          </div>
        </div>
      </Panel>
    </>
  );
}

function HeroTab({ d, set }: TabProps) {
  const h = d.hero; const u = (p: Partial<Draft["hero"]>) => patch(set, "hero", p);
  return (
    <Panel title="Hero Section">
      <div className="grid gap-5 md:grid-cols-2">
        <F label="Badge text" value={h.badge} onChange={(v) => u({ badge: v })} className="md:col-span-2" />
        <F label="Headline" value={h.headline} onChange={(v) => u({ headline: v })} long rows={2} className="md:col-span-2" />
        <F label="Subheadline" value={h.subheadline} onChange={(v) => u({ subheadline: v })} long rows={2} className="md:col-span-2" />
        <F label="Main button label" value={h.ctaLabel} onChange={(v) => u({ ctaLabel: v })} />
        <F label="Second button label" value={h.secondaryCtaLabel} onChange={(v) => u({ secondaryCtaLabel: v })} />
        <F label="Rating line" value={h.ratingText} onChange={(v) => u({ ratingText: v })} className="md:col-span-2" />
      </div>
    </Panel>
  );
}

function AboutTab({ d, set }: TabProps) {
  const a = d.about; const u = (p: Partial<Draft["about"]>) => patch(set, "about", p);
  return (
    <div className="space-y-6">
      <Panel title="About Section">
        <div className="grid gap-5 md:grid-cols-2">
          <F label="Small label above title" value={a.eyebrow} onChange={(v) => u({ eyebrow: v })} />
          <F label="Section title" value={a.title} onChange={(v) => u({ title: v })} />
          <F label="Bio (blank line between paragraphs)" value={a.paragraphs.join("\n\n")} onChange={(v) => u({ paragraphs: v.split(/\n\s*\n/) })} long rows={8} className="md:col-span-2" />
          <F label="Credentials on photo (one per line, max 3)" value={a.credentials.join("\n")} onChange={(v) => u({ credentials: v.split("\n") })} long rows={3} className="md:col-span-2" />
        </div>
      </Panel>
      <Panel title="Core Pillars">
        <div className="space-y-4">
          {a.pillars.map((p, i) => (
            <Card key={i} title={`Pillar ${i + 1}`} onRemove={() => u({ pillars: a.pillars.filter((_, j) => j !== i) })}>
              <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <F label="Title" value={p.title} onChange={(v) => u({ pillars: replaceAt(a.pillars, i, { ...p, title: v }) })} />
                <F label="Description" value={p.description} onChange={(v) => u({ pillars: replaceAt(a.pillars, i, { ...p, description: v }) })} />
              </div>
            </Card>
          ))}
          <Button variant="outline" className="rounded-full bg-transparent" onClick={() => u({ pillars: [...a.pillars, { title: "New pillar", description: "" }] })}><Plus /> Add pillar</Button>
        </div>
      </Panel>
      <Panel title="Stats Counters">
        <div className="space-y-4">
          {a.stats.map((st, i) => (
            <Card key={i} title={`Stat ${i + 1}`} onRemove={() => u({ stats: a.stats.filter((_, j) => j !== i) })}>
              <div className="grid gap-4 sm:grid-cols-3">
                <F label="Number" type="number" value={st.value} onChange={(v) => u({ stats: replaceAt(a.stats, i, { ...st, value: Number(v) || 0 }) })} />
                <F label="Suffix (e.g. + or %)" value={st.suffix} onChange={(v) => u({ stats: replaceAt(a.stats, i, { ...st, suffix: v }) })} />
                <F label="Label" value={st.label} onChange={(v) => u({ stats: replaceAt(a.stats, i, { ...st, label: v }) })} />
              </div>
            </Card>
          ))}
          <Button variant="outline" className="rounded-full bg-transparent" onClick={() => u({ stats: [...a.stats, { value: 0, suffix: "+", label: "New stat" }] })}><Plus /> Add stat</Button>
        </div>
      </Panel>
    </div>
  );
}

function ServicesTab({ d, set }: TabProps) {
  const sv = d.services; const u = (p: Partial<Draft["services"]>) => patch(set, "services", p);
  const list = sv.items;
  const up = (i: number, p: Partial<Service>) => u({ items: replaceAt(list, i, { ...(list[i] as Service), ...p }) });
  return (
    <Panel title="Services & Pricing">
      <div className="mb-6 grid gap-5 md:grid-cols-2">
        <F label="Small label above title" value={sv.eyebrow} onChange={(v) => u({ eyebrow: v })} />
        <F label="Section title" value={sv.title} onChange={(v) => u({ title: v })} />
      </div>
      <div className="space-y-5">
        {list.map((s, i) => (
          <Card key={s.id} title={`Package ${i + 1}`} onRemove={() => u({ items: list.filter((x) => x.id !== s.id) })}>
            <div className="grid gap-4 md:grid-cols-4">
              <F label="Title" value={s.name} onChange={(v) => up(i, { name: v })} className="md:col-span-2" />
              <F label="Price" value={s.price} onChange={(v) => up(i, { price: v })} />
              <F label="Period" value={s.period} onChange={(v) => up(i, { period: v })} />
              <F label="Description" value={s.description} onChange={(v) => up(i, { description: v })} className="md:col-span-3" />
              <F label="Badge" value={s.badge} onChange={(v) => up(i, { badge: v })} />
              <F label="Features (one per line)" value={s.features.join("\n")} onChange={(v) => up(i, { features: v.split("\n") })} long rows={4} className="md:col-span-4" />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={s.featured} onChange={(e) => up(i, { featured: e.target.checked })} className="accent-primary" /> Highlight as featured</label>
          </Card>
        ))}
        <Button variant="outline" className="rounded-full bg-transparent" onClick={() => u({ items: [...list, { id: newId(), name: "New Package", price: "$0", period: "per session", description: "", features: ["Feature"], badge: "", featured: false }] })}><Plus /> Add package</Button>
      </div>
    </Panel>
  );
}

function TestimonialsTab({ d, set }: TabProps) {
  const t = d.testimonials; const u = (p: Partial<Draft["testimonials"]>) => patch(set, "testimonials", p);
  return (
    <Panel title="Testimonials" hint="Avatar: leave blank for the first letter of the name, type a letter, or paste an image URL.">
      <div className="mb-6 grid gap-5 md:grid-cols-2">
        <F label="Small label above title" value={t.eyebrow} onChange={(v) => u({ eyebrow: v })} />
        <F label="Section title" value={t.title} onChange={(v) => u({ title: v })} />
        <F label="Intro text" value={t.subtitle} onChange={(v) => u({ subtitle: v })} className="md:col-span-2" />
      </div>
      <div className="space-y-4">
        {t.items.map((r, i) => (
          <Card key={r.id} title={`Review ${i + 1}`} onRemove={() => u({ items: t.items.filter((x) => x.id !== r.id) })}>
            <div className="grid gap-4 md:grid-cols-3">
              <F label="Client name" value={r.name} onChange={(v) => u({ items: replaceAt(t.items, i, { ...r, name: v }) })} />
              <F label="Role / grade" value={r.role} onChange={(v) => u({ items: replaceAt(t.items, i, { ...r, role: v }) })} />
              <F label="Avatar initial or photo URL" value={r.avatar} onChange={(v) => u({ items: replaceAt(t.items, i, { ...r, avatar: v }) })} />
              <F label="Quote" value={r.quote} onChange={(v) => u({ items: replaceAt(t.items, i, { ...r, quote: v }) })} long className="md:col-span-3" />
            </div>
          </Card>
        ))}
        <Button variant="outline" className="rounded-full bg-transparent" onClick={() => u({ items: [...t.items, { id: newId(), name: "New client", role: "", avatar: "", quote: "" }] })}><Plus /> Add review</Button>
      </div>
    </Panel>
  );
}

function FaqsTab({ d, set }: TabProps) {
  const f = d.faqs; const u = (p: Partial<Draft["faqs"]>) => patch(set, "faqs", p);
  return (
    <Panel title="FAQs">
      <div className="mb-6 grid gap-5 md:grid-cols-2">
        <F label="Small label above title" value={f.eyebrow} onChange={(v) => u({ eyebrow: v })} />
        <F label="Section title" value={f.title} onChange={(v) => u({ title: v })} />
        <F label="Intro text" value={f.subtitle} onChange={(v) => u({ subtitle: v })} className="md:col-span-2" />
      </div>
      <div className="space-y-4">
        {f.items.map((q, i) => (
          <Card key={q.id} title={`Question ${i + 1}`} onRemove={() => u({ items: f.items.filter((x) => x.id !== q.id) })}>
            <div className="grid gap-4">
              <F label="Question" value={q.q} onChange={(v) => u({ items: replaceAt(f.items, i, { ...q, q: v }) })} />
              <F label="Answer" value={q.a} onChange={(v) => u({ items: replaceAt(f.items, i, { ...q, a: v }) })} long />
            </div>
          </Card>
        ))}
        <Button variant="outline" className="rounded-full bg-transparent" onClick={() => u({ items: [...f.items, { id: newId(), q: "New question?", a: "" }] })}><Plus /> Add question</Button>
      </div>
    </Panel>
  );
}

function ContactTab({ d, set }: TabProps) {
  const c = d.contact; const u = (p: Partial<Draft["contact"]>) => patch(set, "contact", p);
  return (
    <Panel title="Contact & Social">
      <div className="grid gap-5 md:grid-cols-2">
        <F label="Email" value={c.email} onChange={(v) => u({ email: v })} />
        <F label="Phone" value={c.phone} onChange={(v) => u({ phone: v })} />
        <F label="Address / city" value={c.location} onChange={(v) => u({ location: v })} />
        <F label="WhatsApp number (with country code)" value={c.whatsapp} onChange={(v) => u({ whatsapp: v })} />
        <F label="Instagram URL" value={c.instagram} onChange={(v) => u({ instagram: v })} />
        <F label="LinkedIn URL" value={c.linkedin} onChange={(v) => u({ linkedin: v })} />
        <F label="YouTube URL" value={c.youtube} onChange={(v) => u({ youtube: v })} />
        <F label="Newsletter text (footer)" value={c.newsletterText} onChange={(v) => u({ newsletterText: v })} />
      </div>
    </Panel>
  );
}

function ThemeTab() {
  const [theme, setTheme] = useTheme();
  return (
    <Panel title="Theme & Styling">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {THEME_PRESETS.map((p) => (
          <button key={p.id} onClick={() => { setTheme({ preset: p.id, primary: p.primary }); toast.success(`${p.name} applied`); }}
            className={`lift rounded-2xl border-2 p-4 text-left ${theme.preset === p.id ? "border-primary" : "border-transparent"}`}
            style={{ background: p.bg }}>
            <div className="flex gap-2">
              <span className="h-8 w-8 rounded-full" style={{ background: p.primary }} />
              <span className="h-8 w-8 rounded-full border" style={{ background: p.bg }} />
            </div>
            <div className="mt-3 text-sm font-medium" style={{ color: "#222" }}>{p.name}</div>
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Label htmlFor="hex">Custom brand color</Label>
        <input id="hex" type="color" value={theme.primary} onChange={(e) => setTheme({ preset: "custom", primary: e.target.value })} className="h-11 w-16 cursor-pointer rounded-lg border bg-transparent" />
        <Input value={theme.primary} onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setTheme({ preset: "custom", primary: e.target.value })} className="w-32 font-mono" />
        <Button className="rounded-full">Preview button</Button>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Badge</span>
      </div>
    </Panel>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-primary/15 text-primary",
  completed: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function fmtPreferred(d: string) {
  if (!d) return "—";
  const x = new Date(`${d}T00:00:00`);
  return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function csvCell(v: string) {
  const s = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${s.replace(/"/g, '""')}"`;
}

function waLink(phone: string, name = "", service = "") {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const text = `Hi ${name}, thanks for booking a consultation regarding ${service}!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function fillTemplate(t: string, b: Booking) {
  return t.replace(/\{name\}/g, b.name).replace(/\{service\}/g, b.service).replace(/\{email\}/g, b.email);
}

function gmailLink(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function mailLink(email: string, subject: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function statusLabel(s: BookingStatus) {
  return s === "new" ? "pending" : s;
}

function LeadsTab() {
  const [bookings, setBookings] = useBookings();
  const [content] = useContent();
  const labels = content.labels;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [quick, setQuick] = useState<Booking | null>(null);
  const [qSubject, setQSubject] = useState("");
  const [qBody, setQBody] = useState("");
  const openQuick = (b: Booking) => {
    setQuick(b);
    setQSubject(fillTemplate(labels.leadEmailSubject, b));
    setQBody(fillTemplate(labels.leadEmailBody, b));
  };
  const [aiNotes, setAiNotes] = useState("");
  const [aiDetails, setAiDetails] = useState("");
  const shown = useMemo(() => bookings.filter((b) =>
    (filter === "all" || b.status === filter) &&
    [b.name, b.email, b.phone, b.service, b.message].join(" ").toLowerCase().includes(q.toLowerCase()),
  ), [bookings, q, filter]);
  const setStatus = (id: string, status: BookingStatus) => setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Service", "Preferred date", "Submitted", "Status", "Notes"];
    const rows = shown.map((b) => [b.name, b.email, b.phone, b.service, b.date, b.createdAt, statusLabel(b.status), b.message]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map((c) => csvCell(c ?? "")).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    toast.success(`Exported ${shown.length} lead${shown.length === 1 ? "" : "s"}`);
  };
  const analyzeLead = (b: Booking) => {
    setAiDetails(leadToDetails(b));
    if (b.message) setAiNotes(b.message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Panel title="Leads & Bookings">
      <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Email{quick ? ` — ${quick.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>To</Label><Input readOnly value={quick?.email ?? ""} /></div>
            <div><Label>Subject</Label><Input value={qSubject} onChange={(e) => setQSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={9} value={qBody} onChange={(e) => setQBody(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuick(null)}>Cancel</Button>
            <Button asChild className="rounded-full">
              <a
                href={quick ? gmailLink(quick.email, qSubject, qBody) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { if (quick) { if (quick.status === "new") setStatus(quick.id, "contacted"); setQuick(null); } }}
              >
                <Mail /> Send via Gmail
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AiAssistant notes={aiNotes} setNotes={setAiNotes} details={aiDetails} setDetails={setAiDetails} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, service…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="field-select sm:w-44">
          <option value="all">All ({bookings.length})</option>
          <option value="new">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="completed">Completed</option>
        </select>
        <Button variant="outline" className="rounded-full bg-transparent" disabled={shown.length === 0} onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </div>
      {shown.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No bookings yet. Requests from your website will appear here.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">Client</TableHead>
                <TableHead className="hidden md:table-cell">Service</TableHead>
                <TableHead className="hidden lg:table-cell">Preferred date</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((b) => {
                const wa = waLink(b.phone, b.name, b.service);
                const em = mailLink(b.email, labels.leadEmailSubject);
                return (
                <Fragment key={b.id}>
                  <TableRow>
                    <TableCell className="pl-4 max-sm:w-[110px] max-sm:pl-2">
                      <div className="font-medium">{b.name}</div>
                      <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground max-sm:block max-sm:truncate"><Mail className="h-3 w-3" />{b.email}</a>
                      {b.phone && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{b.phone}{wa && <a href={wa} target="_blank" rel="noopener noreferrer" title={labels.leadWhatsAppLabel} className="ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-primary hover:bg-primary/10"><MessageCircle className="h-3 w-3" />{labels.leadWhatsAppLabel}</a>}</div>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap font-medium text-primary md:table-cell">{b.service}</TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell">{fmtPreferred(b.date)}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{fmtDate(b.createdAt)}</TableCell>
                    <TableCell>
                      <label className="flex w-max cursor-pointer items-center gap-2 select-none">
                        <Checkbox
                          checked={b.status !== "new"}
                          onCheckedChange={(c) => setStatus(b.id, c ? "contacted" : "new")}
                          aria-label={`Mark ${b.name} as ${b.status === "new" ? "contacted" : "pending"}`}
                        />
                        <span className={`text-xs font-medium ${b.status === "new" ? "text-muted-foreground" : "text-primary"}`}>
                          {b.status === "new" ? "Pending" : "Contacted"}
                        </span>
                      </label>
                      {b.status === "completed" && (
                        <button
                          type="button"
                          title="Undo completed"
                          onClick={() => setStatus(b.id, "contacted")}
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE.completed}`}
                        >
                          Completed <Undo2 className="h-3 w-3" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 max-sm:pr-1">
                      <div className="flex flex-wrap items-center justify-end gap-1 max-sm:w-[80px] max-sm:[&>a]:size-6 max-sm:[&>a]:min-w-0 max-sm:[&>a]:px-0 max-sm:[&>button]:size-6 max-sm:[&>button]:min-w-0 max-sm:[&>button]:px-0">
                        {wa ? (
                          <Button asChild size="sm" variant="outline" className="rounded-full bg-transparent" title={labels.leadWhatsAppLabel}>
                            <a href={wa} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="text-primary" />
                              <span className="hidden lg:inline">{labels.leadWhatsAppLabel}</span>
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="rounded-full bg-transparent" disabled title="No phone number for this lead">
                            <MessageCircle />
                            <span className="hidden lg:inline">{labels.leadWhatsAppLabel}</span>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline" className="rounded-full bg-transparent" title={labels.leadEmailLabel}>
                          <a href={em}>
                            <Mail className="text-primary" />
                            <span className="hidden lg:inline">{labels.leadEmailLabel}</span>
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full bg-transparent" title="Quick Email" onClick={() => openQuick(b)}>
                          <Zap className="text-primary" />
                          <span className="hidden lg:inline">Quick Email</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-full" title="Analyze with AI" onClick={() => analyzeLead(b)}>
                          <Sparkles className="text-primary" />
                        </Button>
                        {b.message && (
                          <Button size="sm" variant="ghost" className="rounded-full" title="Show notes" onClick={() => setOpenNotes(openNotes === b.id ? null : b.id)}>
                            <MessageSquare className={openNotes === b.id ? "text-primary" : ""} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="rounded-full" title="Mark as completed" onClick={() => setStatus(b.id, "completed")}>
                          <Check className="text-primary" />
                          <span className="hidden xl:inline">Completed</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" title="Delete lead" onClick={() => setBookings(bookings.filter((x) => x.id !== b.id))}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {openNotes === b.id && b.message && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell className="p-0" colSpan={6}>
                        <div className="border-l-2 border-primary/40 px-4 py-3 text-sm sm:ml-4">
                          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes / goals</span>
                          <p className="mt-1 whitespace-pre-line">{b.message}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
                );
              })}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">Showing {shown.length} of {bookings.length}</div>
        </div>
      )}
    </Panel>
  );
}

function SettingsTab({ onReset }: { onReset: () => void }) {
  const [admin, setAdmin] = useAdmin();
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const current = await hashPassword(String(fd.get("current")));
    if (current !== admin?.passwordHash) { toast.error("Current password is incorrect."); return; }
    const email = String(fd.get("email")).trim().toLowerCase();
    const pw = String(fd.get("password"));
    if (pw && pw.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setAdmin({ email, passwordHash: pw ? await hashPassword(pw) : admin.passwordHash });
    e.currentTarget.reset();
    toast.success("Account updated");
  };
  return (
    <Panel title="Account Settings">
      <form onSubmit={submit} className="grid max-w-md gap-4" key={admin?.email}>
        <div className="grid gap-2"><Label>Admin email</Label><Input name="email" type="email" defaultValue={admin?.email} required /></div>
        <div className="grid gap-2"><Label>New password (leave blank to keep)</Label><Input name="password" type="password" /></div>
        <div className="grid gap-2"><Label>Current password</Label><Input name="current" type="password" required /></div>
        <Button type="submit" className="w-fit rounded-full">Update account</Button>
      </form>
      <div className="mt-10 rounded-2xl border border-destructive/30 p-5">
        <div className="font-semibold">Reset to Factory Defaults</div>
        <p className="mt-1 text-sm text-muted-foreground">Restores the original demo content and theme. Your leads and admin login are kept.</p>
        <Button variant="destructive" className="mt-4 rounded-full" onClick={() => {
          if (!window.confirm("Replace all website content with the original demo content?")) return;
          resetToDefaults(); onReset(); toast.success("Factory defaults restored");
        }}><RotateCcw /> Reset to Factory Defaults</Button>
      </div>
    </Panel>
  );
}

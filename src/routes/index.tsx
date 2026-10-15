import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Award, BadgeCheck, CalendarDays, Check, Compass, GraduationCap, HeartHandshake,
  Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Phone, Quote, Sparkles, Star, Target, X, Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookingModal } from "@/components/site/BookingModal";
import { addSubscriber, useContent } from "@/lib/site-store";
import founderImg from "@/assets/founder.jpg";
import { getSeo } from "@/lib/seo.functions";
import { SITE_CONFIG } from "@/site.config";

export const Route = createFileRoute("/")({
  loader: () => getSeo(),
  head: ({ loaderData }) => {
    const s = loaderData ?? SITE_CONFIG;
    return {
      meta: [
        { title: s.title },
        { name: "description", content: s.description },
        { property: "og:title", content: s.title },
        { property: "og:description", content: s.description },
        { property: "og:url", content: `${s.siteUrl}/` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${s.siteUrl}/` }],
    };
  },
  component: Index,
});


function Stat({ n, suffix, label }: { n: number; suffix: string; label: string }) {
  // Starts at the final value so it's never stuck at 0; animates up once mounted.
  const [v, setV] = useState(n);
  useEffect(() => {
    let f = 0;
    setV(0);
    const id = setInterval(() => {
      f++;
      setV(Math.round((n * f) / 40));
      if (f >= 40) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [n]);
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="font-display text-3xl text-primary">{v}{suffix}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Index() {
  const [content] = useContent();
  const { brand, hero, about, contact, labels } = content;
  const NAV = [
    { href: "#about", label: labels.navAbout },
    { href: "#services", label: labels.navServices },
    { href: "#results", label: labels.navResults },
    { href: "#faq", label: labels.navFaq },
  ];
  const services = content.services.items;
  const profile = { ...brand, ...contact };
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string | undefined>();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const photo = profile.photoUrl || founderImg;

  useEffect(() => {
    if (content.seo.title) document.title = content.seo.title;
    const m = document.querySelector('meta[name="description"]');
    if (m && content.seo.description) m.setAttribute("content", content.seo.description);
  }, [content.seo.title, content.seo.description]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  const book = (service?: string) => {
    setPreset(service);
    setOpen(true);
    setMenu(false);
  };

  const subscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    addSubscriber(email);
    e.currentTarget.reset();
    toast.success("You're subscribed!");
  };

  const wa = profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/[^\d]/g, "")}` : "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Navbar */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
        <nav className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-2.5 transition-all ${scrolled ? "glass mx-4 md:mx-auto" : ""}`}>
          <a href="#top" className="font-display text-xl">{profile.brandName}<span className="text-primary">.</span></a>
          <div className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{n.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => book()} className="hidden rounded-full sm:inline-flex">{labels.navCta}</Button>
            <button className="p-2 md:hidden" aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          </div>
        </nav>
        {menu && (
          <div className="glass mx-4 mt-2 flex flex-col gap-1 rounded-2xl p-4 md:hidden">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 hover:bg-accent">{n.label}</a>
            ))}
            <Button onClick={() => book()} className="mt-2 rounded-full">{labels.navCta}</Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="hero-glow relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-[1.15fr_1fr]">
          <div className="fade-up">
            <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
              <BadgeCheck className="h-4 w-4 text-primary" /> {hero.badge}
            </div>
            <h1 className="mt-6 text-4xl leading-[1.05] md:text-6xl">{hero.headline}</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">{hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => book()} className="group rounded-full px-7">
                {hero.ctaLabel} <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-transparent px-7">
                {hero.secondaryCtaLabel}
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
              {hero.ratingText}
            </div>
          </div>

          <div className="fade-up relative mx-auto w-full max-w-sm" style={{ animationDelay: ".15s" }}>
            <div className="glass rounded-[2rem] p-3">
              <img src={photo} alt={profile.founderName} width={832} height={1024} className="aspect-[4/5] w-full rounded-[1.6rem] object-cover" />
              <div className="flex items-center justify-between px-3 pt-4 pb-2">
                <div>
                  <div className="font-display text-lg">{profile.founderName}</div>
                  <div className="text-sm text-muted-foreground">{profile.title}</div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> {brand.availability}
                </span>
              </div>
            </div>
            <div className="glass absolute -left-6 top-10 hidden rounded-2xl px-4 py-3 sm:block">
              <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /> {labels.floatingBadge}</div>
            </div>
            <div className="glass absolute -right-4 bottom-24 hidden rounded-2xl px-4 py-3 sm:block">
              <div className="text-xs text-muted-foreground">{labels.slotLabel}</div>
              <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-primary" /> {labels.slotValue}</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 md:grid-cols-2">
          <div className="relative">
            <img src={photo} alt="" loading="lazy" width={832} height={1024} className="aspect-[4/5] w-full rounded-[2rem] object-cover" />
            <div className="glass absolute -bottom-6 right-6 left-6 grid grid-cols-3 gap-2 rounded-2xl p-4 text-center">
              {about.credentials.slice(0, 3).map((c) => (
                <div key={c} className="text-xs font-medium"><GraduationCap className="mx-auto mb-1 h-4 w-4 text-primary" />{c}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium uppercase tracking-widest text-primary">{about.eyebrow}</span>
            <h2 className="mt-3 text-3xl md:text-5xl">{about.title}</h2>
            {about.paragraphs.filter(Boolean).map((p, i) => <p key={i} className="mt-6 leading-relaxed text-muted-foreground">{p}</p>)}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {about.pillars.map(({ title: t, description: d }, i) => { const I = [Compass, Target, HeartHandshake][i % 3] ?? Compass; return (
                <div key={i} className="glass lift rounded-2xl p-4">
                  <I className="h-5 w-5 text-primary" />
                  <div className="mt-3 font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d}</div>
                </div>
              ); })}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {about.stats.map((st, i) => <Stat key={i} n={Number(st.value) || 0} suffix={st.suffix} label={st.label} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="hero-glow py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium uppercase tracking-widest text-primary">{content.services.eyebrow}</span>
            <h2 className="mt-3 text-3xl md:text-5xl">{content.services.title}</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className={`lift relative flex flex-col rounded-[1.75rem] p-8 ${s.featured ? "bg-foreground text-background" : "glass"}`}>
                {s.badge && (
                  <span className={`absolute top-6 right-6 rounded-full px-3 py-1 text-xs font-medium ${s.featured ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{s.badge}</span>
                )}
                <h3 className="text-2xl">{s.name}</h3>
                <p className={`mt-2 text-sm ${s.featured ? "opacity-70" : "text-muted-foreground"}`}>{s.description}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl">{s.price}</span>
                  <span className={`text-sm ${s.featured ? "opacity-60" : "text-muted-foreground"}`}>{s.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {s.features.map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>
                  ))}
                </ul>
                <Button onClick={() => book(s.name)} variant={s.featured ? "default" : "outline"} className={`mt-8 rounded-full ${s.featured ? "" : "bg-transparent"}`} size="lg">
                  {labels.bookNow}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-primary">{content.testimonials.eyebrow}</span>
              <h2 className="mt-3 text-3xl md:text-5xl">{content.testimonials.title}</h2>
            </div>
            <p className="max-w-sm text-muted-foreground">{content.testimonials.subtitle}</p>
          </div>
          <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
            {content.testimonials.items.map((t) => (
              <figure key={t.id} className="glass lift min-w-[85%] snap-center rounded-2xl p-6 sm:min-w-[60%] md:min-w-0">
                <Quote className="h-6 w-6 text-primary/50" />
                <div className="mt-3 flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <blockquote className="mt-4 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  {/^(https?:|data:|\/)/.test(t.avatar) ? (
                    <img src={t.avatar} alt={t.name} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">{t.avatar || t.name[0] || "★"}</div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="text-sm font-medium uppercase tracking-widest text-primary">{content.faqs.eyebrow}</span>
            <h2 className="mt-3 text-3xl md:text-5xl">{content.faqs.title}</h2>
            <p className="mt-4 text-muted-foreground">{content.faqs.subtitle}</p>
            <Button onClick={() => book()} className="mt-6 rounded-full"><Sparkles /> {labels.navCta}</Button>
          </div>
          <Accordion type="single" collapsible className="glass rounded-2xl px-6">
            {content.faqs.items.map((f, i) => (
              <AccordionItem key={f.id} value={`f${i}`}>
                <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA + Footer */}
      <footer className="bg-foreground pt-20 pb-10 text-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="font-display text-2xl">{profile.brandName}<span className="text-primary">.</span></div>
              <p className="mt-3 max-w-sm text-sm opacity-70">{contact.newsletterText}</p>
              <form onSubmit={subscribe} className="mt-5 flex max-w-sm gap-2">
                <Input name="email" type="email" placeholder={labels.newsletterPlaceholder} className="rounded-full border-background/20 bg-background/10" />
                <Button type="submit" className="rounded-full">{labels.subscribeLabel}</Button>
              </form>
            </div>
            <div>
              <div className="text-sm font-semibold">{labels.quickLinksTitle}</div>
              <ul className="mt-4 space-y-2 text-sm opacity-70">
                {NAV.map((n) => <li key={n.href}><a href={n.href} className="hover:text-primary hover:opacity-100">{n.label}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">{labels.contactTitle}</div>
              <ul className="mt-4 space-y-3 text-sm opacity-70">
                <li className="flex gap-2"><Mail className="h-4 w-4" />{profile.email}</li>
                <li className="flex gap-2"><Phone className="h-4 w-4" />{profile.phone}</li>
                <li className="flex gap-2"><MapPin className="h-4 w-4" />{profile.location}</li>
              </ul>
              <div className="mt-5 flex gap-3">
                {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full bg-background/10 p-2 hover:bg-primary"><MessageCircle className="h-4 w-4" /></a>}
                {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-background/10 p-2 hover:bg-primary"><Instagram className="h-4 w-4" /></a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-full bg-background/10 p-2 hover:bg-primary"><Linkedin className="h-4 w-4" /></a>}
                {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full bg-background/10 p-2 hover:bg-primary"><Youtube className="h-4 w-4" /></a>}
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-background/15 pt-6 text-xs">
            <span className="opacity-60">© {new Date().getFullYear()} {profile.brandName}. {labels.copyright}</span>
            <Link to="/admin" className="opacity-40 transition-opacity hover:text-primary hover:opacity-100">{labels.adminLinkLabel}</Link>
          </div>
        </div>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="lift fixed right-5 bottom-5 z-40 rounded-full bg-primary p-4 text-primary-foreground shadow-lg">
          <MessageCircle className="h-5 w-5" />
        </a>
      )}

      <BookingModal open={open} onOpenChange={setOpen} services={services} defaultService={preset} />
    </div>
  );
}

import { useEffect, useState } from "react";

export interface Profile {
  brandName: string;
  founderName: string;
  title: string;
  tagline: string;
  headline: string;
  bio: string;
  photoUrl: string;
  whatsapp: string;
  email: string;
  phone: string;
  location: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badge: string;
  featured: boolean;
}

export type BookingStatus = "new" | "contacted" | "completed";

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Theme {
  preset: string;
  primary: string;
}

export interface AdminAccount {
  email: string;
  passwordHash: string;
}

export const THEME_PRESETS: { id: string; name: string; primary: string; bg: string }[] = [
  { id: "beige", name: "Warm Neutral Beige", primary: "#9a6b43", bg: "#f6f1ea" },
  { id: "emerald", name: "Modern Emerald Green", primary: "#1f7a5a", bg: "#eef4f0" },
  { id: "slate", name: "Deep Slate Tech", primary: "#33475b", bg: "#eef1f4" },
  { id: "rose", name: "Soft Blush Rose", primary: "#b05a6c", bg: "#f8eeef" },
];

export const DEFAULT_PROFILE: Profile = {
  brandName: "Elena Hart",
  founderName: "Elena Hart",
  title: "Executive & Business Coach",
  tagline: "Clarity, confidence and a plan that actually works.",
  headline: "Unlock Your Full Potential with Expert 1-on-1 Guidance",
  bio: "For over a decade I've helped founders, professionals and students break through plateaus. After leading teams at two scale-ups and earning my ICF certification, I built a practice around one belief: real growth happens when strategy meets accountability. Every session is tailored, practical and focused on measurable progress.",
  photoUrl: "",
  whatsapp: "+15551234567",
  email: "hello@elenahart.co",
  phone: "+1 (555) 123-4567",
  location: "London · Online worldwide",
  instagram: "https://instagram.com",
  linkedin: "https://linkedin.com",
  youtube: "",
};

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "starter",
    name: "Starter Strategy",
    price: "$149",
    period: "per session",
    description: "A focused 90-minute session or small group class to map your next move.",
    features: ["90-minute deep-dive call", "Personal action roadmap", "Session recording", "7 days email follow-up"],
    badge: "Group Class",
    featured: false,
  },
  {
    id: "accelerator",
    name: "1-on-1 Accelerator",
    price: "$590",
    period: "per month",
    description: "Weekly private coaching or tutoring with accountability between sessions.",
    features: ["4 private sessions / month", "Custom growth plan", "WhatsApp support", "Progress reviews", "Resource library"],
    badge: "Most Popular",
    featured: true,
  },
  {
    id: "vip",
    name: "VIP Intensive",
    price: "$1,900",
    period: "3 months",
    description: "High-touch transformation for leaders who want results fast.",
    features: ["Full-day kickoff intensive", "Unlimited messaging", "Bi-weekly 1-on-1 calls", "Priority scheduling", "Lifetime alumni access"],
    badge: "Premium",
    featured: false,
  },
];

const KEYS = {
  profile: "site:profile",
  services: "site:services",
  bookings: "site:bookings",
  theme: "site:theme",
  admin: "site:admin",
  session: "site:session",
  subscribers: "site:subscribers",
  content: "site:content",
} as const;

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.get(key)?.forEach((l) => l());
}

function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    sync();
    setReady(true);
    const set = listeners.get(key) ?? new Set();
    set.add(sync);
    listeners.set(key, set);
    const onStorage = (e: StorageEvent) => e.key === key && sync();
    window.addEventListener("storage", onStorage);
    return () => {
      set.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, (v: T) => write(key, v), ready];
}

export const useProfile = () => useStored<Profile>(KEYS.profile, DEFAULT_PROFILE);
export const useServices = () => useStored<Service[]>(KEYS.services, DEFAULT_SERVICES);
export const useContent = (): [SiteContent, (v: SiteContent) => void, boolean] => {
  const [raw, set, ready] = useStored<Partial<SiteContent>>(KEYS.content, DEFAULT_CONTENT);
  return [mergeContent(raw), set, ready];
};
export const useBookings = () => useStored<Booking[]>(KEYS.bookings, []);
export const useTheme = () => useStored<Theme>(KEYS.theme, { preset: "beige", primary: "#9a6b43" });
export const useAdmin = () => useStored<AdminAccount | null>(KEYS.admin, null);
export const useSession = () => useStored<boolean>(KEYS.session, false);

export function resetToDefaults() {
  write(KEYS.content, DEFAULT_CONTENT);
  write(KEYS.theme, { preset: "beige", primary: "#9a6b43" });
}

export function addBooking(b: Omit<Booking, "id" | "status" | "createdAt">) {
  const list = read<Booking[]>(KEYS.bookings, []);
  write(KEYS.bookings, [
    { ...b, id: crypto.randomUUID(), status: "new" as const, createdAt: new Date().toISOString() },
    ...list,
  ]);
}

export function addSubscriber(email: string) {
  const list = read<string[]>(KEYS.subscribers, []);
  if (!list.includes(email)) write(KEYS.subscribers, [...list, email]);
}

export async function hashPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`coach-site:${pw}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newId() {
  return crypto.randomUUID();
}

// ---------- Unified CMS content ----------
export interface Pillar { title: string; description: string }
export interface StatItem { value: number; suffix: string; label: string }
export interface Testimonial { id: string; quote: string; name: string; role: string; avatar: string }
export interface Faq { id: string; q: string; a: string }

export interface BookingTexts {
  title: string; subtitle: string;
  nameLabel: string; namePlaceholder: string; emailLabel: string; emailPlaceholder: string;
  phoneLabel: string; phonePlaceholder: string; serviceLabel: string; freeOption: string;
  dateLabel: string; messageLabel: string; messagePlaceholder: string;
  submitLabel: string; sendingLabel: string; successTitle: string; successMessage: string; errorMessage: string;
}

export interface SiteContent {
  brand: { brandName: string; founderName: string; title: string; photoUrl: string; availability: string };
  hero: { badge: string; headline: string; subheadline: string; ctaLabel: string; secondaryCtaLabel: string; ratingText: string };
  about: { eyebrow: string; title: string; paragraphs: string[]; credentials: string[]; pillars: Pillar[]; stats: StatItem[] };
  services: { eyebrow: string; title: string; items: Service[] };
  testimonials: { eyebrow: string; title: string; subtitle: string; items: Testimonial[] };
  faqs: { eyebrow: string; title: string; subtitle: string; items: Faq[] };
  labels: { navAbout: string; navServices: string; navResults: string; navFaq: string; navCta: string; bookNow: string; floatingBadge: string; slotLabel: string; slotValue: string; quickLinksTitle: string; contactTitle: string; newsletterPlaceholder: string; subscribeLabel: string; copyright: string; adminLinkLabel: string; leadWhatsAppLabel: string; leadEmailLabel: string; leadEmailSubject: string; leadEmailBody: string };
  seo: { title: string; description: string };
  booking: BookingTexts;
  contact: { email: string; phone: string; location: string; whatsapp: string; instagram: string; linkedin: string; youtube: string; newsletterText: string };
}

export const DEFAULT_CONTENT: SiteContent = {
  brand: { brandName: "Elena Hart", founderName: "Elena Hart", title: "Executive & Business Coach", photoUrl: "", availability: "Available" },
  hero: {
    badge: "150+ Clients Coached · 99% Success Rate",
    headline: "Unlock Your Full Potential with Expert 1-on-1 Guidance",
    subheadline: "Clarity, confidence and a plan that actually works.",
    ctaLabel: "Book Free Consultation",
    secondaryCtaLabel: "View Programs",
    ratingText: "Rated 4.9/5 by clients & students",
  },
  about: {
    eyebrow: "About & Philosophy",
    title: "Hi, I'm Elena.",
    paragraphs: [
      "For over a decade I've helped founders, professionals and students break through plateaus. After leading teams at two scale-ups and earning my ICF certification, I built a practice around one belief: real growth happens when strategy meets accountability.",
      "Every session is tailored, practical and focused on measurable progress.",
    ],
    credentials: ["ICF PCC", "MBA, LBS", "10+ yrs"],
    pillars: [
      { title: "Clarity", description: "Define what success means to you." },
      { title: "Strategy", description: "Practical plans, not theory." },
      { title: "Accountability", description: "Support that keeps you moving." },
    ],
    stats: [
      { value: 150, suffix: "+", label: "Clients" },
      { value: 99, suffix: "%", label: "Success" },
      { value: 10, suffix: "+", label: "Years" },
    ],
  },
  services: { eyebrow: "Services & Pricing", title: "Choose your path forward", items: DEFAULT_SERVICES },
  testimonials: {
    eyebrow: "Results",
    title: "Real people, real progress",
    subtitle: "Stories from clients and students who did the work — and saw it pay off.",
    items: [
      { id: "t1", name: "Marcus Lee", role: "Founder, Northwind Studio", avatar: "", quote: "In three months I doubled revenue and finally hired my first team. The clarity was worth every penny." },
      { id: "t2", name: "Priya Shah", role: "A/L Student, now at Imperial", avatar: "", quote: "My maths grade went from a C to an A*. Sessions were patient, structured and genuinely fun." },
      { id: "t3", name: "Daniel Ortiz", role: "Senior PM, Fintech", avatar: "", quote: "I landed a promotion I'd been chasing for two years. The accountability changed everything." },
      { id: "t4", name: "Sophie Laurent", role: "Wellness Consultant", avatar: "", quote: "Elegant frameworks, honest feedback. I left every call with a clear next step." },
      { id: "t5", name: "James Okafor", role: "Career Changer", avatar: "", quote: "Went from burnout to a role I love. Couldn't recommend this more." },
      { id: "t6", name: "Aiko Tanaka", role: "E-commerce Owner", avatar: "", quote: "The VIP intensive reshaped my whole business model in one weekend." },
    ],
  },
  faqs: {
    eyebrow: "FAQ",
    title: "Questions, answered",
    subtitle: "Still unsure? Book a free call and ask me anything.",
    items: [
      { id: "f1", q: "How do I book a session?", a: "Click any “Book” button, fill in the short form with your preferred date, and I'll confirm by email or WhatsApp within 24 hours." },
      { id: "f2", q: "Is the first consultation really free?", a: "Yes. The 20-minute discovery call is free with no obligation — it's a chance to see if we're a good fit." },
      { id: "f3", q: "What payment methods do you accept?", a: "Card, bank transfer and PayPal. Packages can be paid monthly or upfront with a discount." },
      { id: "f4", q: "What is your cancellation policy?", a: "Reschedule or cancel free of charge up to 24 hours before your session. Late cancellations count as a used session." },
      { id: "f5", q: "Are sessions online or in person?", a: "Both. Most clients meet via Zoom or Google Meet; in-person sessions are available locally on request." },
      { id: "f6", q: "Do you offer group classes?", a: "Yes — Starter Strategy runs as small-group classes of up to 8 people, perfect for students and early-stage founders." },
    ],
  },
  labels: {
    navAbout: "About", navServices: "Services", navResults: "Results", navFaq: "FAQ", navCta: "Book Free Session", bookNow: "Book Now",
    floatingBadge: "ICF Certified", slotLabel: "Next slot", slotValue: "This week",
    quickLinksTitle: "Quick links", contactTitle: "Contact", newsletterPlaceholder: "Your email", subscribeLabel: "Subscribe",
    copyright: "All rights reserved.", adminLinkLabel: "Admin Login",
    leadWhatsAppLabel: "Reply via WhatsApp", leadEmailLabel: "Send Email", leadEmailSubject: "Regarding your consultation request",
    leadEmailBody: "Hi {name},\n\nThanks for booking a consultation regarding {service}! I've received your request and would love to find a time to talk.\n\nWould you be available for a short call this week? Let me know what suits you best.\n\nWarm regards",
  },
  seo: {
    title: "Elena Hart — Executive Coach & Mentor | 1-on-1 Guidance",
    description: "Unlock your full potential with personalised 1-on-1 coaching, consulting and private tutoring. Book a free consultation today.",
  },
  booking: {
    title: "Book your session", subtitle: "Tell me a little about you and pick a preferred date.",
    nameLabel: "Full name", namePlaceholder: "Jane Doe", emailLabel: "Email", emailPlaceholder: "jane@email.com",
    phoneLabel: "Phone / WhatsApp", phonePlaceholder: "+1 555 000 0000", serviceLabel: "Service / class", freeOption: "Free Consultation",
    dateLabel: "Preferred date", messageLabel: "Your goals", messagePlaceholder: "What would you like to achieve?",
    submitLabel: "Confirm request", sendingLabel: "Sending…", successTitle: "Request received!",
    successMessage: "I'll be in touch within 24 hours to confirm your session.", errorMessage: "Please enter your name and a valid email.",
  },
  contact: {
    email: DEFAULT_PROFILE.email, phone: DEFAULT_PROFILE.phone, location: DEFAULT_PROFILE.location, whatsapp: DEFAULT_PROFILE.whatsapp,
    instagram: DEFAULT_PROFILE.instagram, linkedin: DEFAULT_PROFILE.linkedin, youtube: "",
    newsletterText: "Monthly insights on growth, focus and learning. No spam.",
  },
};

function mergeContent(raw: Partial<SiteContent> | null | undefined): SiteContent {
  const r = raw ?? {};
  const out = {} as SiteContent;
  (Object.keys(DEFAULT_CONTENT) as (keyof SiteContent)[]).forEach((k) => {
    (out as unknown as Record<string, unknown>)[k] = { ...DEFAULT_CONTENT[k], ...((r[k] as object) ?? {}) };
  });
  return out;
}

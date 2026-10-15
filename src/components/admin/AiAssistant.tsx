import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { recommendFollowUp, recommendPackage, type FollowUpAdvice, type PackageRecommendation } from "@/lib/ai.functions";
import { useContent, type Booking } from "@/lib/site-store";

export function leadToDetails(b: Booking) {
  return [
    `Name: ${b.name}`,
    `Email: ${b.email}`,
    b.phone && `Phone: ${b.phone}`,
    `Service requested: ${b.service}`,
    b.date && `Preferred date: ${b.date}`,
    `Submitted: ${b.createdAt.slice(0, 10)}`,
    `Status: ${b.status}`,
    b.message && `Notes: ${b.message}`,
  ].filter(Boolean).join("\n");
}

export function AiAssistant({ notes, setNotes, details, setDetails }: {
  notes: string; setNotes: (v: string) => void; details: string; setDetails: (v: string) => void;
}) {
  const [content] = useContent();
  const pkgFn = useServerFn(recommendPackage);
  const fuFn = useServerFn(recommendFollowUp);
  const [pkg, setPkg] = useState<PackageRecommendation | null>(null);
  const [fu, setFu] = useState<FollowUpAdvice | null>(null);
  const [busy, setBusy] = useState<"pkg" | "fu" | null>(null);
  const [err, setErr] = useState<{ pkg?: string | undefined; fu?: string | undefined }>({});

  const runPkg = async () => {
    setBusy("pkg"); setErr((e) => ({ ...e, pkg: undefined })); setPkg(null);
    try {
      const r = await pkgFn({ data: { notes, packages: content.services.items.map((s) => ({ name: s.name, price: s.price, description: s.description })) } });
      if (r.ok) setPkg(r.result); else setErr((e) => ({ ...e, pkg: r.error }));
    } catch { setErr((e) => ({ ...e, pkg: "Something went wrong." })); }
    setBusy(null);
  };
  const runFu = async () => {
    setBusy("fu"); setErr((e) => ({ ...e, fu: undefined })); setFu(null);
    try {
      const r = await fuFn({ data: { details } });
      if (r.ok) setFu(r.result); else setErr((e) => ({ ...e, fu: r.error }));
    } catch { setErr((e) => ({ ...e, fu: "Something went wrong." })); }
    setBusy(null);
  };

  const prioStyle = { high: "bg-destructive text-destructive-foreground", medium: "bg-primary text-primary-foreground", low: "bg-muted text-muted-foreground" };

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card/60 p-5">
        <h3 className="flex items-center gap-2 font-display text-lg"><Sparkles className="h-4 w-4 text-primary" /> Goals & package match</h3>
        <p className="mt-1 text-xs text-muted-foreground">Paste a prospect's booking notes to summarize their goals and get a package recommendation.</p>
        <Textarea className="mt-3" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. I'm a new manager struggling with delegation and want to be ready for a promotion in 6 months…" />
        <Button className="mt-3 rounded-full" disabled={busy !== null || notes.trim().length < 3} onClick={runPkg}>
          {busy === "pkg" ? <Loader2 className="animate-spin" /> : <Sparkles />} Analyze notes
        </Button>
        {err.pkg && <p className="mt-3 text-sm text-destructive">{err.pkg}</p>}
        {pkg && (
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Goals</div>
              <ul className="mt-1 list-disc space-y-1 pl-5">{pkg.goalsSummary.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Recommended package</div>
              <div className="mt-1 font-medium text-primary">{pkg.recommendedPackage}</div>
              <p className="mt-1 text-muted-foreground">{pkg.reason}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card/60 p-5">
        <h3 className="flex items-center gap-2 font-display text-lg"><Sparkles className="h-4 w-4 text-primary" /> Follow-up advisor</h3>
        <p className="mt-1 text-xs text-muted-foreground">Enter a lead's details (or click the sparkle on a lead below) to get a priority and next step.</p>
        <Textarea className="mt-3" rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Name, service, when they enquired, what they said…" />
        <Button className="mt-3 rounded-full" disabled={busy !== null || details.trim().length < 3} onClick={runFu}>
          {busy === "fu" ? <Loader2 className="animate-spin" /> : <Sparkles />} Get follow-up advice
        </Button>
        {err.fu && <p className="mt-3 text-sm text-destructive">{err.fu}</p>}
        {fu && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${prioStyle[fu.priority]}`}>{fu.priority} priority</span>
            </div>
            <p className="text-muted-foreground">{fu.rationale}</p>
            <div className="rounded-xl bg-primary/10 p-3">
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Next action</div>
              <p className="mt-1">{fu.nextAction}</p>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Suggested message</div>
              <p className="mt-1 whitespace-pre-line rounded-xl border p-3">{fu.suggestedMessage}</p>
              <Button size="sm" variant="outline" className="mt-2 rounded-full bg-transparent" onClick={() => navigator.clipboard.writeText(fu.suggestedMessage)}>Copy message</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

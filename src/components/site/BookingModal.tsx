import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addBooking, useContent, type Service } from "@/lib/site-store";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  services: Service[];
  defaultService?: string | undefined;
}

export function BookingModal({ open, onOpenChange, services, defaultService }: Props) {
  const [loading, setLoading] = useState(false);
  const [content] = useContent();
  const t = content.booking;
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    if (!get("name") || !/^\S+@\S+\.\S+$/.test(get("email"))) {
      toast.error(t.errorMessage);
      return;
    }
    setLoading(true);
    addBooking({
      name: get("name").slice(0, 100),
      email: get("email").slice(0, 200),
      phone: get("phone").slice(0, 40),
      service: get("service"),
      date: get("date"),
      message: get("message").slice(0, 1000),
    });
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      toast.success(t.successTitle, { description: t.successMessage });
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-2xl">{t.title}</DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" key={defaultService}>
          <div className="grid gap-2">
            <Label htmlFor="b-name">{t.nameLabel}</Label>
            <Input id="b-name" name="name" required maxLength={100} placeholder={t.namePlaceholder} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="b-email">{t.emailLabel}</Label>
              <Input id="b-email" name="email" type="email" required placeholder={t.emailPlaceholder} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-phone">{t.phoneLabel}</Label>
              <Input id="b-phone" name="phone" placeholder={t.phonePlaceholder} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="b-service">{t.serviceLabel}</Label>
              <select id="b-service" name="service" defaultValue={defaultService ?? t.freeOption} className="field-select">
                <option>{t.freeOption}</option>
                {services.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-date">{t.dateLabel}</Label>
              <Input id="b-date" name="date" type="date" min={today} required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-msg">{t.messageLabel}</Label>
            <Textarea id="b-msg" name="message" rows={3} maxLength={1000} placeholder={t.messagePlaceholder} />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="rounded-full">
            {loading ? t.sendingLabel : t.submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

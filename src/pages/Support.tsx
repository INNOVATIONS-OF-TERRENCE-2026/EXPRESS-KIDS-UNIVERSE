import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, CreditCard, RefreshCw, Mic, Package, Users,
  Search, ChevronDown, ChevronUp, Send, Paperclip, X,
  CheckCircle2, AlertCircle, Clock, Shield, Lock, ExternalLink,
  Loader2, HelpCircle, FileText, Heart, Mail, Phone, MapPin,
} from "lucide-react";
import {
  AuroraGradient, StarfieldParticles, StaggerContainer, StaggerItem,
} from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { brand } from "@/lib/brand";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════
   BUSINESS CONTACT CONSTANTS
   ═══════════════════════════════════════════════════════ */
const SUPPORT_EMAIL = "expresskids-studio@expressaudiopower.com";
const SUPPORT_PHONE = "+1 (531) 348-9321";
const SUPPORT_PHONE_TEL = "tel:+15313489321";
const BUSINESS_ADDRESS = "4917 Peninsula Way Apt 6106, Garland, TX 75043, United States";
const BUSINESS_ENTITY = "Express Audio Power Co";
const LAST_UPDATED = "March 1, 2026";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type TicketCategory =
  | "billing"
  | "subscription_cancel"
  | "refund"
  | "technical"
  | "content_concern"
  | "general";

interface QuickAction {
  icon: typeof Film;
  label: string;
  description: string;
  category: TicketCategory;
  faqKey: string;
}

interface FaqEntry {
  q: string;
  a: string;
  tags: string[];
}

interface SystemStatus {
  name: string;
  key: string;
  status: "operational" | "degraded" | "outage";
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Film, label: "Video Not Playing", description: "Troubleshoot playback, buffering, or loading issues.", category: "technical", faqKey: "video" },
  { icon: CreditCard, label: "Billing / Subscription", description: "Manage your plan, view receipts, or update payment.", category: "billing", faqKey: "billing" },
  { icon: RefreshCw, label: "Refund Request", description: "Request a refund or dispute a charge.", category: "refund", faqKey: "refund" },
  { icon: Mic, label: "Voice / Audio Issues", description: "Fix audio playback, voice engine, or sound sync.", category: "technical", faqKey: "audio" },
  { icon: Package, label: "Toy Orders", description: "Track, return, or report issues with toy orders.", category: "general", faqKey: "toys" },
  { icon: Users, label: "Parental Controls", description: "Manage child profiles, content filters, and screen time.", category: "content_concern", faqKey: "parental" },
];

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "billing", label: "Billing Issue" },
  { value: "subscription_cancel", label: "Subscription Cancel" },
  { value: "refund", label: "Refund Request" },
  { value: "technical", label: "Technical Issue" },
  { value: "content_concern", label: "Content Concern" },
  { value: "general", label: "General Inquiry" },
];

const FAQ_DATA: FaqEntry[] = [
  // Billing
  { q: "How do subscriptions work?", a: "Express Kids Universe offers monthly and annual plans. Your subscription renews automatically unless cancelled. You can manage your plan from Account → Billing.", tags: ["billing", "subscription", "plan", "payment"] },
  { q: "How do I cancel my subscription?", a: "Go to Account → Billing → Cancel Plan, or use the cancellation link below. Cancellation takes effect at the end of your current billing period — you keep access until then.", tags: ["billing", "cancel", "subscription"] },
  { q: "How are refunds processed?", a: "Refunds are processed within 5-10 business days back to your original payment method. Submit a refund request below and our team will respond within 24-48 hours.", tags: ["refund", "billing", "money"] },
  { q: "Where can I find my receipt?", a: "Receipts are emailed automatically after each payment. You can also view billing history in Account → Billing. Check spam if you don't see it.", tags: ["billing", "receipt", "invoice"] },
  { q: "How does the charge appear on my statement?", a: "Charges appear as \"EXPRESS KIDS UNIVERSE\" or the shortened form \"EKU App\" on your bank or credit card statement.", tags: ["billing", "charge", "statement", "bank"] },
  // Technical
  { q: "My video won't play — what should I do?", a: "Try: 1) Refresh the page, 2) Clear browser cache, 3) Check your internet connection, 4) Try a different browser. If the issue persists, submit a ticket below.", tags: ["video", "technical", "playback", "buffering"] },
  { q: "Audio or voice isn't working", a: "Make sure your device volume is up and browser permissions allow audio. Check Parent Controls to ensure sound is enabled. Try reloading the page.", tags: ["audio", "voice", "sound", "technical"] },
  // Parental
  { q: "How do parental controls work?", a: "Parents can set content filters, screen time limits, and manage child profiles from the Parent Controls page. All content is COPPA-compliant and kid-safe by default.", tags: ["parental", "children", "safety", "coppa"] },
  // Toys
  { q: "How do I track my toy order?", a: "Toy order tracking is available in your Account → Orders section. You'll also receive email updates when your order ships.", tags: ["toys", "order", "shipping", "tracking"] },
  // Refund
  { q: "Can I get a refund if I forgot to cancel?", a: "Yes — if you contact us within 48 hours of a renewal charge, we can process a full refund. Submit a refund request below.", tags: ["refund", "cancel", "forgot", "billing"] },
  // General
  { q: "Is Express Kids Universe safe for children?", a: "Absolutely. We are COPPA-compliant, all content is AI-moderated for child safety, and we never show ads or collect children's personal data.", tags: ["safety", "coppa", "children", "privacy"] },
  { q: "What data do you collect?", a: "We collect only what's needed to provide the service: account email, child's first name and age for story personalization. We never sell data. See our full Privacy Policy.", tags: ["privacy", "data", "security"] },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function Support() {
  const { user } = useAuth();

  /* ── Quick-action expansion ── */
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  /* ── Contact form ── */
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    order_id: "",
    subscription_email: "",
    category: "general" as TicketCategory,
    message: "",
    consent: false,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── FAQ search ── */
  const [faqSearch, setFaqSearch] = useState("");
  const [faqDebounced, setFaqDebounced] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onSearchChange = useCallback((val: string) => {
    setFaqSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFaqDebounced(val), 250);
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!faqDebounced.trim()) return FAQ_DATA;
    const terms = faqDebounced.toLowerCase().split(/\s+/);
    return FAQ_DATA.filter((f) =>
      terms.every(
        (t) =>
          f.q.toLowerCase().includes(t) ||
          f.a.toLowerCase().includes(t) ||
          f.tags.some((tag) => tag.includes(t)),
      ),
    );
  }, [faqDebounced]);

  /* ── System status ── */
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: "Video Generation", key: "video", status: "operational" },
    { name: "Streaming", key: "streaming", status: "operational" },
    { name: "AR System", key: "ar", status: "operational" },
    { name: "Billing", key: "billing", status: "operational" },
  ]);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("system-health");
        if (!cancelled && data?.systems) {
          setSystems(data.systems);
        }
      } catch {
        // Silently fall back to defaults
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Pre-fill category from quick action ── */
  const selectCategory = useCallback((cat: TicketCategory) => {
    setForm((prev) => ({ ...prev, category: cat }));
    document.getElementById("support-contact-form")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── File handler ── */
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setSubmitResult({ ok: false, message: "File must be under 5 MB." });
      return;
    }
    setAttachment(file);
    setSubmitResult(null);
  }, []);

  /* ── Form submit ── */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      setSubmitResult(null);
      setSubmitting(true);

      abortRef.current = new AbortController();

      try {
        // Upload attachment if present
        let attachmentUrl: string | null = null;
        if (attachment) {
          const ext = attachment.name.split(".").pop();
          const path = `support/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("support-attachments")
            .upload(path, attachment, { upsert: false });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage
              .from("support-attachments")
              .getPublicUrl(path);
            attachmentUrl = urlData?.publicUrl ?? null;
          }
        }

        const { data, error } = await supabase.functions.invoke(
          "submit-support-ticket",
          {
            body: {
              ...form,
              attachment_url: attachmentUrl,
            },
          },
        );

        if (error) throw error;

        setSubmitResult({
          ok: true,
          message: data?.message ?? "Ticket submitted successfully!",
        });

        // Reset form
        setForm({
          full_name: "",
          email: user?.email ?? "",
          order_id: "",
          subscription_email: "",
          category: "general",
          message: "",
          consent: false,
        });
        setAttachment(null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setSubmitResult({
          ok: false,
          message: err?.message ?? "Something went wrong. Please try again.",
        });
      } finally {
        setSubmitting(false);
        abortRef.current = null;
      }
    },
    [form, attachment, submitting, user],
  );

  /* ── Expanded FAQ item ── */
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <AuroraGradient intensity="low" />
      <StarfieldParticles count={30} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* ────────────────── HERO ────────────────── */}
        <StaggerContainer className="text-center mb-16" delay={0.1}>
          <StaggerItem>
            <h1 className="font-heading text-4xl md:text-5xl font-black aurora-text mb-4">
              {brand.name} Support
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-2">
              We're here to help your family's creative journey.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Last updated: {LAST_UPDATED}
            </p>
          </StaggerItem>
        </StaggerContainer>

        {/* ────────────────── DIRECT CONTACT CARDS ────────────────── */}
        <section className="mb-20">
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="glass-card p-5 flex items-start gap-3 hover:ring-1 hover:ring-primary/30 transition-all group"
              aria-label="Email support"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Email Us</p>
                <p className="text-xs text-primary group-hover:underline break-all">{SUPPORT_EMAIL}</p>
                <p className="text-xs text-muted-foreground mt-1">Response within 24–48 hours</p>
              </div>
            </a>

            <a
              href={SUPPORT_PHONE_TEL}
              className="glass-card p-5 flex items-start gap-3 hover:ring-1 hover:ring-primary/30 transition-all group"
              aria-label="Call support"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Call Us</p>
                <p className="text-xs text-primary group-hover:underline">{SUPPORT_PHONE}</p>
                <p className="text-xs text-muted-foreground mt-1">Mon–Fri, 9 AM – 5 PM CT</p>
              </div>
            </a>

            <div className="glass-card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">{BUSINESS_ENTITY}</p>
                <p className="text-xs text-muted-foreground">4917 Peninsula Way Apt 6106</p>
                <p className="text-xs text-muted-foreground">Garland, TX 75043, US</p>
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────── QUICK ACTIONS ────────────────── */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            How Can We Help?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isOpen = expandedAction === action.label;
              const relevantFaqs = FAQ_DATA.filter((f) =>
                f.tags.includes(action.faqKey),
              );

              return (
                <motion.div
                  key={action.label}
                  className="glass-card p-5 cursor-pointer select-none"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setExpandedAction(isOpen ? null : action.label)
                  }
                  layout
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">
                          {action.label}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                          {relevantFaqs.map((faq, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{faq.q}</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                {faq.a}
                              </p>
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectCategory(action.category);
                            }}
                            className="text-xs text-primary font-semibold hover:underline mt-2 inline-block"
                          >
                            Still need help? Contact us →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ────────────────── BILLING FAQ (CHARGEBACK PREVENTION) ────────────────── */}
        <section className="mb-20">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold">
                Billing &amp; Subscription Help
              </h2>
            </div>

            <div className="space-y-4 mb-8">
              {FAQ_DATA.filter((f) => f.tags.includes("billing")).map(
                (faq, i) => (
                  <div key={i} className="border-b border-border/20 pb-4">
                    <p className="font-semibold text-sm">{faq.q}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {faq.a}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Manage Your Subscription
                </h3>
                <p className="text-xs text-muted-foreground">
                  {user
                    ? "Access the Stripe Customer Portal to update payment, download invoices, or cancel."
                    : "Sign in to manage your subscription, or enter the email associated with your account below."}
                </p>
              </div>
              {user ? (
                <Link to="/account">
                  <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Billing Portal
                  </button>
                </Link>
              ) : (
                <Link to="/auth">
                  <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                    Sign In to Manage
                  </button>
                </Link>
              )}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-muted-foreground">
              <strong>Statement descriptor:</strong> Charges from Express Kids Universe appear on your bank statement as{" "}
              <span className="font-mono text-foreground">"EXPRESS KIDS UNIVERSE"</span> or{" "}
              <span className="font-mono text-foreground">"EKU App"</span>.
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/legal/refund-policy" className="text-primary hover:underline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Refund Policy
              </Link>
              <Link to="/legal/subscription-policy" className="text-primary hover:underline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Subscription &amp; Cancellation Policy
              </Link>
            </div>
          </div>
        </section>

        {/* ────────────────── CONTACT FORM ────────────────── */}
        <section id="support-contact-form" className="mb-20 scroll-mt-24">
          <div className="glass-card p-8">
            <h2 className="font-heading text-2xl font-bold mb-2">
              Contact Support
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill out the form below and our team will respond within 24-48 hours.
            </p>

            <AnimatePresence>
              {submitResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                    submitResult.ok
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}
                >
                  {submitResult.ok ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{submitResult.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row: Name + Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sf-name" className="block text-sm font-medium mb-1.5">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="sf-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="sf-email" className="block text-sm font-medium mb-1.5">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="sf-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Row: Order ID + Subscription Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sf-order" className="block text-sm font-medium mb-1.5">
                    Order ID <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    id="sf-order"
                    type="text"
                    maxLength={60}
                    value={form.order_id}
                    onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))}
                    className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="e.g. ORD-12345"
                  />
                </div>
                <div>
                  <label htmlFor="sf-subemail" className="block text-sm font-medium mb-1.5">
                    Subscription Email{" "}
                    <span className="text-muted-foreground text-xs">(if different)</span>
                  </label>
                  <input
                    id="sf-subemail"
                    type="email"
                    value={form.subscription_email}
                    onChange={(e) => setForm((p) => ({ ...p, subscription_email: e.target.value }))}
                    className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="billing@example.com"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="sf-category" className="block text-sm font-medium mb-1.5">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  id="sf-category"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      category: e.target.value as TicketCategory,
                    }))
                  }
                  className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="sf-message" className="block text-sm font-medium mb-1.5">
                  Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="sf-message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-y"
                  placeholder="Describe your issue..."
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {form.message.length}/5000
                </p>
              </div>

              {/* File attachment */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Attachment <span className="text-muted-foreground text-xs">(optional, max 5 MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.log"
                  onChange={handleFile}
                  className="hidden"
                />
                {attachment ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 text-sm">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach a file
                  </button>
                )}
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
                  className="mt-1 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/legal/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and consent to Express Kids Universe processing my support request.{" "}
                  <span className="text-destructive">*</span>
                </span>
              </label>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Ticket
                    </>
                  )}
                </button>
                {submitting && (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* ────────────────── SYSTEM STATUS ────────────────── */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            System Status
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systems.map((sys) => {
              const color =
                sys.status === "operational"
                  ? "text-green-400"
                  : sys.status === "degraded"
                    ? "text-yellow-400"
                    : "text-red-400";
              const bg =
                sys.status === "operational"
                  ? "bg-green-500/10"
                  : sys.status === "degraded"
                    ? "bg-yellow-500/10"
                    : "bg-red-500/10";
              const StatusIcon =
                sys.status === "operational"
                  ? CheckCircle2
                  : sys.status === "degraded"
                    ? Clock
                    : AlertCircle;

              return (
                <div
                  key={sys.key}
                  className={`glass-card p-4 flex items-center gap-3 ${bg}`}
                >
                  <StatusIcon className={`w-5 h-5 ${color}`} />
                  <div>
                    <p className="font-semibold text-sm">{sys.name}</p>
                    <p className={`text-xs capitalize ${color}`}>
                      {sys.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {statusLoading && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Checking status…
            </p>
          )}
        </section>

        {/* ────────────────── SEARCHABLE HELP CENTER ────────────────── */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            Help Center
          </h2>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search help articles…"
              className="w-full rounded-xl bg-muted/40 border border-border/40 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              aria-label="Search FAQ"
            />
          </div>

          <div className="space-y-2">
            {filteredFaqs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No results found. Try a different search term or{" "}
                <button
                  onClick={() => {
                    onSearchChange("");
                    selectCategory("general");
                  }}
                  className="text-primary hover:underline"
                >
                  contact us directly
                </button>
                .
              </p>
            )}
            {filteredFaqs.map((faq, i) => {
              const isOpen = expandedFaq === i;
              return (
                <motion.div
                  key={i}
                  className="glass-card overflow-hidden"
                  layout
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-sm pr-4">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm text-muted-foreground">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ────────────────── PRIVACY & TRUST BLOCK ────────────────── */}
        <section className="mb-16">
          <div className="glass-card p-8 text-center">
            <h2 className="font-heading text-xl font-bold mb-4">
              Your Privacy &amp; Trust
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              Express Kids Universe is committed to protecting your family's data.
              We are COPPA-compliant and never sell personal information.
              All payments are processed securely through Stripe.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>COPPA Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>Encrypted Data</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Stripe Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-primary" />
                <span>Kid-Safe Content</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                to="/legal/privacy"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Privacy Policy
              </Link>
              <Link
                to="/legal/terms"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Terms of Service
              </Link>
              <Link
                to="/legal/refund-policy"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Refund Policy
              </Link>
              <Link
                to="/legal/subscription-policy"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Subscription Policy
              </Link>
              <Link
                to="/parents"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" /> Parental Controls
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

// @ts-nocheck — Deno edge function; VS Code TS checker lacks Deno types
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── Simple in-memory rate limiter (per-instance) ─── */
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 5; // max 5 submissions per minute per IP/email

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ─── Input validation helpers ─── */
const CATEGORIES = [
  "billing",
  "subscription_cancel",
  "refund",
  "technical",
  "content_concern",
  "general",
] as const;

function sanitize(str: string): string {
  return str
    .replace(/<[^>]*>/g, "") // strip HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // strip control chars
    .trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* ── Parse body ── */
    const body = await req.json();
    const {
      full_name,
      email,
      order_id,
      subscription_email,
      category,
      message,
      attachment_url,
      consent,
    } = body;

    /* ── Validate required fields ── */
    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      return jsonError("Full name is required (min 2 characters).", 400);
    }
    if (!email || !isValidEmail(email)) {
      return jsonError("A valid email is required.", 400);
    }
    if (!category || !CATEGORIES.includes(category)) {
      return jsonError(`Category must be one of: ${CATEGORIES.join(", ")}`, 400);
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return jsonError("Message must be at least 10 characters.", 400);
    }
    if (message.length > 5000) {
      return jsonError("Message must be under 5000 characters.", 400);
    }
    if (!consent) {
      return jsonError("You must agree to the privacy policy.", 400);
    }

    /* ── Rate-limit by email ── */
    if (isRateLimited(email.toLowerCase())) {
      return jsonError("Too many requests. Please try again in a minute.", 429);
    }

    /* ── Sanitize ── */
    const cleanName = sanitize(full_name);
    const cleanMessage = sanitize(message);
    const cleanOrderId = order_id ? sanitize(order_id) : null;
    const cleanSubEmail =
      subscription_email && isValidEmail(subscription_email)
        ? subscription_email.trim()
        : null;

    /* ── Supabase client (service role for DB insert) ── */
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    /* ── Try to resolve user_id from auth header ── */
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await supabaseAuth.auth.getUser();
      userId = data?.user?.id ?? null;
    }

    /* ── Insert ticket ── */
    const { data: ticket, error: insertErr } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        user_id: userId,
        email: email.trim().toLowerCase(),
        full_name: cleanName,
        category,
        order_id: cleanOrderId,
        subscription_email: cleanSubEmail,
        message: cleanMessage,
        attachment_url: attachment_url || null,
        status: "open",
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("DB insert error:", insertErr);
      return jsonError("Failed to create ticket. Please try again.", 500);
    }

    /* ── Send notification email to support team ── */
    // Uses Supabase Edge Function built-in fetch to a mail relay
    // In production, configure SMTP or Resend/SendGrid via env vars
    const SUPPORT_EMAIL = "expresskids-studio@expressaudiopower.com";

    try {
      // Attempt to send via Resend if API key available
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_KEY) {
        // Notify support team
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Express Kids Universe <support@expressaudiopower.com>",
            to: [SUPPORT_EMAIL],
            subject: `[Support Ticket #${ticket.id.slice(0, 8)}] ${categoryLabel(category)}`,
            html: `
              <h2>New Support Ticket</h2>
              <p><strong>From:</strong> ${cleanName} &lt;${email}&gt;</p>
              <p><strong>Category:</strong> ${categoryLabel(category)}</p>
              ${cleanOrderId ? `<p><strong>Order ID:</strong> ${cleanOrderId}</p>` : ""}
              <p><strong>Message:</strong></p>
              <blockquote>${cleanMessage.replace(/\n/g, "<br>")}</blockquote>
              <p><em>Ticket ID: ${ticket.id}</em></p>
            `,
          }),
        });

        // Send confirmation to user
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Express Kids Universe <support@expressaudiopower.com>",
            to: [email.trim()],
            subject: "We received your support request — Express Kids Universe",
            html: `
              <h2>Thanks for reaching out, ${cleanName}!</h2>
              <p>We've received your support request and our team will get back to you within 24-48 hours.</p>
              <p><strong>Ticket ID:</strong> ${ticket.id.slice(0, 8).toUpperCase()}</p>
              <p><strong>Category:</strong> ${categoryLabel(category)}</p>
              <br>
              <p>If you need immediate help with billing, you can manage your subscription directly from your account settings.</p>
              <br>
              <p>— The Express Kids Universe Team</p>
            `,
          }),
        });
      }
    } catch (emailErr) {
      // Non-blocking: ticket is already saved
      console.error("Email send error (non-blocking):", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticket.id,
        message: "Your support ticket has been submitted. We'll respond within 24-48 hours.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonError("An unexpected error occurred.", 500);
  }
});

/* ── Helpers ── */
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    billing: "Billing Issue",
    subscription_cancel: "Subscription Cancellation",
    refund: "Refund Request",
    technical: "Technical Issue",
    content_concern: "Content Concern",
    general: "General Inquiry",
  };
  return labels[cat] ?? cat;
}

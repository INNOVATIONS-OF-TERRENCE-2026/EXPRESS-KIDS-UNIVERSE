-- ══════════════════════════════════════════════════════════
-- Support Tickets table
-- Migration: 20260302 — Customer support ticket system
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN (
      'billing', 'subscription_cancel', 'refund',
      'technical', 'content_concern', 'general'
    )),
  order_id TEXT,
  subscription_email TEXT,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own tickets
CREATE POLICY "Users can view own support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert a ticket (anonymous or authenticated)
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

-- Service role can do anything (for edge functions)
CREATE POLICY "Service role full access on support tickets"
  ON public.support_tickets FOR ALL
  USING (auth.role() = 'service_role');

-- Index for lookups
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

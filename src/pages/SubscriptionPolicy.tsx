import { Link } from "react-router-dom";
import { AuroraGradient } from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { brand } from "@/lib/brand";

const LAST_UPDATED = "March 1, 2026";

export default function SubscriptionPolicy() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold aurora-text mb-3">
            Subscription &amp; Cancellation Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="glass-card p-8 space-y-8 text-sm leading-relaxed">
            {/* ── 1. Overview ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">1. Overview</h2>
              <p className="text-muted-foreground">
                {brand.name}, operated by Express Audio Power Co, offers subscription-based access to
                AI-powered storytelling, animation, and educational content for children. This policy
                explains how subscriptions work, how to cancel, and what to expect regarding billing
                cycles and plan changes.
              </p>
            </section>

            {/* ── 2. Subscription Plans ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">2. Subscription Plans</h2>
              <p className="text-muted-foreground mb-3">We offer the following plan tiers:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong>Free:</strong> Limited access to story creation and basic features. No payment required.</li>
                <li><strong>Plus (Monthly / Annual):</strong> Expanded content limits, HD video, priority generation, and voice customization.</li>
                <li><strong>Studio Pro (Monthly / Annual):</strong> Unlimited creation, commercial licensing, advanced AI features, AR experiences, and priority support.</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Full plan details and pricing are available on our{" "}
                <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link>.
              </p>
            </section>

            {/* ── 3. Billing Cycle ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">3. Billing Cycle</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <strong>Monthly plans</strong> are billed on the same calendar date each month
                  (e.g., if you subscribed on March 15, you are charged on the 15th of each
                  subsequent month).
                </li>
                <li>
                  <strong>Annual plans</strong> are billed once per year on the anniversary of
                  your subscription start date.
                </li>
                <li>
                  All charges appear on your statement as{" "}
                  <span className="font-mono text-foreground">"EXPRESS KIDS UNIVERSE"</span> or{" "}
                  <span className="font-mono text-foreground">"EKU App"</span>.
                </li>
                <li>
                  Payments are processed securely via Stripe. We never store your full credit card
                  number on our servers.
                </li>
              </ul>
            </section>

            {/* ── 4. Free Trial ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">4. Free Trial Terms</h2>
              <p className="text-muted-foreground mb-3">
                When offered, free trials provide full access to a paid plan for a limited duration
                (typically 7 days). At the end of the trial:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Your subscription automatically converts to the paid plan unless you cancel before the trial ends.</li>
                <li>No charge is made until the trial period expires.</li>
                <li>If you cancel during the trial, you retain access until the trial end date.</li>
                <li>Each user is eligible for one free trial. Creating multiple accounts to obtain additional trials is prohibited.</li>
              </ul>
            </section>

            {/* ── 5. How to Cancel ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">5. How to Cancel Your Subscription</h2>
              <p className="text-muted-foreground mb-3">You can cancel your subscription at any time using one of these methods:</p>
              <ol className="list-decimal pl-5 text-muted-foreground space-y-2">
                <li>
                  <strong>Dashboard:</strong> Navigate to{" "}
                  <Link to="/account" className="text-primary hover:underline">Account → Billing</Link>{" "}
                  and click "<strong>Cancel Plan</strong>."
                </li>
                <li>
                  <strong>Support:</strong> Submit a cancellation request via our{" "}
                  <Link to="/support" className="text-primary hover:underline">Support Center</Link>{" "}
                  with category "Subscription Cancel."
                </li>
                <li>
                  <strong>Email:</strong> Send your request to{" "}
                  <a href="mailto:expresskids-studio@expressaudiopower.com" className="text-primary hover:underline">
                    expresskids-studio@expressaudiopower.com
                  </a>{" "}
                  with the subject line "Cancel Subscription."
                </li>
              </ol>
            </section>

            {/* ── 6. When Cancellation Takes Effect ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">6. When Cancellation Takes Effect</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  Cancellation takes effect at the <strong>end of the current billing period</strong>.
                  You continue to have full access until that date.
                </li>
                <li>
                  No partial or prorated refunds are issued for the remaining days of a billing cycle
                  after a cancellation request is processed.
                </li>
                <li>
                  After your subscription expires, your account reverts to the Free plan. Your
                  previously created content remains accessible in read-only mode.
                </li>
              </ul>
            </section>

            {/* ── 7. Plan Switching ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">7. Upgrading &amp; Downgrading</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <strong>Upgrades</strong> take effect immediately. You are charged a prorated
                  amount for the remainder of your current billing cycle.
                </li>
                <li>
                  <strong>Downgrades</strong> take effect at the end of the current billing period.
                  You retain access to the higher-tier features until then.
                </li>
                <li>
                  Switching from monthly to annual (or vice versa) creates a new billing cycle
                  starting from the switch date.
                </li>
              </ul>
            </section>

            {/* ── 8. Reactivation ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">8. Reactivation</h2>
              <p className="text-muted-foreground">
                If your subscription has expired, you can reactivate at any time from{" "}
                <Link to="/account" className="text-primary hover:underline">Account → Billing</Link>{" "}
                or our <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link>.
                A new billing cycle begins on the date of reactivation. Previously generated content
                will be restored to your account.
              </p>
            </section>

            {/* ── 9. Failed Payments ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">9. Failed Payments</h2>
              <p className="text-muted-foreground">
                If a scheduled payment fails, we will attempt to charge your payment method up to
                3 times over a 7-day grace period. You will receive email notifications for each
                attempt. If all retries fail, your subscription will be paused and your account
                will revert to the Free plan.
              </p>
            </section>

            {/* ── 10. Parental / Guardian Responsibility ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">10. Parental &amp; Guardian Responsibility</h2>
              <p className="text-muted-foreground">
                {brand.name} is designed for use by children under adult supervision. The account
                holder (parent or legal guardian) is solely responsible for all subscription
                charges, cancellations, and account management. We recommend enabling{" "}
                <Link to="/parents" className="text-primary hover:underline">Parental Controls</Link>{" "}
                to manage content access and prevent unauthorized purchases.
              </p>
            </section>

            {/* ── 11. Changes to This Policy ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Subscription &amp; Cancellation Policy from time to time. Material
                changes will be communicated via email or in-app notification at least 14 days before
                taking effect. Continued use of the service after the effective date constitutes
                acceptance of the updated terms.
              </p>
            </section>

            {/* ── 12. Contact ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">12. Contact Information</h2>
              <div className="text-muted-foreground space-y-1">
                <p><strong>Express Audio Power Co</strong></p>
                <p>4917 Peninsula Way Apt 6106</p>
                <p>Garland, TX 75043</p>
                <p>United States</p>
                <p className="mt-2">
                  Email:{" "}
                  <a href="mailto:expresskids-studio@expressaudiopower.com" className="text-primary hover:underline">
                    expresskids-studio@expressaudiopower.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a href="tel:+15313489321" className="text-primary hover:underline">
                    +1 (531) 348-9321
                  </a>
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/support" className="text-primary hover:underline">← Support Center</Link>
            <Link to="/legal/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
            <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { Link } from "react-router-dom";
import { AuroraGradient } from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { brand } from "@/lib/brand";

const LAST_UPDATED = "March 1, 2026";

export default function RefundPolicy() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold aurora-text mb-3">
            Refund Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="glass-card p-8 space-y-8 text-sm leading-relaxed">
            {/* ── 1. Overview ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">1. Overview</h2>
              <p className="text-muted-foreground">
                {brand.name} ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>"),
                operated by Express Audio Power Co, is committed to customer satisfaction. This Refund
                Policy governs all purchases made through our platform, including subscription plans,
                digital content, and physical merchandise. By completing a purchase you acknowledge
                and agree to the terms outlined below.
              </p>
            </section>

            {/* ── 2. Digital Products & Subscriptions ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">2. Digital Products &amp; Subscriptions</h2>
              <p className="text-muted-foreground mb-3">
                Because {brand.name} delivers digital content (AI-generated stories, animations, voice
                experiences, and video assets) that is accessible immediately upon creation, the
                following rules apply:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <strong>Subscription charges</strong> may be refunded if a request is submitted
                  within <strong>48 hours</strong> of the renewal date and the subscriber has not
                  consumed significant content during the new billing period.
                </li>
                <li>
                  <strong>First-time subscribers</strong> who cancel within 48 hours of their initial
                  charge are eligible for a full refund, provided fewer than 3 stories or videos
                  have been generated.
                </li>
                <li>
                  <strong>Free trial conversions:</strong> If you forget to cancel before a free trial
                  ends, contact us within 48 hours of the first charge for a full refund.
                </li>
                <li>
                  <strong>Mid-cycle cancellations</strong> do not generate a prorated refund. You
                  retain access through the end of the current billing period.
                </li>
              </ul>
            </section>

            {/* ── 3. Physical Merchandise ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">3. Physical Merchandise (Toy Orders)</h2>
              <p className="text-muted-foreground mb-3">
                Physical items (character toys, printed books, etc.) may be returned within
                <strong> 14 days</strong> of delivery for a full refund, provided the item is
                unused and in original packaging. Shipping costs for returns are the customer's
                responsibility unless the item arrived damaged or defective.
              </p>
            </section>

            {/* ── 4. Non-Refundable Items ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">4. Non-Refundable Items</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Subscription periods that have already elapsed.</li>
                <li>Digital content that has been fully generated, downloaded, or shared.</li>
                <li>Accounts terminated for violation of our Terms of Service.</li>
                <li>Retroactive refund requests for billing periods older than 60 days.</li>
              </ul>
            </section>

            {/* ── 5. Abuse Prevention ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">5. Abuse Prevention</h2>
              <p className="text-muted-foreground mb-3">
                We reserve the right to deny refund requests if we detect patterns consistent with
                abuse, including but not limited to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Repeatedly subscribing, consuming content, and requesting refunds ("<strong>subscription cycling</strong>").</li>
                <li>Downloading or exporting large volumes of digital content before requesting a refund.</li>
                <li>Opening multiple accounts to exploit trial or refund policies.</li>
                <li>Filing chargebacks without first contacting our support team.</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Accounts engaged in abusive behavior may be suspended or permanently terminated.
              </p>
            </section>

            {/* ── 6. Chargebacks ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">6. Chargebacks &amp; Disputes</h2>
              <p className="text-muted-foreground mb-3">
                We encourage customers to contact our support team before initiating a chargeback
                with their bank or credit card company. We maintain detailed records of all
                transactions, content access logs, and communication history.
              </p>
              <p className="text-muted-foreground">
                If a chargeback is filed, we will submit evidence to the payment processor
                demonstrating the validity of the charge. Fraudulent chargebacks may result in
                account suspension, collection activity, and reporting to fraud prevention networks.
                In most cases, contacting us directly leads to a faster and more favorable resolution.
              </p>
            </section>

            {/* ── 7. Processing Timeline ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">7. Refund Processing Timeline</h2>
              <p className="text-muted-foreground">
                Approved refunds are processed within <strong>5–10 business days</strong> and returned
                to the original payment method. Depending on your bank, it may take an additional
                3–5 business days for the credit to appear on your statement. Charges on your
                statement appear as <span className="font-mono text-foreground">"EXPRESS KIDS UNIVERSE"</span>{" "}
                or <span className="font-mono text-foreground">"EKU App"</span>.
              </p>
            </section>

            {/* ── 8. How to Request a Refund ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">8. How to Request a Refund</h2>
              <p className="text-muted-foreground mb-3">To request a refund:</p>
              <ol className="list-decimal pl-5 text-muted-foreground space-y-2">
                <li>
                  Visit our <Link to="/support" className="text-primary hover:underline">Support Center</Link> and
                  select "<strong>Refund Request</strong>" as the category.
                </li>
                <li>Provide your account email, order/transaction ID, and reason for the request.</li>
                <li>Our team will review and respond within <strong>24–48 hours</strong>.</li>
              </ol>
              <p className="text-muted-foreground mt-4">
                You may also email us directly at{" "}
                <a href="mailto:expresskids-studio@expressaudiopower.com" className="text-primary hover:underline">
                  expresskids-studio@expressaudiopower.com
                </a>{" "}
                or call{" "}
                <a href="tel:+15313489321" className="text-primary hover:underline">
                  +1 (531) 348-9321
                </a>.
              </p>
            </section>

            {/* ── 9. Contact ── */}
            <section>
              <h2 className="font-heading text-xl font-bold mb-3">9. Contact Information</h2>
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
            <Link to="/legal/subscription-policy" className="text-primary hover:underline">Subscription Policy</Link>
            <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

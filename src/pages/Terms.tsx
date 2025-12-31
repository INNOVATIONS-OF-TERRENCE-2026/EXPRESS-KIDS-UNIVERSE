import { Link } from "react-router-dom";
import { AuroraGradient } from "@/components/eku";

export default function Terms() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl font-bold aurora-text mb-8">Terms of Service</h1>
          <div className="glass-card p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground">Last updated: December 2024</p>
            <h2>Acceptance of Terms</h2>
            <p>By using Express Kids Universe, you agree to these terms. The service is intended for family use with adult supervision for children under 13.</p>
            <h2>Use of Service</h2>
            <p>You may use this service to create personalized stories for educational and entertainment purposes. Content generated is for personal use only.</p>
            <h2>Content Guidelines</h2>
            <p>All generated content is designed to be age-appropriate and safe for children. Users must not attempt to circumvent content filters.</p>
            <h2>Intellectual Property</h2>
            <p>Stories generated using the service are licensed for personal use. The underlying technology and branding remain property of Express Kids Universe.</p>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
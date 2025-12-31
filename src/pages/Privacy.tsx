import { Link } from "react-router-dom";
import { AuroraGradient } from "@/components/eku";

export default function Privacy() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl font-bold aurora-text mb-8">Privacy Policy</h1>
          <div className="glass-card p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground">Last updated: December 2024</p>
            <h2>Information We Collect</h2>
            <p>Express Kids Universe collects minimal information to provide personalized story experiences. This includes child profile data (name, age, interests) that you provide during adventure creation.</p>
            <h2>How We Use Information</h2>
            <p>We use provided information solely to generate personalized stories. Data is stored locally on your device and is not transmitted to external servers without your consent.</p>
            <h2>Data Security</h2>
            <p>We prioritize the safety and privacy of children. All data is stored securely and we never sell or share personal information with third parties.</p>
            <h2>Contact</h2>
            <p>For questions about this policy, please contact us through the app.</p>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
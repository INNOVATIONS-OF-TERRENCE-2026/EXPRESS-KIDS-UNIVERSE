import { User } from "lucide-react";
import { AuroraGradient, EmptyState } from "@/components/eku";

export default function Account() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon={User}
            title="Account Coming Soon"
            description="Sign in to sync your adventures across devices and unlock premium features."
          />
        </div>
      </div>
    </div>
  );
}
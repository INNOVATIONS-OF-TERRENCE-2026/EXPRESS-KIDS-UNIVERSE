import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { AuroraGradient, StarfieldParticles, CinematicButton, LogoBrand, ShootingStars } from "@/components/eku";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/create");
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={40} />
      <ShootingStars count={3} />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card-elevated p-8 holographic"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <LogoBrand size="lg" animate3D />
            </div>
            <h1 className="font-heading text-2xl font-bold aurora-text">
              {isSignUp ? "Join the Adventure" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? "Create an account to save your stories" : "Sign in to continue your adventures"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label className="flex items-center gap-2"><User className="w-4 h-4" /> Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="mt-2" />
              </div>
            )}
            <div>
              <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@email.com" className="mt-2" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Lock className="w-4 h-4" /> Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-2" />
            </div>
            <CinematicButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </CinematicButton>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

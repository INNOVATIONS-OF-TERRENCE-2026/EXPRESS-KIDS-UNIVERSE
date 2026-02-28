import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { AuroraGradient, StarfieldParticles, CinematicButton, ShootingStars } from "@/components/eku";
import { BrandLogo } from "@/components/eku/BrandLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { brand } from "@/lib/brand";
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
        toast.success("Welcome to Express Kids Universe!");
        navigate("/create");
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

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed. Please try again.");
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
              <BrandLogo size="lg" animate3D />
            </div>
            <h1 className="font-heading text-2xl font-bold aurora-text">
              {isSignUp ? "Join the Adventure" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? "Create an account to save your stories" : "Sign in to continue your adventures"}
            </p>
          </div>

          {/* Google Sign-In */}
          <CinematicButton
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </CinematicButton>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
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

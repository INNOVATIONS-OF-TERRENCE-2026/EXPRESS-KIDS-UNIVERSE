import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Images, Shield, HelpCircle, Menu, X, LogIn, LogOut, Volume2, VolumeX, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "./BrandLogo";
import { PwaInstallButton } from "./PwaInstallButton";
import { brand } from "@/lib/brand";
import { audioManager } from "@/lib/audio";
import { getParentSettings } from "@/lib/storage";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { to: "/create", label: "Create", icon: Sparkles },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/seo", label: "SEO Suite", icon: TrendingUp },
  { to: "/parents", label: "Parent Controls", icon: Shield },
];

export function GlassNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleAmbient = () => {
    if (ambientOn) { audioManager.stopAmbient(); setAmbientOn(false); }
    else { audioManager.startAmbient(); setAmbientOn(true); }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass-card px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <BrandLogo size="sm" animate3D={false} />
              <span className="font-heading font-bold text-sm aurora-text hidden sm:block">{brand.name}</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                        isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {getParentSettings().soundEnabled && (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleAmbient}>
                  {ambientOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              )}
              <PwaInstallButton />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-0">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-xl aurora-text">Welcome to {brand.name}!</DialogTitle>
                    <DialogDescription className="text-muted-foreground">Here's how to create magical adventures for your child.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {[
                      { n: "1", cls: "primary", title: "Create a Profile", desc: "Tell us about your child - their name, age, and interests." },
                      { n: "2", cls: "secondary", title: "Choose an Adventure", desc: "Pick a theme and setting for their personalized story." },
                      { n: "3", cls: "accent", title: "Enjoy & Save", desc: "Read, watch, and save the adventure to your gallery." },
                    ].map(item => (
                      <div key={item.n} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full bg-${item.cls}/20 flex items-center justify-center shrink-0`}>
                          <span className={`text-${item.cls} font-bold`}>{item.n}</span>
                        </div>
                        <div><h4 className="font-semibold">{item.title}</h4><p className="text-sm text-muted-foreground">{item.desc}</p></div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {user ? (
                <Button variant="outline" size="sm" className="hidden sm:flex rounded-full gap-2" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="hidden sm:flex rounded-full gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Button>
                </Link>
              )}

              <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-4 right-4 z-40 glass-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                    <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            {user ? (
              <Button variant="outline" className="mt-2 rounded-full" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>Sign Out</Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="mt-2 rounded-full w-full">Sign In</Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}

      <div className="h-20" />
    </>
  );
}

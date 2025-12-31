import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Images, Shield, HelpCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { to: "/create", label: "Create", icon: Sparkles },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/parents", label: "Parent Controls", icon: Shield },
];

export function GlassNav() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full bg-aurora-gradient flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-foreground" />
              </motion.div>
              <span className="font-heading font-bold text-lg aurora-text hidden sm:block">
                EKU
              </span>
            </Link>

            {/* Desktop Nav */}
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
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Help Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-0">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-xl aurora-text">
                      Welcome to Express Kids Universe!
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Here's how to create magical adventures for your child.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Create a Profile</h4>
                        <p className="text-sm text-muted-foreground">
                          Tell us about your child - their name, age, and interests.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                        <span className="text-secondary font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Choose an Adventure</h4>
                        <p className="text-sm text-muted-foreground">
                          Pick a theme and setting for their personalized story.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-accent-foreground font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Enjoy & Save</h4>
                        <p className="text-sm text-muted-foreground">
                          Read, watch, and save the adventure to your gallery.
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Sign In (placeholder) */}
              <Button variant="outline" size="sm" className="hidden sm:flex rounded-full">
                Sign In
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-4 right-4 z-40 glass-card p-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            <Button variant="outline" className="mt-2 rounded-full">
              Sign In
            </Button>
          </div>
        </motion.div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-20" />
    </>
  );
}
import { Link } from "react-router-dom";
import { brand } from "@/lib/brand";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-border/50 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" variant="footer" animate3D={false} />
          <span className="font-heading font-bold text-lg">{brand.name}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          Founded &amp; Engineered by {brand.founder}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {brand.leadership.map((l) => `${l.name} — ${l.title}`).join(" · ")}
        </p>
        <p className="text-xs text-muted-foreground/50 italic">
          {brand.foundation}
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mt-2">
          <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/parents" className="hover:text-foreground transition-colors">Parents</Link>
          <Link to="/leadership" className="hover:text-foreground transition-colors">Leadership</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </div>

        <p className="text-xs text-muted-foreground/50">&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

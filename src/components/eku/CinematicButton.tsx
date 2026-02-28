import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CinematicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function CinematicButton({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  disabled, 
  ...props 
}: CinematicButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all focus-ring overflow-hidden transform-gpu";
  
  const variants = {
    primary: "bg-primary text-primary-foreground glow-button",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent text-foreground hover:bg-muted/50",
    outline: "border-2 border-primary text-primary hover:bg-primary/10 hover:border-primary/80",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm gap-2",
    md: "px-6 py-3 text-base gap-2",
    lg: "px-8 py-4 text-lg gap-3",
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { 
        scale: 1.03, 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 15 }
      }}
      whileTap={disabled ? undefined : { scale: 0.97, y: 0 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...(props as any)}
    >
      {/* Shimmer sweep on hover */}
      {variant === "primary" && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full"
          whileHover={{ translateX: "200%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
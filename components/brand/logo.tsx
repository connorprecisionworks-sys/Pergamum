import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 18, text: "text-base", gap: "gap-1.5" },
  md: { icon: 24, text: "text-xl",  gap: "gap-2"   },
  lg: { icon: 32, text: "text-3xl", gap: "gap-2.5" },
};

/** Stylised open scroll / book mark in the Pergamum brand colour. */
function ScrollMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Scroll body */}
      <path
        d="M5 4C5 2.895 5.895 2 7 2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Scroll curl at bottom */}
      <path
        d="M7 20a2 2 0 0 1-2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Text lines on scroll */}
      <line x1="9" y1="8"  x2="17" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const cfg = sizeConfig[size];

  if (variant === "icon") {
    return (
      <span
        className={cn("inline-flex items-center text-pergamum-500", className)}
        aria-label="Pergamum"
      >
        <ScrollMark size={cfg.icon} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-serif font-semibold text-foreground",
        cfg.gap,
        className
      )}
      aria-label="Pergamum"
    >
      <ScrollMark size={cfg.icon} className="text-pergamum-500 shrink-0" />
      <span className={cfg.text}>Pergamum</span>
    </span>
  );
}

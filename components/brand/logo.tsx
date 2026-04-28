import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "hero";

interface LogoProps {
  variant?: "full" | "icon";
  size?: LogoSize;
  className?: string;
}

const sizeMap: Record<LogoSize, string> = {
  sm:   "text-xl",
  md:   "text-3xl",
  lg:   "text-5xl",
  hero: "text-7xl md:text-9xl",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-serif font-normal text-primary leading-none select-none",
        sizeMap[size],
        className
      )}
      aria-label="Pergamum"
    >
      P
    </span>
  );
}

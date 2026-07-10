import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "hero";

interface LogoProps {
  variant?: "full" | "icon";
  size?: LogoSize;
  className?: string;
}

// Mark is icon-only (no wordmark baked in) and square (1080×1080). Two
// theme-swapped exports — the black mark for light backgrounds, the white
// mark for dark — toggled purely with Tailwind's class-based dark mode.
const sizeMap: Record<LogoSize, { px: number; cls: string }> = {
  sm:   { px: 24,  cls: "h-6 w-6" },
  md:   { px: 40,  cls: "h-10 w-10" },
  lg:   { px: 80,  cls: "h-20 w-20" },
  hero: { px: 192, cls: "h-32 w-32 md:h-48 md:w-48" },
};

export function Logo({ size = "md", className }: LogoProps) {
  const { px, cls } = sizeMap[size];
  return (
    <>
      <Image
        src="/logo-mark-black.png"
        alt="Prmpt"
        width={px}
        height={px}
        priority={size === "hero"}
        className={cn("select-none object-contain block dark:hidden", cls, className)}
      />
      <Image
        src="/logo-mark-white.png"
        alt="Prmpt"
        width={px}
        height={px}
        priority={size === "hero"}
        className={cn("select-none object-contain hidden dark:block", cls, className)}
      />
    </>
  );
}

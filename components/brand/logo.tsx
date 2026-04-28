import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "hero";

interface LogoProps {
  variant?: "full" | "icon";
  size?: LogoSize;
  className?: string;
}

// Source logo is 1536×1024 (3:2). Width is the constraint we pin to;
// height is computed from the aspect ratio at render time by next/image.
const sizeMap: Record<LogoSize, { width: number; height: number; cls: string }> = {
  sm:   { width: 36,  height: 24,  cls: "h-6 w-auto" },
  md:   { width: 60,  height: 40,  cls: "h-10 w-auto" },
  lg:   { width: 120, height: 80,  cls: "h-20 w-auto" },
  hero: { width: 360, height: 240, cls: "h-32 md:h-48 w-auto" },
};

export function Logo({ size = "md", className }: LogoProps) {
  const { width, height, cls } = sizeMap[size];
  return (
    <Image
      src="/logo.png"
      alt="Pergamum"
      width={width}
      height={height}
      priority={size === "hero"}
      className={cn("select-none", cls, className)}
    />
  );
}

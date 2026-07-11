import { cn, MODEL_DISPLAY } from "@/lib/utils";

interface ModelBadgeProps {
  model: string;
  className?: string;
}

export function ModelBadge({ model, className }: ModelBadgeProps) {
  const info = MODEL_DISPLAY[model.toLowerCase()] ?? { label: model };

  // Monochrome: color is an event, not a texture. MODEL_DISPLAY still supplies
  // the label; its per-model `color` is deliberately no longer read.
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground-muted",
        className
      )}
    >
      {info.label}
    </span>
  );
}

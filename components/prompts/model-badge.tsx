import { cn, MODEL_DISPLAY } from "@/lib/utils";

interface ModelBadgeProps {
  model: string;
  className?: string;
}

export function ModelBadge({ model, className }: ModelBadgeProps) {
  const info = MODEL_DISPLAY[model.toLowerCase()] ?? {
    label: model,
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        info.color,
        className
      )}
    >
      {info.label}
    </span>
  );
}

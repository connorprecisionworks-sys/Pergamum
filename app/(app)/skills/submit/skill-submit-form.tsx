"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { slugify, normalizeTags } from "@/lib/utils";

// Same buckets used in /skills page filtering. Keep in sync.
const SKILL_CATEGORIES = [
  { value: "agents", label: "Agents & automation" },
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing & docs" },
  { value: "data", label: "Data & analysis" },
  { value: "research", label: "Research" },
  { value: "design", label: "Design" },
  { value: "ops", label: "Ops & DevOps" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

const RUNTIME_OPTIONS = [
  { value: "claude-code", label: "Claude Code" },
  { value: "cowork", label: "Cowork" },
  { value: "claude-api", label: "Claude API / SDK" },
];

const skillSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(80),
    summary: z.string().min(20, "Summary must be at least 20 characters").max(400),
    install_command: z.string().max(2000).optional().or(z.literal("")),
    source_url: z
      .string()
      .max(500)
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    readme: z.string().max(20000).optional().or(z.literal("")),
    category: z.string().min(1, "Please pick a category"),
    runtimes: z.array(z.string()).min(1, "Pick at least one runtime"),
    tags: z.string().optional(),
  })
  .refine(
    (v) =>
      (v.install_command && v.install_command.trim().length > 0) ||
      (v.source_url && v.source_url.trim().length > 0),
    {
      message: "Add an install command OR a source URL so people can use this skill.",
      path: ["install_command"],
    }
  );

type SkillFormValues = z.infer<typeof skillSchema>;

interface SkillSubmitFormProps {
  authorId: string;
  isAdmin: boolean;
}

export function SkillSubmitForm({ authorId, isAdmin }: SkillSubmitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRuntimes, setSelectedRuntimes] = useState<string[]>(["claude-code"]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      runtimes: ["claude-code"],
      category: "",
    },
  });

  const toggleRuntime = (rt: string) => {
    setSelectedRuntimes((prev) => {
      const next = prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt];
      const result = next.length > 0 ? next : ["claude-code"];
      setValue("runtimes", result);
      return result;
    });
  };

  const onSubmit = async (values: SkillFormValues) => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Slug + collision suffix
      const base = slugify(values.name);
      const { data: existing } = await supabase
        .from("skills")
        .select("slug")
        .like("slug", `${base}%`);
      const existingSlugs = (existing ?? []).map((s) => s.slug);
      let slug = base;
      if (existingSlugs.includes(slug)) {
        let i = 2;
        while (existingSlugs.includes(`${base}-${i}`)) i++;
        slug = `${base}-${i}`;
      }

      const needsReview = !isAdmin;
      const status = needsReview ? "pending" : "published";
      const published_at = needsReview ? null : new Date().toISOString();

      const { data, error } = await supabase
        .from("skills")
        .insert({
          author_id: authorId,
          name: values.name.trim(),
          slug,
          summary: values.summary.trim(),
          install_command: values.install_command?.trim() || null,
          source_url: values.source_url?.trim() || null,
          readme: values.readme?.trim() || null,
          category: values.category,
          runtimes: values.runtimes,
          tags: normalizeTags(values.tags ?? ""),
          status,
          published_at,
        })
        .select("slug")
        .single();

      if (error) throw error;

      if (needsReview) {
        toast.success("Skill submitted — it'll go live once approved, usually within an hour.");
        router.push("/dashboard");
      } else {
        toast.success("Skill published — it's live!");
        router.push(`/skills/${data.slug}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Skill name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. PDF Toolkit"
          {...register("name")}
        />
        <p className="text-xs text-muted-foreground">
          Short and recognizable — what people will see on the card.
        </p>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">
          Summary <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="summary"
          placeholder="What does this skill do? When should someone use it?"
          rows={3}
          {...register("summary")}
        />
        <p className="text-xs text-muted-foreground">
          One or two sentences — shows on the card and in search results.
        </p>
        {errors.summary && (
          <p className="text-sm text-destructive">{errors.summary.message}</p>
        )}
      </div>

      {/* Category + Runtime */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(v) => setValue("category", v)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Runtime <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {RUNTIME_OPTIONS.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => toggleRuntime(rt.value)}
                aria-pressed={selectedRuntimes.includes(rt.value)}
              >
                <Badge
                  variant={selectedRuntimes.includes(rt.value) ? "pergamum" : "outline"}
                  className="cursor-pointer hover:bg-pergamum-50 dark:hover:bg-pergamum-900/20 transition-colors"
                >
                  {rt.label}
                </Badge>
              </button>
            ))}
          </div>
          {errors.runtimes && (
            <p className="text-sm text-destructive">{errors.runtimes.message}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="pdf, extraction, ocr (comma-separated)"
          {...register("tags")}
        />
        <p className="text-xs text-muted-foreground">
          Help people find it by topic — keep them short and lowercase.
        </p>
      </div>

      <Separator />

      {/* Install command */}
      <div className="space-y-2">
        <Label htmlFor="install_command">Install command</Label>
        <Textarea
          id="install_command"
          placeholder={`/plugin install your-plugin-name

# or
curl -fsSL https://example.com/install.sh | bash`}
          rows={5}
          className="font-mono text-sm"
          {...register("install_command")}
        />
        <p className="text-xs text-muted-foreground">
          What someone needs to paste into Claude Code (or their terminal) to install this skill.
        </p>
        {errors.install_command && (
          <p className="text-sm text-destructive">{errors.install_command.message}</p>
        )}
      </div>

      {/* Source URL */}
      <div className="space-y-2">
        <Label htmlFor="source_url">Source URL</Label>
        <Input
          id="source_url"
          placeholder="https://github.com/you/your-skill"
          {...register("source_url")}
        />
        <p className="text-xs text-muted-foreground">
          GitHub repo, plugin marketplace listing, or wherever the skill lives.
        </p>
        {errors.source_url && (
          <p className="text-sm text-destructive">{errors.source_url.message}</p>
        )}
      </div>

      {/* SKILL.md content */}
      <div className="space-y-2">
        <Label htmlFor="readme">SKILL.md preview</Label>
        <Textarea
          id="readme"
          placeholder={`# Your Skill\n\nDescribe what triggers it, what it does, and any gotchas. People will read this before they install.`}
          rows={10}
          className="font-mono text-sm"
          {...register("readme")}
        />
        <p className="text-xs text-muted-foreground">
          Paste the contents of your SKILL.md so people can see exactly what they&apos;re installing. Markdown is rendered as plain text for safety.
        </p>
        {errors.readme && (
          <p className="text-sm text-destructive">{errors.readme.message}</p>
        )}
      </div>

      {!isAdmin && (
        <div className="flex gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Every skill is reviewed before going live (usually under an hour). We
            check install commands carefully — please don&apos;t submit anything
            that runs untrusted code without warning.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit skill
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

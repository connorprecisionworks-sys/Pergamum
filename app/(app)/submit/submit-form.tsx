"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, Eye, EyeOff, Info, Braces } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { slugify, normalizeTags, substituteVariables } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { Category, Prompt } from "@/lib/types/database";

const MODEL_OPTIONS = ["any", "claude", "gpt-4", "gemini", "llama", "mistral", "stable-diffusion", "dall-e", "midjourney"];

const promptSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters").max(400),
  body: z.string().min(20, "Prompt body must be at least 20 characters"),
  category_id: z.string().min(1, "Please select a category"),
  model_tags: z.array(z.string()).min(1, "Select at least one model"),
  tags: z.string().optional(),
  variables: z.array(
    z.object({
      name: z.string().min(1, "Variable name required").regex(/^\w+$/, "Only letters, numbers, underscores"),
      description: z.string().optional(),
      default: z.string().optional(),
      type: z.enum(["text", "number", "select"]).default("text"),
    })
  ).optional(),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface SubmitFormProps {
  categories: Category[];
  authorId: string;
  isAdmin: boolean;
  isFirstPrompt: boolean;
  forkedFrom?: Pick<Prompt, "id" | "title" | "description" | "body" | "model_tags" | "category_id" | "tags" | "variables">;
}

export function SubmitForm({
  categories,
  authorId,
  isAdmin,
  isFirstPrompt,
  forkedFrom,
}: SubmitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(
    forkedFrom?.model_tags ?? ["any"]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    control,
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      variables: [],
      model_tags: forkedFrom?.model_tags ?? ["any"],
      title: forkedFrom ? `Remix: ${forkedFrom.title}` : "",
      description: forkedFrom?.description ?? "",
      body: forkedFrom?.body ?? "",
      category_id: forkedFrom?.category_id ?? "",
      tags: forkedFrom?.tags?.join(", ") ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variables",
  });

  const watchedBody = watch("body") ?? "";
  const watchedVariables = watch("variables") ?? [];

  // Auto-detect {{variables}} in the prompt body and de-dupe in order of first occurrence.
  const detectedVars = useMemo(() => {
    if (!watchedBody) return [] as string[];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const match of watchedBody.matchAll(/\{\{(\w+)\}\}/g)) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    }
    return out;
  }, [watchedBody]);

  // Wire a real ref to the body textarea so we can insert at the caret.
  // react-hook-form's `register` returns its own ref — we layer ours on via callback.
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyReg = register("body");

  function insertVariable() {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const selected = ta.value.slice(start, end);
    // Sanitise selection to valid variable name; fallback to "name".
    const cleaned = selected.toLowerCase().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
    const placeholder = cleaned || "name";
    const insertion = `{{${placeholder}}}`;
    const newValue = ta.value.slice(0, start) + insertion + ta.value.slice(end);
    setValue("body", newValue, { shouldValidate: true, shouldDirty: true });
    // After React updates the value, move caret to select the inserted name so user can type-replace it.
    requestAnimationFrame(() => {
      ta.focus();
      const nameStart = start + 2; // skip past `{{`
      ta.setSelectionRange(nameStart, nameStart + placeholder.length);
    });
  }

  const toggleModel = (model: string) => {
    setSelectedModels((prev) => {
      const next = prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model];
      const result = next.length > 0 ? next : ["any"];
      setValue("model_tags", result);
      return result;
    });
  };

  const previewBody = substituteVariables(
    watchedBody,
    Object.fromEntries(
      (watchedVariables ?? []).map((v) => [v.name, v.default ?? `{{${v.name}}}`])
    )
  );

  const onSubmit = async (values: PromptFormValues) => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Generate slug with collision check
      const base = slugify(values.title);
      const { data: existing } = await supabase
        .from("prompts")
        .select("slug")
        .like("slug", `${base}%`);

      const existingSlugs = (existing ?? []).map((p) => p.slug);
      let slug = base;
      if (existingSlugs.includes(slug)) {
        let i = 2;
        while (existingSlugs.includes(`${base}-${i}`)) i++;
        slug = `${base}-${i}`;
      }

      // Every non-admin submission enters review before publishing
      const needsReview = !isAdmin;
      const status = needsReview ? "pending" : "published";
      const published_at = needsReview ? null : new Date().toISOString();

      const { data, error } = await supabase
        .from("prompts")
        .insert({
          author_id: authorId,
          title: values.title.trim(),
          slug,
          body: values.body.trim(),
          description: values.description.trim(),
          category_id: values.category_id,
          model_tags: values.model_tags,
          tags: normalizeTags(values.tags ?? ""),
          variables: (values.variables ?? []).map((v) => ({
            name: v.name,
            description: v.description || undefined,
            default: v.default || undefined,
            type: v.type,
          })),
          status,
          published_at,
          forked_from_id: forkedFrom?.id ?? null,
        })
        .select("slug")
        .single();

      if (error) throw error;

      if (needsReview) {
        if (isFirstPrompt) track("first_prompt_submitted");
        toast.success("Prompt submitted — it'll go live once approved, usually within an hour.");
        router.push("/dashboard");
      } else {
        toast.success("Prompt published — it's live!");
        router.push(`/prompts/${data.slug}`);
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
      {/* First-timer welcome banner */}
      {isFirstPrompt && !isAdmin && (
        <div className="flex gap-3 p-4 rounded-lg bg-pergamum-50 dark:bg-pergamum-950/20 border border-pergamum-200 dark:border-pergamum-800">
          <Info className="h-4 w-4 text-pergamum-600 shrink-0 mt-0.5" />
          <p className="text-sm text-pergamum-800 dark:text-pergamum-300">
            Welcome! Every prompt is reviewed before going live, usually under an hour.
          </p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Senior Developer Code Review"
          {...register("title")}
          aria-describedby={errors.title ? "title-error" : "title-hint"}
        />
        <p id="title-hint" className="text-xs text-muted-foreground">
          A clear, specific title helps people find your prompt.
        </p>
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="What does this prompt do? When should someone use it?"
          rows={3}
          {...register("description")}
          aria-describedby={errors.description ? "desc-error" : "desc-hint"}
        />
        <p id="desc-hint" className="text-xs text-muted-foreground">
          This shows on the prompt card and in search results, so be specific.
        </p>
        {errors.description && (
          <p id="desc-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category + Models row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={forkedFrom?.category_id ?? undefined}
            onValueChange={(v) => setValue("category_id", v)}
          >
            <SelectTrigger id="category" aria-describedby={errors.category_id ? "cat-error" : undefined}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p id="cat-error" className="text-sm text-destructive">
              {errors.category_id.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Models <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => toggleModel(model)}
                aria-pressed={selectedModels.includes(model)}
              >
                <Badge
                  variant={selectedModels.includes(model) ? "pergamum" : "outline"}
                  className="cursor-pointer capitalize hover:bg-pergamum-50 dark:hover:bg-pergamum-900/20 transition-colors"
                >
                  {model}
                </Badge>
              </button>
            ))}
          </div>
          {errors.model_tags && (
            <p className="text-sm text-destructive">{errors.model_tags.message}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="code-review, typescript, performance (comma-separated)"
          {...register("tags")}
        />
        <p className="text-xs text-muted-foreground">
          Separate with commas — these help people find your prompt by topic.
        </p>
      </div>

      <Separator />

      {/* Variables (optional metadata for auto-detected vars) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold">Variable details (optional)</h3>
            <p className="text-sm text-muted-foreground">
              Pergamum auto-detects any <code className="bg-muted px-1 rounded text-xs font-mono">{"{{name}}"}</code> in your prompt body. Add help text or a default value here if you want.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ name: "", description: "", default: "", type: "text" })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add details
          </Button>
        </div>

        {fields.map((field, i) => (
          <div
            key={field.id}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/30"
          >
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="variable_name"
                {...register(`variables.${i}.name`)}
              />
              {errors.variables?.[i]?.name && (
                <p className="text-xs text-destructive">
                  {errors.variables[i]?.name?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                placeholder="What to put here"
                {...register(`variables.${i}.description`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Default value (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Default…"
                  {...register(`variables.${i}.default`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Remove variable"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Prompt body */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Label htmlFor="body">
            Prompt body <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={insertVariable}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
              aria-label="Insert a variable at the cursor"
            >
              <Braces className="h-3.5 w-3.5" />
              Insert variable
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Friendly explainer — appears once above the field */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Want any part of your prompt to be fillable? Highlight it and click{" "}
          <span className="text-foreground font-medium">Insert variable</span>, or wrap it in <code className="font-mono px-1 rounded bg-muted">{`{{}}`}</code> yourself — like <code className="font-mono px-1 rounded bg-muted text-primary">{`{{topic}}`}</code>. We&apos;ll turn each one into a live input on the prompt page.
        </p>

        {showPreview ? (
          <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <pre className="prompt-body text-sm overflow-x-auto">{previewBody}</pre>
          </div>
        ) : (
          <Textarea
            id="body"
            placeholder={`You are an expert {{language}} developer. Review the following code and tell me about:

- Code quality
- Performance
- Security

Code:
{{code}}`}
            rows={12}
            className="font-mono text-sm"
            {...bodyReg}
            ref={(el) => {
              bodyReg.ref(el);
              bodyRef.current = el;
            }}
            aria-describedby={errors.body ? "body-error" : "body-vars"}
          />
        )}

        {/* Live variable detection feedback */}
        <div id="body-vars" className="flex flex-wrap items-center gap-2 text-xs min-h-[1.5em]">
          {detectedVars.length > 0 ? (
            <>
              <span className="text-muted-foreground font-medium">
                Variables found:
              </span>
              {detectedVars.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]"
                >
                  {v}
                </span>
              ))}
              <span className="text-muted-foreground">
                — fillable on the prompt page.
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              No variables yet. Static prompts work fine — but variables make yours reusable.
            </span>
          )}
        </div>

        {errors.body && (
          <p id="body-error" className="text-sm text-destructive">
            {errors.body.message}
          </p>
        )}
      </div>

      {/* Moderation note */}
      {!isAdmin && (
        <div className="flex gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Every prompt is reviewed before going live (usually under an hour).
            We&apos;ll let you know when yours is approved.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className=""
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit prompt
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

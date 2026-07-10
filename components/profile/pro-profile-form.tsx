"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProProfile } from "@/lib/pro-profile-actions";
import {
  ROLE_CATEGORY_OPTIONS,
  INDUSTRY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  GOAL_OPTIONS,
} from "@/lib/pro-profile-options";
import type { UserAttributes } from "@/lib/types/database";

interface ProProfileFormProps {
  initial: UserAttributes | null;
  /** "card" = the quick 4-field dismissible prompt. "settings" = full "About you" section. */
  variant: "card" | "settings";
  onSaved?: () => void;
}

export function ProProfileForm({ initial, variant, onSaved }: ProProfileFormProps) {
  const [roleCategory, setRoleCategory] = useState<string | null>(initial?.role_category ?? null);
  const [industry, setIndustry] = useState<string | null>(initial?.industry ?? null);
  const [companySize, setCompanySize] = useState<string | null>(initial?.company_size ?? null);
  const [goals, setGoals] = useState<string[]>(initial?.goals ?? []);
  const [jobTitle, setJobTitle] = useState(initial?.job_title ?? "");
  const [companyName, setCompanyName] = useState(initial?.company_name ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedin_url ?? "");
  const [isPending, startTransition] = useTransition();

  const toggleGoal = (goal: string) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const handleSubmit = () => {
    const fd = new FormData();
    if (roleCategory) fd.set("role_category", roleCategory);
    if (industry) fd.set("industry", industry);
    if (companySize) fd.set("company_size", companySize);
    goals.forEach((g) => fd.append("goals", g));
    if (variant === "settings") {
      fd.set("job_title", jobTitle.trim());
      fd.set("company_name", companyName.trim());
      fd.set("linkedin_url", linkedinUrl.trim());
    }
    startTransition(async () => {
      const result = await saveProProfile(fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(variant === "card" ? "Thanks — we'll tune your prompts." : "Saved.");
      onSaved?.();
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          What do you do?
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleCategory(roleCategory === value ? null : value)}
              aria-pressed={roleCategory === value}
            >
              <Badge variant={roleCategory === value ? "brand" : "outline"} className="cursor-pointer">
                {label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Industry</Label>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIndustry(industry === value ? null : value)}
              aria-pressed={industry === value}
            >
              <Badge variant={industry === value ? "brand" : "outline"} className="cursor-pointer">
                {label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Company size <span className="normal-case text-foreground-subtle">(optional)</span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCompanySize(companySize === value ? null : value)}
              aria-pressed={companySize === value}
            >
              <Badge variant={companySize === value ? "brand" : "outline"} className="cursor-pointer">
                {label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Goals <span className="normal-case text-foreground-subtle">(optional, pick any)</span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              aria-pressed={goals.includes(goal)}
            >
              <Badge variant={goals.includes(goal) ? "brand" : "outline"} className="cursor-pointer">
                {goal}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {variant === "settings" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="job_title">Job title</Label>
            <Input
              id="job_title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Head of Growth"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
          </div>
        </>
      )}

      <Button onClick={handleSubmit} disabled={isPending} size={variant === "card" ? "sm" : "default"}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {variant === "card" ? "Save" : "Save changes"}
      </Button>
    </div>
  );
}

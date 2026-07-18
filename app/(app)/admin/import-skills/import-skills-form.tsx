"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Github,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchSkillFromGithub,
  importSkill,
  type SkillCandidate,
} from "./actions";

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

interface ImportSkillsFormProps {
  adminId: string;
}

export function ImportSkillsForm({ adminId }: ImportSkillsFormProps) {
  const [url, setUrl] = useState("");
  const [candidate, setCandidate] = useState<SkillCandidate | null>(null);
  const [category, setCategory] = useState("coding");
  const [runtimes, setRuntimes] = useState<string[]>(["claude-code"]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importedSlug, setImportedSlug] = useState<string | null>(null);
  const [fetching, startFetch] = useTransition();
  const [importing, startImport] = useTransition();

  const handleFetch = () => {
    setFetchError(null);
    setCandidate(null);
    setImportedSlug(null);
    startFetch(async () => {
      const res = await fetchSkillFromGithub(url);
      if (!res.ok || !res.candidate) {
        setFetchError(res.error ?? "Couldn't read that repo.");
        return;
      }
      setCandidate(res.candidate);
    });
  };

  const toggleRuntime = (rt: string) => {
    setRuntimes((prev) => {
      const next = prev.includes(rt)
        ? prev.filter((r) => r !== rt)
        : [...prev, rt];
      return next.length > 0 ? next : ["claude-code"];
    });
  };

  const handleImport = () => {
    if (!candidate) return;
    startImport(async () => {
      const res = await importSkill({
        candidate,
        category,
        runtimes,
        authorId: adminId,
      });
      if (!res.ok || !res.slug) {
        toast.error(`Import failed. ${res.error ?? ""}`);
        return;
      }
      setImportedSlug(res.slug);
      toast.success(`"${candidate.name}" imported.`);
    });
  };

  return (
    <div className="space-y-8">
      {/* Step 1: repo URL */}
      <div className="space-y-2">
        <Label htmlFor="repo-url">GitHub repo URL</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="repo-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim() && !fetching) handleFetch();
              }}
              placeholder="https://github.com/owner/repo"
              className="pl-9"
            />
          </div>
          <Button onClick={handleFetch} disabled={!url.trim() || fetching}>
            {fetching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Fetch skill
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          One repo, one skill. If the repo (or the folder you link) has a
          SKILL.md, its details are used; otherwise the repo description and
          README are pulled. The skill&apos;s download is the repo itself.
        </p>
        {fetchError && (
          <div className="flex items-start gap-2 text-sm text-destructive mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fetchError}</span>
          </div>
        )}
      </div>

      {/* Step 2: preview + settings */}
      {candidate && (
        <div className="space-y-6 border-t border-border pt-6">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-medium">{candidate.name}</span>
              <Badge variant={candidate.hasSkillMd ? "brand" : "secondary"}>
                {candidate.hasSkillMd ? (
                  <>
                    <FileCode className="h-3 w-3 mr-1" /> SKILL.md
                  </>
                ) : (
                  "repo"
                )}
              </Badge>
              <a
                href={candidate.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {candidate.repoLabel} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">{candidate.summary}</p>
            <div>
              <span className="text-[11px] uppercase tracking-wide text-foreground-subtle">
                Download / install
              </span>
              <pre className="mt-1 font-mono text-xs bg-muted rounded-md p-2.5 whitespace-pre-wrap break-all">
                {candidate.install_command}
              </pre>
            </div>
            {candidate.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {candidate.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Category + runtime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="skill-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="skill-category">
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
            </div>
            <div className="space-y-2">
              <Label>Runtime</Label>
              <div className="flex flex-wrap gap-2">
                {RUNTIME_OPTIONS.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => toggleRuntime(rt.value)}
                    aria-pressed={runtimes.includes(rt.value)}
                  >
                    <Badge
                      variant={runtimes.includes(rt.value) ? "brand" : "outline"}
                      className="cursor-pointer transition-colors"
                    >
                      {rt.label}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleImport} disabled={importing}>
              {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Import skill
            </Button>
            {importedSlug && (
              <Link
                href={`/skills/${importedSlug}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                View imported skill
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

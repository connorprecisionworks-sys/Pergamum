"use client";

import { useState, useTransition } from "react";
import {
  Github,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
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
  fetchSkillsFromGithub,
  importSkills,
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
  const [repoLabel, setRepoLabel] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    repo: string;
    branch: string;
  } | null>(null);
  const [candidates, setCandidates] = useState<SkillCandidate[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState("coding");
  const [runtimes, setRuntimes] = useState<string[]>(["claude-code"]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [done, setDone] = useState<{ imported: number; errors: number } | null>(
    null
  );
  const [fetching, startFetch] = useTransition();
  const [importing, startImport] = useTransition();

  const canImport =
    candidates !== null && selected.size > 0 && !importing && repoInfo !== null;

  const handleFetch = () => {
    setFetchError(null);
    setCandidates(null);
    setRepoInfo(null);
    setDone(null);
    startFetch(async () => {
      const res = await fetchSkillsFromGithub(url);
      setRepoLabel(res.repoLabel ?? null);
      if (!res.ok || !res.owner || !res.repo || !res.branch) {
        setFetchError(res.error ?? "Couldn't read that repo.");
        return;
      }
      setRepoInfo({ owner: res.owner, repo: res.repo, branch: res.branch });
      setCandidates(res.candidates);
      setSelected(new Set(res.candidates.map((c) => c.path)));
    });
  };

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
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

  const selectAll = () => {
    if (candidates) setSelected(new Set(candidates.map((c) => c.path)));
  };
  const selectNone = () => setSelected(new Set());

  const handleImport = () => {
    if (!repoInfo || !candidates) return;
    const paths = candidates
      .filter((c) => selected.has(c.path))
      .map((c) => c.path);
    startImport(async () => {
      const res = await importSkills({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch: repoInfo.branch,
        paths,
        category,
        runtimes,
        authorId: adminId,
      });
      if (res.imported === 0 && res.errors.length > 0) {
        toast.error(`Import failed. ${res.errors[0]?.message ?? ""}`);
      } else if (res.errors.length > 0) {
        toast.warning(
          `${res.imported} imported, ${res.errors.length} failed. See below.`
        );
      } else {
        toast.success(
          `${res.imported} skill${res.imported !== 1 ? "s" : ""} imported.`
        );
      }
      setDone({ imported: res.imported, errors: res.errors.length });
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
              placeholder="https://github.com/owner/repo (or /tree/main/skills)"
              className="pl-9"
            />
          </div>
          <Button onClick={handleFetch} disabled={!url.trim() || fetching}>
            {fetching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Fetch skills
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Reads every SKILL.md in the repo. Point at a subfolder with
          /tree/&lt;branch&gt;/&lt;path&gt; to limit it. Nothing is generated —
          only the real files are imported.
        </p>
        {fetchError && (
          <div className="flex items-start gap-2 text-sm text-destructive mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fetchError}</span>
          </div>
        )}
      </div>

      {/* Step 2: batch settings + preview */}
      {candidates !== null && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <div className="text-sm">
              <span className="font-medium">{candidates.length}</span> skill
              {candidates.length !== 1 ? "s" : ""} found in{" "}
              <span className="font-mono">{repoLabel}</span> ·{" "}
              <span className="font-medium">{selected.size}</span> selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                None
              </Button>
            </div>
          </div>

          {/* Batch category + runtime, applied to every imported skill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="batch-category">Category for all</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="batch-category">
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
              <Label>Runtime for all</Label>
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

          {/* Preview list */}
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {candidates.map((c) => (
              <label
                key={c.path}
                className="flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.path)}
                  onChange={() => toggle(c.path)}
                  className="mt-1 h-4 w-4 shrink-0 accent-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.name}</span>
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {c.summary}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className="font-mono text-[11px] text-foreground-subtle">
                      {c.path}
                    </span>
                    {c.install_command && (
                      <Badge variant="outline" className="text-[10px]">
                        install cmd
                      </Badge>
                    )}
                    {c.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleImport} disabled={!canImport}>
              {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Import{" "}
              {selected.size > 0
                ? `${selected.size} skill${selected.size !== 1 ? "s" : ""}`
                : ""}
            </Button>
            {done && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {done.imported} imported
                {done.errors > 0 ? `, ${done.errors} failed` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

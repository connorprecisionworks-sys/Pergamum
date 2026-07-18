"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type SkillInsert = Database["public"]["Tables"]["skills"]["Insert"];

export interface SkillCandidate {
  name: string;
  summary: string;
  install_command: string;
  source_url: string;
  readme: string;
  tags: string[];
  repoLabel: string;
  hasSkillMd: boolean;
}

export interface FetchSkillResult {
  ok: boolean;
  error?: string;
  candidate?: SkillCandidate;
}

export interface ImportSkillArgs {
  candidate: SkillCandidate;
  category: string;
  runtimes: string[];
  authorId: string;
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

const README_MAX = 20000;
const SUMMARY_MAX = 400;

type FrontmatterData = Record<string, string | string[]>;

function unquote(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseFrontmatter(md: string): { data: FrontmatterData; body: string } {
  const m = /^\uFEFF?---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(md);
  if (!m) return { data: {}, body: md };
  const body = md.slice(m[0].length);
  const data: FrontmatterData = {};
  let currentKey: string | null = null;
  for (const rawLine of m[1].split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && currentKey) {
      const existing = data[currentKey];
      const arr = Array.isArray(existing) ? existing : [];
      arr.push(unquote(listItem[1]));
      data[currentKey] = arr;
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const rest = kv[2].trim();
    currentKey = key;
    if (rest === "") {
      if (!(key in data)) data[key] = "";
      continue;
    }
    if (rest.startsWith("[") && rest.endsWith("]")) {
      data[key] = rest
        .slice(1, -1)
        .split(",")
        .map((s) => unquote(s))
        .filter(Boolean);
      currentKey = null;
    } else {
      data[key] = unquote(rest);
      currentKey = null;
    }
  }
  return { data, body };
}

function asString(v: string | string[] | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(",");
  return [];
}

function firstParagraph(body: string): string {
  for (const block of body.split(/\n\s*\n/)) {
    const line = block.trim();
    if (!line || line.startsWith("#") || line.startsWith("---")) continue;
    return line.replace(/\s+/g, " ").replace(/[#*`>_]/g, "").trim();
  }
  return "";
}

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "prmpt-skill-importer",
    Accept: "application/vnd.github+json",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub returned ${res.status} for ${url}`);
  return res.text();
}

async function tryFetchText(url: string): Promise<string | null> {
  try {
    return await ghFetchText(url);
  } catch {
    return null;
  }
}

async function ghFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub returned ${res.status} for ${url}`);
  return res.json();
}

interface ParsedRepoUrl {
  owner: string;
  repo: string;
  branch?: string;
  subpath?: string;
}

function parseRepoUrl(raw: string): ParsedRepoUrl | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  let branch: string | undefined;
  let subpath: string | undefined;
  if ((parts[2] === "tree" || parts[2] === "blob") && parts[3]) {
    branch = parts[3];
    if (parts.length > 4) {
      subpath = parts.slice(4).join("/").replace(/\/SKILL\.md$/i, "");
    }
  }
  return { owner, repo, branch, subpath };
}

async function resolveBranch(owner: string, repo: string): Promise<string> {
  try {
    const meta = (await ghFetchJson(
      `https://api.github.com/repos/${owner}/${repo}`
    )) as { default_branch?: string };
    return meta.default_branch || "main";
  } catch {
    return "main";
  }
}

async function fetchReadme(
  owner: string,
  repo: string,
  branch: string,
  dir: string
): Promise<string> {
  const prefix = dir ? `${dir}/` : "";
  const names = ["README.md", "readme.md", "Readme.md", "README.MD"];
  for (const n of names) {
    const text = await tryFetchText(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${prefix}${n}`
    );
    if (text) return text;
  }
  return "";
}

export async function fetchSkillFromGithub(
  url: string
): Promise<FetchSkillResult> {
  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return {
      ok: false,
      error:
        "That doesn't look like a GitHub URL. Paste a repo link like https://github.com/owner/repo.",
    };
  }
  const { owner, repo } = parsed;
  const repoLabel = `${owner}/${repo}`;
  try {
    const branch = parsed.branch || (await resolveBranch(owner, repo));
    const dir = (parsed.subpath || "").replace(/\/+$/, "");
    const cloneCmd = `git clone https://github.com/${owner}/${repo}.git`;
    const sourceUrl = dir
      ? `https://github.com/${owner}/${repo}/tree/${branch}/${dir}`
      : `https://github.com/${owner}/${repo}`;

    // Prefer a SKILL.md at the target path if one exists.
    const skillMd = await tryFetchText(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dir ? dir + "/" : ""}SKILL.md`
    );

    if (skillMd) {
      const { data, body } = parseFrontmatter(skillMd);
      const folder = dir.split("/").filter(Boolean).pop() || repo;
      const name = (asString(data.name) || asString(data.title) || folder).slice(0, 80);
      const summary = (
        asString(data.description) ||
        asString(data.summary) ||
        firstParagraph(body) ||
        name
      ).slice(0, SUMMARY_MAX);
      const install = asString(data.install) || asString(data.install_command) || cloneCmd;
      const tags = asArray(data.tags)
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 10);
      return {
        ok: true,
        candidate: {
          name,
          summary,
          install_command: install,
          source_url: sourceUrl,
          readme: skillMd.slice(0, README_MAX),
          tags,
          repoLabel,
          hasSkillMd: true,
        },
      };
    }

    // No SKILL.md — build one skill from the repo itself (description + README + topics).
    let description = "";
    let topics: string[] = [];
    try {
      const meta = (await ghFetchJson(
        `https://api.github.com/repos/${owner}/${repo}`
      )) as { description?: string; topics?: string[] };
      description = meta.description || "";
      topics = Array.isArray(meta.topics) ? meta.topics : [];
    } catch {
      /* description/topics are best-effort */
    }
    const readme = await fetchReadme(owner, repo, branch, dir);
    const name = (dir.split("/").filter(Boolean).pop() || repo).slice(0, 80);
    const summary = (
      description ||
      firstParagraph(parseFrontmatter(readme).body) ||
      name
    ).slice(0, SUMMARY_MAX);
    const tags = topics
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean)
      .slice(0, 10);
    return {
      ok: true,
      candidate: {
        name,
        summary,
        install_command: cloneCmd,
        source_url: sourceUrl,
        readme: (readme || `# ${name}\n\nSource: ${sourceUrl}`).slice(0, README_MAX),
        tags,
        repoLabel,
        hasSkillMd: false,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch the repo.",
    };
  }
}

export async function importSkill(args: ImportSkillArgs): Promise<ImportResult> {
  const { candidate, category, runtimes, authorId } = args;
  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient.from("skills").select("slug");
  const taken = new Set((existing ?? []).map((s) => s.slug as string));
  const base = slugify(candidate.name) || "skill";
  let slug = base;
  if (taken.has(slug)) {
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    slug = `${base}-${i}`;
  }

  const row: SkillInsert = {
    author_id: authorId,
    name: candidate.name,
    slug,
    summary: candidate.summary || candidate.name,
    install_command: candidate.install_command || null,
    source_url: candidate.source_url,
    readme: candidate.readme || null,
    category: category || null,
    runtimes: runtimes.length > 0 ? runtimes : [],
    tags: candidate.tags,
    status: "published",
    published_at: new Date().toISOString(),
    hero_image_url: null,
    hero_loop_url: null,
    hero_poster_url: null,
  };

  const { error } = await serviceClient
    .from("skills")
    .insert(row)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug };
}

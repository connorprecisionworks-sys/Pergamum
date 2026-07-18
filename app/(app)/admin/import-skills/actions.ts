"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type SkillInsert = Database["public"]["Tables"]["skills"]["Insert"];

export interface SkillCandidate {
  name: string;
  summary: string;
  install_command: string | null;
  source_url: string;
  tags: string[];
  path: string;
  readme_chars: number;
}

export interface FetchSkillsResult {
  ok: boolean;
  error?: string;
  repoLabel?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  candidates: SkillCandidate[];
}

export interface ImportSkillsArgs {
  owner: string;
  repo: string;
  branch: string;
  paths: string[];
  category: string;
  runtimes: string[];
  authorId: string;
}

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

const BATCH_SIZE = 50;
const MAX_SKILLS = 200;
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

async function listSkillPaths(
  owner: string,
  repo: string,
  branch: string,
  subpath?: string
): Promise<string[]> {
  const tree = (await ghFetchJson(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  )) as { tree?: { path: string; type: string }[] };
  let paths = (tree.tree ?? [])
    .filter((n) => n.type === "blob" && /(^|\/)SKILL\.md$/i.test(n.path))
    .map((n) => n.path);
  if (subpath) {
    const sp = subpath.replace(/\/+$/, "");
    paths = paths.filter((p) => p === `${sp}/SKILL.md` || p.startsWith(`${sp}/`));
  }
  return paths.slice(0, MAX_SKILLS);
}

interface BuiltSkill {
  name: string;
  summary: string;
  install_command: string | null;
  source_url: string;
  tags: string[];
  readme: string;
  path: string;
}

async function buildSkill(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<BuiltSkill> {
  const raw = await ghFetchText(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  );
  const { data, body } = parseFrontmatter(raw);
  const dir = path.replace(/\/?SKILL\.md$/i, "");
  const folder = dir.split("/").filter(Boolean).pop() || repo;
  const name = (asString(data.name) || asString(data.title) || folder).slice(0, 80);
  const summary = (
    asString(data.description) ||
    asString(data.summary) ||
    firstParagraph(body) ||
    name
  ).slice(0, SUMMARY_MAX);
  const install_command =
    asString(data.install) || asString(data.install_command) || null;
  const source_url = dir
    ? `https://github.com/${owner}/${repo}/tree/${branch}/${dir}`
    : `https://github.com/${owner}/${repo}`;
  const tags = asArray(data.tags)
    .map((t) => t.toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 10);
  return {
    name,
    summary,
    install_command,
    source_url,
    tags,
    readme: raw.slice(0, README_MAX),
    path,
  };
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  const workers = new Array(size).fill(0).map(async () => {
    for (;;) {
      const idx = cursor++;
      if (idx >= items.length) break;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function fetchSkillsFromGithub(
  url: string
): Promise<FetchSkillsResult> {
  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return {
      ok: false,
      error:
        "That doesn't look like a GitHub URL. Paste a repo link like https://github.com/owner/repo.",
      candidates: [],
    };
  }
  const repoLabel = `${parsed.owner}/${parsed.repo}`;
  try {
    const branch =
      parsed.branch || (await resolveBranch(parsed.owner, parsed.repo));
    const paths = await listSkillPaths(
      parsed.owner,
      parsed.repo,
      branch,
      parsed.subpath
    );
    if (paths.length === 0) {
      return {
        ok: false,
        error: "No SKILL.md files found in that repo or path.",
        repoLabel,
        candidates: [],
      };
    }
    const built = await mapPool(paths, 10, async (p) => {
      try {
        return await buildSkill(parsed.owner, parsed.repo, branch, p);
      } catch {
        return null;
      }
    });
    const candidates: SkillCandidate[] = built
      .filter((b): b is BuiltSkill => b !== null)
      .map((b) => ({
        name: b.name,
        summary: b.summary,
        install_command: b.install_command,
        source_url: b.source_url,
        tags: b.tags,
        path: b.path,
        readme_chars: b.readme.length,
      }));
    if (candidates.length === 0) {
      return {
        ok: false,
        error: "Found SKILL.md files but could not read any of them.",
        repoLabel,
        candidates: [],
      };
    }
    return {
      ok: true,
      repoLabel,
      owner: parsed.owner,
      repo: parsed.repo,
      branch,
      candidates,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch the repo.",
      repoLabel,
      candidates: [],
    };
  }
}

export async function importSkills(
  args: ImportSkillsArgs
): Promise<ImportResult> {
  const { owner, repo, branch, paths, category, runtimes, authorId } = args;
  const serviceClient = await createServiceClient();

  const { data: existingSlugs } = await serviceClient
    .from("skills")
    .select("slug");
  const taken = new Set((existingSlugs ?? []).map((s) => s.slug as string));
  const publishedAt = new Date().toISOString();

  const errors: { row: number; message: string }[] = [];
  const rows: SkillInsert[] = [];

  let index = 0;
  for (const path of paths.slice(0, MAX_SKILLS)) {
    index++;
    try {
      const skill = await buildSkill(owner, repo, branch, path);
      const base = slugify(skill.name) || "skill";
      let slug = base;
      if (taken.has(slug)) {
        let i = 2;
        while (taken.has(`${base}-${i}`)) i++;
        slug = `${base}-${i}`;
      }
      taken.add(slug);
      rows.push({
        author_id: authorId,
        name: skill.name,
        slug,
        summary: skill.summary || skill.name,
        install_command: skill.install_command,
        source_url: skill.source_url,
        readme: skill.readme,
        category: category || null,
        runtimes: runtimes.length > 0 ? runtimes : [],
        tags: skill.tags,
        status: "published",
        published_at: publishedAt,
        hero_image_url: null,
        hero_loop_url: null,
        hero_poster_url: null,
      });
    } catch (e) {
      errors.push({
        row: index,
        message: e instanceof Error ? e.message : "Could not read skill.",
      });
    }
  }

  let imported = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await serviceClient
      .from("skills")
      .insert(batch)
      .select("id");
    if (error) {
      batch.forEach((_, j) =>
        errors.push({ row: i + j + 1, message: error.message })
      );
    } else {
      imported += (data ?? []).length;
    }
  }

  return { imported, errors };
}

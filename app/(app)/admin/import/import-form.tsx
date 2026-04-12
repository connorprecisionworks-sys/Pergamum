"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importPrompts, type ImportPromptInput } from "./actions";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ImportFormProps {
  categories: Category[];
  adminId: string;
}

interface RowResult {
  index: number;
  valid: boolean;
  error?: string;
  title?: string;
  categoryName?: string;
  models?: string[];
  data?: ImportPromptInput;
}

const VAR_REGEX = /\{\{(\w+)\}\}/g;

function extractVariables(body: string): { name: string; type: "text" }[] {
  const names = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_REGEX.source, "g");
  while ((m = re.exec(body)) !== null) names.add(m[1]);
  return [...names].map((name) => ({ name, type: "text" as const }));
}

function validateRows(
  parsed: unknown[],
  categories: Category[],
  adminId: string
): RowResult[] {
  return parsed.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { index, valid: false, error: "Each entry must be a JSON object" };
    }
    const obj = item as Record<string, unknown>;

    const title =
      typeof obj.title === "string" ? obj.title.trim() : "";
    if (title.length < 5) {
      return {
        index,
        valid: false,
        error: `"title" required (min 5 chars)${title ? `, got "${title}"` : ""}`,
      };
    }

    const body =
      typeof obj.body === "string" ? obj.body.trim() : "";
    if (body.length < 20) {
      return {
        index,
        valid: false,
        error: `"body" required (min 20 chars)${body ? `, got ${body.length} chars` : ""}`,
      };
    }

    // Category — optional, matched by name or slug
    let category_id: string | null = null;
    let categoryName = "—";
    if (obj.category != null) {
      const needle =
        typeof obj.category === "string"
          ? obj.category.toLowerCase().trim()
          : "";
      const match = categories.find(
        (c) =>
          c.name.toLowerCase() === needle || c.slug.toLowerCase() === needle
      );
      if (!match) {
        return {
          index,
          valid: false,
          error: `Unknown category: "${obj.category}". Valid: ${categories.map((c) => c.name).join(", ")}`,
        };
      }
      category_id = match.id;
      categoryName = match.name;
    }

    // Description — default to first 160 chars of body
    const description =
      typeof obj.description === "string" && obj.description.trim().length > 0
        ? obj.description.trim()
        : body.slice(0, 160).replace(/\s+/g, " ");

    // model_tags
    const model_tags =
      Array.isArray(obj.model_tags) &&
      obj.model_tags.length > 0 &&
      obj.model_tags.every((t) => typeof t === "string")
        ? (obj.model_tags as string[])
        : ["any"];

    // tags
    const tags =
      Array.isArray(obj.tags) && obj.tags.every((t) => typeof t === "string")
        ? (obj.tags as string[]).map((t) => t.toLowerCase().trim()).filter(Boolean)
        : [];

    // variables — auto-detect from body if not provided
    let variables: { name: string; type: "text" }[];
    if (
      Array.isArray(obj.variables) &&
      obj.variables.every(
        (v) =>
          typeof v === "object" &&
          v !== null &&
          typeof (v as Record<string, unknown>).name === "string"
      )
    ) {
      variables = (obj.variables as { name: string }[]).map((v) => ({
        name: v.name,
        type: "text" as const,
      }));
    } else {
      variables = extractVariables(body);
    }

    return {
      index,
      valid: true,
      title,
      categoryName,
      models: model_tags,
      data: {
        title,
        description,
        body,
        category_id,
        model_tags,
        tags,
        variables,
        author_id: adminId,
      },
    };
  });
}

export function ImportForm({ categories, adminId }: ImportFormProps) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<RowResult[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validRows = (rows ?? []).filter((r) => r.valid);
  const invalidRows = (rows ?? []).filter((r) => !r.valid);
  const canImport = rows !== null && validRows.length > 0 && !isPending;

  const handleValidate = () => {
    setParseError(null);
    setRows(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.trim());
    } catch (e) {
      setParseError(
        e instanceof SyntaxError ? e.message : "Invalid JSON"
      );
      return;
    }

    if (!Array.isArray(parsed)) {
      setParseError("JSON must be an array of prompt objects, e.g. [{...}, {...}]");
      return;
    }

    if (parsed.length === 0) {
      setParseError("Array is empty — nothing to import.");
      return;
    }

    setRows(validateRows(parsed, categories, adminId));
  };

  const handleImport = () => {
    const toInsert = validRows
      .map((r) => r.data)
      .filter((d): d is ImportPromptInput => d !== undefined);

    startTransition(async () => {
      const result = await importPrompts(toInsert);

      if (result.errors.length > 0) {
        toast.error(
          `${result.imported} imported, ${result.errors.length} failed. Check the results below.`
        );
        // Mark failed rows
        setRows((prev) =>
          (prev ?? []).map((r) => {
            const err = result.errors.find((e) => e.row === r.index + 1);
            if (err) return { ...r, valid: false, error: `Insert failed: ${err.message}` };
            return r;
          })
        );
      } else {
        toast.success(
          `${result.imported} prompt${result.imported !== 1 ? "s" : ""} imported successfully.`
        );
        setText("");
        setRows(null);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Textarea */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          JSON payload{" "}
          <span className="text-muted-foreground font-normal">
            — array of prompt objects
          </span>
        </label>
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Reset validation state when content changes
            setRows(null);
            setParseError(null);
          }}
          placeholder={JSON.stringify(
            [
              {
                title: "Senior Developer Code Review",
                description: "Reviews code for quality, performance, and security.",
                body: "You are a senior {{language}} engineer. Review the following code:\n\n{{code}}",
                category: "Coding",
                model_tags: ["any"],
                tags: ["code-review", "engineering"],
              },
            ],
            null,
            2
          )}
          className="font-mono text-xs min-h-[400px] resize-y"
          spellCheck={false}
        />
        {parseError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <XCircle className="h-4 w-4 shrink-0" />
            {parseError}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleValidate}
          disabled={!text.trim() || isPending}
        >
          Validate
        </Button>
        <Button
          type="button"
          onClick={handleImport}
          disabled={!canImport}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Import {validRows.length > 0 ? `${validRows.length} prompt${validRows.length !== 1 ? "s" : ""}` : ""}
        </Button>
        {rows !== null && (
          <span className="text-sm text-muted-foreground">
            {validRows.length} valid · {invalidRows.length} invalid
          </span>
        )}
      </div>

      {/* Preview table */}
      {rows !== null && rows.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2.5 px-4 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left py-2.5 px-4 font-medium text-muted-foreground w-32">Category</th>
                <th className="text-left py-2.5 px-4 font-medium text-muted-foreground w-32">Models</th>
                <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.index}
                  className={`border-b last:border-0 ${
                    row.valid ? "" : "bg-destructive/5"
                  }`}
                >
                  <td className="py-2.5 px-4 text-muted-foreground tabular-nums">
                    {row.index + 1}
                  </td>
                  <td className="py-2.5 px-4 font-medium truncate max-w-[240px]">
                    {row.title ?? (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {row.categoryName ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">
                    {row.models?.join(", ") ?? "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    {row.valid ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Valid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <XCircle className="h-4 w-4 shrink-0" />
                        {row.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post-import hint */}
      <p className="text-xs text-muted-foreground">
        Imported prompts are published immediately and attributed to your admin account.{" "}
        <Link href="/prompts" className="text-pergamum-600 hover:text-pergamum-700">
          Browse the library →
        </Link>
      </p>
    </div>
  );
}

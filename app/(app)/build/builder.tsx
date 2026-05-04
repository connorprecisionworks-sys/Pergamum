"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  Copy,
  Check,
  Download,
  Save,
  Trash2,
  ChevronDown,
  Wand2,
  ArrowRight,
  Plus,
  History,
  Play,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveDraft, deleteDraft, type DraftInput } from "./actions";
// The visual artifact at the top of the builder. The PromptStrength meter
// scores the prompt and surfaces actionable suggestions. The Constellation
// (./constellation) and TypeCase (./typecase) files are still on disk if we
// ever want to flip back to a more decorative visual.
import {
  PromptStrength,
  type BlockKey as ConstellationBlockKey,
  type ActionTarget as StrengthActionTarget,
} from "./strength";
import { relativeTime } from "@/lib/utils";
import type { PromptDraft, PromptExample } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────
type Result = {
  title: string;
  role: string;
  context: string;
  task: string;
  constraints: string;
  output_format: string;
};

type YesNoQuestion = { id: string; text: string };
type AnswerValue = "yes" | "no";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // When the assistant message accompanies a finished prompt, this is set
  // so we can render the prompt card right under that message.
  resultSnapshot?: Result;
  // When the assistant turn is a set of yes/no clarification cards.
  questions?: YesNoQuestion[];
  // Filled in as the user clicks Yes/No on the cards above; once all are
  // answered we collapse the card into a compact summary line.
  answers?: Record<string, AnswerValue>;
};

interface BuilderProps {
  userId: string;
  initialDraft: PromptDraft | null;
  recentDrafts: Pick<PromptDraft, "id" | "title" | "goal" | "updated_at">[];
}

// ─── Helpers ──────────────────────────────────────────────────────
function emptyResult(): Result {
  return {
    title: "",
    role: "",
    context: "",
    task: "",
    constraints: "",
    output_format: "",
  };
}

function resultFromDraft(d: PromptDraft): Result {
  return {
    title: d.title ?? "",
    role: d.role,
    context: d.context,
    task: d.task,
    constraints: d.constraints,
    output_format: d.output_format,
  };
}

function hasAnyContent(r: Result): boolean {
  return [r.role, r.context, r.task, r.constraints, r.output_format].some(
    (v) => v.trim().length > 0
  );
}

/**
 * Assemble blocks (and any few-shot examples) into a single prompt body,
 * skipping empty sections. Examples render under an "# Examples" heading —
 * most models pick up few-shot patterns reliably from this layout.
 */
function assemble(r: Result, examples: PromptExample[] = []): string {
  const sections: { label: string; value: string }[] = [
    { label: "Role", value: r.role },
    { label: "Context", value: r.context },
    { label: "Task", value: r.task },
    { label: "Constraints", value: r.constraints },
    { label: "Output format", value: r.output_format },
  ];
  const blocks = sections
    .filter((s) => s.value.trim().length > 0)
    .map((s) => `# ${s.label}\n${s.value.trim()}`);

  const usable = examples.filter(
    (e) => (e.input ?? "").trim().length > 0 || (e.output ?? "").trim().length > 0
  );
  if (usable.length > 0) {
    const rendered = usable
      .map((e) => `Input:\n${e.input.trim()}\n\nOutput:\n${e.output.trim()}`)
      .join("\n\n---\n\n");
    blocks.push(`# Examples\n${rendered}`);
  }

  return blocks.join("\n\n");
}

function newId() {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Component ────────────────────────────────────────────────────
export function Builder({ userId: _userId, initialDraft, recentDrafts }: BuilderProps) {
  const router = useRouter();

  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [goal, setGoal] = useState<string>(initialDraft?.goal ?? "");
  const [result, setResult] = useState<Result>(
    initialDraft ? resultFromDraft(initialDraft) : emptyResult()
  );
  // Few-shot examples are stored separately from the 5-block result so the
  // chat assistant can revise the blocks without accidentally clobbering
  // user-authored examples.
  const [examples, setExamples] = useState<PromptExample[]>(
    Array.isArray(initialDraft?.examples)
      ? (initialDraft!.examples as unknown as PromptExample[])
      : []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // If we loaded an existing draft, seed the chat with a single system-like
    // assistant message that shows the saved prompt as the starting point.
    if (initialDraft && hasAnyContent(resultFromDraft(initialDraft))) {
      return [
        {
          id: newId(),
          role: "assistant",
          content:
            "Here's the prompt you saved. Tell me what to change, or just copy it as-is.",
          resultSnapshot: resultFromDraft(initialDraft),
        },
      ];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  // True when an unanswered yes/no question set is active. The QuestionView
  // takes over the page when this is true; the normal builder layout returns
  // once the user finishes (Continue on last question) or skips.
  const [inQuestionFlow, setInQuestionFlow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const manualEditorRef = useRef<HTMLDetailsElement>(null);

  const assembled = useMemo(() => assemble(result, examples), [result, examples]);
  const hasResult = hasAnyContent(result);

  // Open the manual editor and scroll to a specific block textarea so the
  // user can edit that part directly.
  const focusBlock = (key: ConstellationBlockKey) => {
    setShowManual(true);
    if (manualEditorRef.current) manualEditorRef.current.open = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(`manual-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLTextAreaElement).focus();
      }
    });
  };

  // Strength suggestions can target any block OR the few-shot examples panel.
  // Route both through one handler so the panel decides where to land.
  const handleStrengthAction = (target: StrengthActionTarget) => {
    if (target === "examples") {
      setShowManual(true);
      if (manualEditorRef.current) manualEditorRef.current.open = true;
      // No specific element id for the examples section — open the editor and
      // scroll to the bottom where the few-shot panel lives, so the user
      // lands close to it.
      requestAnimationFrame(() => {
        manualEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
      return;
    }
    focusBlock(target);
  };


  // Auto-scroll the chat to the bottom whenever messages or thinking change.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // ─── Send a user message to the converse endpoint ──────────────
  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    // Capture the very first user message as the "goal" — useful when we
    // save the draft so the dashboard can show what the prompt is for.
    if (!goal.trim()) setGoal(trimmed);

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/build/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          current: hasResult
            ? {
                title: result.title,
                role: result.role,
                context: result.context,
                task: result.task,
                constraints: result.constraints,
                output_format: result.output_format,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong");

      if (data.kind === "yesno" && Array.isArray(data.questions) && data.questions.length > 0) {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: "A couple of quick yes/no questions before I write it:",
            questions: data.questions as YesNoQuestion[],
            answers: {},
          },
        ]);
        // Take over the screen with the full-page question UI.
        setInQuestionFlow(true);
      } else if (data.kind === "question") {
        setMessages((m) => [
          ...m,
          { id: newId(), role: "assistant", content: data.text },
        ]);
      } else if (data.kind === "ready") {
        const next: Result = {
          title: data.title ?? result.title ?? "",
          role: data.role ?? "",
          context: data.context ?? "",
          task: data.task ?? "",
          constraints: data.constraints ?? "",
          output_format: data.output_format ?? "",
        };
        setResult(next);
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: data.blurb ?? "Here's your prompt.",
            resultSnapshot: next,
          },
        ]);
      } else {
        throw new Error("Unexpected response from the builder.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      // Roll back — the user's message stays, but no assistant reply lands.
      // They can press send again to retry.
    } finally {
      setThinking(false);
      // Re-focus so the user can keep typing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  // ─── Yes/No answer handling ────────────────────────────────────
  // The full-screen QuestionView walks the user through each question one
  // at a time. answerQuestion just records the choice; the QuestionView
  // calls submitAnswers() when the user clicks Continue on the last
  // question, which then sends the synthesised answers to the AI.
  const answerQuestion = (messageId: string, questionId: string, value: AnswerValue) => {
    setMessages((m) =>
      m.map((msg) => {
        if (msg.id !== messageId || !msg.questions) return msg;
        return {
          ...msg,
          answers: { ...(msg.answers ?? {}), [questionId]: value },
        };
      })
    );
  };

  const submitAnswers = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.questions || !msg.answers) return;
    const text = msg.questions
      .map((q) => `${msg.answers![q.id] === "yes" ? "Yes" : "No"} — ${q.text}`)
      .join("\n");
    setInQuestionFlow(false);
    void send(text);
  };

  // "Skip — just generate" — bypasses any pending yes/no questions.
  const skipQuestions = () => {
    setInQuestionFlow(false);
    void send("Skip the questions and just generate the prompt with reasonable defaults.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline — standard chat affordance.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  // ─── Actions on the finished prompt ────────────────────────────
  const onCopy = async () => {
    if (!assembled) return;
    try {
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Couldn't copy — your browser may have blocked it.");
    }
  };

  const onDownload = () => {
    if (!assembled) return;
    const blob = new Blob([assembled], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = (result.title.trim() || "prompt")
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "");
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onSave = (then?: (id: string) => void) => {
    startSaving(async () => {
      const input: DraftInput = {
        id: draftId ?? undefined,
        title: result.title,
        goal,
        role: result.role,
        context: result.context,
        task: result.task,
        constraints: result.constraints,
        output_format: result.output_format,
        examples,
      };
      const r = await saveDraft(input);
      if (!r.success || !r.draftId) {
        toast.error(r.error ?? "Failed to save draft.");
        return;
      }
      if (!draftId) {
        setDraftId(r.draftId);
        router.replace(`/build?draft=${r.draftId}`);
      }
      if (then) then(r.draftId);
      else toast.success("Draft saved.");
    });
  };

  const onDelete = () => {
    if (!draftId) return;
    if (!confirm("Delete this draft? This can't be undone.")) return;
    startDeleting(async () => {
      const r = await deleteDraft(draftId);
      if (!r.success) {
        toast.error(r.error ?? "Failed to delete.");
        return;
      }
      toast.success("Draft deleted.");
      onNew();
    });
  };

  const onSendToLibrary = () => {
    if (!hasResult) return;
    onSave((id) => {
      router.push(`/submit?from_draft=${id}`);
    });
  };

  const onNew = () => {
    if (
      hasResult &&
      !confirm("Start a new prompt? Unsaved changes in this one will be lost.")
    ) {
      return;
    }
    setDraftId(null);
    setGoal("");
    setResult(emptyResult());
    setExamples([]);
    setMessages([]);
    setInput("");
    setShowManual(false);
    router.replace("/build");
  };

  // ─── Render ────────────────────────────────────────────────────
  // Find an active question set (questions exist but user hasn't finished
  // answering all of them yet). When one is active and inQuestionFlow is on,
  // we render the full-screen QuestionView in place of the normal builder.
  const activeQuestionsMessage = inQuestionFlow
    ? [...messages].reverse().find(
        (m) => m.questions && m.questions.length > 0
      ) ?? null
    : null;

  if (activeQuestionsMessage) {
    return (
      <QuestionView
        message={activeQuestionsMessage}
        onAnswer={answerQuestion}
        onSubmit={submitAnswers}
        onSkip={skipQuestions}
        thinking={thinking}
      />
    );
  }

  return (
    <div className="max-w-[760px] mx-auto">
      {/* Top bar — minimal: new prompt + drafts dropdown */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNew}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New prompt
        </Button>
        {recentDrafts.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" />
                Drafts
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                Recent drafts
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentDrafts.map((d) => (
                <DropdownMenuItem key={d.id} asChild>
                  <Link href={`/build?draft=${d.id}`}>
                    <div className="flex flex-col items-start gap-0.5 py-1 min-w-0 w-full">
                      <span className="text-[13px] truncate w-full">
                        {d.title || d.goal || "Untitled draft"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(d.updated_at)}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Prompt strength meter — scores the current prompt and surfaces
          actionable suggestions. Replaces the more decorative constellation /
          typecase visuals in favour of something the user can actually act on. */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background-subtle py-6 md:py-8 px-5 md:px-7">
        <PromptStrength
          data={{
            role: result.role,
            context: result.context,
            task: result.task,
            constraints: result.constraints,
            output_format: result.output_format,
          }}
          examples={examples}
          title={hasResult ? result.title : undefined}
          thinking={thinking}
          onActionClick={handleStrengthAction}
        />
      </div>

      {/* Main artifact area — switches based on whether a prompt exists */}
      {hasResult ? (
        <ResultArtifact result={result} examples={examples} />
      ) : (
        <div
          ref={scrollRef}
          className="rounded-xl border border-border/60 bg-card min-h-[220px] max-h-[50vh] overflow-y-auto p-5 md:p-6 space-y-5"
        >
          {messages.length === 0 && !thinking && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground max-w-[440px] mx-auto leading-relaxed">
                Describe a task you&apos;ll run more than once. I&apos;ll ask
                what I need to and hand back a structured prompt.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              onAnswer={answerQuestion}
              onSkip={skipQuestions}
              thinking={thinking}
            />
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
              </span>
              <span>Thinking…</span>
            </div>
          )}
        </div>
      )}

      {/* Input — no helper microcopy. Placeholder carries its weight. */}
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={
              hasResult
                ? "Refine — e.g. 'make the tone more casual'"
                : "e.g. summarize customer interview transcripts into a research brief grouped by theme"
            }
            disabled={thinking}
            className="pr-14 text-[14px] leading-relaxed resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={thinking || !input.trim()}
            className="absolute bottom-2 right-2 h-9 w-9"
            aria-label="Send"
          >
            {thinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Tools — only meaningful once there's a prompt */}
      {hasResult && (
        <div className="mt-6 space-y-4">
          {/* One primary, the rest as quiet text buttons */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button
              type="button"
              onClick={onSendToLibrary}
              disabled={isSaving}
              className="h-10 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Send to library
            </Button>

            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onSave()}
                disabled={isSaving}
                className="hover:text-foreground transition-colors disabled:opacity-50"
              >
                Save
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onDownload}
                className="hover:text-foreground transition-colors"
              >
                .md
              </button>
              {draftId && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Conversation history — only if there's actually anything to show */}
          {messages.length > 1 && (
            <details className="group">
              <summary className="cursor-pointer list-none text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                <span>Show conversation</span>
              </summary>
              <div className="mt-3 rounded-xl border border-border/40 bg-background-subtle p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                {messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    message={m}
                    onAnswer={answerQuestion}
                    onSkip={skipQuestions}
                    thinking={thinking}
                  />
                ))}
              </div>
            </details>
          )}

          {/* Edit manually — short label */}
          <details
            ref={manualEditorRef}
            className="group rounded-xl border border-border/60 bg-card overflow-hidden"
            open={showManual}
            onToggle={(e) => setShowManual((e.target as HTMLDetailsElement).open)}
          >
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm text-foreground/80 hover:bg-background-subtle transition-colors">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              <span>Edit manually</span>
            </summary>
            <ManualEditor
              result={result}
              setResult={setResult}
              examples={examples}
              setExamples={setExamples}
            />
          </details>

          {/* Test it — short label */}
          <details className="group rounded-xl border border-border/60 bg-card overflow-hidden">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm text-foreground/80 hover:bg-background-subtle transition-colors">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Test it</span>
            </summary>
            <TestPanel assembled={assembled} />
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

interface ChatBubbleProps {
  message: ChatMessage;
  onAnswer?: (messageId: string, questionId: string, value: AnswerValue) => void;
  onSkip?: () => void;
  thinking?: boolean;
}

function ChatBubble({ message, onAnswer, onSkip, thinking }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasQuestions = !!message.questions && message.questions.length > 0;
  const allAnswered =
    hasQuestions &&
    !!message.answers &&
    message.questions!.every((q) => message.answers![q.id]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`${hasQuestions ? "max-w-full w-full" : "max-w-[88%]"} rounded-2xl px-4 py-2.5 text-[14px] leading-[1.55] ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-background-subtle text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Yes/No clarification cards */}
        {hasQuestions && !allAnswered && (
          <div className="mt-3 space-y-2">
            {message.questions!.map((q) => {
              const ans = message.answers?.[q.id];
              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-border/60 bg-card p-3 flex items-center justify-between gap-3"
                >
                  <p className="text-[13.5px] text-foreground leading-snug flex-1">
                    {q.text}
                  </p>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!!ans || thinking}
                      onClick={() => onAnswer?.(message.id, q.id, "yes")}
                      className={`h-7 px-3 rounded-md text-[12px] font-medium transition-colors ${
                        ans === "yes"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background-subtle text-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      disabled={!!ans || thinking}
                      onClick={() => onAnswer?.(message.id, q.id, "no")}
                      className={`h-7 px-3 rounded-md text-[12px] font-medium transition-colors ${
                        ans === "no"
                          ? "bg-foreground text-background"
                          : "bg-background-subtle text-foreground hover:bg-foreground/10 disabled:opacity-50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={thinking}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline mt-1"
              >
                Skip — just generate it
              </button>
            )}
          </div>
        )}

        {/* Compact summary once all questions are answered */}
        {hasQuestions && allAnswered && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.questions!.map((q) => (
              <span
                key={q.id}
                className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <span className="font-medium text-foreground">
                  {message.answers![q.id] === "yes" ? "Yes" : "No"}
                </span>
                <span className="truncate max-w-[260px]">— {q.text}</span>
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// The current prompt rendered as a top-level document — no chat bubble, no
// "Here's your prompt" framing, just the artifact itself.
function ResultArtifact({
  result,
  examples,
}: {
  result: Result;
  examples: PromptExample[];
}) {
  const assembled = useMemo(() => assemble(result, examples), [result, examples]);
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <header className="px-6 md:px-7 py-5 border-b border-border/40">
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium mb-1.5">
          Your prompt
        </p>
        <h2 className="font-serif text-2xl md:text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-foreground">
          {result.title || "Untitled"}
        </h2>
      </header>
      <pre className="px-6 md:px-7 py-5 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-words text-foreground/90 max-h-[60vh] overflow-y-auto">
        {assembled}
      </pre>
    </div>
  );
}

// ─── Full-screen question view ────────────────────────────────────
// Compform-inspired full-page experience for the yes/no clarification
// stage. One question at a time, big serif headline, two stacked option
// boxes, Continue button, "1 of N" counter. Skip link at the bottom.

interface QuestionViewProps {
  message: ChatMessage;
  onAnswer: (messageId: string, questionId: string, value: AnswerValue) => void;
  onSubmit: (messageId: string) => void;
  onSkip: () => void;
  thinking: boolean;
}

function QuestionView({ message, onAnswer, onSubmit, onSkip, thinking }: QuestionViewProps) {
  const questions = message.questions ?? [];
  const total = questions.length;
  const [index, setIndex] = useState(0);

  // Defensive — don't crash if we somehow have no questions.
  if (total === 0) return null;

  const current = questions[Math.min(index, total - 1)];
  const answer = message.answers?.[current.id];
  const isLast = index >= total - 1;
  const canContinue = !!answer && !thinking;

  const onContinue = () => {
    if (!canContinue) return;
    if (isLast) {
      onSubmit(message.id);
    } else {
      setIndex((i) => Math.min(i + 1, total - 1));
    }
  };

  const onBack = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col px-4 md:px-6 max-w-[920px] mx-auto">
      {/* Top — small label and skip link */}
      <div className="flex items-start justify-between pt-2 pb-10">
        <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-medium tabular-nums">
          Builder · Question {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={onSkip}
          disabled={thinking}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Skip questions →
        </button>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center py-6">
        <h2 className="font-serif text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em] mb-10 max-w-[800px]">
          {current.text}
        </h2>

        <div className="space-y-3 max-w-[680px]">
          {(["yes", "no"] as const).map((value) => {
            const selected = answer === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onAnswer(message.id, current.id, value)}
                disabled={thinking}
                aria-pressed={selected}
                className={`w-full text-left px-6 py-5 rounded-xl border transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-foreground/40 hover:bg-background-subtle text-foreground"
                } disabled:opacity-50`}
              >
                <span className="text-[17px] font-medium">
                  {value === "yes" ? "Yes" : "No"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — hint, back, continue */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8 pb-4 border-t border-border/40">
        <p className="text-sm text-muted-foreground">
          {answer ? (isLast ? "Hit Continue to generate your prompt." : "Hit Continue for the next question.") : "Tap an option to continue."}
        </p>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={thinking}
              className="h-10 px-4 text-sm"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="h-10 px-6 gap-1.5"
          >
            {thinking && isLast ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {isLast ? (thinking ? "Generating…" : "Generate prompt") : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Manual editor (the disclosure) ───────────────────────────────
const BLOCKS: { key: keyof Omit<Result, "title">; label: string; rows: number }[] = [
  { key: "role", label: "Role", rows: 2 },
  { key: "context", label: "Context", rows: 4 },
  { key: "task", label: "Task", rows: 2 },
  { key: "constraints", label: "Constraints", rows: 4 },
  { key: "output_format", label: "Output format", rows: 2 },
];

function ManualEditor({
  result,
  setResult,
  examples,
  setExamples,
}: {
  result: Result;
  setResult: (r: Result) => void;
  examples: PromptExample[];
  setExamples: (e: PromptExample[]) => void;
}) {
  const update = <K extends keyof Result>(k: K, v: Result[K]) => {
    setResult({ ...result, [k]: v });
  };

  const updateExample = (i: number, field: keyof PromptExample, v: string) => {
    setExamples(examples.map((e, idx) => (idx === i ? { ...e, [field]: v } : e)));
  };
  const addExample = () => setExamples([...examples, { input: "", output: "" }]);
  const removeExample = (i: number) =>
    setExamples(examples.filter((_, idx) => idx !== i));

  return (
    <div className="px-4 pb-5 pt-2 space-y-5 border-t border-border/60">
      <div className="space-y-1.5">
        <Label htmlFor="manual-title" className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-medium">
          Title
        </Label>
        <Input
          id="manual-title"
          value={result.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Give it a short title"
          className="text-[14px]"
        />
      </div>
      {BLOCKS.map((b) => (
        <div key={b.key} className="space-y-1.5">
          <Label htmlFor={`manual-${b.key}`} className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-medium">
            {b.label}
          </Label>
          <Textarea
            id={`manual-${b.key}`}
            rows={b.rows}
            value={result[b.key] as string}
            onChange={(e) => update(b.key, e.target.value)}
            className="font-mono text-[13px] leading-[1.65]"
          />
        </div>
      ))}

      {/* Few-shot examples — input/output pairs that bake into the prompt */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-medium">
              Few-shot examples
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Show the model what good looks like. One or two examples
              dramatically lifts output quality.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExample}
            className="h-8 gap-1.5 text-xs shrink-0"
          >
            <Plus className="h-3 w-3" />
            Add example
          </Button>
        </div>

        {examples.length === 0 ? (
          <p className="text-xs italic text-muted-foreground/80 py-2">
            No examples yet. Click <span className="font-medium">Add example</span>{" "}
            to attach an input → output pair.
          </p>
        ) : (
          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-background-subtle p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground/80 font-medium tabular-nums">
                    Example {i + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExample(i)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove example"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                    Input
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Sample input the model would see…"
                    value={ex.input}
                    onChange={(e) => updateExample(i, "input", e.target.value)}
                    className="font-mono text-[12px] leading-[1.6] bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                    Output
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="What you'd want it to produce in response…"
                    value={ex.output}
                    onChange={(e) => updateExample(i, "output", e.target.value)}
                    className="font-mono text-[12px] leading-[1.6] bg-card"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
        <Wand2 className="h-3 w-3" />
        Or just ask the assistant above to make the change for you.
      </p>
    </div>
  );
}

// ─── Test panel ──────────────────────────────────────────────────
function TestPanel({ assembled }: { assembled: string }) {
  // Detect {{variable_name}} placeholders in the assembled prompt, in
  // first-seen order, deduped. Re-runs whenever the assembled body changes.
  const detectedVariables = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of assembled.matchAll(/\{\{(\w+)\}\}/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        out.push(m[1]);
      }
    }
    return out;
  }, [assembled]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [filledPrompt, setFilledPrompt] = useState<string | null>(null);
  const [outputCopied, setOutputCopied] = useState(false);

  // Keep the values map in sync with detected variables — add new keys,
  // drop keys that disappeared, preserve the user's existing values.
  useEffect(() => {
    setValues((prev) => {
      const next: Record<string, string> = {};
      for (const v of detectedVariables) {
        next[v] = prev[v] ?? "";
      }
      return next;
    });
  }, [detectedVariables]);

  const run = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const res = await fetch("/api/build/test-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: assembled, variables: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Test run failed");
      setOutput(data.output as string);
      setFilledPrompt(data.prompt as string);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setRunning(false);
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setOutputCopied(true);
      setTimeout(() => setOutputCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  return (
    <div className="px-4 pb-5 pt-2 space-y-4 border-t border-border/60">
      {detectedVariables.length === 0 ? (
        <p className="text-xs italic text-muted-foreground/80 py-2">
          This prompt has no <code className="font-mono px-1 rounded bg-muted">{`{{variables}}`}</code>{" "}
          yet. Add some to your blocks to make this prompt reusable, or run it
          as-is.
        </p>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-medium">
            Variables
          </p>
          {detectedVariables.map((v) => (
            <div key={v} className="space-y-1">
              <Label className="text-[11px] font-mono text-muted-foreground">
                {`{{${v}}}`}
              </Label>
              <Textarea
                rows={2}
                value={values[v] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [v]: e.target.value }))
                }
                placeholder={`What should '${v}' be on this run?`}
                className="text-[13px] leading-relaxed"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={run}
          disabled={running || !assembled}
          className="h-9 gap-1.5"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "Running…" : "Run prompt"}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Sends the filled-in prompt to gpt-4o-mini.
        </p>
      </div>

      {/* Filled prompt preview — what actually got sent */}
      {filledPrompt && !running && (
        <details className="rounded-lg border border-border/60 bg-background-subtle">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
            Show what we sent
          </summary>
          <pre className="px-3 pb-3 font-mono text-[11px] leading-[1.55] whitespace-pre-wrap break-words text-foreground/80 max-h-[220px] overflow-y-auto">
            {filledPrompt}
          </pre>
        </details>
      )}

      {/* Model output */}
      {output && (
        <div className="rounded-lg border border-primary/30 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background-subtle">
            <span className="text-[11px] tracking-[0.16em] uppercase text-primary font-medium">
              Model output
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyOutput}
              className="h-7 gap-1.5 text-xs"
            >
              {outputCopied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy
            </Button>
          </div>
          <pre className="px-3 py-3 font-sans text-[13px] leading-[1.65] whitespace-pre-wrap break-words text-foreground max-h-[420px] overflow-y-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

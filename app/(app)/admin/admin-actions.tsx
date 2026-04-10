"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AdminActionsProps {
  type: "prompt" | "report" | "tool";
  id: string;
  authorId?: string;
  promptId?: string;
}

export function AdminActions({ type, id, authorId, promptId }: AdminActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const approvePrompt = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("prompts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        toast.error("Failed to approve prompt.");
        return;
      }

      // Increment author's contribution count
      if (authorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contribution_count")
          .eq("id", authorId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              contribution_count: (profile.contribution_count ?? 0) + 1,
            })
            .eq("id", authorId);
        }
      }

      toast.success("Prompt approved and published.");
      router.refresh();
    });
  };

  const rejectPrompt = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("prompts")
        .update({ status: "removed" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to reject prompt.");
        return;
      }
      toast.success("Prompt removed.");
      router.refresh();
    });
  };

  const flagPrompt = () => {
    if (!promptId) return;
    startTransition(async () => {
      const { error } = await supabase
        .from("prompts")
        .update({ status: "flagged" })
        .eq("id", promptId);

      if (error) {
        toast.error("Failed to flag prompt.");
        return;
      }

      // Resolve report
      await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", id);

      toast.success("Prompt flagged and report resolved.");
      router.refresh();
    });
  };

  const resolveReport = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to resolve report.");
        return;
      }
      toast.success("Report resolved (no action taken).");
      router.refresh();
    });
  };

  const approveTool = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("tools")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to approve tool.");
        return;
      }
      toast.success("Tool approved.");
      router.refresh();
    });
  };

  const rejectTool = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("tools")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to reject tool.");
        return;
      }
      toast.success("Tool rejected.");
      router.refresh();
    });
  };

  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (type === "prompt") {
    return (
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          onClick={approvePrompt}
          className="bg-emerald-600 hover:bg-emerald-700 h-8"
          aria-label="Approve prompt"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={rejectPrompt}
          className="h-8"
          aria-label="Reject prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (type === "report") {
    return (
      <div className="flex gap-1 shrink-0">
        {promptId && (
          <Button
            size="sm"
            variant="destructive"
            onClick={flagPrompt}
            className="h-8 text-xs"
            aria-label="Flag prompt"
          >
            <Flag className="h-3.5 w-3.5 mr-1" />
            Flag
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={resolveReport}
          className="h-8 text-xs"
          aria-label="Dismiss report"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (type === "tool") {
    return (
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          onClick={approveTool}
          className="bg-emerald-600 hover:bg-emerald-700 h-8"
          aria-label="Approve tool"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={rejectTool}
          className="h-8"
          aria-label="Reject tool"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return null;
}

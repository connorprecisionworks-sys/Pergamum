"use client";

import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SkillReportButtonProps {
  skillId: string;
  currentUserId: string | null;
}

export function SkillReportButton({ skillId, currentUserId }: SkillReportButtonProps) {
  const handleReport = async () => {
    if (!currentUserId) {
      toast.error("Sign in to report this skill.");
      return;
    }
    const reason = window.prompt(
      "Why are you reporting this skill? (spam, malicious install command, etc.)"
    );
    if (!reason?.trim()) return;

    const supabase = createClient();
    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      skill_id: skillId,
      reason: reason.trim(),
    });

    if (error) {
      toast.error("Couldn't submit your report. Try again.");
    } else {
      toast.success("Report submitted — thanks for keeping the directory tidy.");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReport}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Report this skill"
    >
      <Flag className="h-4 w-4 mr-1.5" />
      Report
    </Button>
  );
}

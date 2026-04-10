"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CopyButtonProps {
  text: string;
  promptId: string;
  className?: string;
}

export function CopyButton({ text, promptId, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");

      // Increment view count (fire-and-forget)
      fetch("/api/prompts/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      }).catch(() => {
        // Non-critical: ignore errors
      });

      // Reset after 2s
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please select and copy manually.");
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={copied ? "secondary" : "default"}
      className={`${copied ? "" : "bg-violet-600 hover:bg-violet-700"} ${className ?? ""}`}
      aria-label={copied ? "Copied!" : "Copy prompt to clipboard"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy prompt
        </>
      )}
    </Button>
  );
}

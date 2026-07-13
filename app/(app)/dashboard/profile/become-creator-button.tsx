"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { becomeCreator } from "./actions";

export function BecomeCreatorButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activate = () => {
    setError(null);
    startTransition(async () => {
      const result = await becomeCreator();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/creator/onboarding");
    });
  };

  return (
    <div>
      <Button variant="outline" onClick={activate} disabled={isPending} className="gap-1.5">
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Turn on creator tools
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

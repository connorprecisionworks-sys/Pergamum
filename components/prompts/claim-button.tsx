"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/auth-form";

interface ClaimButtonProps {
  /** Relative path back to this prompt, so auth returns here with nothing lost. */
  returnTo: string;
}

export function ClaimButton({ returnTo }: ClaimButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
        Save to your library
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this and we&apos;ll remember what you typed.</DialogTitle>
            <DialogDescription>
              Create an account — or continue with Google.
            </DialogDescription>
          </DialogHeader>
          <AuthForm mode="signup" returnTo={returnTo} />
        </DialogContent>
      </Dialog>
    </>
  );
}

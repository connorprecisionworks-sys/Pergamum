import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PromptNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center py-16">
      <p className="text-5xl font-bold text-brand-300">404</p>
      <h1 className="text-2xl font-semibold">Prompt not found</h1>
      <p className="text-muted-foreground max-w-sm">
        We couldn&apos;t find that prompt. It may have been unpublished, or the
        link is mistyped.
      </p>
      <Button asChild>
        <Link href="/prompts">Browse prompts</Link>
      </Button>
    </div>
  );
}

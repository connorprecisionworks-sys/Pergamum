import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-8">
      <p className="text-5xl font-bold text-pergamum-300">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">
        This page doesn&apos;t exist, or it may have moved.
      </p>
      <Button asChild>
        <Link href="/prompts">Browse prompts</Link>
      </Button>
    </div>
  );
}

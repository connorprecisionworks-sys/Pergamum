import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center py-16">
      <p className="text-5xl font-bold text-pergamum-300">404</p>
      <h1 className="text-2xl font-semibold">User not found</h1>
      <p className="text-muted-foreground max-w-sm">
        That profile doesn&apos;t exist. The username may be wrong, or the
        account may have been removed.
      </p>
      <Button asChild>
        <Link href="/prompts">Browse prompts</Link>
      </Button>
    </div>
  );
}

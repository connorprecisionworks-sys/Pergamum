import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SkillNotFound() {
  return (
    <div className="container py-24 text-center max-w-md mx-auto space-y-4">
      <h1 className="font-serif text-3xl font-medium">Skill not found</h1>
      <p className="text-muted-foreground">
        This skill may have been removed, renamed, or never existed. Try
        browsing the directory instead.
      </p>
      <Button asChild>
        <Link href="/skills">Browse skills</Link>
      </Button>
    </div>
  );
}

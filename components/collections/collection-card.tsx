import Link from "next/link";
import { Bookmark, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Collection, Profile } from "@/lib/types/database";

const COLOR_MAP: Record<string, string> = {
  pergamum: "from-pergamum-100 to-pergamum-50 dark:from-pergamum-900/30 dark:to-pergamum-950/20",
  amber:    "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20",
  zinc:     "from-zinc-100 to-zinc-50 dark:from-zinc-800/30 dark:to-zinc-900/20",
  emerald:  "from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-950/20",
  blue:     "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/20",
  rose:     "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-950/20",
};

interface CollectionCardProps {
  collection: Collection & { prompt_count?: number };
  owner: Pick<Profile, "username" | "display_name">;
  showOwner?: boolean;
}

export function CollectionCard({ collection, owner, showOwner = false }: CollectionCardProps) {
  const gradient = COLOR_MAP[collection.cover_color] ?? COLOR_MAP.zinc;
  const href = `/collections/${owner.username}/${collection.slug}`;

  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group-hover:border-pergamum-300 dark:group-hover:border-pergamum-700">
        {/* Color band */}
        <div className={`h-1.5 bg-gradient-to-r ${gradient.split(" ").slice(0, 2).join(" ")}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
              <Bookmark className="h-4 w-4 text-pergamum-600 dark:text-pergamum-400" />
            </div>
            {!collection.is_public && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-pergamum-600 transition-colors line-clamp-1">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            {collection.prompt_count !== undefined && (
              <span>{collection.prompt_count} prompt{collection.prompt_count !== 1 ? "s" : ""}</span>
            )}
            {showOwner && (
              <span className="truncate">by {owner.display_name ?? owner.username}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

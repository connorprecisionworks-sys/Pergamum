import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/types/database";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card className="hover:border-pergamum-200 dark:hover:border-pergamum-800 hover:shadow-sm transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Logo placeholder */}
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pergamum-100 to-pergamum-200 dark:from-pergamum-900/40 dark:to-pergamum-800/40 flex items-center justify-center text-lg font-bold text-pergamum-700 dark:text-pergamum-300 shrink-0">
            {tool.name.slice(0, 1).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm group-hover:text-pergamum-700 dark:group-hover:text-pergamum-400 transition-colors">
                {tool.name}
              </h3>
              {tool.is_free && (
                <Badge
                  variant="outline"
                  className="text-xs shrink-0 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800"
                >
                  Free
                </Badge>
              )}
            </div>

            {tool.category && (
              <p className="text-xs text-pergamum-600 dark:text-pergamum-400 mt-0.5">
                {tool.category}
              </p>
            )}

            {tool.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            )}

            {tool.pricing_note && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {tool.pricing_note}
              </p>
            )}

            <Link
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-pergamum-600 hover:text-pergamum-700 mt-3 transition-colors"
            >
              Visit site
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

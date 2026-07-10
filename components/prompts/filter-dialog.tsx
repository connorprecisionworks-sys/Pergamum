"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterSidebar } from "./filter-sidebar";
import type { Category } from "@/lib/types/database";

interface FilterDialogProps {
  categories: Category[];
}

export function FilterDialog({ categories }: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount = [
    searchParams.get("category"),
    searchParams.get("model"),
    searchParams.get("sort") && searchParams.get("sort") !== "trending"
      ? searchParams.get("sort")
      : null,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-h-[44px]">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] text-white font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[65vh] py-2">
          <FilterSidebar categories={categories} />
        </div>
        <Button onClick={() => setOpen(false)} className="w-full mt-2">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

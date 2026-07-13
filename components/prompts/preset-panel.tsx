"use client";

import { useState } from "react";
import { Bookmark, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";
import { relativeTime } from "@/lib/utils";
import type { PromptPreset, PromptRun } from "@/lib/types/database";

interface PresetPanelProps {
  promptId: string;
  currentUserId: string;
  values: Record<string, string>;
  onLoadValues: (values: Record<string, string>) => void;
}

function asValues(json: PromptPreset["values"]): Record<string, string> {
  return (json as unknown as Record<string, string>) ?? {};
}

export function PresetPanel({ promptId, currentUserId, values, onLoadValues }: PresetPanelProps) {
  const [presets, setPresets] = useState<PromptPreset[] | null>(null);
  const [runs, setRuns] = useState<PromptRun[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  const load = async () => {
    if (presets !== null) return; // already loaded this open-session
    const [{ data: presetRows }, { data: runRows }] = await Promise.all([
      supabase
        .from("prompt_presets")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("prompt_id", promptId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("prompt_runs")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    setPresets(presetRows ?? []);
    setRuns(runRows ?? []);
  };

  const handleSave = async () => {
    const name = window.prompt("Name this preset:");
    if (!name?.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("prompt_presets")
      .insert({ user_id: currentUserId, prompt_id: promptId, name: name.trim(), values })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "You already have a preset with that name."
          : "Couldn't save the preset."
      );
      return;
    }
    setPresets((prev) => [data, ...(prev ?? [])]);
    toast.success("Preset saved.");
    void recordLeadEvent(supabase, "preset_saved", promptId, null, {});
  };

  const handleRename = async (preset: PromptPreset) => {
    const name = window.prompt("Rename preset:", preset.name);
    if (!name?.trim() || name.trim() === preset.name) return;
    setBusyId(preset.id);
    const { error } = await supabase
      .from("prompt_presets")
      .update({ name: name.trim() })
      .eq("id", preset.id);
    setBusyId(null);
    if (error) {
      toast.error("Couldn't rename the preset.");
      return;
    }
    setPresets((prev) => prev?.map((p) => (p.id === preset.id ? { ...p, name: name.trim() } : p)) ?? null);
  };

  const handleDelete = async (preset: PromptPreset) => {
    if (!window.confirm(`Delete "${preset.name}"?`)) return;
    setBusyId(preset.id);
    const { error } = await supabase.from("prompt_presets").delete().eq("id", preset.id);
    setBusyId(null);
    if (error) {
      toast.error("Couldn't delete the preset.");
      return;
    }
    setPresets((prev) => prev?.filter((p) => p.id !== preset.id) ?? null);
    toast.success("Preset deleted.");
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) load(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-3.5 w-3.5 mr-1.5" />
          Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-2" />
          )}
          Save current as preset
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Saved presets</DropdownMenuLabel>
        {presets === null ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : presets.length === 0 ? (
          <div className="py-2 px-2 text-xs text-muted-foreground">No saved presets yet.</div>
        ) : (
          presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onLoadValues(asValues(preset.values))}
              disabled={busyId === preset.id}
              className="justify-between gap-2 pr-1"
            >
              <span className="truncate flex-1">{preset.name}</span>
              <span className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  aria-label="Rename preset"
                  onClick={(e) => { e.stopPropagation(); handleRename(preset); }}
                  className="p-1 rounded hover:bg-muted-foreground/10"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Delete preset"
                  onClick={(e) => { e.stopPropagation(); handleDelete(preset); }}
                  className="p-1 rounded hover:bg-muted-foreground/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Recent</DropdownMenuLabel>
        {runs === null ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : runs.length === 0 ? (
          <div className="py-2 px-2 text-xs text-muted-foreground">No runs yet.</div>
        ) : (
          runs.map((run) => (
            <DropdownMenuItem key={run.id} onClick={() => onLoadValues(asValues(run.values))}>
              {relativeTime(run.created_at)}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

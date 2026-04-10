"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { substituteVariables } from "@/lib/utils";
import type { PromptVariable } from "@/lib/types/database";

interface VariableFormProps {
  variables: PromptVariable[];
  body: string;
  onSubstitutedChange: (substituted: string) => void;
}

export function VariableForm({
  variables,
  body,
  onSubstitutedChange,
}: VariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, v.default ?? ""]))
  );

  useEffect(() => {
    onSubstitutedChange(substituteVariables(body, values));
  }, [body, values, onSubstitutedChange]);

  if (variables.length === 0) return null;

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Variables
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {variables.map((variable) => (
          <div key={variable.name} className="space-y-1.5">
            <Label
              htmlFor={`var-${variable.name}`}
              className="text-sm"
            >
              {variable.name}
              {variable.description && (
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  — {variable.description}
                </span>
              )}
            </Label>
            {variable.type === "select" && variable.options ? (
              <select
                id={`var-${variable.name}`}
                value={values[variable.name] ?? ""}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={variable.name}
              >
                {variable.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`var-${variable.name}`}
                value={values[variable.name] ?? ""}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                placeholder={variable.default ?? `Enter ${variable.name}…`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

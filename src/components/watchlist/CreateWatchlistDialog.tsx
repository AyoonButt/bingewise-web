"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { WATCHLIST_PALETTE } from "./palette";

interface CreateWatchlistDialogProps {
  open: boolean;
  isCreating: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (
    name: string,
    description: string | null,
    coverColor: string | null
  ) => Promise<void> | void;
}

export function CreateWatchlistDialog({
  open,
  isCreating,
  error,
  onClose,
  onCreate,
}: CreateWatchlistDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(WATCHLIST_PALETTE[0]);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setColor(WATCHLIST_PALETTE[0]);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCreating) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isCreating]);

  if (!open) return null;

  const canCreate = name.trim().length > 0 && !isCreating;

  const handleCreate = async () => {
    if (!canCreate) return;
    await onCreate(name.trim(), description.trim() || null, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={isCreating ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">New Watchlist</h3>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="watchlist-name">
            Name
          </label>
          <input
            id="watchlist-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Watch"
            className="input-base"
            maxLength={60}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="watchlist-description">
            Description{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="watchlist-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this list about?"
            className="input-base min-h-[70px] resize-none"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Accent color</span>
          <div className="flex flex-wrap gap-2">
            {WATCHLIST_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use color ${c}`}
                className="h-8 w-8 rounded-full transition-transform hover:scale-105"
                style={{
                  backgroundColor: c,
                  transform: color === c ? "scale(1.15)" : undefined,
                  boxShadow: color === c ? `0 0 0 3px ${c}66` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="btn-outline flex-1 h-10"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="btn-primary flex-1 h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

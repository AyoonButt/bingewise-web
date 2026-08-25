"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { WATCHLIST_PALETTE, parseCoverColor } from "./palette";

interface EditWatchlistDialogProps {
  open: boolean;
  name: string;
  coverColor: string | null;
  isSaving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (patch: { name?: string; coverColor?: string | null }) => void;
}

/** Edit a watchlist's title and accent color. */
export function EditWatchlistDialog({
  open,
  name: initialName,
  coverColor,
  isSaving,
  error,
  onClose,
  onSave,
}: EditWatchlistDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(parseCoverColor(coverColor));

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(parseCoverColor(coverColor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, isSaving]);

  if (!open) return null;

  const dirty = name.trim() !== initialName || color !== parseCoverColor(coverColor);
  const canSave = name.trim().length > 0 && dirty && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    const patch: { name?: string; coverColor?: string | null } = {};
    if (name.trim() !== initialName) patch.name = name.trim();
    if (color !== parseCoverColor(coverColor)) patch.coverColor = color;
    onSave(patch);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={isSaving ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Edit Watchlist</h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="edit-watchlist-name">
            Name
          </label>
          <input
            id="edit-watchlist-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
            maxLength={60}
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
          <button onClick={onClose} disabled={isSaving} className="btn-outline flex-1 h-10">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary flex-1 h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

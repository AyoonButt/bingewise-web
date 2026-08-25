"use client";

import { apiClient } from "@/lib/api-client";

interface PrivacyToggleProps {
  userId: number;
  isPrivate: boolean;
  onToggle: (isPrivate: boolean) => void;
}

export function PrivacyToggle({ userId, isPrivate, onToggle }: PrivacyToggleProps) {
  const handleToggle = async () => {
    const newValue = !isPrivate;
    await apiClient(`/api/users/${userId}/update-privacy`, {
      method: "PUT",
      body: JSON.stringify({ isPrivate: newValue }),
    });
    onToggle(newValue);
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isPrivate ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isPrivate ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

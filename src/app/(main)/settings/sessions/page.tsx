"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, Loader2, Monitor, Smartphone, Trash2 } from "lucide-react";
import type { SessionDto } from "@/types/user";

export default function SessionsPage() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    apiClient<SessionDto[]>(`/api/notifications/user/${user.userId}/tokens`)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const handleRevoke = async (tokenId: number) => {
    if (!user) return;
    setRevoking(tokenId);
    try {
      await apiClient(
        `/api/notifications/user/${user.userId}/tokens/${tokenId}`,
        { method: "DELETE" }
      );
      setSessions((prev) => prev.filter((s) => s.id !== tokenId));
    } catch {
      // error
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg skeleton" />
          <div className="h-6 skeleton w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-4 skeleton w-1/3" />
              <div className="h-3 skeleton w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Active Sessions</h2>
      </div>

      {sessions.length > 1 && (
        <button
          onClick={async () => {
            if (!user || sessions.length === 0) return;
            try {
              await apiClient(
                `/api/notifications/user/${user.userId}/tokens/others?currentTokenId=${sessions[0].id}`,
                { method: "DELETE" }
              );
              setSessions((prev) => prev.slice(0, 1));
            } catch {
              // error
            }
          }}
          className="btn-outline w-full h-10 border-destructive/30 text-destructive hover:bg-destructive/5 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Revoke All Other Sessions
        </button>
      )}

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
              <Monitor className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No active sessions</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {session.deviceInfo?.toLowerCase().includes("mobile") ? (
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.deviceInfo || "Unknown device"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.lastUpdated
                    ? `Last active: ${new Date(session.lastUpdated).toLocaleDateString()}`
                    : "Unknown"}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(session.id)}
                disabled={revoking === session.id}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors shrink-0"
              >
                {revoking === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

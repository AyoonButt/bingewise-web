"use client";

import { formatDate } from "@/lib/utils";
import { userAvatarUrl } from "@/lib/avatar";
import type { CommentDto } from "@/types/comment";

interface CommentItemProps {
  comment: CommentDto;
  replyCount?: number;
  onDelete: (commentId: number) => void;
}

export function CommentItem({ comment, replyCount = 0, onDelete }: CommentItemProps) {
  return (
    <div className="space-y-2 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <img
          src={userAvatarUrl(comment.userId, 64)}
          alt={comment.username}
          className="h-8 w-8 rounded-full"
        />
        <div>
          <p className="text-sm font-medium">{comment.username}</p>
          <p className="text-xs text-muted-foreground">
            {comment.timestamp ? formatDate(new Date(comment.timestamp).toISOString()) : ""}
          </p>
        </div>
      </div>
      <p className="text-sm pl-10">{comment.content}</p>
      <div className="flex items-center gap-4 pl-10">
        {replyCount > 0 && (
          <button className="text-xs text-primary hover:underline font-medium">
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

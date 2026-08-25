"use client";

import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import type { CommentDto } from "@/types/comment";

interface CommentThreadProps {
  comments: CommentDto[];
  isLoading: boolean;
  onAddComment: (content: string) => Promise<unknown>;
  onDeleteComment: (commentId: number) => void;
}

export function CommentThread({
  comments,
  isLoading,
  onAddComment,
  onDeleteComment,
}: CommentThreadProps) {
  return (
    <div className="space-y-4">
      <CommentInput onSubmit={onAddComment} />
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.commentId}
            comment={comment}
            onDelete={onDeleteComment}
          />
        ))
      )}
    </div>
  );
}

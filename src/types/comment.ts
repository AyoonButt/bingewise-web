export interface CommentDto {
  commentId: number | null;
  userId: number;
  username: string;
  postId: number;
  content: string;
  timestamp: number | null;
  parentCommentId: number | null;
  commentType: string;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  commentId: number;
}

export interface ReplyCountDto {
  parentId: number;
  replyCount: number;
}

export type CommentEventType =
  | "NEW_ROOT_COMMENT"
  | "NEW_REPLY"
  | "REPLY_COUNT_UPDATE"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED"
  | "ERROR";

export interface CommentEvent {
  type: CommentEventType;
  commentId?: number;
  postId?: number;
  replyCount?: number;
  content?: string;
}

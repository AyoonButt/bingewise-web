export interface UserPostInteractionDto {
  interactionId: number | null;
  userId: number;
  postId: number;
  startTimestamp: number;
  endTimestamp: number;
  likeState: boolean;
  saveState: boolean;
  commentButtonPressed: boolean;
}

export interface InteractionStates {
  liked: boolean;
  saved: boolean;
}

export interface TrailerInteractionDto {
  interactionId: number | null;
  userId: number;
  postId: number;
  startTimestamp: number;
  endTimestamp: number;
  replayCount: number;
  isMuted: boolean;
  likeState: boolean;
  saveState: boolean;
  commentButtonPressed: boolean;
}

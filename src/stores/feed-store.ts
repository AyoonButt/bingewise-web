import { create } from "zustand";
import type { PostDto } from "@/types/post";

interface FeedState {
  posts: PostDto[];
  setPosts: (posts: PostDto[]) => void;
  addPosts: (posts: PostDto[]) => void;
  updatePost: (postId: number, updates: Partial<PostDto>) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPosts: (newPosts) =>
    set((state) => ({ posts: [...state.posts, ...newPosts] })),
  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.postId === postId ? { ...p, ...updates } : p
      ),
    })),
  clearFeed: () => set({ posts: [] }),
}));

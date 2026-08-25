import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { CommentEvent } from "@/types/comment";

type MessageHandler = (event: CommentEvent) => void;

let client: Client | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 2000;

export function connectComments(
  token: string,
  onMessage: MessageHandler
): () => void {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081/comments/websocket/websocket";

  client = new Client({
    webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      reconnectAttempts = 0;
      client?.subscribe("/topic/comments", (message: IMessage) => {
        try {
          const event: CommentEvent = JSON.parse(message.body);
          onMessage(event);
        } catch {
          // ignore malformed messages
        }
      });
    },
    onStompError: () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts - 1);
        setTimeout(() => connectComments(token, onMessage), delay);
      }
    },
  });

  client.activate();

  return () => {
    client?.deactivate();
    client = null;
  };
}

export function subscribeToPost(postId: number): void {
  client?.publish({
    destination: "/app/comments.subscribe",
    body: JSON.stringify({ expandedSections: [postId] }),
  });
}

export function unsubscribeFromPost(postId: number): void {
  client?.publish({
    destination: "/app/comments.unsubscribe",
    body: JSON.stringify({ expandedSections: [postId] }),
  });
}

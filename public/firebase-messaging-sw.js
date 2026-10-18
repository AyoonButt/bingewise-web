// Firebase Cloud Messaging service worker.
// Keep the config below in sync with NEXT_PUBLIC_FIREBASE_* in .env.local.
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCeiOB1O5A1p6Hzv7f9kigDhIPy8i2XEwc",
  authDomain: "bingewise-38080.firebaseapp.com",
  projectId: "bingewise-38080",
  storageBucket: "bingewise-38080.firebasestorage.app",
  messagingSenderId: "1004857501128",
  appId: "1:1004857501128:web:f85a4f2aefd4b05d5e4cfd",
});

const messaging = firebase.messaging();

function notifyClients(message) {
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const type = data.type;

  if (type === "force_logout" || type === "session_expired") {
    notifyClients({ type: "FORCE_LOGOUT", reason: data.reason });
    return;
  }

  const title = data.title || "BingeWise";
  const body = data.message || "";
  const referenceId = parseInt(data.referenceId || "0", 10) || 0;
  const senderName = data.senderName || "";
  const posterUrl = data.posterUrl || data.imageUrl || "";

  const notificationOptions = {
    body,
    icon: posterUrl || "/images/bingewise.png",
    badge: "/images/bingewise.png",
    tag: `${type}_${referenceId}`,
    renotify: true,
    data: {
      type,
      referenceId,
      contentId: parseInt(data.contentId || "0", 10) || 0,
      senderName,
      senderUserId: parseInt(data.senderUserId || "0", 10) || 0,
      mediaType: data.mediaType || "",
    },
  };

  self.registration.showNotification(title, notificationOptions);
});

const postTypes = [
  "REPLY",
  "SHARE",
  "UPCOMING_RELEASE",
  "SEQUEL_RELEASE",
  "NEW_COLLECTION_MOVIE",
  "NEW_SEASON",
  "SHOW_STATUS_CHANGE",
  "NEW_FRANCHISE_SHOW",
  "STREAMING_AVAILABLE",
  "comment",
  "share",
  "new_release",
];

// Content notifications open poster detail (media) via the TMDB id carried in
// contentId; when only the post id (referenceId) is known, fetch the post and
// use its tmdbId/type — the same resolution the post card performs — falling
// back to the post page only if that lookup fails.
async function notificationUrl(notificationData) {
  const { type, referenceId, contentId, senderName, mediaType } = notificationData || {};
  if (postTypes.includes(type)) {
    if (contentId && contentId > 0) {
      const typeParam = mediaType === "movie" ? "movie" : "tv";
      return `/post/${contentId}?type=${typeParam}`;
    }
    if (referenceId) {
      try {
        const res = await fetch(`/api/backend/api/posts/${referenceId}/en-US`);
        if (res.ok) {
          const post = await res.json();
          if (post.tmdbId && post.tmdbId > 0) {
            const typeParam = (post.type || mediaType) === "movie" ? "movie" : "tv";
            return `/post/${post.tmdbId}?type=${typeParam}`;
          }
        }
      } catch {
        // fall through to the post page
      }
      return `/activity/item/${referenceId}`;
    }
  }
  if (senderName && (type === "MESSAGE" || type === "FOLLOW_REQUEST" || type === "FOLLOW_REQUEST_ACCEPTED" || type === "NEW_FOLLOWER" || type === "follow")) {
    return `/user/${senderName}`;
  }
  return "/feed";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    notificationUrl(event.notification.data)
      .then((url) =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
          for (const client of clients) {
            if ("focus" in client && "url" in client) {
              const clientUrl = new URL(client.url);
              if (clientUrl.pathname + clientUrl.search === url) {
                return client.focus();
              }
            }
          }
          return self.clients.openWindow(url);
        })
      )
      .catch(() => self.clients.openWindow("/feed"))
  );
});
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
    },
  };

  self.registration.showNotification(title, notificationOptions);
});

function notificationUrl(notificationData) {
  const { type, referenceId, senderName } = notificationData || {};
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
  if (postTypes.includes(type) && referenceId) {
    return `/post/${referenceId}`;
  }
  if (senderName && (type === "MESSAGE" || type === "FOLLOW_REQUEST" || type === "FOLLOW_REQUEST_ACCEPTED" || type === "NEW_FOLLOWER" || type === "follow")) {
    return `/user/${senderName}`;
  }
  return "/feed";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = notificationUrl(event.notification.data);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && "url" in client && new URL(client.url).pathname === url) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
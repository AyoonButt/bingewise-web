/**
 * Singleton pool managing ONE reusable YouTube IFrame player.
 * Mirrors the Android VideoPlayerPool: ownership tokens, acquire/release
 * semantics, last-known-position tracking, and failed-video-key memory.
 *
 * The player lives in a persistent fixed-position host div that gets
 * visually positioned over the active card's target element. The iframe
 * is never re-parented (moving iframes in the DOM reloads them).
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type VideoErrorReason =
  | "INVALID_PARAMETER"
  | "HTML5_ERROR"
  | "NOT_FOUND"
  | "EMBED_DISABLED"
  | "UNKNOWN"
  | "API_LOAD_FAILED";

const failedVideoKeys = new Set<string>();
let failedKeysLoaded = false;

export function markVideoKeyFailed(key: string): void {
  failedVideoKeys.add(key);
}

export function isVideoKeyFailed(key: string): boolean {
  return failedVideoKeys.has(key);
}

/**
 * Load known-failed video keys from the backend so they persist across sessions.
 * Call once on app init (e.g., in TrailerFeed mount).
 * Uses raw fetch (not apiClient) so 401s never trigger a refresh loop.
 */
export async function loadFailedVideoKeys(): Promise<void> {
  if (failedKeysLoaded) return;
  failedKeysLoaded = true;
  try {
    const res = await fetch("/api/backend/api/video-keys/failed");
    if (!res.ok) return; // 401 for guests — silently skip
    const keys = await res.json();
    if (Array.isArray(keys)) {
      for (const k of keys) failedVideoKeys.add(k);
    }
  } catch {
    // best-effort — fall back to in-memory only
  }
}

/**
 * Report a failed video key to the backend for persistence.
 * Uses raw fetch (not apiClient) so 401s never trigger a refresh loop.
 */
export async function reportVideoKeyFailed(
  key: string,
  errorReason: string
): Promise<void> {
  markVideoKeyFailed(key);
  try {
    await fetch("/api/backend/api/video-keys/failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoKey: key, errorReason }),
    });
  } catch {
    // best-effort
  }
}

interface AcquireOptions {
  /** The feed's scroll container. The sticky overlay host is appended inside it. */
  containerEl: HTMLElement;
  targetEl: HTMLElement;
  videoKey: string;
  autoPlay: boolean;
  startMuted: boolean;
  startSeconds?: number;
  onEnded?: () => void;
  onError?: (reason: VideoErrorReason) => void;
  onPlayingChange?: (playing: boolean) => void;
}

class YoutubePlayerPool {
  private player: any = null;
  private host: HTMLDivElement | null = null;
  /** Inner container the iframe is created in, positioned over the active card. */
  private videoBox: HTMLDivElement | null = null;
  private containerEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private currentOwner: string | null = null;
  private currentVideoKey: string | null = null;
  /** Key of the video the player is actually playing. Null until PLAYING fires for the current key. */
  private playingVideoKey: string | null = null;
  private targetEl: HTMLElement | null = null;
  private callbacks: AcquireOptions | null = null;
  private muted = true;
  private apiPromise: Promise<void> | null = null;
  /** Resolves when the player's onReady fires; gate all API calls behind it. */
  private playerReadyPromise: Promise<void> | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private positions = new Map<string, number>();
  private lastHostW = 0;
  private lastHostH = 0;
  private scrollRaf: number | null = null;

  /** Load the YouTube IFrame API once. */
  private loadApi(): Promise<void> {
    if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
    if (window.YT?.Player) return Promise.resolve();
    if (this.apiPromise) return this.apiPromise;

    this.apiPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("YT API load timeout")),
        15000
      );
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        clearTimeout(timeout);
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("YT API script failed"));
      };
      document.head.appendChild(script);
    });
    return this.apiPromise;
  }

  /**
   * Create the sticky overlay host inside the feed's scroll container.
   * `position: sticky; top: 0` keeps it pinned to the container's visible
   * area while scrolling, so no scroll listener is needed. The iframe is
   * created once inside it and never re-parented (moving iframes reloads them).
   *
   * The pool is a singleton that outlives the feed component. If the feed's
   * scroll container was unmounted (client-side navigation away and back), the
   * old host is still referenced but DETACHED from the document — the iframe
   * would keep throwing "player is not attached to the DOM". In that case,
   * re-insert the same host (iframe untouched) into the new container.
   */
  private ensureHost(containerEl: HTMLElement): HTMLDivElement {
    if (this.host && this.host.isConnected) {
      // Same container as before — nothing to do.
      if (this.containerEl === containerEl) return this.host;
      // Different container but host is connected (shouldn't normally happen):
      // move it over rather than creating a second player.
      containerEl.insertBefore(this.host, containerEl.firstChild);
      this.containerEl = containerEl;
      return this.host;
    }
    if (!this.host) {
      const host = document.createElement("div");
      host.style.cssText =
        "position:sticky;top:0;left:0;width:100%;height:0;z-index:30;pointer-events:none;";
      const videoBox = document.createElement("div");
      videoBox.style.cssText =
        "position:absolute;overflow:hidden;visibility:hidden;";
      host.appendChild(videoBox);
      this.host = host;
      this.videoBox = videoBox;
    }
    // Must be the first child so its natural position is at the content top,
    // where sticky can pin it to the scrollport.
    containerEl.insertBefore(this.host!, containerEl.firstChild);
    this.containerEl = containerEl;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.reposition());
    this.resizeObserver.observe(containerEl);
    return this.host!;
  }

  /**
   * Create the player once. Resolves only when onReady fires — callers must
   * await this before issuing any API commands (loadVideoById, cueVideoById,
   * playVideo, etc.), otherwise the widget API throws
   * "player is not attached to the DOM". Importantly, `this.player` is assigned
   * here only inside onReady, so a not-yet-ready player is never exposed.
   */
  private createPlayer(videoId: string): Promise<void> {
    this.playerReadyPromise = new Promise<void>((resolve, reject) => {
      const videoBox = this.videoBox;
      if (!videoBox) {
        reject(new Error("videoBox missing"));
        return;
      }
      // YT.Player REPLACES the element it's constructed on with the iframe,
      // so it must be created in a throwaway mount inside the permanent box.
      const playerMount = document.createElement("div");
      playerMount.style.cssText = "width:640px;height:360px;";
      videoBox.appendChild(playerMount);
      const player = new window.YT.Player(playerMount, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.player = player;
            resolve();
          },
          onStateChange: (e: { data: number }) => this.onStateChange(e.data),
          onError: (e: { data: number }) => this.onPlayerError(e.data),
        },
      });
    });
    return this.playerReadyPromise;
  }

  private eventVideoId(): string | null {
    try {
      return this.player?.getVideoData?.().video_id ?? null;
    } catch {
      return null;
    }
  }

  private onStateChange(state: number): void {
    const cb = this.callbacks;
    if (!cb) return;
    if (state === PLAYER_STATES.PLAYING) {
      // A PLAYING event can belong to a previous video that briefly resumed
      // before loadVideoById swapped it out. Only trust it for the current key.
      const videoId = this.eventVideoId();
      if (videoId && videoId !== this.currentVideoKey) return;
      this.playingVideoKey = this.currentVideoKey;
      cb.onPlayingChange?.(true);
    } else if (state === PLAYER_STATES.PAUSED) {
      // Ignore PAUSED events fired by the replaced video while switching.
      if (this.playingVideoKey !== this.currentVideoKey) return;
      this.capturePosition();
      cb.onPlayingChange?.(false);
    } else if (state === PLAYER_STATES.ENDED) {
      // loadVideoById for a new video fires ENDED for the replaced one.
      // Only surface it when the video we were actually playing has ended.
      if (!this.playingVideoKey || this.playingVideoKey !== this.currentVideoKey) return;
      this.capturePositionAt(this.playingVideoKey, 0);
      this.playingVideoKey = null;
      cb.onEnded?.();
    }
  }

  private onPlayerError(code: number): void {
    const reason: VideoErrorReason =
      code === 2
        ? "INVALID_PARAMETER"
        : code === 5
        ? "HTML5_ERROR"
        : code === 100
        ? "NOT_FOUND"
        : code === 101 || code === 150
        ? "EMBED_DISABLED"
        : "UNKNOWN";
    const erroredKey = this.eventVideoId() ?? this.playingVideoKey ?? this.currentVideoKey;
    if (erroredKey) markVideoKeyFailed(erroredKey);
    // Only surface to the current owner when the error belongs to their video.
    if (erroredKey !== this.currentVideoKey) return;
    this.callbacks?.onError?.(reason);
  }

  private capturePosition(): void {
    const key = this.playingVideoKey ?? this.currentVideoKey;
    if (!this.player || !key) return;
    try {
      const t = this.player.getCurrentTime?.();
      if (typeof t === "number" && !Number.isNaN(t)) {
        // A position inside the last second is effectively "ended". Persisting
        // it would make the next acquire resume at the very end, play a few
        // frames, and instantly fire ENDED — the "skips straight past this
        // video" loop. Store 0 so it replays from the top instead.
        const d = this.player.getDuration?.();
        if (typeof d === "number" && d > 0 && t >= d - 1) {
          this.capturePositionAt(key, 0);
          return;
        }
        this.capturePositionAt(key, t);
      }
    } catch {
      // player not ready
    }
  }

  private capturePositionAt(key: string, seconds: number): void {
    if (this.positions.size > 200) this.positions.clear();
    this.positions.set(key, seconds);
  }

  private startTicking(): void {
    this.stopTicking();
    this.tickInterval = setInterval(() => this.capturePosition(), 1000);
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * All cards are uniform size and centered in the feed, so the video box
   * offset within the sticky host is constant. No scroll tracking needed.
   *
   * The iframe is "contain"-fit at its native 16:9 and centered inside the
   * card: trailers play uncropped on portrait phone screens (the poster acts
   * as ambient background above/below), while wide desktop cards get a near-
   * exact fit.
   */
  private reposition(): void {
    if (!this.host || !this.host.isConnected) return;
    if (!this.videoBox || !this.containerEl || !this.targetEl || !this.currentOwner) return;
    const rect = this.targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      this.videoBox.style.visibility = "hidden";
      return;
    }
    const hostRect = this.host.getBoundingClientRect();
    const style = this.videoBox.style;
    style.visibility = "visible";
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    // Overlay the card exactly (relative to the sticky host) so the video
    // tracks the card as it scrolls instead of staying pinned to center.
    style.left = `${rect.left - hostRect.left}px`;
    style.top = `${rect.top - hostRect.top}px`;
    const radius = getComputedStyle(this.targetEl).borderRadius;
    if (radius) style.borderRadius = radius;

    // Fit the iframe to the card based on breakpoint: desktop cards are wide,
    // so cover-fill them (like object-fit: cover); portrait phone screens get
    // a contain-fit native-16:9 stage with the poster as ambient backdrop.
    const VIDEO_ASPECT = 16 / 9;
    let w: number;
    let h: number;
    if (window.matchMedia("(min-width: 768px)").matches) {
      const cardAspect = rect.width / rect.height;
      if (cardAspect > VIDEO_ASPECT) {
        w = Math.round(rect.width);
        h = Math.round(w / VIDEO_ASPECT);
      } else {
        h = Math.round(rect.height);
        w = Math.round(h * VIDEO_ASPECT);
      }
    } else {
      w = Math.round(rect.width);
      h = Math.round(w / VIDEO_ASPECT);
      if (h > rect.height) {
        h = Math.round(rect.height);
        w = Math.round(h * VIDEO_ASPECT);
      }
    }
    const iframe = this.videoBox.querySelector("iframe");
    if (iframe) {
      const fStyle = iframe.style;
      fStyle.position = "absolute";
      fStyle.width = `${w}px`;
      fStyle.height = `${h}px`;
      fStyle.left = `${Math.round((rect.width - w) / 2)}px`;
      fStyle.top = `${Math.round((rect.height - h) / 2)}px`;
    }

    if (this.lastHostW !== rect.width || this.lastHostH !== rect.height) {
      this.lastHostW = rect.width;
      this.lastHostH = rect.height;
      try {
        this.player?.setSize?.(w, h);
      } catch {
        // ignore
      }
    }
  }

  private attachLayoutListeners(): void {
    // The sticky host tracks the container's scrollport on its own; only
    // container size changes matter, handled by the ResizeObserver.
    if (!this.resizeObserver && this.containerEl) {
      this.resizeObserver = new ResizeObserver(() => this.reposition());
      this.resizeObserver.observe(this.containerEl);
    }
    if (this.containerEl) {
      this.containerEl.addEventListener("scroll", this.onScroll, { passive: true });
    }
  }

  private onScroll = (): void => {
    if (this.scrollRaf != null) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = null;
      this.reposition();
    });
  };

  private detachLayoutListeners(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.containerEl) {
      this.containerEl.removeEventListener("scroll", this.onScroll);
    }
    if (this.scrollRaf != null) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
  }

  getLastKnownPosition(videoKey: string): number {
    return this.positions.get(videoKey) ?? 0;
  }

  async acquire(ownerKey: string, opts: AcquireOptions): Promise<void> {
    if (typeof window === "undefined") return;
    if (!opts.containerEl || !opts.containerEl.isConnected) {
      opts.onError?.("API_LOAD_FAILED");
      return;
    }

    // Take over: pause whatever the previous owner was playing.
    if (this.currentOwner && this.currentOwner !== ownerKey) {
      try {
        this.player?.pauseVideo?.();
      } catch {
        // ignore
      }
    }

    this.currentOwner = ownerKey;
    this.callbacks = opts;
    this.targetEl = opts.targetEl;
    this.currentVideoKey = opts.videoKey;
    this.muted = opts.startMuted;

    try {
      await this.loadApi();
    } catch {
      markVideoKeyFailed(opts.videoKey);
      opts.onError?.("API_LOAD_FAILED");
      return;
    }
    if (this.currentOwner !== ownerKey) return; // lost ownership while loading

    this.ensureHost(opts.containerEl);

    // Only one player is ever created; the first acquirer builds it. Any other
    // concurrent acquirer just awaits the same ready promise instead of racing
    // to construct a second (which corrupts the iframe). The promise resolves
    // in onReady, so by the time we return `this.player` is fully attached.
    if (!this.playerReadyPromise) {
      try {
        await this.createPlayer(opts.videoKey);
      } catch {
        markVideoKeyFailed(opts.videoKey);
        opts.onError?.("API_LOAD_FAILED");
        return;
      }
      if (this.currentOwner !== ownerKey) return;
    } else {
      try {
        await this.playerReadyPromise;
      } catch {
        markVideoKeyFailed(opts.videoKey);
        opts.onError?.("API_LOAD_FAILED");
        return;
      }
      if (this.currentOwner !== ownerKey) return;
      if (opts.videoKey !== this.currentVideoKey) {
        this.currentVideoKey = opts.videoKey;
      }
    }

    // Size the video box before the video starts loading so the player
    // is never asked to render while hidden or zero-sized.
    this.reposition();

    // After the await points above, React may have unmounted the scroll
    // container (e.g. during fast scrolling or navigation), detaching the
    // host from the document. Re-insert if possible; bail if the container
    // itself is gone.
    if (!this.host?.isConnected) {
      if (opts.containerEl.isConnected) {
        this.ensureHost(opts.containerEl);
      } else {
        return;
      }
    }

    const resumeAt = opts.startSeconds ?? this.getLastKnownPosition(opts.videoKey);
    try {
      if (opts.autoPlay) {
        this.player.loadVideoById({
          videoId: opts.videoKey,
          startSeconds: resumeAt,
        });
      } else {
        this.player.cueVideoById({
          videoId: opts.videoKey,
          startSeconds: resumeAt,
        });
      }
      if (this.muted) this.player.mute();
      else this.player.unMute();
    } catch {
      // Player iframe not attached to DOM — safe to ignore; the next
      // acquire will re-attach via ensureHost.
    }

    this.reposition();
    this.attachLayoutListeners();
    if (opts.autoPlay) this.startTicking();
  }

  release(ownerKey: string): void {
    if (this.currentOwner !== ownerKey) return;
    this.capturePosition();
    try {
      this.player?.pauseVideo?.();
    } catch {
      // ignore
    }
    this.stopTicking();
    this.detachLayoutListeners();
    this.currentOwner = null;
    this.currentVideoKey = null;
    this.playingVideoKey = null;
    this.callbacks = null;
    this.targetEl = null;
    if (this.videoBox) this.videoBox.style.visibility = "hidden";
  }

  play(ownerKey: string): void {
    if (this.currentOwner !== ownerKey) return;
    try {
      // Don't resume the previous owner's video while the new one loads.
      const videoId = this.player?.getVideoData?.().video_id;
      if (videoId && videoId !== this.currentVideoKey) return;
      this.player?.playVideo?.();
      this.startTicking();
    } catch {
      // ignore
    }
  }

  pause(ownerKey: string): void {
    if (this.currentOwner !== ownerKey) return;
    this.capturePosition();
    try {
      this.player?.pauseVideo?.();
    } catch {
      // ignore
    }
  }

  replay(ownerKey: string): void {
    if (this.currentOwner !== ownerKey) return;
    try {
      this.player?.seekTo?.(0, true);
      this.player?.playVideo?.();
      this.startTicking();
    } catch {
      // ignore
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      if (muted) this.player?.mute?.();
      else this.player?.unMute?.();
    } catch {
      // ignore
    }
  }

  updateLayout(ownerKey: string): void {
    if (this.currentOwner !== ownerKey) return;
    this.reposition();
  }

  destroy(): void {
    this.stopTicking();
    this.detachLayoutListeners();
    try {
      this.player?.destroy?.();
    } catch {
      // ignore
    }
    this.host?.remove();
    this.host = null;
    this.videoBox = null;
    this.containerEl = null;
    this.player = null;
    this.playerReadyPromise = null;
    this.currentOwner = null;
    this.currentVideoKey = null;
    this.playingVideoKey = null;
    this.callbacks = null;
    this.targetEl = null;
  }
}

export const youtubePlayerPool = new YoutubePlayerPool();

"use client";

import {
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuthApp } from "./firebase";

export type SocialProvider = "google" | "apple";

export interface SocialCredential {
  /** Raw provider identity token — verified by our backend, not Firebase. */
  idToken: string;
  /** Display-name hint; Apple only returns this on first authorization. */
  name?: string;
}

/**
 * Firebase Auth handles the browser popup for both providers. We hand the
 * provider's own ID token to the backend's native /api/auth/google or
 * /api/auth/apple flow, which verifies it and issues the app session.
 */
export async function getSocialIdToken(
  provider: SocialProvider
): Promise<SocialCredential> {
  const app = getFirebaseAuthApp();
  if (!app) {
    throw new Error("Social sign-in is not configured for this environment.");
  }

  const auth = getAuth(app);
  const authProvider =
    provider === "google"
      ? new GoogleAuthProvider()
      : new OAuthProvider("apple.com");

  const result = await signInWithPopup(auth, authProvider);
  const credential =
    provider === "google"
      ? GoogleAuthProvider.credentialFromResult(result)
      : OAuthProvider.credentialFromResult(result);
  const idToken = credential?.idToken;
  if (!idToken) {
    throw new Error(`No identity token was returned by ${provider}.`);
  }

  return { idToken, name: result.user.displayName ?? undefined };
}

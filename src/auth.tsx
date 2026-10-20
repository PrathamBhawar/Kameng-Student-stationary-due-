import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Lets the Google sign-in popup hand its result back to the page that opened it (web).
WebBrowser.maybeCompleteAuthSession();

export type Profile = { provider: 'google' | 'apple'; name: string; email: string };

/**
 * Google OAuth client IDs, created in Google Cloud Console (APIs & Services → Credentials).
 * Put them in a `.env` file at the project root — see README "Google sign-in".
 */
export const googleIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
};

/** Expo Go can't receive Google's redirect, so real Google sign-in needs the installed app or the web. */
export const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Why Google sign-in can't run here, or null when it can. */
export function googleUnavailableReason(): string | null {
  const id = Platform.OS === 'ios' ? googleIds.iosClientId : Platform.OS === 'android' ? googleIds.androidClientId : googleIds.webClientId;
  if (!id) return 'Google sign-in isn’t set up yet';
  if (inExpoGo) return 'Google sign-in works in the installed app';
  return null;
}

/**
 * Renders nothing; owns the Google auth request so the hook only runs when client IDs exist.
 * `register` receives the prompt function the Google button calls.
 */
export function GoogleAuth({ register, onProfile, onError }: {
  register: (prompt: (() => Promise<void>) | null) => void;
  onProfile: (p: Profile) => void;
  onError: (message: string | null) => void;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({ ...googleIds, selectAccount: true });

  useEffect(() => {
    register(request ? async () => { await promptAsync(); } : null);
    return () => register(null);
  }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const token = response.authentication?.accessToken;
      if (!token) { onError('Google didn’t return an account'); return; }
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + token } })
        .then((r) => r.json())
        .then((u) => onProfile({ provider: 'google', name: u.name || u.given_name || '', email: u.email || '' }))
        .catch(() => onError('Couldn’t read your Google account'));
    } else if (response.type === 'error') {
      onError(response.error?.message || 'Google sign-in failed');
    } else {
      onError(null); // dismissed or cancelled: just stop the spinner
    }
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/** Native Sign in with Apple sheet. Resolves null when the user cancels; throws when unavailable. */
export async function appleSignIn(): Promise<Profile | null> {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Sign in with Apple is available on iPhone');
  }
  try {
    const c = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    // Apple shares the name and email only the first time someone signs in to the app.
    const name = c.fullName ? AppleAuthentication.formatFullName(c.fullName).trim() : '';
    return { provider: 'apple', name, email: c.email || '' };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}

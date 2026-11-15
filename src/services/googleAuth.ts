/**
 * Google Auth & Token Management for Owner-Only Gmail Workspace Integration
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { OWNER_EMAIL } from '../utils/emailMime';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Gmail send scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.setCustomParameters({
  prompt: 'consent select_account',
  login_hint: OWNER_EMAIL,
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const isAuthorizedOwner = (user: User | null): boolean => {
  if (!user?.email) return false;
  return user.email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && isAuthorizedOwner(user)) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      if (user && !isAuthorizedOwner(user)) {
        // Never allow non-owner sessions to persist
        await signOut(auth).catch(() => {});
      }
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Sign in with Google popup and obtain access token (owner-restricted)
 * Handles user cancellations and popup closures gracefully without throwing errors
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);

    if (!isAuthorizedOwner(result.user)) {
      await signOut(auth).catch(() => {});
      cachedAccessToken = null;
      throw new Error(`Access restricted to site owner (${OWNER_EMAIL}).`);
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Gmail OAuth access token. Please grant Gmail permission.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle user cancellation, popup closures, or benign internal assertions gracefully
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-blocked' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('Pending promise was never set')
    ) {
      return null;
    }

    throw error;
  } finally {
    setTimeout(() => {
      isSigningIn = false;
    }, 600);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

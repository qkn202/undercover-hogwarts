import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc, 
  type Firestore, 
  Timestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithCustomToken, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  type User, 
  type Auth 
} from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";

export const FLOO_FIREBASE_CONFIG = {
  projectId: "hpvnn-archive",
  appId: "1:593615248970:web:d8b84465061422965810b3",
  storageBucket: "hpvnn-archive.firebasestorage.app",
  apiKey: "AIzaSyDoGJgeikTsfdviVrePe_2H7UcBcpFnrec",
  authDomain: "hpvnn-archive.firebaseapp.com",
  messagingSenderId: "593615248970"
};

const APP_NAME = "hpvn-undercover-floo";

// Singleton Firebase instances for Mạng Floo
let flooApp: FirebaseApp;
let flooAuth: Auth;
let flooDb: Firestore;
let flooFunctions: Functions;

export function getFlooFirebase() {
  if (!flooApp) {
    const existing = getApps().find(app => app.name === APP_NAME);
    flooApp = existing || initializeApp(FLOO_FIREBASE_CONFIG, APP_NAME);
    flooAuth = getAuth(flooApp);
    flooDb = getFirestore(flooApp);
    flooFunctions = getFunctions(flooApp, "asia-southeast1");
  }
  return { app: flooApp, auth: flooAuth, db: flooDb, functions: flooFunctions };
}

export interface FlooUserProfile {
  uid: string;
  username: string;
  house: string;
  userTag?: string;
  email?: string | null;
}

export interface FlooShout {
  id: string;
  name: string;
  house: string;
  message: string;
  createdAt: Date | null;
  uid?: string;
  imageUrl?: string | null;
  imageReplyUrl?: string | null;
  replyToId?: string | null;
  userTag?: string | null;
}

/**
 * Sign in to HPVN Floo Network using HPVN username or email and password.
 */
export async function signInHPVN(account: string, password: string): Promise<User> {
  const { auth, functions } = getFlooFirebase();
  const trimmed = account.trim();

  if (trimmed.includes("@")) {
    // Email login
    const cred = await signInWithEmailAndPassword(auth, trimmed.toLowerCase(), password);
    return cred.user;
  } else {
    // Account name login via Cloud Function
    const apiKey = FLOO_FIREBASE_CONFIG.apiKey;
    const callable = httpsCallable<{ account: string; password: string; apiKey: string }, { token?: string }>(
      functions,
      "signInWithShoutId"
    );
    const res = await callable({ account: trimmed, password, apiKey });
    if (!res.data?.token) {
      throw new Error("Không nhận được token xác thực từ Mạng Floo HPVN.");
    }
    const cred = await signInWithCustomToken(auth, res.data.token);
    return cred.user;
  }
}

/**
 * Sign out of HPVN Floo Network.
 */
export async function signOutHPVN(): Promise<void> {
  const { auth } = getFlooFirebase();
  await signOut(auth);
}

/**
 * Fetch detailed HPVN user profile (house, custom tag, etc.)
 */
export async function fetchFlooUserProfile(uid: string): Promise<FlooUserProfile | null> {
  const { db } = getFlooFirebase();
  try {
    const userDoc = await getDoc(doc(db, "shout_users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        username: typeof data.username === "string" ? data.username : "Phù thủy HPVN",
        house: typeof data.house === "string" ? data.house.toUpperCase() : "NONE",
        userTag: typeof data.userTag === "string" ? data.userTag : undefined,
      };
    }
  } catch (err) {
    console.warn("fetchFlooUserProfile warning:", err);
  }
  return null;
}

/**
 * Subscribe to realtime shouts in HPVN Floo Network.
 */
export function subscribeToFlooShouts(
  onShouts: (shouts: FlooShout[]) => void,
  onError?: (err: Error) => void,
  limitCount: number = 30
): () => void {
  const { db } = getFlooFirebase();
  const shoutsQuery = query(
    collection(db, "shouts"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    shoutsQuery,
    (snapshot) => {
      const items: FlooShout[] = snapshot.docs.map((d) => {
        const data = d.data();
        let createdAtDate: Date | null = null;
        if (data.createdAt instanceof Timestamp) {
          createdAtDate = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt.toMillis === "function") {
          createdAtDate = new Date(data.createdAt.toMillis());
        }

        return {
          id: d.id,
          name: typeof data.name === "string" ? data.name : "Phù thủy ẩn danh",
          house: typeof data.house === "string" ? data.house.toUpperCase() : "NONE",
          message: typeof data.message === "string" ? data.message : "",
          createdAt: createdAtDate,
          uid: typeof data.uid === "string" ? data.uid : undefined,
          imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
          imageReplyUrl: typeof data.imageReplyUrl === "string" ? data.imageReplyUrl : null,
          replyToId: typeof data.replyToId === "string" ? data.replyToId : null,
          userTag: typeof data.userTag === "string" ? data.userTag : null,
        };
      });

      // Reverse so oldest at top, newest at bottom for natural chat flow
      onShouts(items.reverse());
    },
    (err) => {
      console.error("subscribeToFlooShouts error:", err);
      onError?.(err);
    }
  );
}

/**
 * Send a new shout to HPVN Floo Network via official sendShout Cloud Function.
 */
export async function sendFlooShout(message: string, replyToId?: string | null): Promise<void> {
  const { db, functions } = getFlooFirebase();
  const trimmed = message.trim();
  if (!trimmed) return;

  const shoutId = doc(collection(db, "shouts")).id;
  const callable = httpsCallable(functions, "sendShout");

  await callable({
    shoutId,
    message: trimmed,
    recipientUids: [],
    ...(replyToId ? { replyToId } : {}),
  });
}

/**
 * Helper formatting House styling & badges harmonized with Undercover Hogwarts theme.
 */
export function getHouseStyle(houseRaw?: string) {
  const house = (houseRaw || "").toUpperCase();
  switch (house) {
    case "GRYFFINDOR":
      return {
        id: "GRYFFINDOR",
        name: "Gryffindor",
        badge: "🦁",
        textColor: "text-[#ffd875]",
        borderColor: "border-red-700/80",
        bgColor: "bg-red-950/70",
        pillColor: "bg-[#330e0e] text-[#ffd875] border border-red-700/70",
      };
    case "SLYTHERIN":
      return {
        id: "SLYTHERIN",
        name: "Slytherin",
        badge: "🐍",
        textColor: "text-emerald-300",
        borderColor: "border-emerald-700/80",
        bgColor: "bg-emerald-950/70",
        pillColor: "bg-[#0c2419] text-emerald-300 border border-emerald-700/70",
      };
    case "RAVENCLAW":
      return {
        id: "RAVENCLAW",
        name: "Ravenclaw",
        badge: "🦅",
        textColor: "text-sky-300",
        borderColor: "border-sky-700/80",
        bgColor: "bg-sky-950/70",
        pillColor: "bg-[#0c1f2d] text-sky-300 border border-sky-700/70",
      };
    case "HUFFLEPUFF":
      return {
        id: "HUFFLEPUFF",
        name: "Hufflepuff",
        badge: "🦡",
        textColor: "text-amber-300",
        borderColor: "border-amber-700/80",
        bgColor: "bg-amber-950/70",
        pillColor: "bg-[#2a200c] text-amber-300 border border-amber-700/70",
      };
    default:
      return {
        id: "GRYFFINDOR",
        name: "Phù thủy",
        badge: "🧙",
        textColor: "text-[#ebdcb0]",
        borderColor: "border-[#7a5229]/70",
        bgColor: "bg-[#181008]/80",
        pillColor: "bg-[#26160c] text-[#ebdcb0] border border-[#7a5229]/70",
      };
  }
}

export { onAuthStateChanged };

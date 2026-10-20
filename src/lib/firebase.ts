import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  get,
  off,
} from 'firebase/database';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { QuizState, ParticipantResponse, Participant } from '@/types/quiz';

export const firebaseConfig = {
  apiKey: 'AIzaSyBFqfpGYydk-DxntAXprtJPz9HG2gtUwBg',
  authDomain: 'symposium-quiz-b2761.firebaseapp.com',
  databaseURL: 'https://symposium-quiz-b2761-default-rtdb.firebaseio.com',
  projectId: 'symposium-quiz-b2761',
  storageBucket: 'symposium-quiz-b2761.firebasestorage.app',
  messagingSenderId: '83886023212',
  appId: '1:83886023212:web:8ba8d70ef8a5c44226a789',
  measurementId: 'G-50NV45BYF3',
};

export const ENABLE_FIREBASE_CLOUD = process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'false';

function getFirebaseApp() {
  if (!ENABLE_FIREBASE_CLOUD) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

function getRtdb() {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getDatabase(app);
  } catch (err) {
    console.warn('Realtime Database init notice:', err);
    return null;
  }
}

function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

const RTDB_ROOT = 'symposium_quiz/live_session';
const FIRESTORE_PATH = ['symposium_quiz', 'live_session'] as const;

/**
 * Deep-clean object to eliminate all `undefined` values and ensure pure JSON compatibility
 */
function sanitizePayload<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Convert participant dictionary or array into standard array
 */
function normalizeParticipants(raw: unknown): Participant[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object') return Object.values(raw as Record<string, Participant>).filter(Boolean);
  return [];
}

/**
 * Convert response dictionary or array into standard array
 */
function normalizeResponses(raw: unknown): ParticipantResponse[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object') return Object.values(raw as Record<string, ParticipantResponse>).filter(Boolean);
  return [];
}

export interface PushOptions {
  resetRound?: boolean;
  clearParticipants?: boolean;
}

/**
 * Broadcast authoritative quiz state from laptop Conductor to Firebase Cloud
 * Uses non-destructive update to preserve registered participants and incoming responses
 */
export async function pushQuizStateToFirebase(state: QuizState, options?: PushOptions) {
  if (!ENABLE_FIREBASE_CLOUD) return;

  const cleanState = sanitizePayload({
    ...state,
    lastUpdated: Date.now(),
  });

  // 1. Primary: Realtime Database (Sub-millisecond WebSocket, No daily write quota)
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      const liveRef = ref(rtdb, RTDB_ROOT);
      
      const updates: Record<string, unknown> = {
        status: cleanState.status,
        currentQuestionIndex: cleanState.currentQuestionIndex,
        questionLaunchedAt: cleanState.questionLaunchedAt,
        remainingSeconds: cleanState.remainingSeconds,
        questions: cleanState.questions,
        soundEnabled: cleanState.soundEnabled,
        lastUpdated: Date.now(),
      };

      if (options?.resetRound) {
        updates['responses'] = null;
      }

      if (options?.clearParticipants) {
        updates['participants'] = null;
      }

      // If conductor revealed answer, synchronize updated scores into participants in RTDB
      if (cleanState.status === 'REVEALED' && Array.isArray(cleanState.participants)) {
        cleanState.participants.forEach((p: Participant) => {
          if (p && p.id) {
            updates[`participants/${p.id}/score`] = p.score;
          }
        });
      }

      await update(liveRef, updates);
      return;
    } catch (err) {
      console.warn('RTDB push notice:', err);
    }
  }

  // 2. Fallback: Firestore
  const firestore = getFirestoreDb();
  if (firestore) {
    try {
      const docRef = doc(firestore, ...FIRESTORE_PATH);
      await setDoc(docRef, cleanState);
    } catch (err) {
      console.warn('Firestore fallback sync notice:', err);
    }
  }
}

/**
 * Explicitly clear all participants from Firebase Realtime Database
 */
export async function clearAllParticipantsInFirebase() {
  if (!ENABLE_FIREBASE_CLOUD) return;
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      await set(ref(rtdb, `${RTDB_ROOT}/participants`), null);
    } catch (err) {
      console.warn('RTDB clear participants notice:', err);
    }
  }
}

/**
 * Explicitly clear response board for new round from Firebase Realtime Database
 */
export async function clearResponsesInFirebase() {
  if (!ENABLE_FIREBASE_CLOUD) return;
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      await set(ref(rtdb, `${RTDB_ROOT}/responses`), null);
    } catch (err) {
      console.warn('RTDB clear responses notice:', err);
    }
  }
}

/**
 * Subscribe to live quiz state from Firebase Cloud (Realtime Database primary, Firestore fallback)
 */
export function subscribeToFirebaseQuizState(
  onUpdate: (state: Partial<QuizState>) => void
): () => void {
  if (!ENABLE_FIREBASE_CLOUD) return () => {};

  // 1. Primary: Realtime Database
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      const liveRef = ref(rtdb, RTDB_ROOT);
      const unsubscribeRtdb = onValue(
        liveRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data) {
              const normalized: Partial<QuizState> = {
                ...data,
                participants: normalizeParticipants(data.participants),
                responses: normalizeResponses(data.responses),
                questions: Array.isArray(data.questions)
                  ? data.questions
                  : data.questions
                  ? Object.values(data.questions)
                  : [],
              };
              onUpdate(normalized);
            }
          }
        },
        (error) => {
          console.warn('RTDB subscription notice:', error);
        }
      );

      return () => {
        off(liveRef);
      };
    } catch (err) {
      console.warn('RTDB subscribe error:', err);
    }
  }

  // 2. Fallback: Firestore
  const firestore = getFirestoreDb();
  if (firestore) {
    try {
      const docRef = doc(firestore, ...FIRESTORE_PATH);
      const unsubscribeFirestore = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data) {
              onUpdate(data as Partial<QuizState>);
            }
          }
        },
        (error) => {
          console.warn('Firestore fallback notice:', error);
        }
      );
      return unsubscribeFirestore;
    } catch {
      return () => {};
    }
  }

  return () => {};
}

/**
 * Submit participant response directly to Firebase with zero-latency distributed keying
 */
export async function submitResponseToFirebase(response: ParticipantResponse) {
  if (!ENABLE_FIREBASE_CLOUD) return;

  const cleanResponse = sanitizePayload(response);

  // RTDB: Write directly to `responses/${participantId}`
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      const respRef = ref(rtdb, `${RTDB_ROOT}/responses/${cleanResponse.participantId}`);
      await set(respRef, cleanResponse);
      return;
    } catch (err) {
      console.warn('RTDB response submit notice:', err);
    }
  }
}

/**
 * Register participant in Firebase live session with zero-latency distributed keying
 */
export async function registerParticipantInFirebase(participant: Participant) {
  if (!ENABLE_FIREBASE_CLOUD) return;

  const cleanParticipant = sanitizePayload(participant);

  // RTDB: Write directly to `participants/${participant.id}`
  const rtdb = getRtdb();
  if (rtdb) {
    try {
      const pRef = ref(rtdb, `${RTDB_ROOT}/participants/${cleanParticipant.id}`);
      await set(pRef, cleanParticipant);
      return;
    } catch (err) {
      console.warn('RTDB participant registration notice:', err);
    }
  }
}


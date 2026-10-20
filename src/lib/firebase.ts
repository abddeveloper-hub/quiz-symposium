import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { QuizState, ParticipantResponse, Participant } from '@/types/quiz';

export const firebaseConfig = {
  apiKey: 'AIzaSyBFqfpGYydk-DxntAXprtJPz9HG2gtUwBg',
  authDomain: 'symposium-quiz-b2761.firebaseapp.com',
  projectId: 'symposium-quiz-b2761',
  storageBucket: 'symposium-quiz-b2761.firebasestorage.app',
  messagingSenderId: '83886023212',
  appId: '1:83886023212:web:8ba8d70ef8a5c44226a789',
  measurementId: 'G-50NV45BYF3',
};

// Initialize Firebase safely for SSR/Client
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

const QUIZ_DOC_PATH = ['symposium_quiz', 'live_session'] as const;

// Circuit breaker to protect browser console from infinite backoff retries when Spark tier daily limit is reached
let isFirebaseQuotaExhausted = false;

function handleFirestoreError(context: string, err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message || '';
  if (code === 'resource-exhausted' || message.includes('Quota exceeded') || message.includes('resource-exhausted')) {
    if (!isFirebaseQuotaExhausted) {
      isFirebaseQuotaExhausted = true;
      console.info(
        'ℹ️ Firebase Cloud Firestore daily quota reached. Seamlessly continuing with high-speed local network & BroadcastChannel sync.'
      );
    }
    return true;
  }
  console.warn(`Firebase ${context} notice:`, err);
  return false;
}

/**
 * Broadcast full quiz state to Firebase Cloud Firestore
 */
export async function pushQuizStateToFirebase(state: QuizState) {
  if (isFirebaseQuotaExhausted) return;
  try {
    const docRef = doc(db, ...QUIZ_DOC_PATH);
    await setDoc(docRef, {
      ...state,
      lastUpdated: Date.now(),
    });
  } catch (err) {
    handleFirestoreError('state sync', err);
  }
}

/**
 * Subscribe to live quiz state from Firebase Cloud Firestore
 */
export function subscribeToFirebaseQuizState(
  onUpdate: (state: Partial<QuizState>) => void
): () => void {
  if (isFirebaseQuotaExhausted) return () => {};
  try {
    const docRef = doc(db, ...QUIZ_DOC_PATH);
    const unsubscribe = onSnapshot(
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
        const isQuota = handleFirestoreError('onSnapshot', error);
        if (isQuota) {
          try {
            unsubscribe();
          } catch {}
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError('subscribe', err);
    return () => {};
  }
}

/**
 * Submit participant response directly to Firebase
 */
export async function submitResponseToFirebase(response: ParticipantResponse) {
  if (isFirebaseQuotaExhausted) return;
  try {
    const docRef = doc(db, ...QUIZ_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentData = snap.data();
      const existingResponses: ParticipantResponse[] = currentData.responses || [];
      const alreadySubmitted = existingResponses.some(
        (r) => r.participantId === response.participantId
      );
      if (!alreadySubmitted) {
        await updateDoc(docRef, {
          responses: [...existingResponses, response],
          lastUpdated: Date.now(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError('response submit', err);
  }
}

/**
 * Register participant in Firebase live session
 */
export async function registerParticipantInFirebase(participant: Participant) {
  if (isFirebaseQuotaExhausted) return;
  try {
    const docRef = doc(db, ...QUIZ_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentData = snap.data();
      const existingParticipants: Participant[] = currentData.participants || [];
      const index = existingParticipants.findIndex((p) => p.id === participant.id);
      let updatedList: Participant[];
      if (index >= 0) {
        updatedList = [...existingParticipants];
        updatedList[index] = { ...updatedList[index], ...participant };
      } else {
        updatedList = [...existingParticipants, participant];
      }
      await updateDoc(docRef, {
        participants: updatedList,
        lastUpdated: Date.now(),
      });
    }
  } catch (err) {
    handleFirestoreError('register participant', err);
  }
}

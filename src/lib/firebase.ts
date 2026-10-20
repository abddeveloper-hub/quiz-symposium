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

// Firebase Cloud Firestore sync enables real-time public synchronization across any mobile device anywhere in the world.
export const ENABLE_FIREBASE_CLOUD = process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'false';

// Lazily get Firestore instance only when enabled
function getDb() {
  if (!ENABLE_FIREBASE_CLOUD) return null;
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

const QUIZ_DOC_PATH = ['symposium_quiz', 'live_session'] as const;

/**
 * Broadcast full quiz state to Firebase Cloud Firestore
 */
export async function pushQuizStateToFirebase(state: QuizState) {
  if (!ENABLE_FIREBASE_CLOUD) return;
  try {
    const db = getDb();
    if (!db) return;
    const docRef = doc(db, ...QUIZ_DOC_PATH);
    await setDoc(docRef, {
      ...state,
      lastUpdated: Date.now(),
    });
  } catch (err) {
    console.warn('Firebase state sync notice:', err);
  }
}

/**
 * Subscribe to live quiz state from Firebase Cloud Firestore
 */
export function subscribeToFirebaseQuizState(
  onUpdate: (state: Partial<QuizState>) => void
): () => void {
  if (!ENABLE_FIREBASE_CLOUD) return () => {};
  try {
    const db = getDb();
    if (!db) return () => {};
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
        console.warn('Firebase sync notice:', error?.message || error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firebase subscribe notice:', err);
    return () => {};
  }
}

/**
 * Submit participant response directly to Firebase
 */
export async function submitResponseToFirebase(response: ParticipantResponse) {
  if (!ENABLE_FIREBASE_CLOUD) return;
  try {
    const db = getDb();
    if (!db) return;
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
    console.warn('Firebase response submit notice:', err);
  }
}

/**
 * Register participant in Firebase live session
 */
export async function registerParticipantInFirebase(participant: Participant) {
  if (!ENABLE_FIREBASE_CLOUD) return;
  try {
    const db = getDb();
    if (!db) return;
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
    console.warn('Firebase register participant notice:', err);
  }
}

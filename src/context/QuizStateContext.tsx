'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  QuizState,
  QuizStatus,
  Question,
  QuizAction,
  Participant,
  OptionId,
} from '@/types/quiz';
import { INITIAL_PRELOADED_QUESTIONS, INITIAL_PARTICIPANTS } from '@/data/preloadedQuestions';
import { sounds } from '@/utils/soundEffects';
import {
  pushQuizStateToFirebase,
  subscribeToFirebaseQuizState,
  submitResponseToFirebase,
  registerParticipantInFirebase,
} from '@/lib/firebase';

const STORAGE_KEY = 'symposium_quiz_state_v3';
const BROADCAST_CHANNEL = 'symposium_quiz_channel_v3';

const defaultState: QuizState = {
  questions: INITIAL_PRELOADED_QUESTIONS,
  currentQuestionIndex: 0,
  status: 'WAITING',
  questionLaunchedAt: null,
  remainingSeconds: INITIAL_PRELOADED_QUESTIONS[0]?.timerSeconds || 30,
  responses: [],
  participants: INITIAL_PARTICIPANTS,
  soundEnabled: true,
};

interface QuizContextValue {
  state: QuizState;
  currentQuestion: Question | null;
  broadcastQuestion: (index: number) => void;
  unlockRound: () => void;
  lockRound: () => void;
  revealAnswer: () => void;
  passAndReopenRound: () => void;
  nextQuestion: () => void;
  resetRound: () => void;
  submitResponse: (
    participantId: string,
    participantName: string,
    teamName: string,
    optionId: OptionId,
    shuhba?: string,
    shuhbaNo?: string
  ) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
  toggleSound: () => void;
  resetAllScores: () => void;
  clearAllParticipants: () => void;
  setStatus: (status: QuizStatus) => void;
  registerParticipant: (participant: Participant) => void;
}

const QuizStateContext = createContext<QuizContextValue | null>(null);

function deduplicateQuestions(questions: Question[]): Question[] {
  if (!Array.isArray(questions)) return [];
  const map = new Map<string, Question>();
  questions.forEach((q) => {
    if (q && q.id) {
      map.set(q.id, q);
    }
  });
  return Array.from(map.values());
}

// In-memory bus for same-page components (e.g. split view or multiple renders)
type Listener = (action: QuizAction) => void;
const memoryListeners: Set<Listener> = new Set();

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuizState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const rawQ = Array.isArray(parsed.questions) ? parsed.questions : [];
          return {
            ...defaultState,
            ...parsed,
            questions: deduplicateQuestions(rawQ),
            participants: Array.isArray(parsed.participants) ? parsed.participants : [],
          };
        }
      } catch (e) {
        console.warn('Failed to parse stored quiz state:', e);
      }
    }
    return defaultState;
  });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound utility with state
  useEffect(() => {
    sounds.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  const saveToStorage = useCallback((newState: QuizState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        pushQuizStateToFirebase(newState);
      } catch {
        // storage quota
      }
    }
  }, []);

  const dispatchAction = useCallback((action: QuizAction) => {
    // Notify same window memory bus
    memoryListeners.forEach((l) => {
      try {
        l(action);
      } catch {}
    });

    // Notify other tabs via BroadcastChannel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(action);
      } catch {}
    }

    // Broadcast to server for cross-device/mobile network sync
    if (typeof window !== 'undefined') {
      fetch('/api/quiz/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      }).catch(() => {});
    }
  }, []);

  const applyAction = useCallback((action: QuizAction) => {
    setState((prev) => {
      let next: QuizState = { ...prev };

      switch (action.type) {
        case 'STATE_SYNC':
          next = { ...action.payload };
          break;

        case 'SET_STATUS':
          next = { ...prev, status: action.payload };
          break;

        case 'BROADCAST_QUESTION': {
          const idx = Math.max(0, Math.min(action.payload.questionIndex, prev.questions.length - 1));
          const q = prev.questions[idx];
          sounds.playClick();
          next = {
            ...prev,
            currentQuestionIndex: idx,
            status: 'WAITING',
            questionLaunchedAt: null,
            remainingSeconds: q?.timerSeconds || 30,
            responses: [],
          };
          break;
        }

        case 'UNLOCK_ROUND': {
          sounds.playUnlock();
          next = {
            ...prev,
            status: 'LIVE',
            questionLaunchedAt: action.payload.timestamp,
            remainingSeconds: action.payload.duration,
          };
          break;
        }

        case 'LOCK_ROUND': {
          sounds.playPenalty();
          next = {
            ...prev,
            status: 'LOCKED',
          };
          break;
        }

        case 'REVEAL_ANSWER': {
          sounds.playAward();
          const currentQ = prev.questions[prev.currentQuestionIndex];
          const correctOpt = currentQ?.correctOptionId;

          // Compute correct responses and update participant scores
          const updatedResponses = prev.responses.map((r) => ({
            ...r,
            isCorrect: r.selectedOptionId === correctOpt,
          }));

          const pointsAwarded = currentQ?.points || 10;
          const updatedParticipants = prev.participants.map((p) => {
            const resp = updatedResponses.find((r) => r.participantId === p.id);
            if (resp && resp.isCorrect) {
              return { ...p, score: p.score + pointsAwarded };
            }
            return p;
          });

          next = {
            ...prev,
            status: 'REVEALED',
            responses: updatedResponses,
            participants: updatedParticipants,
          };
          break;
        }

        case 'PASS_REOPEN_ROUND': {
          sounds.playUnlock();
          next = {
            ...prev,
            status: 'LIVE',
            questionLaunchedAt: Date.now(),
            remainingSeconds: prev.remainingSeconds > 0 ? prev.remainingSeconds : 15,
          };
          break;
        }

        case 'NEXT_QUESTION': {
          const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
          const nextQ = prev.questions[nextIdx];
          sounds.playClick();
          next = {
            ...prev,
            currentQuestionIndex: nextIdx,
            status: 'WAITING',
            questionLaunchedAt: null,
            remainingSeconds: nextQ?.timerSeconds || 30,
            responses: [],
          };
          break;
        }

        case 'RESET_ROUND': {
          sounds.playClick();
          const q = prev.questions[prev.currentQuestionIndex];
          next = {
            ...prev,
            status: 'WAITING',
            questionLaunchedAt: null,
            remainingSeconds: q?.timerSeconds || 30,
            responses: [],
          };
          break;
        }

        case 'SUBMIT_RESPONSE': {
          sounds.playClick();
          const exists = prev.responses.some((r) => r.participantId === action.payload.participantId);
          if (!exists) {
            next = {
              ...prev,
              responses: [...prev.responses, action.payload],
            };
          }
          break;
        }

        case 'ADD_QUESTION': {
          const exists = prev.questions.some((q) => q.id === action.payload.id);
          const updatedList = exists
            ? prev.questions.map((q) => (q.id === action.payload.id ? action.payload : q))
            : [...prev.questions, action.payload];
          next = {
            ...prev,
            questions: deduplicateQuestions(updatedList),
          };
          break;
        }

        case 'UPDATE_QUESTION': {
          const updated = prev.questions.map((q) => (q.id === action.payload.id ? action.payload : q));
          const currentQ = updated[prev.currentQuestionIndex];
          next = {
            ...prev,
            questions: deduplicateQuestions(updated),
            remainingSeconds: prev.status === 'WAITING' ? (currentQ?.timerSeconds || 30) : prev.remainingSeconds,
          };
          break;
        }

        case 'DELETE_QUESTION': {
          const filtered = prev.questions.filter((q) => q.id !== action.payload.id);
          const newIdx = Math.min(prev.currentQuestionIndex, Math.max(0, filtered.length - 1));
          next = {
            ...prev,
            questions: filtered,
            currentQuestionIndex: newIdx,
          };
          break;
        }

        case 'TOGGLE_SOUND': {
          next = {
            ...prev,
            soundEnabled: !prev.soundEnabled,
          };
          break;
        }

        case 'RESET_ALL_SCORES': {
          const resetP = prev.participants.map((p) => ({ ...p, score: 0 }));
          next = {
            ...prev,
            participants: resetP,
            responses: [],
            status: 'WAITING',
          };
          break;
        }

        case 'CLEAR_ALL_PARTICIPANTS': {
          next = {
            ...prev,
            participants: [],
            responses: [],
            status: 'WAITING',
          };
          break;
        }

        case 'REGISTER_PARTICIPANT': {
          const exists = prev.participants.some((p) => p.id === action.payload.id);
          if (exists) {
            next = {
              ...prev,
              participants: prev.participants.map((p) =>
                p.id === action.payload.id
                  ? { ...p, name: action.payload.name, teamName: action.payload.teamName }
                  : p
              ),
            };
          } else {
            next = {
              ...prev,
              participants: [...prev.participants, action.payload],
            };
          }
          break;
        }

        default:
          break;
      }

      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  // Set up BroadcastChannel & in-memory listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const memoryListener: Listener = (action) => {
      applyAction(action);
    };
    memoryListeners.add(memoryListener);

    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data) {
          applyAction(event.data as QuizAction);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Connect to Server-Sent Events (SSE) for multi-device network synchronization
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/quiz/events');
      eventSource.onmessage = (event) => {
        try {
          if (event.data && event.data.trim()) {
            const action = JSON.parse(event.data);
            applyAction(action);
          }
        } catch {}
      };
    } catch (e) {
      console.warn('SSE subscription error:', e);
    }

    // Connect to Firebase Cloud Firestore for remote/cloud synchronization
    let unsubscribeFirebase: (() => void) | null = null;
    try {
      unsubscribeFirebase = subscribeToFirebaseQuizState((cloudState) => {
        if (cloudState && cloudState.status) {
          setState((prev) => ({
            ...prev,
            ...cloudState,
            questions: cloudState.questions?.length
              ? deduplicateQuestions(cloudState.questions)
              : prev.questions,
            responses: cloudState.responses || prev.responses,
            participants: cloudState.participants || prev.participants,
          }));
        }
      });
    } catch (e) {
      console.warn('Firebase subscription error:', e);
    }

    return () => {
      memoryListeners.delete(memoryListener);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (eventSource) {
        eventSource.close();
      }
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
    };
  }, [applyAction]);

  // Countdown Timer when status === 'LIVE'
  useEffect(() => {
    if (state.status === 'LIVE') {
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.status !== 'LIVE') return prev;
          if (prev.remainingSeconds <= 1) {
            sounds.playPenalty();
            const lockedState: QuizState = {
              ...prev,
              status: 'LOCKED',
              remainingSeconds: 0,
            };
            saveToStorage(lockedState);
            return lockedState;
          }
          if (prev.remainingSeconds <= 4) {
            sounds.playTick();
          }
          const next = {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
          saveToStorage(next);
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state.status, saveToStorage]);

  // Public dispatchers
  const broadcastQuestion = useCallback((questionIndex: number) => {
    dispatchAction({ type: 'BROADCAST_QUESTION', payload: { questionIndex } });
  }, [dispatchAction]);

  const unlockRound = useCallback(() => {
    const q = state.questions[state.currentQuestionIndex];
    const duration = q?.timerSeconds || 30;
    dispatchAction({
      type: 'UNLOCK_ROUND',
      payload: { timestamp: Date.now(), duration },
    });
  }, [state.questions, state.currentQuestionIndex, dispatchAction]);

  const lockRound = useCallback(() => {
    dispatchAction({ type: 'LOCK_ROUND' });
  }, [dispatchAction]);

  const revealAnswer = useCallback(() => {
    dispatchAction({ type: 'REVEAL_ANSWER' });
  }, [dispatchAction]);

  const passAndReopenRound = useCallback(() => {
    dispatchAction({ type: 'PASS_REOPEN_ROUND' });
  }, [dispatchAction]);

  const nextQuestion = useCallback(() => {
    dispatchAction({ type: 'NEXT_QUESTION' });
  }, [dispatchAction]);

  const resetRound = useCallback(() => {
    dispatchAction({ type: 'RESET_ROUND' });
  }, [dispatchAction]);

  const submitResponse = useCallback(
    (
      participantId: string,
      participantName: string,
      teamName: string,
      optionId: OptionId,
      shuhba?: string,
      shuhbaNo?: string
    ) => {
      const submittedAt = Date.now();
      const launched = state.questionLaunchedAt || submittedAt;
      const deltaMs = Math.max(0, submittedAt - launched);

      const responsePayload = {
        participantId,
        participantName,
        teamName,
        shuhba,
        shuhbaNo,
        selectedOptionId: optionId,
        submittedAt,
        deltaMs,
      };

      dispatchAction({
        type: 'SUBMIT_RESPONSE',
        payload: responsePayload,
      });

      submitResponseToFirebase(responsePayload);
    },
    [state.questionLaunchedAt, dispatchAction]
  );

  const addQuestion = useCallback((q: Question) => {
    dispatchAction({ type: 'ADD_QUESTION', payload: q });
  }, [dispatchAction]);

  const updateQuestion = useCallback((q: Question) => {
    dispatchAction({ type: 'UPDATE_QUESTION', payload: q });
  }, [dispatchAction]);

  const deleteQuestion = useCallback((id: string) => {
    dispatchAction({ type: 'DELETE_QUESTION', payload: { id } });
  }, [dispatchAction]);

  const toggleSound = useCallback(() => {
    dispatchAction({ type: 'TOGGLE_SOUND' });
  }, [dispatchAction]);

  const resetAllScores = useCallback(() => {
    dispatchAction({ type: 'RESET_ALL_SCORES' });
  }, [dispatchAction]);

  const clearAllParticipants = useCallback(() => {
    dispatchAction({ type: 'CLEAR_ALL_PARTICIPANTS' });
  }, [dispatchAction]);

  const setStatus = useCallback((status: QuizStatus) => {
    dispatchAction({ type: 'SET_STATUS', payload: status });
  }, [dispatchAction]);

  const registerParticipant = useCallback((participant: Participant) => {
    dispatchAction({ type: 'REGISTER_PARTICIPANT', payload: participant });
    registerParticipantInFirebase(participant);
  }, [dispatchAction]);

  const currentQuestion = state.questions[state.currentQuestionIndex] || state.questions[0] || null;

  return (
    <QuizStateContext.Provider
      value={{
        state,
        currentQuestion,
        broadcastQuestion,
        unlockRound,
        lockRound,
        revealAnswer,
        passAndReopenRound,
        nextQuestion,
        resetRound,
        submitResponse,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        toggleSound,
        resetAllScores,
        clearAllParticipants,
        setStatus,
        registerParticipant,
      }}
    >
      {children}
    </QuizStateContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizStateContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}

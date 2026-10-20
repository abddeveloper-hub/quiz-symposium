'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  QuizMasterState,
  QuizState,
  Contestant,
  BuzzWinner,
  BuzzerSocketAction,
} from '@/types/buzzer';
import { INITIAL_QUESTIONS, INITIAL_CONTESTANTS } from '@/data/mockQuestions';
import { sounds } from '@/utils/soundEffects';

const BROADCAST_CHANNEL_NAME = 'symposium_buzzer_channel';
const LOCAL_STORAGE_KEY = 'symposium_buzzer_state';

const defaultInitialState: QuizMasterState = {
  quizState: 'IDLE',
  currentQuestionIndex: 0,
  currentQuestion: INITIAL_QUESTIONS[0],
  winner: null,
  buzzQueue: [],
  unlockedAt: null,
  remainingSeconds: 15,
  contestants: INITIAL_CONTESTANTS,
  questions: INITIAL_QUESTIONS,
  isSoundEnabled: true,
  latencySimulationMs: 15,
};

// Global in-memory broadcast for same-window subcomponents
type Listener = (action: BuzzerSocketAction) => void;
const memoryBusListeners: Set<Listener> = new Set();

function emitMemoryBus(action: BuzzerSocketAction) {
  memoryBusListeners.forEach((listener) => {
    try {
      listener(action);
    } catch (e) {
      console.error('Error in memory bus listener:', e);
    }
  });
}

export function useBuzzerSocket(currentContestantId?: string) {
  const [state, setState] = useState<QuizMasterState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // ensure questions exist
          return {
            ...defaultInitialState,
            ...parsed,
            questions: INITIAL_QUESTIONS,
            currentQuestion: INITIAL_QUESTIONS[parsed.currentQuestionIndex || 0] || INITIAL_QUESTIONS[0],
          };
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return defaultInitialState;
  });

  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number>(12);
  const [socketUrl, setSocketUrl] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound settings with sound utility
  useEffect(() => {
    sounds.enabled = state.isSoundEnabled;
  }, [state.isSoundEnabled]);

  // Persist state to local storage in simulation mode
  const saveStateToStorage = useCallback((newState: QuizMasterState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      } catch {
        // quota exceeded or private mode
      }
    }
  }, []);

  // Broadcast action across tabs & same-page components
  const broadcastAction = useCallback((action: BuzzerSocketAction) => {
    // In simulation mode:
    emitMemoryBus(action);

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(action);
      } catch (err) {
        console.warn('BroadcastChannel send error:', err);
      }
    }

    // In real socket mode:
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('buzzer_action', action);
    }
  }, []);

  // Dispatcher for local state updates
  const handleAction = useCallback(
    (action: BuzzerSocketAction) => {
      setState((prev) => {
        let next: QuizMasterState = { ...prev };

        switch (action.type) {
          case 'STATE_SYNC': {
            next = { ...action.payload };
            break;
          }

          case 'SET_QUIZ_STATE': {
            next = {
              ...prev,
              quizState: action.payload.state,
            };
            if (action.payload.state === 'IDLE') {
              next.winner = null;
              next.buzzQueue = [];
              next.unlockedAt = null;
            }
            break;
          }

          case 'SELECT_QUESTION': {
            const idx = Math.max(0, Math.min(action.payload.index, prev.questions.length - 1));
            const q = prev.questions[idx];
            // Reset question disqualifications
            const resetContestants = prev.contestants.map((c) => ({
              ...c,
              isDisqualifiedForQuestion: false,
            }));

            next = {
              ...prev,
              currentQuestionIndex: idx,
              currentQuestion: q,
              quizState: 'READING',
              winner: null,
              buzzQueue: [],
              unlockedAt: null,
              remainingSeconds: q.timeLimitSeconds,
              contestants: resetContestants,
            };
            break;
          }

          case 'UNLOCK_BUZZER': {
            sounds.playUnlock();
            next = {
              ...prev,
              quizState: 'BUZZER_ACTIVE',
              unlockedAt: action.payload.timestamp,
              remainingSeconds: action.payload.duration,
              winner: null,
              buzzQueue: [],
            };
            break;
          }

          case 'LOCK_BUZZER': {
            next = {
              ...prev,
              quizState: 'LOCKED',
            };
            break;
          }

          case 'BUZZ_ATTEMPT': {
            const { contestantId, clientTimestamp } = action.payload;
            const contestant = prev.contestants.find((c) => c.id === contestantId);

            // Ignore if buzzer not active or contestant disqualified
            if (prev.quizState !== 'BUZZER_ACTIVE' || !contestant || contestant.isDisqualifiedForQuestion) {
              return prev;
            }

            const unlocked = prev.unlockedAt || clientTimestamp;
            const deltaMs = Math.max(0, clientTimestamp - unlocked);

            const buzzWinner: BuzzWinner = {
              contestantId: contestant.id,
              contestantName: contestant.name,
              teamName: contestant.teamName,
              avatarColor: contestant.avatarColor,
              buzzTimestamp: clientTimestamp,
              unlockedTimestamp: unlocked,
              deltaMs,
            };

            // First buzz wins!
            if (!prev.winner) {
              sounds.playBuzz();
              next = {
                ...prev,
                quizState: 'LOCKED',
                winner: buzzWinner,
                buzzQueue: [buzzWinner],
              };
            } else {
              // Subsequent buzz within same round placed in queue
              const alreadyQueued = prev.buzzQueue.some((b) => b.contestantId === contestantId);
              if (!alreadyQueued) {
                next = {
                  ...prev,
                  buzzQueue: [...prev.buzzQueue, buzzWinner],
                };
              }
            }
            break;
          }

          case 'AWARD_POINTS': {
            sounds.playAward();
            const { contestantId, points } = action.payload;
            const updated = prev.contestants.map((c) =>
              c.id === contestantId ? { ...c, score: c.score + points } : c
            );
            next = {
              ...prev,
              quizState: 'EVALUATING',
              contestants: updated,
            };
            break;
          }

          case 'PENALTY_POINTS': {
            sounds.playPenalty();
            const { contestantId, points } = action.payload;
            const updated = prev.contestants.map((c) =>
              c.id === contestantId ? { ...c, score: Math.max(0, c.score - points) } : c
            );
            next = {
              ...prev,
              quizState: 'EVALUATING',
              contestants: updated,
            };
            break;
          }

          case 'PASS_RESET_LOCK': {
            // Disqualify current winner for this question, re-enable buzzer for remaining contestants
            const currentWinnerId = prev.winner?.contestantId;
            const updatedContestants = prev.contestants.map((c) =>
              c.id === currentWinnerId ? { ...c, isDisqualifiedForQuestion: true } : c
            );

            sounds.playUnlock();
            next = {
              ...prev,
              quizState: 'BUZZER_ACTIVE',
              unlockedAt: Date.now(),
              winner: null,
              buzzQueue: [],
              contestants: updatedContestants,
            };
            break;
          }

          case 'RESET_QUESTION': {
            const resetContestants = prev.contestants.map((c) => ({
              ...c,
              isDisqualifiedForQuestion: false,
            }));
            next = {
              ...prev,
              quizState: 'READING',
              winner: null,
              buzzQueue: [],
              unlockedAt: null,
              remainingSeconds: prev.currentQuestion?.timeLimitSeconds || 15,
              contestants: resetContestants,
            };
            break;
          }

          case 'REGISTER_CONTESTANT': {
            const exists = prev.contestants.find((c) => c.id === action.payload.id);
            if (!exists) {
              const newContestant: Contestant = {
                ...action.payload,
                score: 0,
                isConnected: true,
                latencyMs: 15,
                tabSwitchCount: 0,
                isDisqualifiedForQuestion: false,
                lastActive: Date.now(),
              };
              next = {
                ...prev,
                contestants: [...prev.contestants, newContestant],
              };
            }
            break;
          }

          case 'TAB_SWITCH': {
            const { contestantId } = action.payload;
            const updated = prev.contestants.map((c) =>
              c.id === contestantId
                ? { ...c, tabSwitchCount: c.tabSwitchCount + 1, lastActive: Date.now() }
                : c
            );
            next = {
              ...prev,
              contestants: updated,
            };
            break;
          }

          case 'UPDATE_LATENCY': {
            const { contestantId, latencyMs } = action.payload;
            const updated = prev.contestants.map((c) =>
              c.id === contestantId ? { ...c, latencyMs, lastActive: Date.now() } : c
            );
            next = {
              ...prev,
              contestants: updated,
            };
            break;
          }

          case 'RESET_ALL_SCORES': {
            const reset = prev.contestants.map((c) => ({
              ...c,
              score: 0,
              tabSwitchCount: 0,
              isDisqualifiedForQuestion: false,
            }));
            next = {
              ...prev,
              winner: null,
              buzzQueue: [],
              quizState: 'IDLE',
              contestants: reset,
            };
            break;
          }

          default:
            break;
        }

        saveStateToStorage(next);
        return next;
      });
    },
    [saveStateToStorage]
  );

  // Set up BroadcastChannel & in-memory listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // In-memory bus for instant React subcomponent updates
    const memoryListener: Listener = (action) => {
      handleAction(action);
    };
    memoryBusListeners.add(memoryListener);

    // Cross-tab BroadcastChannel
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data) {
          handleAction(event.data as BuzzerSocketAction);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }

    return () => {
      memoryBusListeners.delete(memoryListener);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [handleAction]);

  // Anti-Cheating UI Safeguard: visibilitychange listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden && currentContestantId) {
        // Tab was hidden / blurred
        const action: BuzzerSocketAction = {
          type: 'TAB_SWITCH',
          payload: { contestantId: currentContestantId },
        };
        broadcastAction(action);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentContestantId, broadcastAction]);

  // Real-time ping simulation & latency measurement
  useEffect(() => {
    pingIntervalRef.current = setInterval(() => {
      // Simulate real-world jitter around base latency
      const jitter = Math.floor(Math.random() * 8) - 4;
      const currentPing = Math.max(4, (state.latencySimulationMs || 15) + jitter);
      setPingMs(currentPing);

      if (currentContestantId) {
        broadcastAction({
          type: 'UPDATE_LATENCY',
          payload: { contestantId: currentContestantId, latencyMs: currentPing },
        });
      }
    }, 3000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [state.latencySimulationMs, currentContestantId, broadcastAction]);

  // Buzzer Active Countdown Timer (1 second interval)
  useEffect(() => {
    if (state.quizState === 'BUZZER_ACTIVE') {
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.quizState !== 'BUZZER_ACTIVE') return prev;
          if (prev.remainingSeconds <= 1) {
            // Time ran out! Lock buzzer
            sounds.playPenalty();
            const lockedState: QuizMasterState = {
              ...prev,
              quizState: 'LOCKED',
              remainingSeconds: 0,
            };
            saveStateToStorage(lockedState);
            return lockedState;
          }
          if (prev.remainingSeconds <= 4) {
            sounds.playTick();
          }
          const updatedState = {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
          saveStateToStorage(updatedState);
          return updatedState;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state.quizState, saveStateToStorage]);

  // Connect to real Socket.io if URL provided
  const connectSocket = useCallback((url: string) => {
    if (!url) return;
    try {
      const socket = io(url, {
        transports: ['websocket'],
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setIsSimulationMode(false);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('buzzer_action', (action: BuzzerSocketAction) => {
        handleAction(action);
      });

      socketRef.current = socket;
      setSocketUrl(url);
    } catch (e) {
      console.error('Socket.io connection error:', e);
    }
  }, [handleAction]);

  // Public action dispatchers
  const unlockBuzzer = useCallback(() => {
    const timestamp = Date.now();
    const duration = state.currentQuestion?.timeLimitSeconds || 15;
    const action: BuzzerSocketAction = {
      type: 'UNLOCK_BUZZER',
      payload: { timestamp, duration },
    };
    broadcastAction(action);
  }, [state.currentQuestion, broadcastAction]);

  const lockBuzzer = useCallback(() => {
    const action: BuzzerSocketAction = { type: 'LOCK_BUZZER' };
    broadcastAction(action);
  }, [broadcastAction]);

  /**
   * ZERO-LATENCY BUZZER TRIGGER
   * Must be called on `onPointerDown` to bypass 300ms mobile delay.
   */
  const buzz = useCallback(
    (contestantId: string) => {
      const clientTimestamp = Date.now();
      const action: BuzzerSocketAction = {
        type: 'BUZZ_ATTEMPT',
        payload: { contestantId, clientTimestamp },
      };
      broadcastAction(action);
    },
    [broadcastAction]
  );

  const awardPoints = useCallback(
    (contestantId: string, points?: number) => {
      const pts = points !== undefined ? points : (state.currentQuestion?.points || 10);
      const action: BuzzerSocketAction = {
        type: 'AWARD_POINTS',
        payload: { contestantId, points: pts },
      };
      broadcastAction(action);
    },
    [state.currentQuestion, broadcastAction]
  );

  const penalize = useCallback(
    (contestantId: string, points?: number) => {
      const pts = points !== undefined ? points : (state.currentQuestion?.penaltyPoints || 5);
      const action: BuzzerSocketAction = {
        type: 'PENALTY_POINTS',
        payload: { contestantId, points: pts },
      };
      broadcastAction(action);
    },
    [state.currentQuestion, broadcastAction]
  );

  const passAndResetLock = useCallback(() => {
    const action: BuzzerSocketAction = { type: 'PASS_RESET_LOCK' };
    broadcastAction(action);
  }, [broadcastAction]);

  const resetQuestion = useCallback(() => {
    const action: BuzzerSocketAction = { type: 'RESET_QUESTION' };
    broadcastAction(action);
  }, [broadcastAction]);

  const selectQuestion = useCallback(
    (index: number) => {
      const action: BuzzerSocketAction = {
        type: 'SELECT_QUESTION',
        payload: { index },
      };
      broadcastAction(action);
    },
    [broadcastAction]
  );

  const setQuizState = useCallback(
    (quizState: QuizState) => {
      const action: BuzzerSocketAction = {
        type: 'SET_QUIZ_STATE',
        payload: { state: quizState },
      };
      broadcastAction(action);
    },
    [broadcastAction]
  );

  const registerContestant = useCallback(
    (contestant: Omit<Contestant, 'score' | 'isConnected' | 'latencyMs' | 'tabSwitchCount' | 'isDisqualifiedForQuestion' | 'lastActive'>) => {
      const action: BuzzerSocketAction = {
        type: 'REGISTER_CONTESTANT',
        payload: contestant,
      };
      broadcastAction(action);
    },
    [broadcastAction]
  );

  const resetAllScores = useCallback(() => {
    const action: BuzzerSocketAction = { type: 'RESET_ALL_SCORES' };
    broadcastAction(action);
  }, [broadcastAction]);

  const toggleSound = useCallback(() => {
    setState((prev) => {
      const updated = { ...prev, isSoundEnabled: !prev.isSoundEnabled };
      saveStateToStorage(updated);
      return updated;
    });
  }, [saveStateToStorage]);

  const setLatencySimulation = useCallback(
    (ms: number) => {
      setState((prev) => {
        const updated = { ...prev, latencySimulationMs: ms };
        saveStateToStorage(updated);
        return updated;
      });
    },
    [saveStateToStorage]
  );

  return {
    state,
    isConnected,
    isSimulationMode,
    pingMs,
    socketUrl,
    connectSocket,
    setIsSimulationMode,
    unlockBuzzer,
    lockBuzzer,
    buzz,
    awardPoints,
    penalize,
    passAndResetLock,
    resetQuestion,
    selectQuestion,
    setQuizState,
    registerContestant,
    resetAllScores,
    toggleSound,
    setLatencySimulation,
  };
}

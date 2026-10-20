// Shared server-side authoritative state and event bus for real-time LAN/Wi-Fi devices
import { QuizState, QuizAction, Question, Participant, ParticipantResponse } from '@/types/quiz';
import { INITIAL_PRELOADED_QUESTIONS, INITIAL_PARTICIPANTS } from '@/data/preloadedQuestions';
import fs from 'fs';
import path from 'path';

type SSEWriter = (data: string) => void;

const defaultServerState: QuizState = {
  questions: INITIAL_PRELOADED_QUESTIONS,
  currentQuestionIndex: 0,
  status: 'WAITING',
  questionLaunchedAt: null,
  remainingSeconds: 30,
  responses: [],
  participants: INITIAL_PARTICIPANTS,
  soundEnabled: true,
};

// Global singleton across hot reloads in Next.js development
const globalForQuiz = global as unknown as {
  quizClients: Set<SSEWriter>;
  currentState: QuizState;
};

if (!globalForQuiz.quizClients) {
  globalForQuiz.quizClients = new Set();
}

// Path for fallback persistence file across server restarts
const STATE_FILE_PATH = path.join(process.cwd(), '.next', 'active_quiz_state.json');

function loadPersistedState(): QuizState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.questions)) {
        return {
          ...defaultServerState,
          ...parsed,
        };
      }
    }
  } catch {
    // Ignore read errors
  }
  return defaultServerState;
}

function persistStateToDisk(state: QuizState) {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

if (!globalForQuiz.currentState) {
  globalForQuiz.currentState = loadPersistedState();
}

export const quizClients = globalForQuiz.quizClients;

export function getServerQuizState(): QuizState {
  return globalForQuiz.currentState;
}

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

export function reduceQuizState(prev: QuizState, action: QuizAction): QuizState {
  let next: QuizState = { ...prev };

  switch (action.type) {
    case 'STATE_SYNC': {
      const payload = action.payload;
      next = {
        ...prev,
        ...payload,
        questions:
          payload.questions && payload.questions.length > 0
            ? deduplicateQuestions(payload.questions)
            : prev.questions,
        participants: payload.participants || prev.participants,
        responses: payload.responses || prev.responses,
      };
      break;
    }

    case 'SET_STATUS':
      next = { ...prev, status: action.payload };
      break;

    case 'BROADCAST_QUESTION': {
      const idx = Math.max(0, Math.min(action.payload.questionIndex, Math.max(0, prev.questions.length - 1)));
      const q = prev.questions[idx];
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
      next = {
        ...prev,
        status: 'LIVE',
        questionLaunchedAt: action.payload.timestamp || Date.now(),
        remainingSeconds: action.payload.duration || 30,
      };
      break;
    }

    case 'LOCK_ROUND': {
      next = {
        ...prev,
        status: 'LOCKED',
      };
      break;
    }

    case 'REVEAL_ANSWER': {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      const correctOpt = currentQ?.correctOptionId;

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
      next = {
        ...prev,
        status: 'LIVE',
        questionLaunchedAt: Date.now(),
        remainingSeconds: prev.remainingSeconds > 0 ? prev.remainingSeconds : 15,
      };
      break;
    }

    case 'NEXT_QUESTION': {
      const nextIdx = Math.min(prev.currentQuestionIndex + 1, Math.max(0, prev.questions.length - 1));
      const nextQ = prev.questions[nextIdx];
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
        remainingSeconds: prev.status === 'WAITING' ? currentQ?.timerSeconds || 30 : prev.remainingSeconds,
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
      next = { ...prev, soundEnabled: !prev.soundEnabled };
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
              ? { ...p, name: action.payload.name, teamName: action.payload.teamName, shuhba: action.payload.shuhba, shuhbaNo: action.payload.shuhbaNo }
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

  return next;
}

export function updateServerQuizState(action: QuizAction): QuizState {
  const updated = reduceQuizState(globalForQuiz.currentState, action);
  globalForQuiz.currentState = updated;
  persistStateToDisk(updated);
  broadcastQuizAction(action);
  return updated;
}

export function broadcastQuizAction(action: unknown) {
  const data = `data: ${JSON.stringify(action)}\n\n`;

  quizClients.forEach((send) => {
    try {
      send(data);
    } catch {
      quizClients.delete(send);
    }
  });
}

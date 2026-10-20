export type QuizState = 'IDLE' | 'READING' | 'BUZZER_ACTIVE' | 'LOCKED' | 'EVALUATING';

export interface Contestant {
  id: string;
  name: string;
  teamName: string;
  avatarColor: string;
  score: number;
  isConnected: boolean;
  latencyMs: number;
  tabSwitchCount: number;
  isDisqualifiedForQuestion: boolean;
  lastActive: number;
}

export interface BuzzWinner {
  contestantId: string;
  contestantName: string;
  teamName: string;
  avatarColor: string;
  buzzTimestamp: number;
  unlockedTimestamp: number;
  deltaMs: number;
}

export interface QuestionPayload {
  id: string;
  number: number;
  category: string;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  penaltyPoints: number;
  timeLimitSeconds: number;
}

export interface QuizMasterState {
  quizState: QuizState;
  currentQuestionIndex: number;
  currentQuestion: QuestionPayload | null;
  winner: BuzzWinner | null;
  buzzQueue: BuzzWinner[];
  unlockedAt: number | null;
  remainingSeconds: number;
  contestants: Contestant[];
  questions: QuestionPayload[];
  isSoundEnabled: boolean;
  latencySimulationMs: number;
}

export type BuzzerSocketAction =
  | { type: 'STATE_SYNC'; payload: QuizMasterState }
  | { type: 'SET_QUIZ_STATE'; payload: { state: QuizState } }
  | { type: 'SELECT_QUESTION'; payload: { index: number } }
  | { type: 'UNLOCK_BUZZER'; payload: { timestamp: number; duration: number } }
  | { type: 'LOCK_BUZZER' }
  | { type: 'BUZZ_ATTEMPT'; payload: { contestantId: string; clientTimestamp: number } }
  | { type: 'AWARD_POINTS'; payload: { contestantId: string; points: number } }
  | { type: 'PENALTY_POINTS'; payload: { contestantId: string; points: number } }
  | { type: 'PASS_RESET_LOCK' }
  | { type: 'RESET_QUESTION' }
  | { type: 'REGISTER_CONTESTANT'; payload: Omit<Contestant, 'score' | 'isConnected' | 'latencyMs' | 'tabSwitchCount' | 'isDisqualifiedForQuestion' | 'lastActive'> }
  | { type: 'TAB_SWITCH'; payload: { contestantId: string } }
  | { type: 'UPDATE_LATENCY'; payload: { contestantId: string; latencyMs: number } }
  | { type: 'RESET_ALL_SCORES' };

export type QuizStatus = 'WAITING' | 'LIVE' | 'LOCKED' | 'REVEALED';

export type OptionId = string;

export interface Option {
  id: OptionId;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: OptionId;
  timerSeconds: number;
  category?: string;
  explanation?: string;
  points: number;
}

export interface ParticipantResponse {
  participantId: string;
  participantName: string;
  teamName: string;
  shuhba?: string;
  shuhbaNo?: string;
  selectedOptionId: OptionId;
  submittedAt: number;
  deltaMs: number;
  isCorrect?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  teamName: string;
  shuhba?: string;
  shuhbaNo?: string;
  score: number;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  status: QuizStatus;
  questionLaunchedAt: number | null;
  remainingSeconds: number;
  responses: ParticipantResponse[];
  participants: Participant[];
  soundEnabled: boolean;
}

export type QuizAction =
  | { type: 'STATE_SYNC'; payload: QuizState }
  | { type: 'SET_STATUS'; payload: QuizStatus }
  | { type: 'BROADCAST_QUESTION'; payload: { questionIndex: number } }
  | { type: 'UNLOCK_ROUND'; payload: { timestamp: number; duration: number } }
  | { type: 'LOCK_ROUND' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'PASS_REOPEN_ROUND' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET_ROUND' }
  | { type: 'SUBMIT_RESPONSE'; payload: ParticipantResponse }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'UPDATE_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: { id: string } }
  | { type: 'REORDER_QUESTIONS'; payload: Question[] }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'RESET_ALL_SCORES' }
  | { type: 'CLEAR_ALL_PARTICIPANTS' }
  | { type: 'REGISTER_PARTICIPANT'; payload: Participant };

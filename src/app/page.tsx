'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Radio,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  LogOut,
  ArrowRight,
  GraduationCap,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useQuiz } from '@/context/QuizStateContext';
import { OptionId, Participant } from '@/types/quiz';
import { OptionCard } from '@/components/quiz/OptionCard';
import { TimerRing } from '@/components/quiz/TimerRing';

const USER_STORAGE_KEY = 'symposium_user_profile';

export default function ParticipantPage() {
  const { state, currentQuestion, submitResponse, toggleSound, registerParticipant } = useQuiz();

  // Current signed-in participant state
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Sign-in form state
  const [inputName, setInputName] = useState<string>('');
  const [inputShuhba, setInputShuhba] = useState<string>('');
  const [inputShuhbaNo, setInputShuhbaNo] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Load saved user profile from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(USER_STORAGE_KEY);
          if (saved) {
            const parsed: Participant = JSON.parse(saved);
            if (parsed && parsed.name) {
              setCurrentUser(parsed);
              registerParticipant(parsed);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load user profile from storage:', e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [registerParticipant]);

  // Keep score updated from state.participants
  const activeParticipant: Participant | null = currentUser
    ? state.participants.find((p) => p.id === currentUser.id) || currentUser
    : null;

  // Find if current participant has submitted an answer for this question
  const existingResponse = activeParticipant
    ? state.responses.find((r) => r.participantId === activeParticipant.id)
    : undefined;

  const selectedOptionId = existingResponse?.selectedOptionId || null;
  const isAnswered = selectedOptionId !== null;

  // Has correct/wrong decision been revealed?
  const isRevealed = state.status === 'REVEALED';
  const isCorrect = isRevealed && selectedOptionId === currentQuestion?.correctOptionId;
  const isWrong = isRevealed && isAnswered && selectedOptionId !== currentQuestion?.correctOptionId;

  // Strict Question Concealment: Conceal question before conductor allows/unlocks
  const isRoundConcealed =
    state.status === 'WAITING' ||
    (state.status === 'LOCKED' && !state.questionLaunchedAt) ||
    state.questions.length === 0;

  // The round is active or revealed only when conductor explicitly launched it
  const isRoundActive =
    !isRoundConcealed &&
    (state.status === 'LIVE' ||
      (state.status === 'LOCKED' && state.questionLaunchedAt !== null) ||
      state.status === 'REVEALED') &&
    state.questions.length > 0;

  // Trigger celebration confetti when participant answers correctly
  useEffect(() => {
    if (isCorrect) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#0ba689', '#006b57', '#67e4cb', '#79f5db'],
      });
    }
  }, [isCorrect]);

  // Handle Sign-in submit
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = inputName.trim();
    const trimmedShuhba = inputShuhba.trim();
    const trimmedShuhbaNo = inputShuhbaNo.trim();
    if (!trimmedName) return;

    const team =
      trimmedShuhba && trimmedShuhbaNo
        ? `${trimmedShuhba} (No. ${trimmedShuhbaNo})`
        : trimmedShuhba || (trimmedShuhbaNo ? `Shuhba No. ${trimmedShuhbaNo}` : `Team ${trimmedName}`);

    const id = currentUser?.id || `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newProfile: Participant = {
      id,
      name: trimmedName,
      shuhba: trimmedShuhba,
      shuhbaNo: trimmedShuhbaNo,
      teamName: team,
      score: activeParticipant?.score || 0,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));
    registerParticipant(newProfile);
    setCurrentUser(newProfile);
    setIsEditingProfile(false);
  };

  // Sign out / Switch user
  const handleSignOut = () => {
    setIsEditingProfile(true);
    setInputName(currentUser?.name || '');
    setInputShuhba(currentUser?.shuhba || '');
    setInputShuhbaNo(currentUser?.shuhbaNo || '');
  };

  // Handle Option selection with zero latency
  const handleSelectOption = (optionId: OptionId) => {
    if (state.status === 'LIVE' && !isAnswered && activeParticipant) {
      submitResponse(
        activeParticipant.id,
        activeParticipant.name,
        activeParticipant.teamName,
        optionId,
        activeParticipant.shuhba,
        activeParticipant.shuhbaNo
      );
    }
  };

  // Graceful institutional loader while storage hydrates (never a blank void)
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-academic-grid text-[#0c1f1b] flex flex-col items-center justify-center p-6 selection:bg-[#7cf8d7] selection:text-[#003328] font-sans">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-[0.25rem] bg-[#006b57] flex items-center justify-center text-white shadow-md shadow-[#006b57]/20">
            <GraduationCap className="w-6 h-6 animate-pulse stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-title-lg text-[#1e332f] tracking-tight">Academic Symposium</h2>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="status-dot w-2 h-2 rounded-full bg-[#0ba689] animate-ping" />
              <span className="font-label-sm text-[#006b57] tracking-[0.08em]">INITIALIZING EXAMINATION PORTAL</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW A: CANDIDATE REGISTRATION (Luminous Emerald Academic)
  // =========================================================
  if (!currentUser || isEditingProfile) {
    return (
      <div className="min-h-screen bg-academic-grid text-[#0c1f1b] flex flex-col justify-between p-4 md:p-12 font-sans selection:bg-[#7cf8d7] selection:text-[#003328]">
        {/* Top Editorial Institutional Banner */}
        <header className="flex items-center justify-between max-w-xl mx-auto w-full pt-2 md:pt-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[0.25rem] bg-[#006b57] flex items-center justify-center shadow-md shadow-[#006b57]/20 text-white">
              <GraduationCap className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <span className="font-title-lg tracking-tight text-[#1e332f] block leading-snug">
                Academic Symposium
              </span>
              <span className="font-label-sm text-[#49625d] tracking-[0.08em] block">
                Official Examination Registry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Indicator Chip */}
            <div className="academic-status-indicator hidden sm:inline-flex">
              <span className="status-dot animate-pulse" />
              <span className="font-label-sm text-[#006b57]">PORTAL ADMISSIBLE</span>
            </div>

            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-[0.25rem] border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                state.soundEnabled
                  ? 'bg-white border-[#0ba689] text-[#0ba689] shadow-xs'
                  : 'bg-[#edf4f2] border-[#dbe6e3] text-[#6d7a75]'
              }`}
              title="Toggle Audio FX"
            >
              {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Center Folio Registration Card */}
        <main className="flex-1 flex items-center justify-center py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl p-6 md:p-10 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-7"
          >
            {/* Catalog Label & Display Headline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="academic-chip px-2.5 py-1">
                  OFFICIAL CANDIDATE MATRICULATION
                </span>
                <span className="text-[11px] font-sans text-[#49625d] font-semibold">
                  • 2026 ACADEMIC CONVOCATION
                </span>
              </div>

              <h1 className="font-headline-lg text-[#1e332f] tracking-tight leading-tight">
                Candidate Examination Entry
              </h1>

              {/* Scholarly Citation Abstract Callout */}
              <div className="scholarly-abstract-callout text-xs md:text-sm leading-relaxed">
                &ldquo;Please record your full scholarly name, designated SHUHBA branch, and numeric designation to authenticate your portal for real-time symposium examination recording.&rdquo;
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSignIn} className="space-y-5 pt-1">
              {/* Candidate Full Name Field */}
              <div>
                <label className="block font-label-md text-[#49625d] mb-1.5 font-bold">
                  Candidate Full Name / Scholar Title <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Abdul Wahid"
                  className="w-full p-3.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-sm md:text-base font-sans font-medium focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20 transition-all placeholder:text-[#6d7a75]"
                />
              </div>

              {/* SHUHBA & SHUHBA NO Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-[#49625d] mb-1.5 font-bold">
                    SHUHBA <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputShuhba}
                    onChange={(e) => setInputShuhba(e.target.value)}
                    placeholder="e.g. Shuhba A or Hifz"
                    className="w-full p-3.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-sm md:text-base font-sans font-medium focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20 transition-all placeholder:text-[#6d7a75]"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-[#49625d] mb-1.5 font-bold">
                    SHUHBA NO <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputShuhbaNo}
                    onChange={(e) => setInputShuhbaNo(e.target.value)}
                    placeholder="e.g. 05"
                    className="w-full p-3.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-sm md:text-base font-sans font-medium focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20 transition-all placeholder:text-[#6d7a75]"
                  />
                </div>
              </div>

              {/* Submit Primary Button (Signature Forest Emerald #0BA689, 0.25rem radius) */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 btn-emerald-primary text-sm md:text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
                >
                  <span className="font-label-md tracking-[0.08em] text-white">AUTHENTICATE &amp; ENTER ARENA</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              </div>

              {currentUser && isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="w-full text-center text-xs text-[#49625d] hover:text-[#006b57] underline font-medium cursor-pointer pt-1"
                >
                  Cancel edits and return to current examination question
                </button>
              )}
            </form>
          </motion.div>
        </main>

        {/* Archival Folio Footer */}
        <footer className="text-center text-xs text-[#49625d] font-sans py-3 max-w-xl mx-auto w-full flex items-center justify-between border-t border-[#dbe6e3]/70">
          <div className="flex items-center gap-2">
            <span className="status-dot w-1.5 h-1.5 rounded-full bg-[#0ba689]" />
            <span className="font-label-sm text-[#49625d]">Zero Latency Pointer Architecture</span>
          </div>
          <span className="font-label-sm text-[#6d7a75]">Symposium Discourse 2026</span>
        </footer>
      </div>
    );
  }

  // =========================================================
  // VIEW B: ACTIVE PARTICIPANT EXAMINATION ARENA (Signed In)
  // =========================================================
  return (
    <div className="min-h-screen bg-academic-grid text-[#0c1f1b] flex flex-col justify-between selection:bg-[#7cf8d7] selection:text-[#003328] font-sans">
      {/* Top Header Navigation (NO ADMIN LINK) */}
      <header className="border-b border-[#dbe6e3] bg-white/95 backdrop-blur-md px-4 md:px-12 py-4 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[0.25rem] bg-[#006b57] flex items-center justify-center shadow-xs text-white">
            <BookOpen className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-title-lg tracking-tight text-[#1e332f]">
                Academic Symposium
              </span>
              <span className="academic-chip px-2.5 py-0.5">
                CANDIDATE LIVE
              </span>
            </div>
            <span className="font-body-sm text-[#49625d] hidden sm:inline">
              Scholarly Assembly &amp; High-Precision Rapid Examination
            </span>
          </div>
        </div>

        {/* Signed In User Badge & Actions */}
        <div className="flex items-center gap-3">
          {/* Candidate Profile Pill */}
          <div className="flex items-center gap-2.5 bg-[#f6faf9] border border-[#dbe6e3] px-3.5 py-1.5 rounded-[0.25rem]">
            <div className="w-6 h-6 rounded-[0.25rem] bg-[#006b57] flex items-center justify-center text-white text-[11px] font-bold">
              {activeParticipant?.name.charAt(0) || 'C'}
            </div>
            <div className="text-left">
              <div className="font-title-md text-xs font-semibold text-[#1e332f] leading-tight">
                {activeParticipant?.name}
              </div>
              <div className="font-label-sm text-[10px] text-[#49625d] leading-tight">
                {activeParticipant?.teamName}
              </div>
            </div>
            <span className="font-serif font-bold text-xs md:text-sm text-[#006b57] pl-2.5 border-l border-[#bccac3]">
              {activeParticipant?.score || 0} PTS
            </span>
          </div>

          {/* Switch User Button */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-[0.25rem] bg-white border border-[#dbe6e3] hover:bg-[#edf4f2] text-[#49625d] hover:text-[#006b57] transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Switch Candidate Profile"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-label-sm">Switch</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-[0.25rem] border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              state.soundEnabled
                ? 'bg-white border-[#0ba689] text-[#0ba689] shadow-xs'
                : 'bg-[#edf4f2] border-[#dbe6e3] text-[#6d7a75]'
            }`}
            title="Toggle Audio FX"
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Examination Screen Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* STAGE 1: ROUND STANDBY • QUESTION STRICTLY CONCEALED      */}
          {/* ========================================================= */}
          {isRoundConcealed && (
            <motion.div
              key="stage-concealed"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="flex flex-col items-center text-center max-w-xl w-full space-y-6"
            >
              {/* Institutional Status Badge */}
              <div className="academic-status-indicator">
                <span className="status-dot animate-ping" />
                <span className="font-label-md text-[#006b57] tracking-[0.08em]">
                  ROUND STANDBY • QUESTION CONCEALED
                </span>
              </div>

              {/* Concealed Hero Folio Card */}
              <div className="w-full p-8 md:p-12 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow flex flex-col items-center space-y-6">
                <div className="w-16 h-16 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] flex items-center justify-center text-[#006b57] relative shadow-xs">
                  <Lock className="w-8 h-8 text-[#0ba689]" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="academic-chip px-2.5 py-1">
                      Question #{state.currentQuestionIndex + 1} of {Math.max(1, state.questions.length)}
                    </span>
                    <span className="font-label-sm text-[#49625d]">
                      {currentQuestion?.category || 'General Science'}
                    </span>
                    <span className="font-serif text-[#006b57] font-bold text-xs">
                      +{currentQuestion?.points || 10} PTS
                    </span>
                  </div>

                  <h2 className="font-headline-lg text-[#1e332f] tracking-tight">
                    {state.questions.length === 0
                      ? 'Awaiting Examination Questions'
                      : 'Question Concealed by Conductor'}
                  </h2>

                  {/* Scholarly Citation Callout */}
                  <div className="scholarly-abstract-callout text-left text-xs md:text-sm leading-relaxed">
                    {state.questions.length === 0
                      ? 'The academic chair is currently organizing the official questions in the moderator deck. Your touchscreen terminal is calibrated and will activate immediately.'
                      : `Institutional examination protocol active. The official examination prompt and answer options are concealed on all participant terminals. The moment the academic moderator unlocks the round, the question prompt and rapid buzzer options will display instantly.`}
                  </div>
                </div>

                {/* Candidate Credentials Card */}
                <div className="w-full p-3.5 rounded-[0.25rem] bg-[#f6faf9] border border-[#dbe6e3] flex items-center justify-between text-xs font-sans text-[#49625d] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-[#6d7a75]">CANDIDATE:</span>
                    <strong className="text-[#006b57] font-semibold">{activeParticipant?.name}</strong>
                    <span>({activeParticipant?.teamName})</span>
                  </div>
                  <div className="font-serif font-bold text-[#0ba689]">
                    SCORE: {activeParticipant?.score || 0} PTS
                  </div>
                </div>
              </div>

              <span className="font-label-sm text-[#49625d] tracking-[0.05em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0ba689] animate-pulse" />
                TOUCH TERMINAL ARMED • ZERO-LATENCY STANDBY
              </span>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STAGES 2, 3 & 4: QUESTION LIVE, ANSWERED, OR REVEALED     */}
          {/* ========================================================= */}
          {isRoundActive && (
            <motion.div
              key="stage-interactive"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col space-y-6"
            >
              {/* Question Header & Radial Timer Ring */}
              <div className="p-6 md:p-8 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 flex-1 text-left">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="academic-chip px-2.5 py-1">
                      Question #{state.currentQuestionIndex + 1}
                    </span>
                    <span className="font-label-sm text-[#49625d]">
                      {currentQuestion?.category || 'General Science'}
                    </span>
                    <span className="font-serif text-[#006b57] font-bold text-xs">
                      +{currentQuestion?.points || 10} PTS
                    </span>
                  </div>

                  <h1 className="font-headline-lg text-[#1e332f] tracking-tight leading-snug">
                    {currentQuestion?.text}
                  </h1>
                </div>

                {/* Animated SVG Radial Timer Ring (Emerald Stroke, Soft Sage Track) */}
                <div className="shrink-0">
                  <TimerRing
                    remainingSeconds={state.remainingSeconds}
                    totalSeconds={currentQuestion?.timerSeconds || 30}
                    size={92}
                    strokeWidth={7}
                  />
                </div>
              </div>

              {/* Status Banner when Answer Selected / Locked / Revealed */}
              <AnimatePresence>
                {/* STAGE 3: Response Recorded Acknowledgment */}
                {isAnswered && !isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="scholarly-abstract-callout not-italic flex items-center justify-between text-xs md:text-sm text-[#003328]"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#0ba689] shrink-0" />
                      <span className="font-medium">
                        Submission locked for Option <strong>{selectedOptionId}</strong>. Awaiting official conductor adjudication.
                      </span>
                    </div>
                    <span className="font-label-sm text-[#006b57] font-bold shrink-0 ml-2">
                      +{( (existingResponse?.deltaMs || 0) / 1000).toFixed(2)}s
                    </span>
                  </motion.div>
                )}

                {/* STAGE 4: Verdict Revealed Acknowledgment */}
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCorrect
                        ? 'bg-[#e2f8f2] border-[#0ba689] text-[#003328] shadow-[0_8px_24px_-4px_rgba(11,166,137,0.18)]'
                        : isWrong
                        ? 'bg-[#ffdad6] border-[#ba1a1a] text-[#93000a]'
                        : 'bg-white border-[#dbe6e3] text-[#1e332f]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-headline-sm text-base md:text-xl">
                        {isCorrect ? (
                          <>
                            <Sparkles className="w-5 h-5 text-[#0ba689]" />
                            <span>Correct Verdict! +{currentQuestion?.points || 10} Points Conferred</span>
                          </>
                        ) : isWrong ? (
                          <>
                            <AlertCircle className="w-5 h-5 text-[#ba1a1a]" />
                            <span>Incorrect Verdict</span>
                          </>
                        ) : (
                          <span>Round Concluded</span>
                        )}
                      </div>
                      {currentQuestion?.explanation && (
                        <p className="font-body-md text-xs md:text-sm text-[#49625d] mt-2 italic font-serif">
                          &ldquo;{currentQuestion.explanation}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 text-xs text-[#49625d]">
                      Official Resolution:{' '}
                      <strong className="text-[#006b57] text-base font-serif font-bold">
                        Option {currentQuestion?.correctOptionId}
                      </strong>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Interactive Option Cards (Any number of options: 1, 2, 3, 4, 5+ in Noto Serif) */}
              <div
                className={`grid gap-4 ${
                  (currentQuestion?.options || []).length === 1
                    ? 'grid-cols-1 max-w-xl mx-auto w-full'
                    : (currentQuestion?.options || []).length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : (currentQuestion?.options || []).length >= 5
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {(currentQuestion?.options || []).map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrectOpt = opt.id === currentQuestion?.correctOptionId;
                  const isWrongOpt = isSelected && !isCorrectOpt;

                  return (
                    <OptionCard
                      key={opt.id}
                      id={opt.id}
                      text={opt.text}
                      isSelected={isSelected}
                      isDisabled={state.status !== 'LIVE' || isAnswered}
                      isRevealed={isRevealed}
                      isCorrect={isCorrectOpt}
                      isWrong={isWrongOpt}
                      onSelect={handleSelectOption}
                    />
                  );
                })}
              </div>

              {/* Instructions Prompt */}
              <div className="text-center font-label-sm text-[#49625d] pt-1">
                {state.status === 'LIVE' && !isAnswered && (
                  <span className="text-[#006b57] font-bold animate-pulse">
                    Select your answer now • Zero-delay pointer response active
                  </span>
                )}
                {state.status === 'LOCKED' && !isRevealed && (
                  <span>Round closed by conductor. Official answer revealing momentarily...</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Footer Info */}
      <footer className="border-t border-[#dbe6e3] bg-white/90 backdrop-blur-md px-6 md:px-12 py-3.5 flex items-center justify-between text-xs text-[#49625d] z-20">
        <div className="flex items-center gap-2.5">
          <span className="status-dot w-2 h-2 rounded-full bg-[#0ba689] animate-pulse" />
          <span className="font-semibold text-[#1e332f]">{activeParticipant?.name}</span>
          <span>•</span>
          <span className="font-label-sm">{activeParticipant?.teamName}</span>
        </div>
        <div className="font-label-sm text-[#6d7a75] hidden sm:block">
          Symposium Academic Discourse Platform • Luminous Emerald Academic
        </div>
      </footer>
    </div>
  );
}

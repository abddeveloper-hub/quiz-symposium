'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Play,
  Lock,
  Eye,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Users,
  ExternalLink,
  Volume2,
  VolumeX,
  Radio,
  ChevronRight,
  X,
  Save,
  Check,
  Smartphone,
  Copy,
  QrCode,
  GraduationCap,
} from 'lucide-react';
import { useQuiz } from '@/context/QuizStateContext';
import { Question, OptionId } from '@/types/quiz';
import { TimerRing } from '@/components/quiz/TimerRing';

export default function AdminPage() {
  const {
    state,
    currentQuestion,
    broadcastQuestion,
    unlockRound,
    lockRound,
    revealAnswer,
    passAndReopenRound,
    nextQuestion,
    resetRound,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleSound,
    resetAllScores,
    clearAllParticipants,
  } = useQuiz();

  const [activeTab, setActiveTab] = useState<'conductor' | 'manager'>('conductor');

  // Quick Edit Modal State (can be opened from Conductor or Queue)
  const [modalQuestion, setModalQuestion] = useState<Question | null>(null);
  const [modalText, setModalText] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalTimer, setModalTimer] = useState<number>(30);
  const [modalPoints, setModalPoints] = useState<number>(10);
  const [modalExplanation, setModalExplanation] = useState<string>('');
  const [modalOptions, setModalOptions] = useState<{ id: OptionId; text: string }[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [modalCorrectOption, setModalCorrectOption] = useState<OptionId>('A');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // QR Modal State
  const PUBLIC_GITHUB_URL = 'https://abddeveloper-hub.github.io/quiz-symposium/';
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [networkUrl, setNetworkUrl] = useState<string>(PUBLIC_GITHUB_URL);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(true);
  const [detectedIp, setDetectedIp] = useState<string>('10.254.84.8');
  const [customIp, setCustomIp] = useState<string>('10.254.84.8');

  // Initialize network URL
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      setNetworkUrl(PUBLIC_GITHUB_URL);
      setIsPublicMode(true);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for editing any question
  const openEditModal = (q: Question) => {
    setModalQuestion(q);
    setModalText(q.text);
    setModalCategory(q.category || 'General Science');
    setModalTimer(q.timerSeconds);
    setModalPoints(q.points);
    setModalExplanation(q.explanation || '');
    setModalOptions(q.options.map((opt) => ({ ...opt })));
    setModalCorrectOption(q.correctOptionId);
  };

  const closeEditModal = () => {
    setModalQuestion(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQuestion || !modalText.trim()) return;

    const updatedQ: Question = {
      ...modalQuestion,
      text: modalText.trim(),
      category: modalCategory.trim(),
      timerSeconds: Number(modalTimer) || 30,
      points: Number(modalPoints) || 10,
      explanation: modalExplanation.trim(),
      options: modalOptions.map((opt) => ({
        id: opt.id,
        text: opt.text.trim() || `Option ${opt.id}`,
      })),
      correctOptionId: modalCorrectOption,
    };

    updateQuestion(updatedQ);
    closeEditModal();
    showToast(`Question updated successfully and synced live!`);
  };

  // Form State in Manager Tab (for creating new or editing inline)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('General Science');
  const [formTimer, setFormTimer] = useState<number>(30);
  const [formPoints, setFormPoints] = useState<number>(10);
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formOptions, setFormOptions] = useState<{ id: OptionId; text: string }[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [formCorrectOption, setFormCorrectOption] = useState<OptionId>('A');

  const startEditManager = (q: Question) => {
    setEditingId(q.id);
    setFormText(q.text);
    setFormCategory(q.category || 'General Science');
    setFormTimer(q.timerSeconds);
    setFormPoints(q.points);
    setFormExplanation(q.explanation || '');
    setFormOptions(q.options.map((opt) => ({ ...opt })));
    setFormCorrectOption(q.correctOptionId);
    setActiveTab('manager');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormText('');
    setFormCategory('General Science');
    setFormTimer(30);
    setFormPoints(10);
    setFormExplanation('');
    setFormOptions([
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ]);
    setFormCorrectOption('A');
  };

  const handleSaveQuestionManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const qData: Question = {
      id: editingId || `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: formText.trim(),
      category: formCategory.trim(),
      timerSeconds: Number(formTimer) || 30,
      points: Number(formPoints) || 10,
      explanation: formExplanation.trim(),
      options: formOptions.map((opt) => ({
        id: opt.id,
        text: opt.text.trim() || `Option ${opt.id}`,
      })),
      correctOptionId: formCorrectOption,
    };

    if (editingId) {
      updateQuestion(qData);
      showToast('Question updated successfully!');
    } else {
      addQuestion(qData);
      showToast('New question added to repository!');
    }
    resetForm();
  };

  return (
    <div className="min-h-screen bg-academic-grid text-[#0c1f1b] flex flex-col p-4 md:p-6 lg:p-8 relative font-sans selection:bg-[#7cf8d7] selection:text-[#003328]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-[0.25rem] bg-[#e2f8f2] border border-[#0ba689] text-[#003328] text-xs font-semibold flex items-center gap-2 shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0ba689]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.25rem] bg-[#006b57] flex items-center justify-center text-white shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif font-semibold text-lg md:text-xl text-[#1e332f] tracking-tight">
                Academic Symposium Conductor
              </h1>
              <span className="academic-chip px-2 py-0.5">
                MODERATOR DECK
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db] text-[#006b57] font-semibold flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ba689] animate-pulse" />
                Real-Time LAN &amp; SSE Sync
              </span>
            </div>
            <p className="text-xs text-[#49625d] mt-0.5">
              Live Examination Conductor & Question Repository Management
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Tab Buttons */}
          <div className="flex items-center p-1 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] text-xs font-medium">
            <button
              onClick={() => setActiveTab('conductor')}
              className={`px-3 py-1.5 rounded-[0.25rem] transition-all cursor-pointer ${
                activeTab === 'conductor'
                  ? 'bg-[#0ba689] text-white font-semibold shadow-xs'
                  : 'text-[#49625d] hover:text-[#006b57]'
              }`}
            >
              Live Conductor
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-3 py-1.5 rounded-[0.25rem] transition-all cursor-pointer ${
                activeTab === 'manager'
                  ? 'bg-[#0ba689] text-white font-semibold shadow-xs'
                  : 'text-[#49625d] hover:text-[#006b57]'
              }`}
            >
              Question Manager ({state.questions.length})
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-[0.25rem] border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
              state.soundEnabled
                ? 'bg-white border-[#0ba689] text-[#0ba689] shadow-xs'
                : 'bg-[#edf4f2] border-[#dbe6e3] text-[#6d7a75]'
            }`}
            title="Toggle Web Audio"
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.25rem] bg-[#006b57] hover:bg-[#005141] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            title="Show Participant URL and QR Code for mobile phones"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Connect Phones (QR)</span>
          </button>

          {/* Live Candidates Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-xs font-semibold text-[#1e332f] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0ba689] animate-pulse" />
            <Users className="w-3.5 h-3.5 text-[#0ba689]" />
            <span>{state.participants.length} Candidates</span>
          </div>

          {/* Participant Portal Link */}
          <a
            href={networkUrl || PUBLIC_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.25rem] bg-white hover:bg-[#f6faf9] border border-[#0ba689] text-xs text-[#0ba689] font-semibold transition-all shadow-xs"
            title="Open Participant Screen in new tab for testing"
          >
            <span>Candidate View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Screen Body */}
      {activeTab === 'conductor' ? (
        /* ========================================================= */
        /* TAB 1: LIVE CONDUCTOR PANEL (12-Column Grid)              */
        /* ========================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* LEFT 4 COLS: Active Question Display & Queue */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Active Question Box with Direct Edit Button */}
            <div className="p-5 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-4">
              {currentQuestion ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-3">
                    <span className="text-xs uppercase text-[#006b57] font-bold flex items-center gap-1.5 tracking-wider">
                      <Radio className="w-4 h-4 text-[#0ba689]" />
                      Active Round #{state.currentQuestionIndex + 1} / {state.questions.length}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-[0.25rem] flex items-center gap-1.5 ${
                          state.status === 'LIVE'
                            ? 'bg-[#e2f8f2] text-[#006b57] border border-[#79f5db] animate-pulse'
                            : state.status === 'REVEALED'
                            ? 'bg-[#006b57] text-white'
                            : state.status === 'LOCKED' && state.questionLaunchedAt
                            ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/40'
                            : 'bg-[#edf4f2] text-[#006b57] border border-[#dbe6e3]'
                        }`}
                      >
                        {state.status === 'LIVE' ? (
                          <>
                            <Radio className="w-3.5 h-3.5 text-[#0ba689]" />
                            <span>PHONES LIVE</span>
                          </>
                        ) : state.status === 'REVEALED' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>PHONES REVEALED</span>
                          </>
                        ) : state.status === 'LOCKED' && state.questionLaunchedAt ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-[#ba1a1a]" />
                            <span>PHONES LOCKED</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-[#0ba689]" />
                            <span>PHONES CONCEALED</span>
                          </>
                        )}
                      </span>

                      {/* DIRECT EDIT BUTTON */}
                      <button
                        onClick={() => openEditModal(currentQuestion)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-[0.25rem] bg-white hover:bg-[#f6faf9] border border-[#0ba689] text-[#0ba689] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        title="Edit active question prompt and options"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text in Noto Serif */}
                  <div className="p-4 rounded-[0.25rem] bg-[#f6faf9] border border-[#dbe6e3] text-sm md:text-base font-serif font-medium leading-relaxed text-[#1e332f]">
                    {currentQuestion.text}
                  </div>

                  {/* Options Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#49625d] font-bold">
                      <span>Examination Options</span>
                      <span className="text-[#006b57] font-bold">
                        Key: Option {currentQuestion.correctOptionId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {currentQuestion.options.map((opt) => {
                        const isCorrect = opt.id === currentQuestion.correctOptionId;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-[0.25rem] border text-xs flex items-center justify-between transition-all ${
                              state.status === 'REVEALED' && isCorrect
                                ? 'bg-[#e2f8f2] border-[#0ba689] text-[#003328] font-semibold'
                                : isCorrect
                                ? 'bg-white border-[#79f5db] text-[#006b57]'
                                : 'bg-white border-[#dbe6e3] text-[#1e332f]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] flex items-center justify-center font-serif font-bold text-[#006b57]">
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] text-[#006b57] font-bold px-2 py-0.5 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db]">
                                CORRECT
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scholarly Explanation Note if Revealed */}
                  {state.status === 'REVEALED' && currentQuestion.explanation && (
                    <div className="scholarly-callout p-3 rounded-[0.25rem] text-xs text-[#1e332f] leading-normal">
                      <span className="font-bold not-italic block mb-0.5 text-[#006b57]">
                        Scholarly Rationale:
                      </span>
                      {currentQuestion.explanation}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] flex items-center justify-center text-[#006b57] mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#1e332f] text-base">
                      No Questions in Repository
                    </h3>
                    <p className="text-xs text-[#49625d] max-w-xs mx-auto mt-1">
                      Start by adding your official symposium questions using the Question Manager tab.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('manager')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[0.25rem] bg-[#0ba689] hover:bg-[#088f75] text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Question</span>
                  </button>
                </div>
              )}
            </div>

            {/* Question Selector Queue List with Direct Edit Icon */}
            <div className="p-4 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow">
              <span className="text-xs uppercase tracking-wider text-[#49625d] mb-3 block font-bold">
                Question Queue (Select to broadcast or edit)
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {state.questions.length === 0 ? (
                  <div className="py-6 px-3 text-center text-xs text-[#6d7a75]">
                    Question repository is currently empty.
                  </div>
                ) : (
                  state.questions.map((q, idx) => (
                    <div
                      key={`queue-${q.id || 'q'}-${idx}`}
                      className={`w-full px-3 py-2 rounded-[0.25rem] text-xs flex items-center justify-between transition-all ${
                        idx === state.currentQuestionIndex
                          ? 'bg-[#e2f8f2] border border-[#0ba689] text-[#003328] font-medium'
                          : 'bg-white hover:bg-[#f6faf9] border border-transparent text-[#49625d]'
                      }`}
                    >
                      <button
                        onClick={() => broadcastQuestion(idx)}
                        className="flex-1 text-left truncate mr-2 cursor-pointer font-serif"
                        title="Broadcast this question"
                      >
                        #{idx + 1}: {q.text}
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[0.25rem] bg-[#edf4f2] text-[#49625d] font-semibold">
                          {q.timerSeconds}s
                        </span>
                        {/* Direct Edit icon */}
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1 rounded-[0.25rem] hover:bg-[#edf4f2] text-[#6d7a75] hover:text-[#006b57] transition-all cursor-pointer"
                          title="Edit this question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CENTER 5 COLS: Conductor Deck & Triggers */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-5 md:p-6 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-5">
              <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-3">
                <div>
                  <h2 className="text-base font-serif font-semibold text-[#1e332f] tracking-tight">
                    Conductor Triggers
                  </h2>
                  <p className="text-xs text-[#49625d]">
                    Coordinate participant timers, buzzer access, and verdict revelation
                  </p>
                </div>

                {/* Round Timer Ring */}
                <div className="scale-75 origin-right">
                  <TimerRing
                    remainingSeconds={state.remainingSeconds}
                    totalSeconds={currentQuestion?.timerSeconds || 30}
                    size={70}
                    strokeWidth={6}
                  />
                </div>
              </div>

              {/* PRIMARY TRIGGER: Unlock Round / Enable Options */}
              <motion.button
                id="admin-btn-unlock"
                onClick={unlockRound}
                disabled={state.status === 'LIVE' || state.questions.length === 0}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 px-6 rounded-[0.25rem] font-bold text-sm md:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md ${
                  state.questions.length === 0
                    ? 'bg-[#edf4f2] text-[#6d7a75] border border-[#dbe6e3] cursor-not-allowed shadow-none'
                    : state.status === 'LIVE'
                    ? 'bg-[#006b57] text-white ring-4 ring-[#79f5db]/50 animate-pulse'
                    : 'bg-[#0ba689] hover:bg-[#088f75] text-white shadow-[#0ba689]/25'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {state.questions.length === 0
                    ? 'NO QUESTIONS LOADED - CREATE IN MANAGER'
                    : state.status === 'LIVE'
                    ? `ROUND LIVE • ${state.remainingSeconds}s`
                    : 'UNLOCK QUESTION & BUZZER (BROADCAST TO PHONES)'}
                </span>
              </motion.button>

              <div className="text-[11px] text-[#49625d] text-center -mt-2">
                {state.status === 'LIVE' ? (
                  <span className="text-[#006b57] font-semibold flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ba689] animate-ping" />
                    Question displayed & buzzer options live on all contestant phones
                  </span>
                ) : (
                  <span>
                    Question prompt & options remain strictly concealed on phones until you click Unlock.
                  </span>
                )}
              </div>

              {/* SECONDARY CONDUCTOR TRIGGERS */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="admin-btn-reveal"
                  onClick={revealAnswer}
                  disabled={state.status === 'REVEALED'}
                  className="py-3 px-4 rounded-[0.25rem] bg-[#006b5c] hover:bg-[#005145] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Correct Answer</span>
                </button>

                <button
                  id="admin-btn-lock"
                  onClick={lockRound}
                  disabled={state.status === 'LOCKED'}
                  className="py-3 px-4 rounded-[0.25rem] bg-white hover:bg-[#f6faf9] disabled:opacity-40 text-[#1e332f] border border-[#dbe6e3] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Lock className="w-4 h-4 text-[#6d7a75]" />
                  <span>Halt / Lock Round</span>
                </button>

                <button
                  id="admin-btn-pass"
                  onClick={passAndReopenRound}
                  className="py-3 px-4 rounded-[0.25rem] bg-[#f6faf9] hover:bg-[#edf4f2] border border-[#dbe6e3] text-[#006b57] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <SkipForward className="w-4 h-4 text-[#0ba689]" />
                  <span>Pass / Re-open Round</span>
                </button>

                <button
                  id="admin-btn-next"
                  onClick={nextQuestion}
                  disabled={state.currentQuestionIndex >= state.questions.length - 1}
                  className="py-3 px-4 rounded-[0.25rem] bg-[#e2f8f2] hover:bg-[#ddf3ec] border border-[#79f5db] disabled:opacity-40 text-[#006b57] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <ChevronRight className="w-4 h-4 text-[#006b57]" />
                  <span>Next Question</span>
                </button>
              </div>

              {/* EMERGENCY ROUND RESET */}
              <div className="pt-2 border-t border-[#dbe6e3] flex items-center justify-between text-xs text-[#49625d] flex-wrap gap-2">
                <button
                  onClick={resetRound}
                  className="flex items-center gap-1.5 text-[#ba1a1a] hover:text-[#93000a] underline underline-offset-4 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Emergency Round Reset</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={resetAllScores}
                    className="text-[#6d7a75] hover:text-[#1e332f] cursor-pointer"
                  >
                    Reset Scores
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear all registered participants?')) {
                        clearAllParticipants();
                        showToast('All participant data cleared!');
                      }
                    }}
                    className="text-[#ba1a1a] hover:underline cursor-pointer"
                  >
                    Clear All Participants
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PARTICIPANT RESPONSE BOARD */}
            <div className="p-5 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-3">
              <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-2">
                <span className="text-xs uppercase tracking-wider text-[#1e332f] font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0ba689]" />
                  Participant Responses ({state.responses.length})
                </span>
                <span className="text-[11px] text-[#006b57] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ba689] animate-pulse" />
                  Real-time Sync Active
                </span>
              </div>

              {state.responses.length === 0 ? (
                <div className="py-8 text-center text-[#6d7a75] text-xs">
                  No responses recorded yet for this question round.
                  <p className="mt-1 text-[11px] text-[#49625d]">
                    Unlock the buzzer to enable candidates to select their answer.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {state.responses.map((resp, i) => {
                    const isCorrect = resp.selectedOptionId === currentQuestion?.correctOptionId;
                    return (
                      <div
                        key={resp.participantId}
                        className={`p-3 rounded-[0.25rem] border flex items-center justify-between text-xs transition-all ${
                          state.status === 'REVEALED'
                            ? isCorrect
                              ? 'bg-[#e2f8f2] border-[#0ba689] text-[#003328]'
                              : 'bg-[#ffdad6] border-[#ba1a1a]/40 text-[#93000a]'
                            : 'bg-[#f6faf9] border-[#dbe6e3] text-[#1e332f]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-[0.25rem] bg-[#edf4f2] text-[#006b57] flex items-center justify-center font-serif font-bold">
                            #{i + 1}
                          </span>
                          <div>
                            <span className="font-semibold block text-[#1e332f]">
                              {resp.participantName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#006b57] font-semibold px-1.5 py-0.2 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db]">
                                {resp.teamName}
                              </span>
                              <span className="text-[10px] text-[#6d7a75]">
                                +{(resp.deltaMs / 1000).toFixed(2)}s
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-[0.25rem] bg-white border border-[#dbe6e3] font-serif font-bold text-sm text-[#006b57]">
                            Option {resp.selectedOptionId}
                          </span>
                          {state.status === 'REVEALED' && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-[0.25rem] font-bold ${
                                isCorrect
                                  ? 'bg-[#006b57] text-white'
                                  : 'bg-[#ba1a1a] text-white'
                              }`}
                            >
                              {isCorrect ? '+10 PTS' : 'INCORRECT'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 3 COLS: Roster & Scoreboard */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="p-4 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-3">
              <span className="text-xs uppercase tracking-wider text-[#1e332f] font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0ba689]" />
                Participant Standings ({state.participants.length})
              </span>

              <div className="space-y-2">
                {state.participants.length === 0 ? (
                  <div className="py-6 px-3 text-center text-xs text-[#6d7a75]">
                    No participants registered yet.
                    <p className="mt-1 text-[11px] text-[#49625d]">
                      Candidates will appear live here as soon as they sign in on their devices.
                    </p>
                  </div>
                ) : (
                  state.participants.map((p) => {
                    const responded = state.responses.find((r) => r.participantId === p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-[0.25rem] bg-[#f6faf9] border border-[#dbe6e3] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-[#1e332f]">
                            <span>{p.teamName}</span>
                            {responded && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0ba689]" title="Submitted" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#49625d]">{p.name}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-serif font-bold text-[#006b57]">
                            {p.score}
                          </span>
                          <span className="text-[10px] text-[#49625d] block">PTS</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* TAB 2: QUESTION MANAGER (Add, Edit, Delete Form)          */
        /* ========================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Form Section (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow">
            <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-4 mb-5">
              <div>
                <h2 className="text-lg font-serif font-semibold text-[#1e332f] tracking-tight flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#0ba689]" />
                  {editingId ? 'Edit Question' : 'Add New Symposium Question'}
                </h2>
                <p className="text-xs text-[#49625d]">
                  Configure question prompt, 4 options, correct answer toggle, and timer duration
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-[0.25rem] bg-[#edf4f2] hover:bg-[#e2f8f2] text-xs text-[#006b57] border border-[#dbe6e3] cursor-pointer font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Editing alert indicator */}
            {editingId && (
              <div className="mb-4 p-3 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db] flex items-center justify-between text-xs text-[#003328]">
                <span className="flex items-center gap-2 font-medium">
                  <Edit3 className="w-4 h-4 text-[#0ba689]" />
                  Currently modifying existing question. Changes will synchronize live!
                </span>
                <button
                  onClick={resetForm}
                  className="text-[#006b57] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            <form onSubmit={handleSaveQuestionManager} className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1.5 font-bold">
                  Question Prompt Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Which physical principle allows quantum computers to perform complex operations..."
                  className="w-full p-3 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-sm focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                />
              </div>

              {/* Meta row: Category, Timer, Points */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                    Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={formTimer}
                    onChange={(e) => setFormTimer(Number(e.target.value))}
                    className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                  />
                </div>
              </div>

              {/* 4 Options with Correct Answer Toggle */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-2 font-bold">
                  Multiple Choice Options & Correct Key (Click letter button to set correct answer)
                </label>
                <div className="space-y-2.5">
                  {formOptions.map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-2.5 rounded-[0.25rem] border ${
                        formCorrectOption === opt.id
                          ? 'bg-[#e2f8f2] border-[#0ba689]'
                          : 'bg-white border-[#dbe6e3]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setFormCorrectOption(opt.id)}
                        className={`w-8 h-8 rounded-[0.25rem] flex items-center justify-center font-serif font-bold text-xs shrink-0 cursor-pointer transition-all ${
                          formCorrectOption === opt.id
                            ? 'bg-[#0ba689] text-white shadow-xs'
                            : 'bg-[#edf4f2] text-[#49625d] hover:bg-[#e2f8f2]'
                        }`}
                        title="Mark as correct answer"
                      >
                        {opt.id}
                      </button>

                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[i].text = e.target.value;
                          setFormOptions(updated);
                        }}
                        placeholder={`Option ${opt.id} text...`}
                        className="flex-1 bg-transparent border-0 text-[#1e332f] text-xs md:text-sm focus:outline-none"
                      />

                      {formCorrectOption === opt.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-[0.25rem] bg-[#006b57] text-white shrink-0">
                          CORRECT ANSWER
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation Text */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                  Explanation / Reference Notes (Shown when verdict is revealed)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Scholarly citation, theory, or reasoning..."
                  className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[0.25rem] bg-[#0ba689] hover:bg-[#088f75] text-white font-semibold text-xs shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Save & Update Question' : 'Save & Append Question'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Questions Repository List (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-lg bg-white border border-[#dbe6e3] ambient-emerald-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#49625d] font-bold">
                Question Inventory ({state.questions.length})
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#006b57] font-semibold hover:text-[#0ba689] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Question
              </button>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {state.questions.length === 0 ? (
                <div className="py-12 text-center text-[#6d7a75] text-xs">
                  Repository is empty. Use the form on the left to add your first symposium question!
                </div>
              ) : (
                state.questions.map((q, idx) => {
                const isBeingEdited = editingId === q.id;
                return (
                  <div
                    key={`inv-${q.id || 'q'}-${idx}`}
                    className={`p-4 rounded-[0.25rem] border space-y-2 relative transition-all ${
                      isBeingEdited
                        ? 'bg-[#e2f8f2] border-[#0ba689] shadow-sm'
                        : 'bg-[#f6faf9] border-[#dbe6e3]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-[#006b57] font-bold">
                        #{idx + 1} • {q.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditManager(q)}
                          className="px-2 py-1 rounded-[0.25rem] bg-white hover:bg-[#edf4f2] text-[#49625d] hover:text-[#006b57] border border-[#dbe6e3] transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Edit this question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="p-1 rounded-[0.25rem] hover:bg-[#ffdad6] text-[#6d7a75] hover:text-[#ba1a1a] transition-all cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-serif text-[#1e332f] font-medium leading-relaxed">
                      {q.text}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[10px] text-[#49625d]">
                      <span className="text-[#006b57] font-bold">
                        Ans: Option {q.correctOptionId}
                      </span>
                      <span>•</span>
                      <span>{q.timerSeconds}s</span>
                      <span>•</span>
                      <span>+{q.points}pts</span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK EDIT MODAL OVERLAY (Usable from anywhere)           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {modalQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1f1b]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-2xl bg-white border border-[#dbe6e3] rounded-lg p-6 shadow-2xl ambient-emerald-shadow space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] flex items-center justify-center text-[#006b57]">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#1e332f] text-base">Edit Question</h3>
                    <p className="text-xs text-[#49625d]">
                      Modify prompt, options, answer key, and timer
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeEditModal}
                  className="p-1.5 rounded-[0.25rem] text-[#6d7a75] hover:text-[#1e332f] hover:bg-[#edf4f2] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                {/* Prompt Text */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                    Question Prompt Text *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    className="w-full p-3 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-sm font-medium focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                  />
                </div>

                {/* Category, Timer, Points */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                      Category
                    </label>
                    <input
                      type="text"
                      value={modalCategory}
                      onChange={(e) => setModalCategory(e.target.value)}
                      className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                      Timer (Seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={modalTimer}
                      onChange={(e) => setModalTimer(Number(e.target.value))}
                      className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={modalPoints}
                      onChange={(e) => setModalPoints(Number(e.target.value))}
                      className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                    />
                  </div>
                </div>

                {/* 4 Options & Correct Answer Radio */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-2 font-bold">
                    Options & Correct Key (Click letter to toggle correct answer)
                  </label>
                  <div className="space-y-2">
                    {modalOptions.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-2.5 rounded-[0.25rem] border ${
                          modalCorrectOption === opt.id
                            ? 'bg-[#e2f8f2] border-[#0ba689]'
                            : 'bg-white border-[#dbe6e3]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setModalCorrectOption(opt.id)}
                          className={`w-8 h-8 rounded-[0.25rem] flex items-center justify-center font-serif font-bold text-xs shrink-0 cursor-pointer transition-all ${
                            modalCorrectOption === opt.id
                              ? 'bg-[#0ba689] text-white shadow-xs'
                              : 'bg-[#edf4f2] text-[#49625d] hover:bg-[#e2f8f2]'
                          }`}
                          title="Mark as correct answer"
                        >
                          {opt.id}
                        </button>

                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...modalOptions];
                            updated[i].text = e.target.value;
                            setModalOptions(updated);
                          }}
                          placeholder={`Option ${opt.id} text...`}
                          className="flex-1 bg-transparent border-0 text-[#1e332f] text-xs md:text-sm focus:outline-none"
                        />

                        {modalCorrectOption === opt.id && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[0.25rem] bg-[#006b57] text-white shrink-0">
                            CORRECT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#49625d] mb-1 font-bold">
                    Explanation / Solution Details
                  </label>
                  <textarea
                    rows={2}
                    value={modalExplanation}
                    onChange={(e) => setModalExplanation(e.target.value)}
                    placeholder="Scholarly rationale or solution notes..."
                    className="w-full p-2.5 rounded-[0.25rem] bg-white border border-[#dbe6e3] text-[#1e332f] text-xs focus:outline-none focus:border-[#0ba689] focus:ring-2 focus:ring-[#0ba689]/20"
                  />
                </div>

                <div className="pt-3 border-t border-[#dbe6e3] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 rounded-[0.25rem] bg-[#edf4f2] hover:bg-[#e2f8f2] text-[#49625d] font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-[0.25rem] bg-[#0ba689] hover:bg-[#088f75] text-white font-semibold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Update Live</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* PARTICIPANT CONNECT / QR CODE MODAL                       */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1f1b]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md bg-white border border-[#dbe6e3] rounded-lg p-6 shadow-2xl ambient-emerald-shadow space-y-5 text-center"
            >
              <div className="flex items-center justify-between border-b border-[#dbe6e3] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db] flex items-center justify-center text-[#006b57]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-semibold text-[#1e332f] text-base">Connect Mobile Devices</h3>
                </div>

                <button
                  onClick={() => setShowQrModal(false)}
                  className="p-1.5 rounded-[0.25rem] text-[#6d7a75] hover:text-[#1e332f] hover:bg-[#edf4f2] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 flex flex-col items-center">
                {/* Mode Selector Tabs */}
                <div className="flex w-full p-1 rounded-[0.25rem] bg-[#edf4f2] border border-[#dbe6e3] text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublicMode(true);
                      setNetworkUrl(PUBLIC_GITHUB_URL);
                    }}
                    className={`flex-1 py-1.5 rounded-[0.25rem] transition-all cursor-pointer font-semibold ${
                      isPublicMode
                        ? 'bg-[#006b57] text-white shadow-xs'
                        : 'text-[#49625d] hover:text-[#006b57]'
                    }`}
                  >
                    Public GitHub Link (Global)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublicMode(false);
                      setNetworkUrl(`http://${customIp}:3000`);
                    }}
                    className={`flex-1 py-1.5 rounded-[0.25rem] transition-all cursor-pointer font-semibold ${
                      !isPublicMode
                        ? 'bg-[#006b57] text-white shadow-xs'
                        : 'text-[#49625d] hover:text-[#006b57]'
                    }`}
                  >
                    Local Wi-Fi IP
                  </button>
                </div>

                <div className="p-2.5 rounded-[0.25rem] bg-[#e2f8f2] border border-[#79f5db] text-left w-full text-xs space-y-1">
                  <div className="text-[#006b57] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0ba689] animate-pulse" />
                    {isPublicMode ? 'Public Internet Connection (Any Phone / Any Network)' : 'Local Wi-Fi Network Connection'}
                  </div>
                  <p className="text-[#003328] text-[11px] leading-relaxed">
                    {isPublicMode
                      ? 'Anyone anywhere in the world on mobile data (4G/5G) or Wi-Fi can scan this QR code or visit the public link below to join live!'
                      : 'Connect participant phones to the same Wi-Fi or Mobile Hotspot, then scan the QR code below:'}
                  </p>
                </div>

                {/* QR Code Image */}
                <div className="p-3 bg-white rounded-lg shadow-md border-2 border-[#0ba689]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(
                      networkUrl
                    )}`}
                    alt="Scan to join symposium quiz"
                    className="w-48 h-48 rounded-[0.25rem]"
                  />
                </div>

                {/* Network URL Pill */}
                <div className="w-full space-y-2">
                  <div className="w-full p-2.5 rounded-[0.25rem] bg-[#f6faf9] border border-[#dbe6e3] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#006b57] font-semibold truncate font-mono text-sm select-all">
                      {networkUrl}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(networkUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-[0.25rem] bg-[#0ba689] hover:bg-[#088f75] text-white flex items-center gap-1 shrink-0 cursor-pointer font-semibold text-xs shadow-xs"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {!isPublicMode && (
                    <div className="flex items-center gap-2 text-[11px] text-[#49625d]">
                      <span className="shrink-0 font-medium">Host IP:</span>
                      <input
                        type="text"
                        value={customIp}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setCustomIp(val);
                          setNetworkUrl(`http://${val}:3000`);
                        }}
                        placeholder="e.g. 10.254.84.8"
                        className="flex-1 px-2 py-1 rounded-[0.25rem] border border-[#dbe6e3] bg-white text-xs font-mono text-[#1e332f] focus:outline-none focus:border-[#0ba689]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomIp(detectedIp);
                          setNetworkUrl(`http://${detectedIp}:3000`);
                        }}
                        className="text-[10px] text-[#006b57] underline hover:text-[#0ba689] shrink-0"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#49625d] text-left bg-[#f6faf9] p-3 rounded-[0.25rem] border border-[#dbe6e3] w-full space-y-1">
                  <div className="text-[#006b57] font-bold">✓ Real-Time Cloud Synchronization Active</div>
                  <div>• Contestants open <strong>{networkUrl}</strong> on their mobile browser.</div>
                  <div>• Questions and submissions update instantly via Firebase Cloud across the globe.</div>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-[0.25rem] bg-[#edf4f2] hover:bg-[#e2f8f2] text-xs font-semibold text-[#006b57] cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

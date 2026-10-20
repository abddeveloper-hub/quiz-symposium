'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Unlock,
  Lock,
  RotateCcw,
  SkipForward,
  Award,
  AlertOctagon,
  Eye,
  EyeOff,
  Activity,
  Wifi,
  Volume2,
  VolumeX,
  Users,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Timer,
  Sliders,
} from 'lucide-react';
import { useBuzzerSocket } from '@/hooks/useBuzzerSocket';

export function QuizMasterPanel() {
  const {
    state,
    unlockBuzzer,
    lockBuzzer,
    awardPoints,
    penalize,
    passAndResetLock,
    resetQuestion,
    selectQuestion,
    resetAllScores,
    toggleSound,
    setLatencySimulation,
    pingMs,
  } = useBuzzerSocket();

  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [customAwardPoints, setCustomAwardPoints] = useState<number>(10);
  const [customPenaltyPoints, setCustomPenaltyPoints] = useState<number>(5);

  const currentQ = state.currentQuestion;
  const winner = state.winner;

  const handleNextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      selectQuestion(state.currentQuestionIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      selectQuestion(state.currentQuestionIndex - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0B0F17] text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      {/* Top Header & Master Status Banner */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 diffuse-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Fastest Finger First
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                QUIZ MASTER DASHBOARD
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Symposium Grand Finale • Real-Time Sub-millisecond Arbiter
            </p>
          </div>
        </div>

        {/* Global Controls & Status Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">STATE:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                state.quizState === 'BUZZER_ACTIVE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : state.quizState === 'LOCKED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : state.quizState === 'READING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {state.quizState}
            </span>
          </div>

          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              state.isSoundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Procedural Web Audio FX"
          >
            {state.isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono">Audio FX</span>
          </button>

          <button
            onClick={resetAllScores}
            className="px-3 py-1.5 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs font-medium transition-all"
          >
            Reset Scores
          </button>
        </div>
      </header>

      {/* Strict 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: 4 COLS (Question Queue & Display)           */}
        {/* ========================================================= */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          {/* Question Nav & Card */}
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 p-5 diffuse-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <Timer className="w-4 h-4" /> Question {state.currentQuestionIndex + 1} of {state.questions.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevQuestion}
                  disabled={state.currentQuestionIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous Question"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={state.currentQuestionIndex === state.questions.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Next Question"
                >
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>

            {/* Category and Points Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                {currentQ?.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-400">
                +{currentQ?.points} PTS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs font-mono text-rose-400">
                -{currentQ?.penaltyPoints} PENALTY
              </span>
            </div>

            {/* Question Prompt */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-sm leading-relaxed text-slate-200">
              <h3 className="font-semibold text-slate-100 mb-1 text-base">
                {currentQ?.prompt}
              </h3>
            </div>

            {/* Options List if applicable */}
            {currentQ?.options && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400">Options</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentQ.options.map((opt, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 font-mono"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reveal Answer Section */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">Official Answer</span>
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showAnswer ? 'Hide' : 'Reveal'}
                </button>
              </div>

              {showAnswer ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-xs text-emerald-200 space-y-1">
                  <div className="font-semibold text-emerald-300 text-sm">
                    {currentQ?.correctAnswer}
                  </div>
                  {currentQ?.explanation && (
                    <div className="text-slate-400 text-[11px] leading-normal pt-1 border-t border-emerald-900/50">
                      {currentQ.explanation}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                  [Answer hidden from preview]
                </div>
              )}
            </div>

            {/* Question Quick Action */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => selectQuestion(state.currentQuestionIndex)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Prepare / Arm Prompt
              </button>
            </div>
          </div>

          {/* Question List Navigator */}
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 p-4 diffuse-shadow">
            <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
              <span>Question Queue</span>
              <span className="text-slate-500">{state.questions.length} total</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {state.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    selectQuestion(idx);
                    setShowAnswer(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    idx === state.currentQuestionIndex
                      ? 'bg-cyan-950/60 border border-cyan-600/60 text-cyan-200'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border border-transparent text-slate-400'
                  }`}
                >
                  <span className="font-mono truncate mr-2">
                    Q{q.number}: {q.category}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                    {q.points}pt
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CENTER COLUMN: 5 COLS (Master Action Panel)              */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Main Action Panel */}
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 p-5 diffuse-shadow flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Tactile Buzzer Triggers
                </h2>
                <p className="text-xs text-slate-400">
                  Control contestant buzzer state and arbiter scoring
                </p>
              </div>

              {state.quizState === 'BUZZER_ACTIVE' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-xs animate-pulse">
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{state.remainingSeconds}s remaining</span>
                </div>
              )}
            </div>

            {/* PRIMARY HIGH-CONTRAST TRIGGER: Unlock Buzzer */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                id="btn-unlock-buzzer"
                onClick={unlockBuzzer}
                whileTap={{ scale: 0.96 }}
                className={`col-span-2 py-4 px-6 rounded-2xl font-bold font-mono tracking-wider text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                  state.quizState === 'BUZZER_ACTIVE'
                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40 ring-4 ring-cyan-500/30'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/60 border border-cyan-400/40'
                }`}
              >
                <Unlock className="w-5 h-5 text-current animate-bounce" />
                <span>
                  {state.quizState === 'BUZZER_ACTIVE' ? 'BUZZER UNLOCKED (ARMED)' : 'UNLOCK BUZZER NOW'}
                </span>
              </motion.button>

              <button
                id="btn-lock-buzzer"
                onClick={lockBuzzer}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Force Lock
              </button>

              <button
                id="btn-reset-lock"
                onClick={passAndResetLock}
                className="py-2.5 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 border border-amber-600/40 text-amber-300 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Pass and re-enable buzzer for other contestants"
              >
                <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                Pass / Reset Lock
              </button>
            </div>

            {/* CURRENT BUZZ WINNER SPOTLIGHT CARD */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Fastest Finger Winner
                </span>
                {winner && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold animate-pulse">
                    FIRST IN: +{winner.deltaMs}ms
                  </span>
                )}
              </div>

              {winner ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${winner.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {winner.teamName.charAt(5) || 'W'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white leading-tight">
                        {winner.teamName}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono">
                        {winner.contestantName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-mono font-extrabold text-cyan-300">
                      +{winner.deltaMs}ms
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">
                      Reaction Time
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center text-slate-500">
                  <Zap className="w-8 h-8 mb-1.5 stroke-[1.5] text-slate-600" />
                  <span className="text-xs font-mono">No active buzz yet. Click Unlock Buzzer.</span>
                </div>
              )}
            </div>

            {/* ADJUDICATION CONTROLS: Award Points or Penalty */}
            <div className="space-y-3 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  Host Adjudication
                </span>
                {winner && (
                  <span className="text-xs text-cyan-400 font-mono">
                    Target: {winner.teamName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  id="btn-award-points"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => winner && awardPoints(winner.contestantId, customAwardPoints)}
                  disabled={!winner}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4 text-emerald-200" />
                  <span>Award (+{customAwardPoints} pts)</span>
                </motion.button>

                <motion.button
                  id="btn-penalty-points"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => winner && penalize(winner.contestantId, customPenaltyPoints)}
                  disabled={!winner}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer transition-all"
                >
                  <AlertOctagon className="w-4 h-4 text-rose-200" />
                  <span>Penalty (-{customPenaltyPoints} pts)</span>
                </motion.button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  onClick={resetQuestion}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 underline underline-offset-4"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Round State
                </button>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>Custom:</span>
                  <button
                    onClick={() => setCustomAwardPoints((p) => (p === 10 ? 20 : 10))}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                  >
                    +{customAwardPoints}
                  </button>
                  <button
                    onClick={() => setCustomPenaltyPoints((p) => (p === 5 ? 10 : 5))}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300"
                  >
                    -{customPenaltyPoints}
                  </button>
                </div>
              </div>
            </div>

            {/* BUZZ QUEUE FEED (Secondary Buzzes) */}
            {state.buzzQueue.length > 1 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 mb-2 block">
                  Secondary Buzz Queue ({state.buzzQueue.length - 1})
                </span>
                <div className="space-y-1.5">
                  {state.buzzQueue.slice(1).map((bz, idx) => (
                    <div
                      key={bz.contestantId}
                      className="px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs flex items-center justify-between text-slate-300 font-mono"
                    >
                      <span>
                        #{idx + 2} {bz.teamName} ({bz.contestantName})
                      </span>
                      <span className="text-amber-400">
                        +{bz.deltaMs}ms (+{bz.deltaMs - (winner?.deltaMs || 0)}ms behind)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 3 COLS (Live Socket Monitor & Roster)      */}
        {/* ========================================================= */}
        <section className="lg:col-span-3 flex flex-col gap-5">
          {/* Live Socket Monitor */}
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 p-4 diffuse-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Live Socket Monitor
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Engine</span>
                <span className="text-emerald-400 font-bold">BroadcastBus</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Host Latency</span>
                <span className="text-cyan-300 font-bold">{pingMs}ms</span>
              </div>
            </div>

            {/* Simulated Latency Injection Slider */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Simulated Lag:</span>
                <span className="text-amber-300 font-bold">{state.latencySimulationMs}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={state.latencySimulationMs}
                onChange={(e) => setLatencySimulation(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Contestant Roster & Anti-Cheat Monitor */}
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 p-4 diffuse-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Contestant Standings
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {state.contestants.length} active
              </span>
            </div>

            <div className="space-y-2">
              {state.contestants.map((c) => {
                const isDisqualified = c.isDisqualifiedForQuestion;
                const isWinner = winner?.contestantId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isWinner
                        ? 'bg-emerald-950/40 border-emerald-500/50'
                        : isDisqualified
                        ? 'bg-slate-950/80 border-slate-800 opacity-60'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {c.teamName.charAt(5)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-100">
                              {c.teamName}
                            </span>
                            {c.isConnected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{c.name}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-cyan-300">
                          {c.score} PTS
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.latencyMs}ms
                        </div>
                      </div>
                    </div>

                    {/* Anti-Cheating tab switch flag */}
                    {c.tabSwitchCount > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-amber-400">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          Tab Switched: {c.tabSwitchCount} time(s)
                        </span>
                        <span className="text-amber-500/80 uppercase font-semibold">FLAGGED</span>
                      </div>
                    )}

                    {isDisqualified && (
                      <div className="mt-1 text-[10px] font-mono text-rose-400">
                        Excluded from current question (Passed)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

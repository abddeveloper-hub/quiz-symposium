'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, ShieldAlert, Wifi, AlertTriangle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBuzzerSocket } from '@/hooks/useBuzzerSocket';
import { Contestant } from '@/types/buzzer';

interface ContestantViewProps {
  initialContestantId?: string;
  isEmbedded?: boolean;
}

export function ContestantView({ initialContestantId = '', isEmbedded = false }: ContestantViewProps) {
  const [selectedId, setSelectedId] = useState<string>(initialContestantId);
  const { state, buzz, pingMs } = useBuzzerSocket(selectedId);

  const currentContestant: Contestant | undefined =
    state.contestants.find((c) => c.id === selectedId) || state.contestants[0];

  const isCurrentWinner = state.winner?.contestantId === currentContestant?.id;
  const isOtherWinner = state.winner && state.winner.contestantId !== currentContestant?.id;
  const isDisqualified = currentContestant?.isDisqualifiedForQuestion;

  // Trigger confetti when this contestant wins the buzz
  useEffect(() => {
    if (isCurrentWinner) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#38bdf8'],
      });
    }
  }, [isCurrentWinner]);

  // Handle high-precision pointer down event (0ms touch delay)
  const handleBuzzerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state.quizState === 'BUZZER_ACTIVE' && !isDisqualified) {
      buzz(currentContestant.id);
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden transition-colors duration-500 ${
        isEmbedded ? 'rounded-2xl border' : ''
      } ${
        isCurrentWinner
          ? 'bg-emerald-950/40 border border-emerald-500/50'
          : isOtherWinner
          ? 'bg-rose-950/20 border border-rose-900/40'
          : 'bg-[#0B0F17]'
      }`}
    >
      {/* Top Header Bar */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-20">
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentContestant.avatarColor} flex items-center justify-center font-bold text-white shadow-md text-sm`}
          >
            {currentContestant.teamName.charAt(5) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-100">
                {currentContestant.teamName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {currentContestant.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" />
                {pingMs}ms ping
              </span>
              <span>•</span>
              <span className="font-mono text-cyan-400 font-medium">
                {currentContestant.score} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Contestant Team Switcher dropdown for instant multi-participant testing */}
        <div className="flex items-center gap-2">
          {currentContestant.tabSwitchCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/60 border border-amber-600/50 text-amber-400 text-[11px] font-mono animate-pulse"
              title="Anti-Cheating Detection: Tab switches logged by host"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{currentContestant.tabSwitchCount}x</span>
            </div>
          )}

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-xs bg-slate-800/90 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title="Switch contestant persona"
          >
            {state.contestants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.teamName} ({c.name})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Reactive Screen Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* STATE 1: WINNER (This contestant buzzed first!) */}
          {isCurrentWinner && (
            <motion.div
              key="winner-state"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex flex-col items-center text-center max-w-sm w-full"
            >
              {/* 10-Second SVG Progress Ring */}
              <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-slate-800/60"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-emerald-400"
                    strokeWidth="7"
                    strokeDasharray="276"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 276 }}
                    transition={{ duration: 10, ease: 'linear' }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Trophy className="w-12 h-12 text-emerald-400 mb-1 animate-bounce" />
                  <span className="text-2xl font-bold font-mono text-emerald-300">
                    +{state.winner?.deltaMs}ms
                  </span>
                  <span className="text-[10px] tracking-widest uppercase text-emerald-400/80 font-mono">
                    FIRST BUZZ
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
                  Floor Granted
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  You have the floor!
                </h2>
                <p className="text-slate-300 text-sm font-medium">
                  State your answer aloud to the symposium committee.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 2: LOCKED_OUT (Another team buzzed first) */}
          {isOtherWinner && (
            <motion.div
              key="locked-out-state"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center text-center max-w-sm w-full space-y-5"
            >
              <div className="w-24 h-24 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/60 text-rose-300 text-xs font-mono font-medium">
                  <span>Locked Out</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  {state.winner?.teamName} buzzed first!
                </h2>
                <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-mono inline-block">
                  Reaction Time: <span className="text-amber-400 font-bold">+{state.winner?.deltaMs}ms</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Stand by. If they give an incorrect answer, the host may pass the question to remaining teams.
              </p>
            </motion.div>
          )}

          {/* STATE 3: DISQUALIFIED FOR CURRENT QUESTION (Passed upon) */}
          {!isCurrentWinner && !isOtherWinner && isDisqualified && (
            <motion.div
              key="disqualified-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-sm space-y-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">Buzzer Inactive For Your Team</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You already attempted this question. Awaiting the next question or committee review.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 4: READING (Question being read, buzzer disabled) */}
          {state.quizState === 'READING' && !isDisqualified && (
            <motion.div
              key="reading-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center max-w-sm w-full space-y-6"
            >
              {/* Subtle Pulsing Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>READING QUESTION — BUZZER ARMED</span>
              </div>

              {/* Buzzer rendered with low opacity */}
              <div className="relative w-64 h-64 rounded-full bg-slate-900 border border-slate-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.4)] opacity-40 pointer-events-none flex flex-col items-center justify-center">
                <Zap className="w-16 h-16 text-slate-500 mb-2" />
                <span className="text-sm font-mono tracking-widest uppercase text-slate-500 font-bold">
                  Buzzer Locked
                </span>
                <span className="text-[11px] text-slate-600 mt-1">Host unlocks after reading</span>
              </div>

              <div className="text-center px-4">
                <p className="text-xs text-slate-400">
                  Focus on the auditorium projection. The buzzer unlocks immediately when the prompt is read.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 5: BUZZER_ACTIVE (Full-screen reactive buzzer target) */}
          {state.quizState === 'BUZZER_ACTIVE' && !isDisqualified && (
            <motion.div
              key="active-state"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center text-center w-full max-w-sm"
            >
              {/* Urgent Countdown Pill */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium mb-5 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>BUZZER OPEN: {state.remainingSeconds}s REMAINING</span>
              </div>

              {/* TACTILE ZERO-LATENCY BUZZER TARGET */}
              <motion.button
                id="contestant-buzz-trigger"
                onPointerDown={handleBuzzerPointerDown}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                className="relative w-64 h-64 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.35),0_12px_40px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center cursor-pointer select-none group touch-none active:border-cyan-300"
              >
                {/* Ripple ring */}
                <div className="absolute inset-2 rounded-full border border-cyan-500/30 group-hover:border-cyan-400/50 transition-colors" />

                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-3 group-hover:bg-cyan-500/20 group-active:scale-95 transition-all">
                  <Zap className="w-10 h-10 text-cyan-400 fill-cyan-400/20 group-hover:scale-110 transition-transform" />
                </div>

                <span className="text-xl font-bold font-mono tracking-wider text-cyan-200 group-hover:text-white">
                  BUZZ IN
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/70 mt-1">
                  TAP NOW
                </span>
              </motion.button>

              <span className="text-[11px] text-slate-500 font-mono mt-4">
                0ms mobile touch delay • onPointerDown active
              </span>
            </motion.div>
          )}

          {/* STATE 6: IDLE / EVALUATING Standby */}
          {(state.quizState === 'IDLE' || (state.quizState === 'EVALUATING' && !state.winner)) && (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-sm space-y-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">Awaiting Host</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The Quiz Master is preparing the next round. Stay on this screen.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Footer Info */}
      <footer className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 font-mono z-20">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>FASTEST FINGER FIRST</span>
        </div>
        <div className="text-slate-500">
          Q#{state.currentQuestion?.number || 1} • {state.currentQuestion?.category || 'General'}
        </div>
      </footer>
    </div>
  );
}

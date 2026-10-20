'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Maximize2, Minimize2, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBuzzerSocket } from '@/hooks/useBuzzerSocket';

export function StageDisplay() {
  const { state } = useBuzzerSocket();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const winner = state.winner;
  const currentQ = state.currentQuestion;

  // Trigger grand auditorium confetti burst when winner is confirmed
  useEffect(() => {
    if (winner) {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#a855f7'],
      });
    }
  }, [winner]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] min-h-[580px] bg-[#0B0F17] text-white flex flex-col justify-between p-8 md:p-12 overflow-hidden border border-slate-800 shadow-2xl radial-vignette select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Dynamic Ambient Spotlight on Winner */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-cyan-500/20 via-emerald-500/10 to-transparent blur-3xl rounded-full pointer-events-none z-0"
        />
      )}

      {/* TOP AUDITORIUM HEADER */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-sm tracking-wider uppercase font-bold flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>ANNUAL TECH SYMPOSIUM • GRAND FINALE</span>
          </div>

          <div className="text-slate-400 text-sm font-mono">
            ROUND 1: FASTEST FINGER FIRST
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-slate-500">QUESTION:</span>
            <span className="text-cyan-400 font-bold text-sm">
              #{currentQ?.number || 1}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Auditorium Projector Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN PROJECTOR CENTER STAGE */}
      <main className="relative z-10 flex-1 flex flex-col justify-center my-6">
        <AnimatePresence mode="wait">
          {/* STATE A: BUZZ WINNER SPOTLIGHT BANNER */}
          {winner ? (
            <motion.div
              key="stage-winner"
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
            >
              {/* Winner Category Pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-mono tracking-widest uppercase font-semibold mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>FIRST FINGER LOCKED</span>
              </motion.div>

              {/* Big Winner Banner Card */}
              <div className="w-full p-8 md:p-10 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/70 shadow-[0_0_60px_rgba(16,185,129,0.35),0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center">
                <div
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-tr ${winner.avatarColor} flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl mb-4 border border-white/20`}
                >
                  {winner.teamName.charAt(5)}
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
                  {winner.teamName}
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 font-medium mt-1">
                  Representative: <span className="text-white font-semibold">{winner.contestantName}</span>
                </p>

                {/* Sub-millisecond reaction latency badge */}
                <div className="mt-6 flex items-center gap-6 font-mono">
                  <div className="px-5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">
                      Reaction Time
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold text-cyan-300">
                      +{winner.deltaMs} ms
                    </span>
                  </div>

                  <div className="px-5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">
                      Floor Status
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 flex items-center gap-2 justify-center">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      ANSWERING
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* STATE B: GIANT AUDITORIUM QUESTION DISPLAY */
            <motion.div
              key="stage-question"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center max-w-5xl mx-auto w-full space-y-6"
            >
              {/* Category & Status Indicator */}
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-mono text-cyan-300 font-semibold uppercase tracking-wider">
                  {currentQ?.category || 'Category'}
                </span>

                {state.quizState === 'BUZZER_ACTIVE' ? (
                  <span className="px-4 py-1.5 rounded-xl bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-mono text-sm font-bold flex items-center gap-2 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    BUZZER OPEN • {state.remainingSeconds}s
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-300 font-mono text-sm">
                    {state.quizState === 'READING' ? 'READING QUESTION' : 'STANDBY'}
                  </span>
                )}
              </div>

              {/* Giant Prompt Typography (Auditorium scale) */}
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight max-w-4xl text-balance">
                &ldquo;{currentQ?.prompt}&rdquo;
              </h2>

              {/* Multiple Choice Options Display */}
              {currentQ?.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl pt-4">
                  {currentQ.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-sm md:text-base font-mono text-slate-200 flex items-center shadow-lg"
                    >
                      <span className="font-semibold">{opt}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM LEADERBOARD STANDINGS MARQUEE */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Live Symposium Leaderboard
          </span>
          <span>Fastest reaction times tracked with sub-ms resolution</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {state.contestants.map((team) => {
            const isWinner = winner?.contestantId === team.id;
            return (
              <div
                key={team.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isWinner
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${team.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-md`}
                  >
                    {team.teamName.charAt(5)}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">
                      {team.teamName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {team.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-cyan-300">
                    {team.score}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

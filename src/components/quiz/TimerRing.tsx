'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
}

export function TimerRing({
  remainingSeconds,
  totalSeconds,
  size = 120,
  strokeWidth = 7,
}: TimerRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, totalSeconds);
  const progress = Math.max(0, Math.min(1, remainingSeconds / safeTotal));
  const strokeDashoffset = circumference - progress * circumference;

  const isUrgent = remainingSeconds <= 5 && remainingSeconds > 0;
  const isExpired = remainingSeconds === 0;

  const strokeColor = isExpired
    ? '#ba1a1a'
    : isUrgent
    ? '#ba1a1a'
    : remainingSeconds <= 10
    ? '#006b5c'
    : '#0ba689';

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Soft Sage Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#dbe6e3"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Emerald Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Digits Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`font-serif font-bold tracking-tight leading-none transition-colors ${
            size < 80 ? 'text-lg' : size < 120 ? 'text-2xl' : 'text-3xl'
          } ${isUrgent ? 'text-[#ba1a1a] animate-pulse' : 'text-[#0c1f1b]'}`}
        >
          {remainingSeconds}
          <span className="text-[11px] text-[#49625d] font-sans font-semibold ml-0.5">s</span>
        </span>
        {size >= 100 && (
          <span className="text-[9px] font-sans font-bold tracking-widest uppercase text-[#49625d] mt-0.5">
            REMAINING
          </span>
        )}
      </div>
    </div>
  );
}

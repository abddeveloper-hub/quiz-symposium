'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { OptionId } from '@/types/quiz';

interface OptionCardProps {
  id: OptionId;
  text: string;
  isSelected: boolean;
  isDisabled: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  isRevealed?: boolean;
  onSelect: (id: OptionId) => void;
}

export function OptionCard({
  id,
  text,
  isSelected,
  isDisabled,
  isCorrect,
  isWrong,
  isRevealed,
  onSelect,
}: OptionCardProps) {
  const handleSelect = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (!isDisabled) {
      onSelect(id);
    }
  };

  // Luminous Emerald Academic Card Styling
  let cardStyle =
    'bg-white border-[#dbe6e3] text-[#1e332f] hover:border-[#0ba689] hover:bg-[#f6faf9] hover:shadow-[0_8px_24px_-4px_rgba(11,166,137,0.08)]';
  let badgeStyle = 'bg-[#edf4f2] text-[#0ba689] border-[#dbe6e3]';

  if (isRevealed) {
    if (isCorrect) {
      cardStyle =
        'bg-[#006b57] border-[#006b57] text-white shadow-[0_12px_32px_-6px_rgba(0,107,87,0.3)] ring-2 ring-[#0ba689]';
      badgeStyle = 'bg-white text-[#006b57] font-bold border-white';
    } else if (isWrong) {
      cardStyle =
        'bg-[#ffdad6] border-[#ba1a1a] text-[#93000a] shadow-[0_8px_24px_-4px_rgba(186,26,26,0.15)]';
      badgeStyle = 'bg-[#ba1a1a] text-white font-bold border-[#ba1a1a]';
    } else {
      cardStyle = 'bg-[#f6faf9] border-[#dbe6e3] text-[#49625d] opacity-50';
      badgeStyle = 'bg-[#e2f8f2] text-[#49625d] border-[#dbe6e3]';
    }
  } else if (isSelected) {
    cardStyle =
      'border-[#0ba689] bg-[#e2f8f2] text-[#003328] shadow-[0_8px_28px_-4px_rgba(11,166,137,0.18)] ring-2 ring-[#0ba689]/40';
    badgeStyle = 'bg-[#0ba689] text-white font-bold border-[#0ba689]';
  } else if (isDisabled) {
    cardStyle = 'bg-[#f6faf9] border-[#dbe6e3] text-[#49625d] opacity-60 cursor-not-allowed';
    badgeStyle = 'bg-[#edf4f2] text-[#49625d] border-[#dbe6e3]';
  }

  return (
    <motion.div
      onClick={handleSelect}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={`group relative w-full p-4 md:p-5 rounded-lg border transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer select-none touch-manipulation active:scale-[0.98] ${cardStyle}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Academic Option Marker Badge (A, B, C, D in Noto Serif) */}
        <span
          className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-[0.25rem] border flex items-center justify-center font-serif font-bold text-sm md:text-base transition-colors ${badgeStyle}`}
        >
          {id}
        </span>

        {/* Option Text in Manrope */}
        <span className="text-sm md:text-base font-sans font-medium leading-snug break-words">
          {text}
        </span>
      </div>

      {/* Right Indicator (Checkmark / X / Selection ring) */}
      <div className="shrink-0">
        {isRevealed && isCorrect && (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#006b57] shadow-sm">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        )}
        {isRevealed && isWrong && (
          <div className="w-8 h-8 rounded-full bg-[#ba1a1a] flex items-center justify-center text-white shadow-sm">
            <X className="w-5 h-5 stroke-[3]" />
          </div>
        )}
        {!isRevealed && isSelected && (
          <div className="w-7 h-7 rounded-full bg-[#0ba689] flex items-center justify-center text-white shadow-sm">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

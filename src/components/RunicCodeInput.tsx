import React, { useRef } from 'react';
import { sound } from '../utils/audio';

interface RunicCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  onEnter?: () => void;
  disabled?: boolean;
}

export const RunicCodeInput: React.FC<RunicCodeInputProps> = ({
  value,
  onChange,
  length = 4,
  onEnter,
  disabled = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const chars = value.split('').slice(0, length);
  while (chars.length < length) {
    chars.push('');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const rawChar = e.target.value.toUpperCase();
    if (!rawChar) return;

    // Grab the last character entered
    const char = rawChar.slice(-1);
    sound.playButtonChime();

    const newChars = [...chars];
    newChars[idx] = char;
    const combined = newChars.join('').slice(0, length);
    onChange(combined);

    // Auto-advance to next input box
    if (idx < length - 1 && char) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!chars[idx] && idx > 0) {
        // Move back to previous box
        const newChars = [...chars];
        newChars[idx - 1] = '';
        onChange(newChars.join(''));
        inputsRef.current[idx - 1]?.focus();
      } else {
        const newChars = [...chars];
        newChars[idx] = '';
        onChange(newChars.join(''));
      }
    } else if (e.key === 'Enter') {
      onEnter?.();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted) {
      sound.playMagicCardFlip();
      const code = pasted.slice(0, length);
      onChange(code);
      const targetIdx = Math.min(code.length, length - 1);
      inputsRef.current[targetIdx]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => {
        const hasChar = Boolean(chars[idx]);

        return (
          <div key={idx} className="relative">
            <input
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={2}
              value={chars[idx]}
              disabled={disabled}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center font-mono font-black text-2xl sm:text-3xl rounded-2xl border-2 transition-all outline-none uppercase shadow-inner cursor-pointer ${
                hasChar
                  ? 'bg-[#1e0f33] border-[#ffd875] text-[#ffd875] shadow-[0_0_15px_rgba(255,216,117,0.3)] ring-1 ring-[#ffd875]/60'
                  : 'bg-[#0d0714] border-stone-800 text-stone-300 focus:border-[#ffd875]/80 focus:bg-[#150a24]'
              }`}
            />
            {/* Subtle runic underline pip */}
            <div
              className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full transition-all ${
                hasChar ? 'bg-[#ffd875]' : 'bg-stone-700'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

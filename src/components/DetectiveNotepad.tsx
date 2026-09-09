import React, { useState } from 'react';
import type { Player } from '../types';
import { BookMarked, ShieldCheck, Skull, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { sound } from '../utils/audio';

export type SuspicionStatus = 'UNKNOWN' | 'STUDENT' | 'DEATH_EATER';

interface DetectiveNotepadProps {
  players: Player[];
  myPlayerId: string;
}

export const DetectiveNotepad: React.FC<DetectiveNotepadProps> = ({
  players,
  myPlayerId,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [suspicions, setSuspicions] = useState<Record<string, SuspicionStatus>>({});

  // Filter out self and eliminated players
  const otherPlayers = players
    .filter((p) => p.id !== myPlayerId && !p.isEliminated && typeof p.speakingOrder === 'number')
    .sort((a, b) => (a.speakingOrder || 0) - (b.speakingOrder || 0));

  if (otherPlayers.length === 0) return null;

  const handleToggleStatus = (playerId: string, status: SuspicionStatus) => {
    sound.playButtonChime();
    setSuspicions((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === status ? 'UNKNOWN' : status,
    }));
  };

  const studentCount = Object.values(suspicions).filter((s) => s === 'STUDENT').length;
  const deathEaterCount = Object.values(suspicions).filter((s) => s === 'DEATH_EATER').length;

  return (
    <div className="w-full max-w-sm mx-auto glass-panel rounded-2xl border border-[#c8aa6e]/40 p-4 shadow-xl text-stone-200 animate-fadeIn mt-3">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer text-left select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-[#ffd875]/40 flex items-center justify-center text-[#ffd875]">
            <BookMarked size={16} />
          </div>
          <div>
            <span className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd875] flex items-center gap-1.5">
              <span>SỔ TAY ĐIỀU TRA</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#201133] text-[#c8aa6e] font-serif border border-[#c8aa6e]/30">
                Bảo mật
              </span>
            </span>
            <p className="text-[10px] text-[#c8aa6e]/80">
              Ghi chú suy đoán phe phái của từng người
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] flex items-center gap-1.5 font-mono font-bold">
            {studentCount > 0 && <span className="text-[#ffd875] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">🪄 {studentCount}</span>}
            {deathEaterCount > 0 && <span className="text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">🐍 {deathEaterCount}</span>}
          </div>
          {isOpen ? <ChevronUp size={16} className="text-[#c8aa6e]" /> : <ChevronDown size={16} className="text-[#c8aa6e]" />}
        </div>
      </button>

      {/* Notepad Roster */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-col gap-2">
          {otherPlayers.map((p) => {
            const currentStatus = suspicions[p.id] || 'UNKNOWN';

            return (
              <div
                key={p.id}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                  currentStatus === 'DEATH_EATER'
                    ? 'bg-red-950/40 border-red-800/60'
                    : currentStatus === 'STUDENT'
                    ? 'bg-amber-950/30 border-amber-600/50'
                    : 'bg-[#140c1e] border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-stone-800 border border-stone-700 text-[10px] font-mono font-bold flex items-center justify-center text-stone-300 shrink-0">
                    #{p.speakingOrder}
                  </span>
                  <span className="text-xs font-semibold truncate text-stone-200">
                    {p.name}
                  </span>
                </div>

                {/* 3 Quick Toggle Options */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p.id, 'STUDENT')}
                    title="Nghi là Học Sinh (Bồ tèo)"
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      currentStatus === 'STUDENT'
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                        : 'bg-[#211533] text-stone-400 hover:text-amber-300 border border-stone-700/60'
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span className="hidden xs:inline">Bạn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p.id, 'DEATH_EATER')}
                    title="Nghi là Tử Thần Thực Tử (Gián điệp)"
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      currentStatus === 'DEATH_EATER'
                        ? 'bg-red-600 text-white font-bold shadow-md'
                        : 'bg-[#211533] text-stone-400 hover:text-red-300 border border-stone-700/60'
                    }`}
                  >
                    <Skull size={13} />
                    <span className="hidden xs:inline">Tử Thần</span>
                  </button>

                  {currentStatus !== 'UNKNOWN' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(p.id, 'UNKNOWN')}
                      title="Bỏ đánh dấu"
                      className="p-1 text-stone-500 hover:text-stone-300 rounded cursor-pointer"
                    >
                      <HelpCircle size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

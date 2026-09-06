import React, { useState } from 'react';
import type { Player } from '../types';
import { Mic, ChevronRight, Sparkles } from 'lucide-react';

interface SpeakingOrderBannerProps {
  players: Player[];
  myPlayerId?: string;
  roundNumber?: number;
}

export const SpeakingOrderBanner: React.FC<SpeakingOrderBannerProps> = ({
  players,
  myPlayerId,
  roundNumber = 1,
}) => {
  // Sort players with speakingOrder assigned (1, 2, 3...)
  const orderedPlayers = [...players]
    .filter((p) => typeof p.speakingOrder === 'number')
    .sort((a, b) => (a.speakingOrder || 0) - (b.speakingOrder || 0));

  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState<number>(0);

  if (orderedPlayers.length === 0) return null;

  const currentSpeaker = orderedPlayers[activeSpeakerIdx] || orderedPlayers[0];
  const isMyTurn = currentSpeaker?.id === myPlayerId;

  const handleNextSpeaker = () => {
    setActiveSpeakerIdx((prev) => (prev + 1) % orderedPlayers.length);
  };

  const handlePrevSpeaker = () => {
    setActiveSpeakerIdx((prev) => (prev - 1 + orderedPlayers.length) % orderedPlayers.length);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-[#1c1328] via-[#140c1e] to-[#0d0714] rounded-2xl border border-[#ffd875]/40 p-4 shadow-xl text-stone-200 animate-fadeIn relative overflow-hidden">
      {/* Subtle magical glowing background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#ffd875]">
            <Mic size={15} />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-[#f3d994] flex items-center gap-1.5">
              <span>THỨ TỰ PHÁT BIỂU</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200 border border-amber-500/30 font-sans">
                Vòng #{roundNumber}
              </span>
            </h4>
            <p className="text-[10px] text-stone-400">
              Lần lượt miêu tả từ theo số thứ tự bên dưới
            </p>
          </div>
        </div>

        {/* Turn Stepper Controls (Host or Quick Advance) */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevSpeaker}
            className="w-6 h-6 rounded bg-[#241735] hover:bg-[#35234e] text-stone-300 hover:text-white flex items-center justify-center text-xs border border-stone-700/60 transition cursor-pointer"
            title="Lượt trước"
          >
            ‹
          </button>
          <span className="text-[11px] font-mono text-amber-300/90 font-bold px-1.5">
            {activeSpeakerIdx + 1}/{orderedPlayers.length}
          </span>
          <button
            onClick={handleNextSpeaker}
            className="w-6 h-6 rounded bg-[#241735] hover:bg-[#35234e] text-stone-300 hover:text-white flex items-center justify-center text-xs border border-stone-700/60 transition cursor-pointer"
            title="Lượt tiếp theo"
          >
            ›
          </button>
        </div>
      </div>

      {/* Active Speaker Spotlight Banner */}
      {currentSpeaker && (
        <div
          className={`p-3 rounded-xl mb-3 border transition-all flex items-center justify-between ${
            isMyTurn
              ? 'bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-amber-950/70 border-amber-500/70 shadow-lg shadow-amber-500/10'
              : 'bg-[#150d22] border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border ${
                isMyTurn
                  ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md animate-bounce'
                  : 'bg-[#28193f] text-[#ffd875] border-[#c8aa6e]/40'
              }`}
            >
              #{currentSpeaker.speakingOrder}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm text-stone-100">
                  {currentSpeaker.name}
                </span>
                {currentSpeaker.id === myPlayerId && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-stone-950">
                    BẠN
                  </span>
                )}
                {currentSpeaker.speakingOrder === 1 && (
                  <span className="text-[10px] text-amber-300/90 bg-amber-900/40 px-1 rounded border border-amber-600/30 flex items-center gap-0.5">
                    <Sparkles size={10} /> Mở màn
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                {isMyTurn ? (
                  <span className="text-amber-300 font-medium">⚡ Đến lượt bạn nói từ của mình!</span>
                ) : (
                  <span>Đang đến lượt phát biểu miêu tả từ</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleNextSpeaker}
            className="px-2.5 py-1 text-xs bg-[#2b1b42] hover:bg-[#3d275e] text-amber-200 hover:text-white rounded-lg border border-[#c8aa6e]/40 transition flex items-center gap-1 active:scale-95 cursor-pointer font-serif"
          >
            <span>Xong</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Full Sequential Speaking Order List */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold block mb-0.5">
          Danh sách thứ tự nói:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {orderedPlayers.map((p, idx) => {
            const isSelectedSpeaker = idx === activeSpeakerIdx;
            const isMe = p.id === myPlayerId;

            return (
              <button
                key={p.id}
                onClick={() => setActiveSpeakerIdx(idx)}
                className={`flex items-center gap-1.5 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  p.isEliminated
                    ? 'bg-stone-900/40 border-stone-800/60 text-stone-500 line-through opacity-60'
                    : isSelectedSpeaker
                    ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/40 border-amber-400/80 text-amber-100 shadow-md ring-1 ring-amber-400/40'
                    : isMe
                    ? 'bg-[#221636] border-amber-500/40 text-stone-200'
                    : 'bg-[#120a1c] border-stone-800/80 hover:border-stone-700 text-stone-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 ${
                    p.speakingOrder === 1
                      ? 'bg-amber-500 text-stone-950'
                      : isSelectedSpeaker
                      ? 'bg-amber-400/30 text-amber-200 border border-amber-400/50'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {p.speakingOrder}
                </span>
                <span className="truncate font-medium flex-1">
                  {p.name}
                </span>
                {isMe && (
                  <span className="text-[9px] font-bold text-amber-400 flex-shrink-0">
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

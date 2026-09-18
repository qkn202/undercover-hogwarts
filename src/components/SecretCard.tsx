import React, { useState } from 'react';
import type { Role } from '../types';
import { Eye, EyeOff, ShieldAlert, Mic, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface SecretCardProps {
  role?: Role;
  word?: string | null;
  hint?: string;
  playerName: string;
  roundNumber: number;
  speakingOrder?: number;
}

export const SecretCard: React.FC<SecretCardProps> = ({
  role,
  word,
  playerName,
  roundNumber,
  speakingOrder,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleReveal = () => {
    if (!isRevealed) {
      sound.playMagicCardFlip();
    } else {
      sound.playButtonChime();
    }
    setIsRevealed(!isRevealed);
  };

  const isMrWhite = role === 'MR_WHITE';

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center animate-fadeIn">
      {/* Player Header Banner */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffd875] via-[#8a1c14] to-[#120a1c] p-[2px] shadow-[0_0_15px_rgba(200,170,110,0.3)] flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#120a1c] text-[#ffd875] font-cinzel font-black text-sm flex items-center justify-center">
              {playerName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="font-serif font-bold text-[#f3efe6] text-sm sm:text-base">
              {playerName}
            </div>
            <p className="text-[11px] text-[#c8aa6e] font-serif">Vòng Đấu Ma Thuật #{roundNumber}</p>
          </div>
        </div>

        {/* Right Header Badges: Speaking Order & Anti-Peeking */}
        <div className="flex items-center gap-2">
          {typeof speakingOrder === 'number' && (
            <div
              className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-xl border font-serif font-bold shadow-sm ${
                speakingOrder === 1
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-[#ffd875] border-[#ffd875]'
                  : 'bg-[#221336] text-[#ffd875] border-[#c8aa6e]/40'
              }`}
            >
              <Mic size={12} className="text-[#ffd875]" />
              <span>{speakingOrder === 1 ? 'Nói đầu (#1)' : `Lượt #${speakingOrder}`}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-600/50 shadow-sm">
            <ShieldAlert size={12} />
            <span className="hidden xs:inline font-serif font-medium">Che màn hình</span>
          </div>
        </div>
      </div>

      {/* The Ancient Grimoire 3D Flip Card */}
      <div
        onClick={toggleReveal}
        className={`w-full min-h-[460px] rounded-3xl cursor-pointer select-none transition-all duration-500 transform relative overflow-hidden border-2 shadow-[0_25px_60px_rgba(0,0,0,0.95)] ${
          isRevealed
            ? 'glass-panel-gold border-[#ffd875] shadow-[0_0_45px_rgba(255,216,117,0.35)]'
            : 'grimoire-card-back border-[#ffd875]/60 hover:border-[#ffd875] active:scale-[0.985] group'
        }`}
      >
        {/* Grimoire Antique 4-Corner Ornate Filigree Metal Brackets */}
        <div className="absolute top-2.5 left-2.5 w-10 h-10 pointer-events-none select-none transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <path d="M3 3H22C14 3 10 7 8 13C6 19 6 26 6 37" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3 3V22C3 14 7 10 13 8C19 6 26 6 37 6" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="3" fill="url(#goldCornerGrad)" />
            <path d="M14 14L26 26M15 22C20 18 24 14 32 10M22 15C18 20 14 24 10 32" stroke="url(#goldCornerGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <defs>
              <linearGradient id="goldCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff5d1" />
                <stop offset="50%" stopColor="#ffd875" />
                <stop offset="100%" stopColor="#9a7322" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute top-2.5 right-2.5 w-10 h-10 pointer-events-none select-none scale-x-[-1] transition-transform duration-300 group-hover:scale-x-[-1.1] group-hover:scale-y-110">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <path d="M3 3H22C14 3 10 7 8 13C6 19 6 26 6 37" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3 3V22C3 14 7 10 13 8C19 6 26 6 37 6" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="3" fill="url(#goldCornerGrad)" />
            <path d="M14 14L26 26M15 22C20 18 24 14 32 10M22 15C18 20 14 24 10 32" stroke="url(#goldCornerGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>

        <div className="absolute bottom-2.5 left-2.5 w-10 h-10 pointer-events-none select-none scale-y-[-1] transition-transform duration-300 group-hover:scale-y-[-1.1] group-hover:scale-x-110">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <path d="M3 3H22C14 3 10 7 8 13C6 19 6 26 6 37" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3 3V22C3 14 7 10 13 8C19 6 26 6 37 6" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="3" fill="url(#goldCornerGrad)" />
            <path d="M14 14L26 26M15 22C20 18 24 14 32 10M22 15C18 20 14 24 10 32" stroke="url(#goldCornerGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>

        <div className="absolute bottom-2.5 right-2.5 w-10 h-10 pointer-events-none select-none scale-[-1] transition-transform duration-300 group-hover:scale-[-1.1]">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <path d="M3 3H22C14 3 10 7 8 13C6 19 6 26 6 37" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3 3V22C3 14 7 10 13 8C19 6 26 6 37 6" stroke="url(#goldCornerGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="3" fill="url(#goldCornerGrad)" />
            <path d="M14 14L26 26M15 22C20 18 24 14 32 10M22 15C18 20 14 24 10 32" stroke="url(#goldCornerGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>

        {/* Ambient Leather Border Inset with Gold Trim */}
        <div className="absolute inset-3.5 rounded-[20px] border border-[#ffd875]/25 pointer-events-none" />
        <div className="absolute inset-5 rounded-[16px] border border-dashed border-[#c8aa6e]/20 pointer-events-none" />

        {!isRevealed ? (
          /* CARD BACK: ANCIENT GRIMOIRE COVER WITH 3D WAX SEAL */
          <div className="h-full min-h-[460px] p-6 flex flex-col items-center justify-center text-center relative z-10">
            {/* Spinning Arcane Runic Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.14] overflow-hidden">
              <svg viewBox="0 0 200 200" className="w-80 h-80 animate-[spin_80s_linear_infinite] text-[#ffd875]" fill="none" stroke="currentColor">
                <circle cx="100" cy="100" r="95" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx="100" cy="100" r="80" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="65" strokeWidth="1" strokeDasharray="2 4" />
                <polygon points="100,10 178,145 22,145" strokeWidth="1" opacity="0.7" />
                <polygon points="100,190 22,55 178,55" strokeWidth="1" opacity="0.7" />
                <circle cx="100" cy="100" r="45" strokeWidth="1" />
              </svg>
            </div>

            {/* Realistic 3D Hogwarts Wax Seal */}
            <div className="wax-seal w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(0,0,0,0.9)] cursor-pointer animate-breathing border-2 border-[#ff7070]/70 relative">
              {/* Seal Inner Bevel & Emblem */}
              <div className="w-24 h-24 rounded-full border border-[#ffd875]/60 flex flex-col items-center justify-center bg-gradient-to-br from-[#b81d1d] via-[#740001] to-[#3a0000] shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />
                <span className="font-cinzel font-black text-3xl text-[#ffd875] tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] select-none">
                  H
                </span>
                <span className="text-[9px] font-cinzel font-bold text-[#ffd875]/80 uppercase tracking-wider select-none mt-0.5">
                  HOGWARTS
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <span className="text-[11px] font-cinzel font-bold text-[#ffd875] uppercase tracking-[0.25em] block mb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                HỌC VIỆN PHÙ THỦY HOGWARTS
              </span>
              <h3 className="font-cinzel font-black text-2xl sm:text-3xl text-[#fff5d6] tracking-wider mb-2 drop-shadow-[0_2px_14px_rgba(255,216,117,0.4)]">
                THẺ BÍ MẬT
              </h3>
              <p className="text-[#e8d7b5] text-xs sm:text-sm max-w-xs mb-6 leading-relaxed font-serif drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Từ khóa thân phận của bạn đang được niêm phong ma thuật. Chạm vào thẻ để lật mở!
              </p>

              <div className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#740001] via-[#9e1c14] to-[#740001] border-2 border-[#ffd875]/80 text-[#ffd875] font-cinzel font-black text-xs sm:text-sm shadow-[0_8px_25px_rgba(116,0,1,0.6)] hover:scale-105 active:scale-95 transition-all group-hover:border-[#ffd875]">
                <Eye size={18} className="text-[#ffd875] animate-pulse" />
                <span className="tracking-wider">CHẠM ĐỂ MỞ PHONG ẤN</span>
              </div>
            </div>
          </div>
        ) : (
          /* CARD FRONT: REVEALED ANCIENT SCROLL */
          <div className="h-full min-h-[460px] p-6 flex flex-col items-center justify-between text-center relative z-10 animate-fadeIn">
            {/* Top Emblem Header */}
            <div className="w-full flex flex-col items-center pt-2">
              <span className="text-4xl mb-2 select-none filter drop-shadow">
                {isMrWhite ? '👻' : '⚡'}
              </span>
              <span className="text-[10px] px-3.5 py-1 rounded-full font-cinzel font-bold border uppercase tracking-wider mb-1.5 bg-[#1a0f28] text-[#ffd875] border-[#ffd875]/50 shadow-sm">
                {isMrWhite ? 'KẺ KHÔNG TÊN' : 'TỪ MA THUẬT CỦA BẠN'}
              </span>
              <h3 className="font-cinzel font-black text-2xl sm:text-3xl text-[#fff2be] tracking-wide">
                {isMrWhite ? 'BẠN LÀ MR. WHITE' : 'TỪ BÍ MẬT'}
              </h3>
            </div>

            {/* Middle Magical Word Box with Gold Aura */}
            <div className="w-full my-4 py-5 px-4 bg-[#08040d]/95 rounded-2xl border-2 border-[#ffd875]/60 shadow-[0_0_25px_rgba(255,216,117,0.25)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd875]/10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[10px] text-[#c8aa6e] block mb-1 uppercase tracking-widest font-cinzel font-bold">
                Nội Dung Trong Thẻ
              </span>
              {isMrWhite ? (
                <div className="py-2">
                  <span className="text-xl sm:text-2xl font-black text-purple-300 italic font-serif">
                    ❓ BẠN KHÔNG CÓ TỪ!
                  </span>
                  <p className="text-xs text-purple-300/90 mt-1.5 font-serif leading-relaxed">
                    Hãy lắng nghe cách người khác miêu tả để suy luận từ bí mật của họ!
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-2xl sm:text-4xl font-black text-[#ffd875] tracking-wider drop-shadow-[0_2px_15px_rgba(255,216,117,0.5)] font-serif">
                    {word || 'Chưa nhận từ'}
                  </span>
                </div>
              )}
            </div>

            {/* Speaking order inside card */}
            {typeof speakingOrder === 'number' && (
              <div className="w-full bg-[#160b24]/90 rounded-xl px-4 py-2.5 border border-[#ffd875]/40 flex items-center justify-between text-xs mb-3 shadow-inner">
                <span className="text-stone-300 font-serif flex items-center gap-1.5">
                  <Mic size={14} className="text-[#ffd875]" />
                  <span>Thứ tự phát biểu của bạn:</span>
                </span>
                <span className="font-mono font-black text-[#ffd875] px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50">
                  {speakingOrder === 1 ? '🌟 Số 1 (Nói đầu)' : `Lượt #${speakingOrder}`}
                </span>
              </div>
            )}

            {/* Instructions */}
            <p className="text-[#e0cfab] text-xs leading-relaxed px-2 mb-4 font-serif">
              {isMrWhite
                ? 'Bạn không có từ bí mật. Hãy lắng nghe các câu miêu tả xung quanh, suy luận chủ đề và khéo léo hòa nhập để không bị phát hiện!'
                : 'Hãy miêu tả từ của bạn thật tinh tế. Bạn không biết mình là Học Sinh hay Tử Thần — hãy lắng nghe mọi người để phán đoán phe phái!'}
            </p>

            {/* Hide Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReveal();
              }}
              className="w-full py-3 rounded-2xl bg-[#1d102b] hover:bg-[#2e1945] text-[#ffd875] border border-[#ffd875]/40 text-xs sm:text-sm font-serif font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <EyeOff size={16} />
              <span>Ẩn Thẻ (Tránh Nhìn Trộm)</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[#c8aa6e]/80 mt-3 text-center font-serif flex items-center justify-center gap-1.5">
        <Sparkles size={13} className="text-[#ffd875]" />
        <span>Nhấn lại vào thẻ để úp xuống bất cứ lúc nào nhằm giữ kín bí mật.</span>
      </p>
    </div>
  );
};

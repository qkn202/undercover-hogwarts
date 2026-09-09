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
        className={`w-full min-h-[430px] rounded-3xl cursor-pointer select-none transition-all duration-500 transform relative overflow-hidden border-2 shadow-[0_25px_60px_rgba(0,0,0,0.9)] ${
          isRevealed
            ? 'glass-panel-gold border-[#ffd875] shadow-[0_0_40px_rgba(255,216,117,0.35)]'
            : 'bg-gradient-to-b from-[#211135] via-[#160b24] to-[#0a0512] border-[#c8aa6e]/70 hover:border-[#ffd875] active:scale-[0.98]'
        }`}
      >
        {/* Grimoire Antique Corner Metal Ornaments */}
        <div className="absolute top-3 left-3 text-[#ffd875]/60 text-sm select-none pointer-events-none font-serif">
          ❖
        </div>
        <div className="absolute top-3 right-3 text-[#ffd875]/60 text-sm select-none pointer-events-none font-serif">
          ❖
        </div>
        <div className="absolute bottom-3 left-3 text-[#ffd875]/60 text-sm select-none pointer-events-none font-serif">
          ❖
        </div>
        <div className="absolute bottom-3 right-3 text-[#ffd875]/60 text-sm select-none pointer-events-none font-serif">
          ❖
        </div>

        {/* Ambient Leather Border Inset */}
        <div className="absolute inset-2 rounded-[22px] border border-[#c8aa6e]/20 pointer-events-none" />

        {!isRevealed ? (
          /* CARD BACK: ANCIENT GRIMOIRE COVER WITH 3D WAX SEAL */
          <div className="h-full min-h-[430px] p-6 flex flex-col items-center justify-center text-center relative z-10">
            {/* Realistic 3D Hogwarts Wax Seal */}
            <div className="wax-seal w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer animate-[breathingPulse_3s_ease-in-out_infinite] border-2 border-[#ff7070]/60">
              <div className="flex flex-col items-center justify-center">
                <span className="text-5xl filter drop-shadow select-none">📜</span>
              </div>
            </div>

            <span className="text-[11px] font-cinzel font-bold text-[#ffd875] uppercase tracking-widest block mb-1">
              HỌC VIỆN PHÙ THỦY HOGWARTS
            </span>
            <h3 className="font-cinzel font-black text-2xl sm:text-3xl text-[#fff2be] tracking-wider mb-2 drop-shadow-[0_2px_12px_rgba(255,216,117,0.3)]">
              THẺ BÍ MẬT
            </h3>
            <p className="text-[#e0cfab] text-xs sm:text-sm max-w-xs mb-6 leading-relaxed font-serif">
              Từ khóa thân phận của bạn đang được niêm phong ma thuật. Chạm vào thẻ để lật mở!
            </p>

            <div className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] border border-[#ffd875]/70 text-[#ffd875] font-cinzel font-black text-xs sm:text-sm shadow-xl hover:scale-105 transition-all">
              <Eye size={18} />
              <span>CHẠM ĐỂ MỞ PHONG ẤN</span>
            </div>
          </div>
        ) : (
          /* CARD FRONT: REVEALED ANCIENT SCROLL */
          <div className="h-full min-h-[430px] p-6 flex flex-col items-center justify-between text-center relative z-10 animate-fadeIn">
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

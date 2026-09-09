import React, { useState } from 'react';
import type { Role } from '../types';
import { Eye, EyeOff, ShieldAlert, Mic } from 'lucide-react';
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
    <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fadeIn">
      {/* Player Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffd875] to-[#740001] p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#120a1c] text-[#ffd875] font-cinzel font-bold text-xs flex items-center justify-center">
              {playerName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="font-serif font-bold text-[#f3efe6] text-sm">
              {playerName}
            </div>
            <p className="text-[11px] text-[#c8aa6e]">Vòng đấu #{roundNumber}</p>
          </div>
        </div>

        {/* Right Header Badges: Speaking Order & Anti-Peeking */}
        <div className="flex items-center gap-1.5">
          {typeof speakingOrder === 'number' && (
            <div
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl border font-serif font-bold shadow-sm ${
                speakingOrder === 1
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-[#ffd875] border-[#ffd875]'
                  : 'bg-[#221336] text-[#ffd875] border-[#c8aa6e]/40'
              }`}
            >
              <Mic size={12} className="text-[#ffd875]" />
              <span>{speakingOrder === 1 ? 'Nói đầu (#1)' : `Lượt #${speakingOrder}`}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 px-2 py-1 rounded-xl border border-amber-600/40">
            <ShieldAlert size={12} />
            <span className="hidden xs:inline">Che màn hình</span>
          </div>
        </div>
      </div>

      {/* The Magical Tactile Flip Card */}
      <div
        onClick={toggleReveal}
        className={`w-full min-h-[400px] rounded-3xl cursor-pointer select-none transition-all duration-300 transform relative overflow-hidden border-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
          isRevealed
            ? 'glass-panel-gold border-[#ffd875] shadow-[0_0_30px_rgba(255,216,117,0.25)]'
            : 'bg-gradient-to-b from-[#241538] via-[#1a0e2a] to-[#0e0716] border-[#c8aa6e]/60 hover:border-[#ffd875] active:scale-[0.98]'
        }`}
      >
        {/* Renaissance Filigree Corner Accents */}
        <div className="absolute top-2.5 left-2.5 text-[#ffd875]/40 text-xs select-none pointer-events-none font-serif">
          ✦
        </div>
        <div className="absolute top-2.5 right-2.5 text-[#ffd875]/40 text-xs select-none pointer-events-none font-serif">
          ✦
        </div>
        <div className="absolute bottom-2.5 left-2.5 text-[#ffd875]/40 text-xs select-none pointer-events-none font-serif">
          ✦
        </div>
        <div className="absolute bottom-2.5 right-2.5 text-[#ffd875]/40 text-xs select-none pointer-events-none font-serif">
          ✦
        </div>

        {/* Background Crest Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[200px]">⚡</span>
        </div>

        {!isRevealed ? (
          /* Card Back (Face Down) */
          <div className="h-full min-h-[400px] p-6 flex flex-col items-center justify-center text-center relative z-10">
            {/* Realistic 3D Hogwarts Wax Seal */}
            <div className="wax-seal w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl filter drop-shadow select-none">📜</span>
              </div>
            </div>

            <span className="text-[10px] font-cinzel font-bold text-[#ffd875] uppercase tracking-widest block mb-1">
              HỌC VIỆN PHÙ THỦY HOGWARTS
            </span>
            <h3 className="font-cinzel font-black text-xl sm:text-2xl text-[#fff2be] tracking-wider mb-2 drop-shadow">
              THẺ BÍ MẬT
            </h3>
            <p className="text-[#c8aa6e]/90 text-xs max-w-xs mb-6 leading-relaxed font-medium">
              Từ ma thuật của bạn được phong ấn bảo mật. Nhấn vào thẻ để lật mở!
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2b1642] to-[#3a1d59] border border-[#ffd875]/60 text-[#ffd875] font-cinzel font-bold text-xs sm:text-sm shadow-xl hover:from-[#3a1d59] hover:to-[#4a2673] transition-all">
              <Eye size={17} />
              <span>CHẠM ĐỂ MỞ THẺ</span>
            </div>
          </div>
        ) : (
          /* Card Front (Revealed) */
          <div className="h-full min-h-[400px] p-6 flex flex-col items-center justify-between text-center relative z-10 animate-fadeIn">
            {/* Top Indicator */}
            <div className="w-full flex flex-col items-center pt-1">
              <span className="text-4xl mb-2 select-none filter drop-shadow">
                {isMrWhite ? '👻' : '📜'}
              </span>
              <span className="text-[10px] px-3 py-1 rounded-full font-cinzel font-bold border uppercase tracking-wider mb-1 bg-[#1a0f28] text-[#ffd875] border-[#ffd875]/40 shadow-sm">
                {isMrWhite ? 'KẺ KHÔNG TÊN' : 'TỪ MA THUẬT CỦA BẠN'}
              </span>
              <h3 className="font-cinzel font-black text-2xl text-[#fff2be] tracking-wide">
                {isMrWhite ? 'BẠN LÀ MR. WHITE' : 'TỪ BÍ MẬT'}
              </h3>
            </div>

            {/* Middle Word Box */}
            <div className="w-full my-3 py-4 px-3 bg-[#0a0512]/90 rounded-2xl border border-[#ffd875]/50 shadow-inner">
              <span className="text-[10px] text-[#c8aa6e] block mb-1 uppercase tracking-widest font-cinzel font-bold">
                Nội Dung Trong Thẻ
              </span>
              {isMrWhite ? (
                <div className="py-2">
                  <span className="text-xl font-extrabold text-purple-300 italic font-serif">
                    ❓ BẠN KHÔNG CÓ TỪ!
                  </span>
                  <p className="text-[11px] text-purple-300/90 mt-1 font-medium">
                    Hãy lắng nghe cách người khác miêu tả để suy luận từ của họ!
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#ffd875] tracking-wide drop-shadow-[0_2px_10px_rgba(255,216,117,0.3)] font-serif">
                    {word || 'Chưa nhận từ'}
                  </span>
                </div>
              )}
            </div>

            {/* Speaking order inside card */}
            {typeof speakingOrder === 'number' && (
              <div className="w-full bg-[#160b24]/90 rounded-xl px-3.5 py-2.5 border border-[#ffd875]/30 flex items-center justify-between text-xs mb-3 shadow-inner">
                <span className="text-stone-300 font-serif flex items-center gap-1.5">
                  <Mic size={13} className="text-[#ffd875]" />
                  <span>Thứ tự phát biểu của bạn:</span>
                </span>
                <span className="font-mono font-black text-[#ffd875] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  {speakingOrder === 1 ? '🌟 Số 1 (Nói đầu)' : `Lượt #${speakingOrder}`}
                </span>
              </div>
            )}

            {/* Instructions */}
            <p className="text-[#c8aa6e]/90 text-xs leading-relaxed px-2 mb-4 font-medium">
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
              className="w-full py-2.5 rounded-xl bg-[#1d102b] hover:bg-[#2e1945] text-[#c8aa6e] hover:text-[#ffd875] border border-[#c8aa6e]/40 text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <EyeOff size={15} />
              <span>Ẩn Thẻ (Tránh Nhìn Trộm)</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#c8aa6e]/70 mt-2.5 text-center font-medium">
        💡 Mẹo: Nhấn lại vào thẻ để úp xuống bất cứ lúc nào nhằm tránh người bên cạnh thấy.
      </p>
    </div>
  );
};

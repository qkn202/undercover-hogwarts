import React, { useState } from 'react';
import type { Role } from '../types';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
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
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Player Header */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2a1a3e] border border-[#c8aa6e]/40 flex items-center justify-center text-sm font-bold text-[#f3d994]">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-serif font-bold text-stone-200 text-sm">
              {playerName}
            </div>
            <p className="text-[11px] text-stone-400">Vòng đấu #{roundNumber}</p>
          </div>
        </div>

        {/* Right Header Badges: Speaking Order & Anti-Peeking */}
        <div className="flex items-center gap-1.5">
          {typeof speakingOrder === 'number' && (
            <div
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border font-serif font-bold ${
                speakingOrder === 1
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-sm'
                  : 'bg-purple-950/40 text-[#ffd875] border-purple-800/40'
              }`}
            >
              <span>🎤</span>
              <span>{speakingOrder === 1 ? 'Lượt #1 (Nói đầu)' : `Lượt #${speakingOrder}`}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-amber-300/80 bg-amber-950/40 px-2 py-1 rounded-md border border-amber-800/40">
            <ShieldAlert size={13} />
            <span>Che màn hình</span>
          </div>
        </div>
      </div>

      {/* The Magical Flip Card */}
      <div
        onClick={toggleReveal}
        className={`w-full min-h-[380px] rounded-2xl cursor-pointer select-none transition-all duration-300 transform relative overflow-hidden border-2 shadow-2xl ${
          isRevealed
            ? 'bg-gradient-to-b from-[#1b1424] to-[#120d18] border-[#c8aa6e] shadow-[#c8aa6e]/20'
            : 'bg-gradient-to-b from-[#241733] via-[#1a1126] to-[#0f0917] border-[#8b6f38] hover:border-[#f3d994] active:scale-[0.98]'
        }`}
      >
        {/* Background Decorative Crest */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
          <span className="text-[180px]">⚡</span>
        </div>

        {!isRevealed ? (
          /* Card Back (Face Down) */
          <div className="h-full min-h-[380px] p-6 flex flex-col items-center justify-center text-center">
            {/* Wax Seal Design */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8a1c14] to-[#450a0a] border-4 border-[#c8aa6e] shadow-lg flex items-center justify-center mb-6 relative animate-pulse">
              <span className="text-4xl select-none">📜</span>
              <div className="absolute -inset-1 rounded-full border border-[#f3d994]/30 pointer-events-none"></div>
            </div>

            <h3 className="font-serif font-bold text-xl text-[#f3d994] tracking-wider mb-2">
              THẺ BÍ MẬT HOGWARTS
            </h3>
            <p className="text-stone-300 text-xs max-w-xs mb-6 leading-relaxed">
              Từ ngữ ma thuật được bảo mật tuyệt đối. Nhấn vào thẻ để lật mở!
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#342250]/80 border border-[#c8aa6e]/60 text-[#f3d994] font-medium text-sm shadow-md hover:bg-[#462e6d] transition-all">
              <Eye size={17} />
              <span>Chạm Để Mở Thẻ</span>
            </div>
          </div>
        ) : (
          /* Card Front (Revealed) — Identical layout for both Student and Death Eater */
          <div className="h-full min-h-[380px] p-6 flex flex-col items-center justify-between text-center relative z-10 animate-fadeIn">
            {/* Top Indicator */}
            <div className="w-full flex flex-col items-center pt-2">
              <span className="text-4xl mb-2 select-none">
                {isMrWhite ? '👻' : '📜'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider mb-1 bg-[#251838] text-[#f3d994] border-[#c8aa6e]/50">
                {isMrWhite ? 'KẺ KHÔNG TÊN' : 'TỪ MA THUẬT CỦA BẠN'}
              </span>
              <h3 className="font-serif font-extrabold text-2xl text-[#f3d994] tracking-wide">
                {isMrWhite ? 'BẠN LÀ MR. WHITE' : 'TỪ BÍ MẬT'}
              </h3>
            </div>

            {/* Middle Word Box */}
            <div className="w-full my-3 py-4 px-3 bg-[#0c0812]/90 rounded-xl border border-[#c8aa6e]/50 shadow-inner">
              <span className="text-[11px] text-stone-400 block mb-1 uppercase tracking-wider font-semibold">
                Nội Dung Trong Thẻ
              </span>
              {isMrWhite ? (
                <div className="py-2">
                  <span className="text-xl font-extrabold text-purple-300 italic">
                    ❓ BẠN KHÔNG CÓ TỪ!
                  </span>
                  <p className="text-[11px] text-purple-400/90 mt-1">
                    Hãy lắng nghe cách người khác miêu tả để đoán từ của họ!
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <span className="text-2xl font-black text-[#ffd875] tracking-wide drop-shadow-md">
                    {word || 'Chưa nhận từ'}
                  </span>
                </div>
              )}
            </div>

            {/* Speaking order inside card */}
            {typeof speakingOrder === 'number' && (
              <div className="w-full bg-[#1b1226]/90 rounded-xl px-3 py-2 border border-[#c8aa6e]/40 flex items-center justify-between text-xs mb-3 shadow-inner">
                <span className="text-stone-300 font-serif flex items-center gap-1.5">
                  <span>🎤</span> Thứ tự phát biểu của bạn:
                </span>
                <span className="font-bold text-[#ffd875] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 font-mono">
                  {speakingOrder === 1 ? '🌟 Số 1 (Nói đầu tiên)' : `Lượt số #${speakingOrder}`}
                </span>
              </div>
            )}

            {/* Instructions: Neutral and thrilling */}
            <p className="text-stone-300 text-xs leading-relaxed px-2 mb-4">
              {isMrWhite
                ? 'Bạn không biết từ bí mật. Hãy lắng nghe các câu miêu tả xung quanh, suy luận chủ đề và tự tin "chém gió" để không bị loại!'
                : 'Hãy miêu tả từ của bạn thật khéo léo. Bạn không biết mình là Học Sinh hay Tử Thần — hãy lắng nghe mọi người xung quanh để tự phán đoán phe phái!'}
            </p>

            {/* Hide Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReveal();
              }}
              className="w-full py-2 rounded-xl bg-[#20152e] hover:bg-[#322047] text-stone-300 hover:text-[#f3d994] border border-[#c8aa6e]/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <EyeOff size={15} />
              <span>Ẩn Thẻ (Tránh Nhìn Trộm)</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-stone-500 mt-2 text-center">
        💡 Mẹo: Nhấn lại vào thẻ để úp xuống bất kỳ lúc nào để tránh người bên cạnh thấy.
      </p>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player, WordPair, GameStatus, HostRoleMode } from '../types';
import { Shield, RefreshCw, Eye, EyeOff, Timer, Skull, BookOpen, Lock } from 'lucide-react';
import { sound } from '../utils/audio';

interface HostBoardProps {
  status: GameStatus;
  hostRole: HostRoleMode;
  currentPair?: WordPair;
  players: Player[];
  roundNumber: number;
  winner?: 'STUDENT' | 'DEATH_EATER' | 'MR_WHITE' | null;
  onRevealAll: () => void;
  onNextRound: () => void;
  onBackToLobby: () => void;
  onToggleEliminated: (playerId: string) => void;
}

export const HostBoard: React.FC<HostBoardProps> = ({
  status,
  hostRole,
  currentPair,
  players,
  roundNumber,
  winner,
  onRevealAll,
  onNextRound,
  onBackToLobby,
  onToggleEliminated,
}) => {

  // Toggle visibility of Game Master Dossier (in case someone looks over Host's shoulder)
  const [showMasterNotes, setShowMasterNotes] = useState(true);

  // Optional Turn Timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      sound.playDarkReveal();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleStartTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
    sound.playButtonChime();
  };

  const handleReveal = () => {
    sound.playVictoryFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onRevealAll();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 mt-6">
      {/* Game Outcome Alert Banner for Host */}
      {winner && (
        <div
          className={`p-4 rounded-2xl border-2 text-center shadow-xl flex flex-col items-center gap-1.5 animate-fadeIn ${
            winner === 'STUDENT'
              ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-amber-400 text-amber-200'
              : winner === 'DEATH_EATER'
              ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border-emerald-400 text-emerald-200'
              : 'bg-gradient-to-r from-purple-950/90 via-purple-900/80 to-purple-950/90 border-purple-400 text-purple-200'
          }`}
        >
          <span className="text-3xl animate-bounce">
            {winner === 'STUDENT' ? '⚡ 🏆' : winner === 'DEATH_EATER' ? '🐍 💀' : '👻 🔮'}
          </span>
          <h4 className="font-serif font-black text-base sm:text-lg tracking-wider">
            {winner === 'STUDENT'
              ? 'PHE HỌC SINH ĐÃ CHIẾN THẮNG!'
              : winner === 'DEATH_EATER'
              ? 'TỬ THẦN THỰC TỬ ĐÃ THỐNG TRỊ HOGWARTS!'
              : 'KẺ KHÔNG TÊN ĐÃ ĐOÁN ĐÚNG TỪ & LẬT KÈO!'}
          </h4>
          <p className="text-xs opacity-90 max-w-md leading-relaxed">
            {winner === 'STUDENT'
              ? 'Tất cả Tử Thần Thực Tử và Kẻ Không Tên đã bị loại khỏi bàn chơi.'
              : winner === 'DEATH_EATER'
              ? 'Số lượng Tử thần và Kẻ không tên đã ngang bằng hoặc áp đảo Học sinh còn sống!'
              : 'Mr. White đã thành công giải mã từ ngữ bí mật của phe Học sinh!'}
          </p>
          {status === 'PLAYING' && (
            <button
              onClick={handleReveal}
              className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              BẤM ĐỂ CÔNG BỐ KẾT QUẢ CHO CẢ PHÒNG ➔
            </button>
          )}
        </div>
      )}

      {/* Host Control Bar */}
      <div className="bg-[#191124] rounded-2xl p-4 border border-[#c8aa6e]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#342250] flex items-center justify-center text-[#f3d994] border border-[#c8aa6e]/40">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[11px] text-[#a49a88] uppercase tracking-wider font-semibold block">
              Bảng Điều Khiển Của Quản Trò (Host)
            </span>
            <span className="font-serif font-bold text-stone-200 text-sm">
              {status === 'PLAYING' ? 'Ván Đấu Đang Diễn Ra' : 'Đã Kết Thúc Vòng Đấu'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {status === 'PLAYING' ? (
            <button
              onClick={handleReveal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-serif font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg border border-amber-400 transition-all active:scale-95"
            >
              <Eye size={16} />
              <span>KẾT THÚC & CÔNG BỐ</span>
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-serif font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg border border-emerald-400 transition-all active:scale-95"
            >
              <RefreshCw size={16} />
              <span>VÁN TIẾP THEO</span>
            </button>
          )}

          <button
            onClick={onBackToLobby}
            className="px-3 py-2.5 rounded-xl bg-[#251838] hover:bg-[#352350] text-stone-300 text-xs font-medium border border-[#c8aa6e]/30 transition-all"
          >
            Về Sảnh
          </button>
        </div>
      </div>

      {/* SỔ TAY QUẢN TRÒ (CHỈ HOST MỚI THẤY CẶP TỪ & PHÂN VAI) */}
      {currentPair && (
        hostRole === 'PLAYER' && status === 'PLAYING' ? (
          /* Host is participating as Player -> Dossier is locked during play for fairness */
          <div className="bg-[#150e20] p-4 rounded-2xl border border-stone-800 text-center animate-fadeIn shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-[#ffd875] font-serif font-bold text-xs mb-1">
              <Lock size={14} className="text-amber-400" />
              <span>SỔ TAY QUẢN TRÒ ĐANG ĐƯỢC KHÓA ĐỂ CÔNG BẰNG</span>
            </div>
            <p className="text-[11px] text-stone-300 max-w-md mx-auto leading-relaxed">
              Bạn đang ở chế độ <strong>Host Cùng Chơi</strong> (đang cầm thẻ bí mật bên trên). Cặp từ và danh tính của mọi người được ẩn để bạn cùng tranh luận công bằng. Sau khi bỏ phiếu xong, bấm <strong>"KẾT THÚC & CÔNG BỐ"</strong> để mở toàn bộ kết quả!
            </p>
          </div>
        ) : (
          /* Host is Game Master OR round is Revealed -> Full Dossier visible */
          <div className="bg-gradient-to-b from-[#1d1429] via-[#160e21] to-[#120a1c] p-5 rounded-2xl border-2 border-[#c8aa6e] shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#c8aa6e]/30 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[#ffd875]" size={20} />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#f3d994] flex items-center gap-1.5">
                    <span>SỔ TAY QUẢN TRÒ — VÒNG #{roundNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/50 font-sans font-semibold">
                      {hostRole === 'GAME_MASTER' ? 'Chế độ Quản Trò' : 'Kết Quả Ván'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Người chơi khác trên điện thoại của họ hoàn toàn KHÔNG THẤY phần này.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMasterNotes(!showMasterNotes)}
                className="px-2.5 py-1.5 rounded-lg bg-[#281b3d] hover:bg-[#392657] text-[#f3d994] border border-[#c8aa6e]/40 text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                {showMasterNotes ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showMasterNotes ? 'Ẩn Sổ Tay' : 'Xem Sổ Tay'}</span>
              </button>
            </div>


          {showMasterNotes && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Words Comparison Box */}
              <div>
                <span className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Cặp Từ Bí Mật Đang Sử Dụng:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#0f0917] p-3.5 rounded-xl border border-amber-600/50 shadow-inner">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase flex items-center gap-1">
                      <span>🪄</span> TỪ HỌC SINH (CIVILIAN — PHE ĐA SỐ)
                    </span>
                    <span className="font-serif font-extrabold text-base sm:text-lg text-[#ffd875] block mt-1">
                      {currentPair.studentWord}
                    </span>
                  </div>

                  <div className="bg-[#0f0917] p-3.5 rounded-xl border border-emerald-600/50 shadow-inner">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase flex items-center gap-1">
                      <span>🐍</span> TỪ TỬ THẦN THỰC TỬ (UNDERCOVER — GIÁN ĐIỆP)
                    </span>
                    <span className="font-serif font-extrabold text-base sm:text-lg text-emerald-300 block mt-1">
                      {currentPair.undercoverWord}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Player Roles Roster */}
              <div>
                <span className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Thân Phận Chi Tiết Từng Người Trong Bàn ({players.length} người):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {players.map((p) => {
                    const isGameMaster = p.isHost && hostRole === 'GAME_MASTER';
                    const isSpectator = !p.isHost && !p.role;
                    const isDeathEater = p.role === 'DEATH_EATER';
                    const isMrWhite = p.role === 'MR_WHITE';

                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isGameMaster
                            ? 'bg-[#1b1429] border-[#c8aa6e]/60 text-amber-200'
                            : isSpectator
                            ? 'bg-[#120d1c] border-dashed border-stone-700/70 text-stone-400'
                            : isDeathEater
                            ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                            : isMrWhite
                            ? 'bg-purple-950/40 border-purple-600/70 text-purple-200'
                            : 'bg-[#0f0917] border-amber-900/40 text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#1b1226] border border-[#c8aa6e]/30 flex items-center justify-center text-xs font-bold text-[#f3d994]">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {typeof p.speakingOrder === 'number' && (
                                <span className="font-mono text-[10px] font-bold px-1 rounded bg-[#281b3d] text-amber-300 border border-amber-500/40">
                                  #{p.speakingOrder}
                                </span>
                              )}
                              <span className="font-semibold text-xs truncate">{p.name}</span>
                            </div>
                            <span className="text-[10px] opacity-75 truncate block">
                              {isGameMaster
                                ? 'Quản trò (Điều phối bàn)'
                                : isSpectator
                                ? '👀 Khán giả (Sẽ tham gia vào ván sau)'
                                : `Từ: ${p.word || 'Không có từ (Mr. White)'}`}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                            isGameMaster
                              ? 'bg-amber-900/80 text-amber-200 border border-amber-500/40'
                              : isSpectator
                              ? 'bg-stone-800 text-stone-300 border border-stone-600/50'
                              : isDeathEater
                              ? 'bg-emerald-800 text-emerald-100'
                              : isMrWhite
                              ? 'bg-purple-800 text-purple-100'
                              : 'bg-amber-900/70 text-amber-200'
                          }`}
                        >
                          {isGameMaster
                            ? '👑 Quản Trò'
                            : isSpectator
                            ? '👀 Khán Giả'
                            : isDeathEater
                            ? '🐍 Tử Thần'
                            : isMrWhite
                            ? '👻 Kẻ Không Tên'
                            : '🪄 Học Sinh'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        )
      )}

      {/* Optional Turn Timer Tool */}
      <div className="bg-[#120d18] px-4 py-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-300">
          <Timer size={16} className="text-[#c8aa6e]" />
          <span>Đồng Hồ Lượt Nói:</span>
          {timerSeconds !== null && (
            <span
              className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                timerSeconds <= 5 ? 'bg-red-950 text-red-400 animate-ping' : 'bg-[#2a1a3e] text-[#ffd875]'
              }`}
            >
              {timerSeconds}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStartTimer(60)}
            className="px-2.5 py-1 rounded-lg bg-[#221633] hover:bg-[#342250] text-stone-300 border border-stone-700 text-[11px]"
          >
            60 giây
          </button>
          <button
            onClick={() => handleStartTimer(45)}
            className="px-2.5 py-1 rounded-lg bg-[#221633] hover:bg-[#342250] text-stone-300 border border-stone-700 text-[11px]"
          >
            45 giây
          </button>
          <button
            onClick={() => handleStartTimer(30)}
            className="px-2.5 py-1 rounded-lg bg-[#221633] hover:bg-[#342250] text-stone-300 border border-stone-700 text-[11px]"
          >
            30 giây
          </button>
          {timerRunning && (
            <button
              onClick={() => setTimerRunning(false)}
              className="px-2 py-1 rounded-lg bg-red-900/60 text-red-200 text-[11px]"
            >
              Dừng
            </button>
          )}
        </div>
      </div>

      {/* In-game Player Elimination Tracker */}
      <div className="bg-[#150e20] p-4 rounded-xl border border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-400 font-semibold uppercase">
            Bỏ Phiếu Loại Người Chơi (Bấm để gạch tên người bị loại):
          </span>
        </div>
        {(() => {
          const activePlayers = players.filter(
            (p) => !(p.isHost && hostRole === 'GAME_MASTER') && (p.role !== undefined || p.isHost)
          );
          const spectators = players.filter((p) => !p.isHost && !p.role);

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onToggleEliminated(p.id);
                      sound.playButtonChime();
                    }}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      p.isEliminated
                        ? 'bg-red-950/60 border-red-800 text-red-300 line-through opacity-60'
                        : 'bg-[#1e142c] border-stone-700 text-stone-300 hover:border-amber-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {typeof p.speakingOrder === 'number' ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 flex-shrink-0">
                          {p.speakingOrder}
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#100b17] flex items-center justify-center text-[10px] font-bold text-[#c8aa6e] flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-medium">{p.name}</span>
                    </div>

                    {p.isEliminated ? <Skull size={13} className="text-red-400 flex-shrink-0" /> : <span className="text-[10px] text-stone-500">Sống</span>}
                  </button>
                ))}
              </div>

              {spectators.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>👀</span>
                    <span>
                      Có <strong className="text-amber-300 font-semibold">{spectators.length}</strong> khán giả đang theo dõi ({spectators.map((s) => s.name).join(', ')}).
                    </span>
                  </div>
                  <span className="text-amber-400/90 text-[10px] font-medium hidden sm:inline">
                    Tự động tham gia ván sau
                  </span>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

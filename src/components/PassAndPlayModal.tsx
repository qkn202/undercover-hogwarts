import React, { useState, useRef } from 'react';
import type { WordPair, Player } from '../types';
import { selectRandomWordPair } from '../data/words';
import { assignOptimalRoles, type PlayerRoleStats } from '../utils/roleAssignment';
import { SecretCard } from './SecretCard';
import { SpeakingOrderBanner } from './SpeakingOrderBanner';
import { Smartphone, X, ArrowRight, RefreshCw, Eye, Award } from 'lucide-react';
import { sound } from '../utils/audio';

interface PassAndPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PASS_PLAYERS: string[] = [
  'Harry', 'Ron', 'Hermione', 'Draco', 'Luna', 'Neville', 'Cedric'
];

export const PassAndPlayModal: React.FC<PassAndPlayModalProps> = ({ isOpen, onClose }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_PASS_PLAYERS);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [includeMrWhite, setIncludeMrWhite] = useState(false);

  // Game state
  const [isStarted, setIsStarted] = useState(false);
  const [currentPair, setCurrentPair] = useState<WordPair | null>(null);
  const [assignedPlayers, setAssignedPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [allPassed, setAllPassed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Role history tracker for fair distribution
  const roleHistoryRef = useRef<Map<string, PlayerRoleStats>>(new Map());

  if (!isOpen) return null;

  const handleStart = () => {
    const pair = selectRandomWordPair(['ALL']);
    setCurrentPair(pair);

    const initialPlayers: Player[] = playerNames.map((name, idx) => ({
      id: `p-${idx}`,
      name,
      isHost: idx === 0,
      isAi: false,
    }));

    const mrWhite = includeMrWhite ? 1 : 0;
    const { roleMap, updatedHistory, speakingOrderMap } = assignOptimalRoles({
      cardPlayers: initialPlayers,
      undercoverCount,
      mrWhiteCount: mrWhite,
      roleHistory: roleHistoryRef.current,
    });
    roleHistoryRef.current = updatedHistory;

    const players: Player[] = initialPlayers.map((p) => {
      const assignedRole = roleMap.get(p.id) || 'STUDENT';
      const order = speakingOrderMap.get(p.id);
      return {
        ...p,
        role: assignedRole,
        speakingOrder: order,
        word:
          assignedRole === 'STUDENT'
            ? pair.studentWord
            : assignedRole === 'DEATH_EATER'
            ? pair.undercoverWord
            : null,
      };
    });

    setAssignedPlayers(players);
    setActivePlayerIndex(0);
    setAllPassed(false);
    setIsRevealed(false);
    setIsStarted(true);
    sound.playVictoryFanfare();
  };

  const handleNextPlayer = () => {
    if (activePlayerIndex < assignedPlayers.length - 1) {
      setActivePlayerIndex(activePlayerIndex + 1);
      sound.playButtonChime();
    } else {
      setAllPassed(true);
      sound.playVictoryFanfare();
    }
  };

  const handleReset = () => {
    setIsStarted(false);
    setAllPassed(false);
    setIsRevealed(false);
    setActivePlayerIndex(0);
  };

  const currentPlayer = assignedPlayers[activePlayerIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#181122] rounded-2xl border-2 border-[#c8aa6e] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c8aa6e]/30 flex items-center justify-between bg-[#120d18]">
          <div className="flex items-center gap-2">
            <Smartphone className="text-[#c8aa6e]" size={20} />
            <h3 className="font-serif font-bold text-[#f3d994] text-lg">
              Chế Độ 1 Máy (Chuyền Tay Nhau)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {!isStarted ? (
            /* Setup View */
            <div className="flex flex-col gap-4">
              <p className="text-xs text-stone-300">
                Chế độ tiện lợi khi chơi tại bàn cà phê: Từng người cầm điện thoại xem từ bí mật của mình rồi chuyền cho người tiếp theo!
              </p>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Danh Sách Người Chơi ({playerNames.length} người):
                </label>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {playerNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#c8aa6e] w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...playerNames];
                          updated[idx] = e.target.value;
                          setPlayerNames(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#100b17] border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-[#c8aa6e]"
                      />
                      {playerNames.length > 3 && (
                        <button
                          onClick={() => setPlayerNames(playerNames.filter((_, i) => i !== idx))}
                          className="text-stone-500 hover:text-red-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {playerNames.length < 10 && (
                  <button
                    onClick={() => setPlayerNames([...playerNames, `Người chơi ${playerNames.length + 1}`])}
                    className="mt-2 text-xs text-[#ffd875] hover:underline"
                  >
                    + Thêm người chơi
                  </button>
                )}
              </div>

              {/* Roles */}
              <div className="grid grid-cols-2 gap-3 bg-[#100b17] p-3 rounded-xl border border-stone-800 text-xs">
                <div>
                  <span className="block text-stone-400 mb-1">Số Tử Thần:</span>
                  <div className="flex gap-2">
                    {[1, 2].map((num) => (
                      <button
                        key={num}
                        onClick={() => setUndercoverCount(num)}
                        className={`px-3 py-1 rounded font-bold ${
                          undercoverCount === num
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-stone-400 mb-1">Kẻ Không Tên (Mr. White):</span>
                  <button
                    onClick={() => setIncludeMrWhite(!includeMrWhite)}
                    className={`px-3 py-1 rounded font-bold ${
                      includeMrWhite ? 'bg-purple-700 text-white' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {includeMrWhite ? 'Bật (1 người)' : 'Tắt (0 người)'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#740001] via-[#c8aa6e] to-[#740001] text-amber-100 font-serif font-bold text-sm shadow-xl"
              >
                BẮT ĐẦU CHUYỀN TAY
              </button>
            </div>
          ) : !allPassed && currentPlayer ? (
            /* Pass to Player Screen */
            <div className="flex flex-col items-center gap-4">
              <div className="w-full bg-[#100b17] p-3 rounded-xl border border-stone-800 text-center">
                <span className="text-xs text-[#a49a88] uppercase block">Lượt Của</span>
                <span className="font-serif font-bold text-xl text-[#f3d994]">
                  {currentPlayer.name} ({activePlayerIndex + 1}/{assignedPlayers.length})
                </span>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Đưa máy cho {currentPlayer.name}. Những người khác vui lòng quay mặt đi!
                </p>
              </div>

              {/* Secret Card for this player */}
              <SecretCard
                role={currentPlayer.role}
                word={currentPlayer.word}
                playerName={currentPlayer.name}
                roundNumber={1}
                speakingOrder={currentPlayer.speakingOrder}
              />

              {/* Next player button */}
              <button
                onClick={handleNextPlayer}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#342250] to-[#462e6d] hover:from-[#3e2960] hover:to-[#553884] text-[#f3d994] font-serif font-bold text-sm border border-[#c8aa6e]/50 flex items-center justify-center gap-2 shadow-lg"
              >
                <span>
                  {activePlayerIndex < assignedPlayers.length - 1
                    ? `Đã xem xong! Chuyền cho ${assignedPlayers[activePlayerIndex + 1]?.name}`
                    : 'Tất cả đã xem xong! Bắt đầu tranh luận'}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* All Passed: Debate & Reveal View */
            <div className="flex flex-col gap-4 text-center">
              <div className="bg-[#120d18] p-5 rounded-2xl border border-[#c8aa6e]/40">
                <span className="text-3xl mb-2 block">🗣️</span>
                <h4 className="font-serif font-bold text-lg text-[#f3d994] mb-1">
                  Mọi Người Đã Xem Xong Thẻ!
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Bây giờ mọi người lần lượt phát biểu miêu tả từ của mình theo thứ tự ngẫu nhiên bên dưới. Sau mỗi vòng, cả nhóm tiến hành bỏ phiếu chỉ ra ai là Tử Thần Thực Tử / Kẻ Không Tên!
                </p>
              </div>

              {/* Randomized Speaking Order Banner */}
              <SpeakingOrderBanner players={assignedPlayers} />

              {!isRevealed ? (
                <button
                  onClick={() => {
                    setIsRevealed(true);
                    sound.playVictoryFanfare();
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-serif font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  <span>KẾT THÚC & LẬT MỞ ĐÁP ÁN</span>
                </button>
              ) : (
                <div className="bg-[#100b17] p-4 rounded-xl border border-[#c8aa6e] text-left animate-fadeIn">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="text-[#ffd875]" size={18} />
                    <span className="font-serif font-bold text-sm text-[#f3d994]">Đáp Án Vòng Này</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded bg-[#181122] border border-amber-600/40">
                      <span className="text-[10px] text-amber-400 block font-semibold">Học Sinh (Civilian):</span>
                      <span className="font-bold text-[#ffd875] text-sm">{currentPair?.studentWord}</span>
                    </div>
                    <div className="p-2 rounded bg-[#181122] border border-emerald-600/40">
                      <span className="text-[10px] text-emerald-400 block font-semibold">Tử Thần (Undercover):</span>
                      <span className="font-bold text-emerald-300 text-sm">{currentPair?.undercoverWord}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {assignedPlayers.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-[#181122]">
                        <div className="flex items-center gap-1.5">
                          {typeof p.speakingOrder === 'number' && (
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-[#ffd875] border border-amber-500/40 text-[9px] font-bold font-mono flex items-center justify-center shrink-0">
                              {p.speakingOrder}
                            </span>
                          )}
                          <span className="font-semibold text-stone-300">{p.name}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          p.role === 'DEATH_EATER' ? 'bg-emerald-900 text-emerald-200' :
                          p.role === 'MR_WHITE' ? 'bg-purple-900 text-purple-200' : 'bg-amber-950 text-amber-200'
                        }`}>
                          {p.role === 'DEATH_EATER' ? 'Tử Thần' : p.role === 'MR_WHITE' ? 'Kẻ Không Tên' : 'Học Sinh'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStart}
                    className="mt-4 w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-serif font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Chơi Ván Mới (Tráo Thẻ Mới)
                  </button>
                </div>
              )}

              <button
                onClick={handleReset}
                className="text-xs text-stone-400 hover:text-white"
              >
                ← Thiết lập lại danh sách
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

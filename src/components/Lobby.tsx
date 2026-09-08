import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Player, RoomConfig } from '../types';
import { CATEGORIES, getWordDeckStats } from '../data/words';
import { Users, Bot, Wand2, Shield, Ghost, UserPlus, Trash2, QrCode, Play, LogOut, Edit3, Check, X } from 'lucide-react';
import { sound } from '../utils/audio';

interface LobbyProps {
  roomCode: string;
  isHost: boolean;
  myPlayerId: string;
  players: Player[];
  config: RoomConfig;
  onUpdateConfig: (newConfig: Partial<RoomConfig>) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onStartGame: () => void;
  onLeaveRoom?: () => void;
  onRenamePlayer?: (newName: string) => void;
  offlinePlayerIds?: string[];
}


export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  isHost,
  myPlayerId,
  players,
  config,
  onUpdateConfig,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  onLeaveRoom,
  onRenamePlayer,
  offlinePlayerIds = [],
}) => {
  const [showQr, setShowQr] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  const myPlayer = players.find((p) => p.id === myPlayerId);

  const handleStartEditing = () => {
    setNewNameInput(myPlayer?.name || '');
    setIsEditingName(true);
    sound.playButtonChime();
  };

  const handleSaveName = () => {
    const trimmed = newNameInput.trim().slice(0, 20);
    if (trimmed && trimmed.length > 0) {
      if (trimmed !== myPlayer?.name) {
        onRenamePlayer?.(trimmed);
        sound.playMagicCardFlip();
      }
    }
    setIsEditingName(false);
  };

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : '';

  const totalPlayers = players.length;
  const isSpectator = config.hostRole === 'GAME_MASTER';
  const participantCount = isSpectator ? Math.max(0, totalPlayers - 1) : totalPlayers;
  const undercoverCount = config.undercoverCount;
  const mrWhiteCount = config.mrWhiteCount;
  const studentCount = Math.max(0, participantCount - undercoverCount - mrWhiteCount);

  const canStart = participantCount >= 3 && studentCount > undercoverCount;


  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      {/* Room Code & Quick Join Box */}
      <div className="bg-gradient-to-r from-[#1f152b] via-[#2a1b3d] to-[#1f152b] rounded-2xl p-5 border border-[#c8aa6e]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-xs text-[#a49a88] uppercase tracking-wider font-semibold">
            Mã Phòng Nhập Trên Điện Thoại
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-3xl sm:text-4xl font-black text-[#f3d994] tracking-widest drop-shadow-md">
              {roomCode}
            </span>
            <button
              onClick={() => {
                setShowQr(!showQr);
                sound.playButtonChime();
              }}
              className="p-2 rounded-xl bg-[#342250] hover:bg-[#462e6d] text-[#f3d994] border border-[#c8aa6e]/40 transition-all flex items-center gap-1 text-xs"
              title="Hiện mã QR để quét bằng camera điện thoại"
            >
              <QrCode size={18} />
              <span className="hidden xs:inline">Mã QR</span>
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Bạn bè mở trình duyệt vào web và nhập mã trên, hoặc quét mã QR.
          </p>
        </div>

        {/* Player Count Gauge */}
        <div className="flex items-center gap-2 bg-[#120d18]/80 px-4 py-2.5 rounded-xl border border-[#c8aa6e]/30">
          <Users className="text-[#c8aa6e]" size={20} />
          <div className="text-right">
            <div className="font-mono font-bold text-lg text-[#f3d994]">
              {totalPlayers}/10
            </div>
            <span className="text-[10px] text-stone-400 uppercase">Phù Thủy</span>
          </div>
        </div>
      </div>

      {/* Player Profile & Direct Name Editing Banner */}
      <div className="bg-gradient-to-r from-[#221633] via-[#2d1b46] to-[#221633] rounded-2xl p-4 border border-[#ffd875]/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-[#10081a] font-serif font-black text-lg flex items-center justify-center border-2 border-[#ffd875] shadow-md flex-shrink-0">
            {myPlayer?.name?.charAt(0)?.toUpperCase() || '🧙'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] text-amber-300/80 uppercase font-semibold tracking-wider flex items-center gap-1">
              <span>Tên Của Bạn Trong Phòng</span>
              <span className="text-stone-400 font-normal">({isHost ? 'Chủ phòng' : 'Người chơi'})</span>
            </span>
            {!isEditingName ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-serif font-bold text-base sm:text-lg text-[#f3d994] truncate">
                  {myPlayer?.name || 'Chưa đặt tên'}
                </span>
                <button
                  onClick={handleStartEditing}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-sans flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Nhấn để chỉnh sửa tên của bạn"
                >
                  <Edit3 size={12} />
                  <span>Đổi tên</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
                className="flex items-center gap-1.5 mt-1"
              >
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  maxLength={20}
                  autoFocus
                  placeholder="Nhập tên mới..."
                  className="px-3 py-1.5 rounded-lg bg-[#120a1c] border border-[#ffd875]/70 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#ffd875] w-36 sm:w-52 font-serif font-bold"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center transition shadow-sm cursor-pointer active:scale-95"
                  title="Lưu tên mới"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs flex items-center justify-center transition cursor-pointer"
                  title="Hủy"
                >
                  <X size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="text-[11px] text-stone-400 text-center sm:text-right">
          {isEditingName ? (
            <span className="text-amber-300 font-medium">Nhấn Enter hoặc nút ✔ để lưu</span>
          ) : (
            <span className="text-stone-400">Bạn có thể đổi tên trực tiếp bất cứ lúc nào</span>
          )}
        </div>
      </div>

      {/* QR Code Modal Drawer */}
      {showQr && (
        <div className="bg-[#120d18] p-5 rounded-2xl border-2 border-[#c8aa6e] flex flex-col items-center text-center animate-fadeIn shadow-2xl">
          <h4 className="font-serif font-bold text-[#f3d994] text-base mb-2">
            Quét Mã QR Bằng Camera Điện Thoại
          </h4>
          <div className="p-4 bg-white rounded-xl shadow-inner my-2">
            <QRCodeSVG value={joinUrl} size={180} level="M" />
          </div>
          <p className="text-xs text-stone-300 max-w-xs mt-2 break-all font-mono">
            {joinUrl}
          </p>
          <button
            onClick={() => setShowQr(false)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-[#2a1b3d] text-xs text-stone-300 hover:text-white border border-[#c8aa6e]/30"
          >
            Đóng QR
          </button>
        </div>
      )}

      {/* Role Configuration (Host Only) */}
      {isHost ? (
        <div className="bg-[#181122]/90 rounded-2xl p-5 border border-[#c8aa6e]/30 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-[#f3d994] text-base flex items-center gap-2">
              <Wand2 size={18} className="text-[#c8aa6e]" />
              <span>Thiết Lập Vòng Đấu</span>
            </h3>
            <span className="text-xs text-[#a49a88]">Quyền của Chủ Phòng</span>
          </div>

          {/* Host Role Option: Player vs Game Master */}
          <div className="mb-4 bg-[#100b17] p-3.5 rounded-xl border border-stone-800">
            <label className="text-xs text-stone-200 font-bold block mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎭</span> Chọn Vai Trò Của Bạn (Host):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ hostRole: 'PLAYER' });
                  sound.playButtonChime();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.hostRole === 'PLAYER'
                    ? 'bg-[#342250] border-[#c8aa6e] shadow-md text-[#f3d994]'
                    : 'bg-[#181122] border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>🧙‍♂️</span>
                  <span>Host Cùng Chơi (Nhận Thẻ)</span>
                </div>
                <p className="text-[11px] text-stone-300/80 mt-1 leading-relaxed">
                  Bạn cũng nhận 1 thẻ bí mật, cùng đoán và vote như mọi người. Đáp án bị khóa trong lúc chơi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ hostRole: 'GAME_MASTER' });
                  sound.playButtonChime();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.hostRole === 'GAME_MASTER'
                    ? 'bg-[#342250] border-[#c8aa6e] shadow-md text-[#f3d994]'
                    : 'bg-[#181122] border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>📜</span>
                  <span>Host Làm Quản Trò (Trọng Tài)</span>
                </div>
                <p className="text-[11px] text-stone-300/80 mt-1 leading-relaxed">
                  Bạn KHÔNG nhận thẻ, đứng ngoài làm trọng tài và ĐƯỢC XEM TRƯỚC toàn bộ cặp từ & phân vai.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Undercover Count */}
            <div className="bg-[#100b17] p-3.5 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-200 block">
                    Tử Thần Thực Tử
                  </span>
                  <span className="text-[11px] text-stone-400">Undercover (Gián điệp)</span>
                </div>
              </div>


              <div className="flex items-center gap-2">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onUpdateConfig({ undercoverCount: num });
                      sound.playButtonChime();
                    }}
                    className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all ${
                      undercoverCount === num
                        ? 'bg-emerald-700 text-white shadow-md border border-emerald-400'
                        : 'bg-[#20162e] text-stone-400 border border-stone-700 hover:bg-[#2e1f42]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Mr White Count */}
            <div className="bg-[#100b17] p-3.5 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300">
                  <Ghost size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-200 block">
                    Kẻ Không Tên
                  </span>
                  <span className="text-[11px] text-stone-400">Mr. White (Không có từ)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[0, 1].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onUpdateConfig({ mrWhiteCount: num });
                      sound.playButtonChime();
                    }}
                    className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all ${
                      mrWhiteCount === num
                        ? 'bg-purple-700 text-white shadow-md border border-purple-400'
                        : 'bg-[#20162e] text-stone-400 border border-stone-700 hover:bg-[#2e1f42]'
                    }`}
                  >
                    {num === 0 ? 'Tắt' : 'Bật'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Selector — multi-select */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="text-xs text-stone-300 font-semibold block">
                Thể Loại Cặp Từ Bí Mật:
              </label>
              {(() => {
                const deckStats = getWordDeckStats(config.selectedCategories);
                return (
                  <span className="text-[11px] text-amber-300/90 font-serif flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30 shadow-sm">
                    <span>🃏</span>
                    <span>Còn <strong>{deckStats.remainingCount}</strong>/{deckStats.totalCount} cặp chưa chơi</span>
                  </span>
                );
              })()}
            </div>
            <p className="text-[11px] text-stone-500 mb-2 italic">Chọn một hoặc nhiều chủ đề (Hệ thống tự động không lặp lại câu đã chơi hôm nay & các ngày trước).</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isAll = cat.id === 'ALL';
                const selected = config.selectedCategories.includes(cat.id) ||
                  (isAll && config.selectedCategories.includes('ALL'));
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playButtonChime();
                      if (isAll) {
                        // Clicking ALL resets to only ALL
                        onUpdateConfig({ selectedCategories: ['ALL'] });
                      } else {
                        const current = config.selectedCategories.filter(c => c !== 'ALL');
                        const alreadySelected = current.includes(cat.id);
                        let next: string[];
                        if (alreadySelected) {
                          next = current.filter(c => c !== cat.id);
                          // Guard: never empty
                          if (next.length === 0) next = ['ALL'];
                        } else {
                          next = [...current, cat.id];
                        }
                        onUpdateConfig({ selectedCategories: next });
                      }
                    }}
                    className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all text-left border relative ${
                      selected
                        ? 'bg-[#342250] border-[#c8aa6e] text-[#f3d994] shadow-md'
                        : 'bg-[#100b17] border-stone-800 text-stone-400 hover:bg-[#1a1226]'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                    {selected && !isAll && (
                      <span className="ml-auto text-[#c8aa6e]">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Summary of selected */}
            {!config.selectedCategories.includes('ALL') && (
              <p className="text-[11px] text-[#c8aa6e] mt-1.5">
                Đã chọn: {config.selectedCategories.map(id => CATEGORIES.find(c => c.id === id)?.label ?? id).join(', ')}
              </p>
            )}
          </div>

          {/* Balance Preview */}
          <div className="mt-4 bg-[#100b17] p-2.5 rounded-xl border border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-300 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#ffd875]">🪄 {studentCount} Học Sinh</span>
              <span className="text-emerald-400">🐍 {undercoverCount} Tử Thần</span>
              {mrWhiteCount > 0 && <span className="text-purple-400">👻 1 Kẻ Không Tên</span>}
              <span className="text-stone-400 font-mono">
                ({isSpectator ? 'Host làm Quản trò' : 'Host cùng chơi'})
              </span>
            </div>
            {!canStart && (
              <span className="text-amber-400/90 text-[11px] italic">
                {isSpectator
                  ? 'Cần thêm ít nhất 3 người chơi khác ngoài Host!'
                  : 'Cần tối thiểu 3 người và Học Sinh phải chiếm đa số!'}
              </span>
            )}
          </div>

        </div>
      ) : (
        /* Client waiting notice */
        <div className="bg-[#181122]/80 rounded-2xl p-4 border border-[#c8aa6e]/20 text-center">
          <p className="text-sm text-[#f3d994] font-medium animate-pulse">
            ⏳ Đang chờ Chủ Phòng điều chỉnh và bắt đầu phát thẻ...
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Hãy nhìn xung quanh và làm quen với các phù thủy trong phòng!
          </p>
        </div>
      )}

      {/* Player Roster */}
      <div className="bg-[#181122]/90 rounded-2xl p-5 border border-[#c8aa6e]/30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#c8aa6e]" />
            <h3 className="font-serif font-bold text-[#f3d994] text-base">
              Danh Sách Phù Thủy ({totalPlayers}/10)
            </h3>
          </div>

          {/* Add Bot button for host */}
          {isHost && totalPlayers < 10 && (
            <button
              onClick={() => {
                onAddBot();
                sound.playButtonChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2a1b3d] hover:bg-[#3d2757] text-[#ffd875] border border-[#c8aa6e]/40 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus size={14} />
              <span>Thêm Bot AI</span>
            </button>
          )}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-[#291b3b] border-[#c8aa6e] shadow-md'
                    : 'bg-[#100b17] border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#20152e] border border-[#c8aa6e]/30 flex items-center justify-center text-xs font-bold text-[#f3d994]">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-semibold text-sm text-stone-200 truncate">
                        {p.name}
                      </span>
                      {isMe && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#c8aa6e]/20 text-[#ffd875] border border-[#c8aa6e]/40 font-mono">
                            Bạn
                          </span>
                          <button
                            type="button"
                            onClick={handleStartEditing}
                            className="text-stone-400 hover:text-amber-300 p-0.5 rounded transition cursor-pointer"
                            title="Đổi tên của bạn"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      )}
                      {p.isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/40 text-amber-300 border border-amber-600/40 font-mono">
                          Host
                        </span>
                      )}
                      {p.isAi && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/40 text-blue-300 border border-blue-600/40 font-mono flex items-center gap-0.5">
                          <Bot size={10} /> AI
                        </span>
                      )}
                      {offlinePlayerIds.includes(p.id) && !p.isAi && !p.isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-600/50 font-mono animate-pulse">
                          Mất kết nối...
                        </span>
                      )}
                    </div>
                  </div>
                </div>


                {/* Remove button (Host can kick AI or other players) */}
                {isHost && !p.isHost && (
                  <button
                    onClick={() => {
                      onRemovePlayer(p.id);
                      sound.playButtonChime();
                    }}
                    title="Xóa người chơi / bot này"
                    className="text-stone-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Game Action Button (Host) or Waiting Status (Client) */}
      {isHost ? (
        <button
          onClick={() => {
            if (!canStart) return;
            onStartGame();
          }}
          disabled={!canStart}
          className={`w-full py-4 rounded-2xl font-serif font-extrabold text-base sm:text-lg tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
            canStart
              ? 'bg-gradient-to-r from-[#8a1c14] via-[#c8aa6e] to-[#8a1c14] text-[#120d18] hover:scale-[1.01] active:scale-[0.99] border-2 border-[#f3d994]'
              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
          }`}
        >
          <Play size={20} fill="currentColor" />
          <span>PHÁT THẺ & BẮT ĐẦU VÁN</span>
        </button>
      ) : (
        <div className="bg-[#181122]/90 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <p className="text-xs text-stone-300">
              Đã tham gia phòng! Đang đợi Chủ phòng (Host) phát thẻ bí mật...
            </p>
          </div>
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
            >
              <LogOut size={14} />
              <span>Rời Phòng</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

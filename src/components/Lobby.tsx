import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Player, RoomConfig } from '../types';
import { CATEGORIES, getWordDeckStats } from '../data/words';
import { Users, Bot, Wand2, Shield, Ghost, UserPlus, Trash2, QrCode, Play, LogOut, Edit3, Check, X, Copy, Crown, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface LobbyProps {
  roomCode: string;
  isHost: boolean;
  myPlayer: Player;
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
  myPlayer,
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [acceptanceInput, setAcceptanceInput] = useState('');
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(
    myPlayer?.name?.startsWith('Phù thủy #') ?? false
  );

  React.useEffect(() => {
    if (myPlayer?.name?.startsWith('Phù thủy #')) {
      setShowAcceptanceModal(true);
    }
  }, [myPlayer?.name]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    sound.playButtonChime();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAcceptanceSubmit = (customName?: string) => {
    const chosen = (customName || acceptanceInput).trim().slice(0, 20);
    if (chosen) {
      onRenamePlayer?.(chosen);
      sound.playMagicCardFlip();
      setShowAcceptanceModal(false);
    }
  };

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

  // House-inspired colors for player avatars
  const getHouseRingColor = (name: string, idx: number) => {
    const colors = [
      'from-[#740001] to-[#c8aa6e]', // Gryffindor
      'from-[#1a472a] to-[#5d8a68]', // Slytherin
      'from-[#0e1a40] to-[#5d76a6]', // Ravenclaw
      'from-[#ecb939] to-[#726255]', // Hufflepuff
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), idx);
    return colors[hash % colors.length];
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 animate-fadeIn">
      {/* Golden Portal Room Code Box */}
      <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-xs text-[#c8aa6e] font-cinzel font-bold uppercase tracking-widest">
            <Sparkles size={13} className="text-[#ffd875]" />
            <span>Mã Phòng Nhập Trên Điện Thoại</span>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-mono text-3xl sm:text-5xl font-black tracking-widest gold-gradient-text drop-shadow-[0_2px_10px_rgba(255,216,117,0.3)] select-all">
              {roomCode}
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-[#2b1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#ffd875]/40 transition-all flex items-center justify-center cursor-pointer shadow-md active:scale-95"
                title="Sao chép mã phòng"
              >
                {copiedCode ? <Check size={17} className="text-emerald-400" /> : <Copy size={17} />}
              </button>

              <button
                onClick={() => {
                  setShowQr(!showQr);
                  sound.playButtonChime();
                }}
                className="p-2.5 rounded-xl bg-[#2b1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#ffd875]/40 transition-all flex items-center gap-1 text-xs font-serif font-bold cursor-pointer shadow-md active:scale-95"
                title="Hiện mã QR để quét bằng camera"
              >
                <QrCode size={17} />
                <span className="hidden xs:inline">QR</span>
              </button>
            </div>
          </div>
          
          <p className="text-[11px] sm:text-xs text-[#c8aa6e]/80 mt-1 font-medium">
            Bạn bè mở trình duyệt web và nhập mã <strong>{roomCode}</strong> hoặc quét mã QR.
          </p>
        </div>

        {/* Player Count Gauge */}
        <div className="flex items-center gap-3 bg-[#0d0714]/80 px-4 py-3 rounded-2xl border border-[#ffd875]/40 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-[#251538] flex items-center justify-center text-[#ffd875] border border-[#c8aa6e]/30">
            <Users size={20} />
          </div>
          <div className="text-right">
            <div className="font-mono font-black text-xl text-[#ffd875]">
              {totalPlayers}/10
            </div>
            <span className="text-[10px] text-[#c8aa6e] uppercase tracking-wider font-cinzel font-semibold">
              Phù Thủy
            </span>
          </div>
        </div>
      </div>

      {/* Player Profile & Direct Name Editing Banner */}
      <div className="glass-panel rounded-2xl p-4 border border-[#ffd875]/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffd875] to-[#8a1c14] p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#120a1c] text-[#ffd875] font-cinzel font-black text-lg flex items-center justify-center">
              {myPlayer?.name?.charAt(0)?.toUpperCase() || '🧙'}
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] text-[#c8aa6e] uppercase font-cinzel font-bold tracking-wider flex items-center gap-1">
              <span>Danh Xưng Của Bạn</span>
              <span className="text-stone-400 font-sans font-normal">({isHost ? 'Chủ phòng' : 'Người chơi'})</span>
            </span>

            {!isEditingName ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-serif font-bold text-base sm:text-lg text-[#fff2be] truncate">
                  {myPlayer?.name || 'Chưa đặt tên'}
                </span>
                <button
                  onClick={handleStartEditing}
                  className="px-2.5 py-1 rounded-lg bg-[#2e1c45] hover:bg-[#402761] text-[#ffd875] border border-[#ffd875]/40 text-xs font-serif font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Nhấn để đổi tên"
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
                  className="px-3 py-1.5 rounded-lg bg-[#0c0612] border border-[#ffd875] text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#ffd875] w-36 sm:w-52 font-serif font-bold shadow-inner"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center transition shadow cursor-pointer active:scale-95"
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

        <div className="text-[11px] text-[#c8aa6e]/80 text-center sm:text-right font-medium">
          {isEditingName ? (
            <span className="text-[#ffd875] font-semibold">Nhấn Enter hoặc nút ✔ để lưu</span>
          ) : (
            <span className={myPlayer.name.startsWith('Phù thủy #') ? "text-amber-400 font-bold" : "text-[#c8aa6e]/80"}>
              {myPlayer.name.startsWith('Phù thủy #') 
                ? "Bạn cần đổi tên để thấy danh sách các phù thủy"
                : "Tên này sẽ hiển thị xuyên suốt bàn chơi"}
            </span>
          )}
        </div>
      </div>

      {/* QR Code Drawer */}
      {showQr && (
        <div className="glass-panel-gold p-6 rounded-3xl border-2 border-[#ffd875] flex flex-col items-center text-center animate-fadeIn shadow-2xl">
          <h4 className="font-cinzel font-black text-[#ffd875] text-lg mb-2">
            Quét Mã QR Bằng Camera Điện Thoại
          </h4>
          <div className="p-4 bg-white rounded-2xl shadow-xl my-2 border-4 border-[#ffd875]/40">
            <QRCodeSVG value={joinUrl} size={190} level="M" />
          </div>
          <p className="text-xs text-[#c8aa6e] max-w-xs mt-2 break-all font-mono">
            {joinUrl}
          </p>
          <button
            onClick={() => setShowQr(false)}
            className="mt-3 px-5 py-2 rounded-xl bg-[#2b1742] text-xs font-serif font-bold text-[#ffd875] hover:bg-[#3d225d] border border-[#ffd875]/40 cursor-pointer active:scale-95"
          >
            Đóng Mã QR
          </button>
        </div>
      )}

      {/* Role Configuration (Host Only) */}
      {isHost ? (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-[#ffd875]/40 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#c8aa6e]/30 pb-3">
            <h3 className="font-cinzel font-black text-[#ffd875] text-base sm:text-lg flex items-center gap-2">
              <Wand2 size={20} className="text-[#ffd875]" />
              <span>Thiết Lập Vòng Đấu</span>
            </h3>
            <span className="text-[11px] font-serif text-[#c8aa6e] bg-[#221338] px-2.5 py-0.5 rounded-full border border-[#c8aa6e]/30">
              Quyền Chủ Phòng
            </span>
          </div>

          {/* Host Role: Player vs Game Master */}
          <div className="bg-[#0e0716]/90 p-4 rounded-2xl border border-stone-800">
            <label className="text-xs text-[#ffd875] font-cinzel font-bold block mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎭</span> Chọn Vai Trò Của Bạn (Host):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ hostRole: 'PLAYER' });
                  sound.playButtonChime();
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.hostRole === 'PLAYER'
                    ? 'bg-gradient-to-b from-[#341b52] to-[#200f33] border-[#ffd875] shadow-lg text-[#ffd875] ring-1 ring-[#ffd875]/60'
                    : 'bg-[#140b20] border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-serif font-bold text-xs sm:text-sm">
                  <span>🧙‍♂️</span>
                  <span>Host Cùng Chơi (Nhận Thẻ)</span>
                </div>
                <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                  Bạn cũng nhận 1 thẻ bí mật, cùng miêu tả và biểu quyết. Đáp án được giữ kín.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ hostRole: 'GAME_MASTER' });
                  sound.playButtonChime();
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.hostRole === 'GAME_MASTER'
                    ? 'bg-gradient-to-b from-[#341b52] to-[#200f33] border-[#ffd875] shadow-lg text-[#ffd875] ring-1 ring-[#ffd875]/60'
                    : 'bg-[#140b20] border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-serif font-bold text-xs sm:text-sm">
                  <span>📜</span>
                  <span>Host Làm Quản Trò (Trọng Tài)</span>
                </div>
                <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                  Bạn KHÔNG nhận thẻ, điều phối bên ngoài và ĐƯỢC XEM TRƯỚC toàn bộ cặp từ & vai trò.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Undercover Count (Slytherin Theme) */}
            <div className="bg-[#0e0716]/90 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-300 shadow">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="text-xs font-serif font-bold text-emerald-300 block">
                    Tử Thần Thực Tử
                  </span>
                  <span className="text-[10px] text-stone-400">Undercover (Gián điệp)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onUpdateConfig({ undercoverCount: num });
                      sound.playButtonChime();
                    }}
                    className={`w-9 h-9 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
                      undercoverCount === num
                        ? 'bg-emerald-700 text-white shadow-lg border border-emerald-300'
                        : 'bg-[#1c102b] text-stone-400 border border-stone-700 hover:bg-[#2e1a47]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Mr White Count (Phantom Purple Theme) */}
            <div className="bg-[#0e0716]/90 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-300 shadow">
                  <Ghost size={18} />
                </div>
                <div>
                  <span className="text-xs font-serif font-bold text-purple-300 block">
                    Kẻ Không Tên
                  </span>
                  <span className="text-[10px] text-stone-400">Mr. White (Không có từ)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {[0, 1].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onUpdateConfig({ mrWhiteCount: num });
                      sound.playButtonChime();
                    }}
                    className={`px-3 h-9 rounded-xl font-serif font-bold text-xs transition-all cursor-pointer ${
                      mrWhiteCount === num
                        ? 'bg-purple-700 text-white shadow-lg border border-purple-300'
                        : 'bg-[#1c102b] text-stone-400 border border-stone-700 hover:bg-[#2e1a47]'
                    }`}
                  >
                    {num === 0 ? 'Tắt' : 'Bật'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs text-[#ffd875] font-cinzel font-bold block">
                Chủ Đề Cặp Từ Bí Mật:
              </label>
              {(() => {
                const deckStats = getWordDeckStats(config.selectedCategories);
                return (
                  <span className="text-[11px] text-[#ffd875] font-serif flex items-center gap-1 bg-[#231438] px-2.5 py-0.5 rounded-full border border-[#c8aa6e]/40 shadow-sm">
                    <span>🃏</span>
                    <span>Còn <strong>{deckStats.remainingCount}</strong>/{deckStats.totalCount} cặp chưa chơi</span>
                  </span>
                );
              })()}
            </div>
            <p className="text-[11px] text-[#c8aa6e]/70 mb-2.5 italic">
              Chọn chủ đề (hệ thống tự động loại trừ các cặp từ đã xuất hiện hôm nay).
            </p>
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
                        onUpdateConfig({ selectedCategories: ['ALL'] });
                      } else {
                        const current = config.selectedCategories.filter(c => c !== 'ALL');
                        const alreadySelected = current.includes(cat.id);
                        let next: string[];
                        if (alreadySelected) {
                          next = current.filter(c => c !== cat.id);
                          if (next.length === 0) next = ['ALL'];
                        } else {
                          next = [...current, cat.id];
                        }
                        onUpdateConfig({ selectedCategories: next });
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs font-serif font-semibold flex items-center gap-2 transition-all text-left border cursor-pointer ${
                      selected
                        ? 'bg-[#341b52] border-[#ffd875] text-[#ffd875] shadow-md'
                        : 'bg-[#0e0716] border-stone-800 text-stone-400 hover:bg-[#1a0f28]'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                    {selected && !isAll && (
                      <span className="ml-auto text-[#ffd875] font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance Preview */}
          <div className="bg-[#0c0612] p-3 rounded-2xl border border-stone-800 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex flex-wrap items-center gap-3 font-serif">
              <span className="text-[#ffd875] font-bold">🪄 {studentCount} Học Sinh</span>
              <span className="text-emerald-400 font-bold">🐍 {undercoverCount} Tử Thần</span>
              {mrWhiteCount > 0 && <span className="text-purple-300 font-bold">👻 1 Kẻ Không Tên</span>}
              <span className="text-stone-400 font-sans font-normal">
                ({isSpectator ? 'Host làm Quản trò' : 'Host cùng chơi'})
              </span>
            </div>
            {!canStart && (
              <span className="text-amber-300 text-[11px] italic font-medium">
                {isSpectator
                  ? 'Cần thêm ít nhất 3 người chơi khác ngoài Host!'
                  : 'Cần tối thiểu 3 người và Học Sinh phải chiếm đa số!'}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Client waiting notice */
        <div className="glass-panel rounded-2xl p-5 border border-[#c8aa6e]/30 text-center shadow-lg">
          <p className="text-sm font-serif font-bold text-[#ffd875] animate-pulse">
            ⏳ Đang chờ Chủ Phòng thiết lập luật và phát thẻ bí mật...
          </p>
          <p className="text-xs text-[#c8aa6e]/80 mt-1 font-medium">
            Hãy nhìn quanh bàn chơi và chuẩn bị chiến thuật đánh lừa đối phương!
          </p>
        </div>
      )}

      {/* Player Roster */}
      {myPlayer.name.startsWith('Phù thủy #') ? (
        <div className="glass-panel-gold rounded-3xl p-6 border-2 border-[#ffd875] shadow-2xl text-center animate-fadeIn flex flex-col items-center gap-3">
          <div className="wax-seal w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-bounce">
            ✉️
          </div>
          <h3 className="font-cinzel font-black text-[#ffd875] text-lg sm:text-xl">
            Thư Mời Nhập Học Đang Chờ Bạn!
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 max-w-sm leading-relaxed">
            Bạn cần khắc tên phù thủy của mình để bước vào Đại Sảnh Đường và tham gia bàn chơi.
          </p>
          <button
            onClick={() => {
              setShowAcceptanceModal(true);
              sound.playButtonChime();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-cinzel font-black text-xs sm:text-sm tracking-wider shadow-xl transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>📜</span>
            <span>MỞ THƯ NHẬP HỌC ĐỂ ĐẶT TÊN</span>
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-[#ffd875]/40 shadow-xl flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-[#c8aa6e]/30 pb-3">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-[#ffd875]" />
              <h3 className="font-cinzel font-bold text-[#ffd875] text-base sm:text-lg">
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
                className="px-3.5 py-1.5 rounded-xl bg-[#2b1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#ffd875]/40 text-xs font-serif font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <UserPlus size={14} />
                <span>Thêm Bot AI</span>
              </button>
            )}
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const isMe = p.id === myPlayer.id;
              const ringColor = getHouseRingColor(p.name, idx);

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-[#29173d] to-[#1f1030] border-[#ffd875] shadow-md ring-1 ring-[#ffd875]/40'
                      : 'bg-[#0d0714]/90 border-stone-800 hover:border-[#c8aa6e]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ringColor} p-[1.5px] shadow-sm flex-shrink-0`}>
                      <div className="w-full h-full rounded-[10px] bg-[#120a1c] flex items-center justify-center font-cinzel font-bold text-xs text-[#ffd875]">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-bold text-sm text-[#f3efe6] truncate">
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#ffd875] border border-amber-500/40 font-serif font-bold">
                            Bạn
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-amber-300 border border-red-700/60 font-serif font-bold flex items-center gap-0.5">
                            <Crown size={9} /> Host
                          </span>
                        )}
                        {p.isAi && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-700/60 font-mono font-semibold flex items-center gap-0.5">
                            <Bot size={10} /> AI
                          </span>
                        )}
                        {offlinePlayerIds.includes(p.id) && !p.isAi && !p.isHost && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50 font-mono animate-pulse">
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
                      className="text-stone-500 hover:text-red-400 p-2 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Game Action Button (Host) or Waiting Status (Client) */}
      {isHost ? (
        <button
          onClick={() => {
            if (!canStart) return;
            onStartGame();
          }}
          disabled={!canStart}
          className={`w-full py-4 sm:py-4.5 rounded-2xl font-cinzel font-black text-base sm:text-lg tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all cursor-pointer relative overflow-hidden group ${
            canStart
              ? 'bg-gradient-to-r from-[#740001] via-[#c8aa6e] to-[#740001] text-[#120a1c] hover:scale-[1.01] active:scale-[0.99] border-2 border-[#ffd875] shadow-[0_8px_30px_rgba(200,170,110,0.4)]'
              : 'bg-stone-800/80 text-stone-500 border border-stone-700 cursor-not-allowed'
          }`}
        >
          <div className="absolute inset-0 shimmer-gold opacity-40 pointer-events-none" />
          <Play size={22} fill="currentColor" />
          <span>PHÁT THẺ & BẮT ĐẦU VÁN</span>
        </button>
      ) : (
        <div className="glass-panel p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 shadow-[0_0_8px_#34d399]" />
            <p className="text-xs text-stone-300 font-medium">
              Đã gia nhập bàn chơi! Đang đợi Quản trò (Host) phát thẻ bí mật...
            </p>
          </div>
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="px-4 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800/50 text-xs font-serif font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 flex-shrink-0"
            >
              <LogOut size={14} />
              <span>Rời Phòng</span>
            </button>
          )}
        </div>
      )}

      {/* Hogwarts Acceptance Letter Modal */}
      {showAcceptanceModal && myPlayer.name.startsWith('Phù thủy #') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-panel-gold border-2 border-[#ffd875] rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
            {/* Background crest watermark */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <span className="text-[180px]">⚡</span>
            </div>

            {/* Hogwarts Wax Seal */}
            <div className="wax-seal w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
              📜
            </div>

            <span className="text-[10px] font-cinzel font-bold text-[#ffd875] uppercase tracking-widest block">
              HỌC VIỆN PHÙ THỦY & PHÁP SƯ HOGWARTS
            </span>
            <h3 className="font-cinzel font-black text-xl sm:text-2xl text-[#fff2be] tracking-wide mt-1 mb-2">
              THƯ MỜI NHẬP HỌC
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              Chào mừng bạn đến với Đại Sảnh Đường! Hãy khắc <strong>danh xưng phù thủy</strong> của bạn để chính thức tham gia ván đấu:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAcceptanceSubmit();
              }}
              className="flex flex-col gap-3 relative z-10"
            >
              <input
                type="text"
                value={acceptanceInput}
                onChange={(e) => setAcceptanceInput(e.target.value)}
                maxLength={20}
                autoFocus
                placeholder="Ví dụ: Harry, Hermione, Khang..."
                className="w-full px-4 py-3 rounded-xl bg-[#0b0512] border-2 border-[#ffd875] text-sm font-serif font-bold text-[#ffd875] text-center placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#ffd875] shadow-inner"
              />

              {/* Quick suggestions */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-stone-400 font-serif">Gợi ý nhanh:</span>
                {['Harry', 'Hermione', 'Ron', 'Draco', 'Luna', 'Snape'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setAcceptanceInput(name);
                      sound.playButtonChime();
                    }}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2a1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#c8aa6e]/30 cursor-pointer transition active:scale-95 font-serif"
                  >
                    {name}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!acceptanceInput.trim()}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-cinzel font-black text-xs sm:text-sm tracking-wider shadow-xl transition active:scale-98 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>XÁC NHẬN & BƯỚC VÀO SẢNH</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

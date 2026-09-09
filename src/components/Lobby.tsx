import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Player, RoomConfig } from '../types';
import { CATEGORIES, getWordDeckStats } from '../data/words';
import {
  Bot,
  Wand2,
  Shield,
  Ghost,
  UserPlus,
  Trash2,
  QrCode,
  Play,
  LogOut,
  Edit3,
  Check,
  X,
  Copy,
  Crown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
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

const HOUSE_THEMES: Record<string, { ring: string; border: string; bg: string; badge: string; crest: string; name: string }> = {
  GRYFFINDOR: {
    ring: 'from-[#740001] via-[#c8aa6e] to-[#740001]',
    border: 'border-[#c8aa6e]/50 hover:border-[#ffd875]',
    bg: 'bg-[#150711]',
    badge: 'bg-[#740001]/90 text-[#ffd875] border-[#ffd875]/50',
    crest: '🦁',
    name: 'Gryffindor',
  },
  Gryffindor: {
    ring: 'from-[#740001] via-[#c8aa6e] to-[#740001]',
    border: 'border-[#c8aa6e]/50 hover:border-[#ffd875]',
    bg: 'bg-[#150711]',
    badge: 'bg-[#740001]/90 text-[#ffd875] border-[#ffd875]/50',
    crest: '🦁',
    name: 'Gryffindor',
  },
  SLYTHERIN: {
    ring: 'from-[#0d6241] via-[#8fc99a] to-[#0d6241]',
    border: 'border-[#2e8a57]/50 hover:border-[#4ade80]',
    bg: 'bg-[#061610]',
    badge: 'bg-[#0d6241]/90 text-[#86efac] border-[#86efac]/50',
    crest: '🐍',
    name: 'Slytherin',
  },
  Slytherin: {
    ring: 'from-[#0d6241] via-[#8fc99a] to-[#0d6241]',
    border: 'border-[#2e8a57]/50 hover:border-[#4ade80]',
    bg: 'bg-[#061610]',
    badge: 'bg-[#0d6241]/90 text-[#86efac] border-[#86efac]/50',
    crest: '🐍',
    name: 'Slytherin',
  },
  RAVENCLAW: {
    ring: 'from-[#0e3b66] via-[#7dd3fc] to-[#0e3b66]',
    border: 'border-[#1d5b91]/50 hover:border-[#38bdf8]',
    bg: 'bg-[#061222]',
    badge: 'bg-[#0e3b66]/90 text-[#7dd3fc] border-[#7dd3fc]/50',
    crest: '🦅',
    name: 'Ravenclaw',
  },
  Ravenclaw: {
    ring: 'from-[#0e3b66] via-[#7dd3fc] to-[#0e3b66]',
    border: 'border-[#1d5b91]/50 hover:border-[#38bdf8]',
    bg: 'bg-[#061222]',
    badge: 'bg-[#0e3b66]/90 text-[#7dd3fc] border-[#7dd3fc]/50',
    crest: '🦅',
    name: 'Ravenclaw',
  },
  HUFFLEPUFF: {
    ring: 'from-[#b08800] via-[#fde047] to-[#b08800]',
    border: 'border-[#b08800]/50 hover:border-[#fde047]',
    bg: 'bg-[#181406]',
    badge: 'bg-[#6b5200]/90 text-[#fef08a] border-[#fde047]/50',
    crest: '🦡',
    name: 'Hufflepuff',
  },
  Hufflepuff: {
    ring: 'from-[#b08800] via-[#fde047] to-[#b08800]',
    border: 'border-[#b08800]/50 hover:border-[#fde047]',
    bg: 'bg-[#181406]',
    badge: 'bg-[#6b5200]/90 text-[#fef08a] border-[#fde047]/50',
    crest: '🦡',
    name: 'Hufflepuff',
  },
};

const DEFAULT_THEME = {
  ring: 'from-[#740001] via-[#c8aa6e] to-[#740001]',
  border: 'border-[#c8aa6e]/40 hover:border-[#ffd875]',
  bg: 'bg-[#10081a]',
  badge: 'bg-[#2b1742] text-[#ffd875] border-[#ffd875]/40',
  crest: '🧙‍♂️',
  name: 'Hogwarts',
};

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

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : '';

  const totalPlayers = players.length;
  const isSpectator = config.hostRole === 'GAME_MASTER';
  const participantCount = isSpectator ? Math.max(0, totalPlayers - 1) : totalPlayers;
  const undercoverCount = config.undercoverCount;
  const mrWhiteCount = config.mrWhiteCount;
  const studentCount = Math.max(0, participantCount - undercoverCount - mrWhiteCount);

  const canStart = participantCount >= 3 && studentCount > undercoverCount;

  const getPlayerTheme = (player: Player, idx: number) => {
    if (player.house && HOUSE_THEMES[player.house]) {
      return HOUSE_THEMES[player.house];
    }
    const houseKeys = ['GRYFFINDOR', 'SLYTHERIN', 'RAVENCLAW', 'HUFFLEPUFF'];
    const hash = player.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), idx);
    const chosenKey = houseKeys[hash % houseKeys.length];
    return HOUSE_THEMES[chosenKey] || DEFAULT_THEME;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-fadeIn pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      {/* TOP HEADER: TABLETOP ROOM BANNER */}
      <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden border border-[#ffd875]/50">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#ffd875]/10 via-[#740001]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Room Code & Quick Actions */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10">
          <div className="flex items-center gap-2 text-xs text-[#c8aa6e] font-cinzel font-bold uppercase tracking-widest">
            <Sparkles size={14} className="text-[#ffd875]" />
            <span>ĐẠI SẢNH ĐƯỜNG • MÃ PHÒNG NHẬP MÁY</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest gold-gradient-text drop-shadow-[0_2px_15px_rgba(255,216,117,0.4)] select-all">
              {roomCode}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-2.5 rounded-xl bg-[#2b1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#ffd875]/50 transition-all flex items-center gap-1.5 text-xs font-serif font-bold cursor-pointer shadow-md active:scale-95"
                title="Sao chép mã phòng"
              >
                {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedCode ? 'Đã chép!' : 'Chép mã'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQr(!showQr);
                  sound.playButtonChime();
                }}
                className="px-3 py-2.5 rounded-xl bg-[#2b1742] hover:bg-[#3d225d] text-[#ffd875] border border-[#ffd875]/50 transition-all flex items-center gap-1.5 text-xs font-serif font-bold cursor-pointer shadow-md active:scale-95"
                title="Hiện mã QR để quét bằng camera"
              >
                <QrCode size={16} />
                <span>Mã QR</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#c8aa6e]/90 mt-1.5 font-serif">
            Mời bạn bè nhập mã <strong className="text-[#ffd875] font-mono">{roomCode}</strong> hoặc quét QR bằng camera điện thoại.
          </p>
        </div>

        {/* Identity & Direct Rename Capsule */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0e0717]/80 px-5 py-3.5 rounded-2xl border border-[#ffd875]/40 shadow-inner z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffd875] to-[#740001] p-0.5 shadow-[0_0_15px_rgba(200,170,110,0.3)] flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#120a1c] text-[#ffd875] font-cinzel font-black text-xl flex items-center justify-center">
                {myPlayer?.house ? HOUSE_THEMES[myPlayer.house]?.crest || '🧙‍♂️' : '🧙‍♂️'}
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#c8aa6e] uppercase font-cinzel font-bold tracking-wider flex items-center gap-1">
                <span>Bạn Là:</span>
                <span className="text-stone-400 font-sans font-normal">
                  ({isHost ? 'Chủ phòng 👑' : 'Học viên'})
                </span>
              </span>

              {!isEditingName ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-serif font-bold text-base text-[#fff2be] truncate max-w-[160px]">
                    {myPlayer?.name || 'Chưa đặt tên'}
                  </span>
                  <button
                    onClick={handleStartEditing}
                    className="p-1 rounded-lg bg-[#2e1c45] hover:bg-[#402761] text-[#ffd875] border border-[#ffd875]/40 text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Nhấn để đổi tên"
                  >
                    <Edit3 size={12} />
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
                    placeholder="Tên mới..."
                    className="px-2.5 py-1 rounded-lg bg-[#0c0612] border border-[#ffd875] text-xs text-stone-100 focus:outline-none w-32 font-serif font-bold shadow-inner"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shadow cursor-pointer active:scale-95"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs transition cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-stone-800 hidden sm:block" />

          {/* Quick Roster Counter */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="font-mono font-black text-2xl text-[#ffd875]">
                {totalPlayers}<span className="text-stone-500 text-sm font-normal">/10</span>
              </div>
              <span className="text-[10px] text-[#c8aa6e] uppercase tracking-wider font-cinzel font-semibold">
                Phù Thủy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Drawer Modal */}
      {showQr && (
        <div className="glass-panel-gold p-6 rounded-3xl border-2 border-[#ffd875] flex flex-col items-center text-center animate-fadeIn shadow-2xl relative">
          <button
            onClick={() => setShowQr(false)}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 text-lg cursor-pointer"
          >
            ✕
          </button>
          <h4 className="font-cinzel font-black text-[#ffd875] text-lg sm:text-xl mb-1">
            Quét Mã QR Bằng Camera Điện Thoại
          </h4>
          <p className="text-xs text-stone-300 font-serif mb-4">
            Người chơi chỉ cần hướng camera vào mã để vào sảnh ngay lập tức:
          </p>
          <div className="p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,216,117,0.3)] border-4 border-[#ffd875]/60">
            <QRCodeSVG value={joinUrl} size={200} level="M" />
          </div>
          <p className="text-xs text-[#c8aa6e] max-w-sm mt-3 break-all font-mono">
            {joinUrl}
          </p>
          <button
            onClick={() => setShowQr(false)}
            className="mt-4 px-6 py-2 rounded-xl bg-[#2b1742] text-xs font-serif font-bold text-[#ffd875] hover:bg-[#3d225d] border border-[#ffd875]/50 cursor-pointer active:scale-95 shadow-md"
          >
            Đóng Mã QR
          </button>
        </div>
      )}

      {/* TOP ROW: WIZARD COUNCIL SEATS & BALANCE OF POWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: WIZARD COUNCIL SEATS (7 Cols on desktop, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 border border-[#ffd875]/40 shadow-2xl flex flex-col gap-4 h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-[#c8aa6e]/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#740001]/60 border border-[#ffd875]/40 text-lg shadow-inner">
                  🧙‍♂️
                </span>
                <div>
                  <h3 className="font-cinzel font-black text-[#ffd875] text-base sm:text-lg">
                    HỘI ĐỒNG PHÙ THỦY ({totalPlayers}/10)
                  </h3>
                  <p className="text-[11px] text-stone-400 font-serif">
                    Danh sách các vị trí ngồi quanh bàn tròn
                  </p>
                </div>
              </div>

              {/* Host Action: Add AI Bot */}
              {isHost && totalPlayers < 10 && (
                <button
                  onClick={() => {
                    onAddBot();
                    sound.playButtonChime();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2b1742] to-[#3d225d] hover:from-[#3d225d] hover:to-[#4e2c7a] text-[#ffd875] border border-[#ffd875]/50 text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <UserPlus size={14} />
                  <span>Thêm Bot AI</span>
                </button>
              )}
            </div>

            {/* Players Cards Grid (Tactile Holographic Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {players.map((p, idx) => {
                const isMe = p.id === myPlayer.id;
                const theme = getPlayerTheme(p, idx);
                const isOffline = offlinePlayerIds.includes(p.id) && !p.isAi && !p.isHost;

                return (
                  <div
                    key={p.id}
                    className={`holographic-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all duration-300 relative overflow-hidden group ${
                      isMe
                        ? 'border-[#ffd875] shadow-[0_0_20px_rgba(255,216,117,0.25)] ring-1 ring-[#ffd875]/50 bg-gradient-to-r from-[#211133] to-[#160b22]'
                        : `${theme.border} ${theme.bg}`
                    }`}
                  >
                    {/* Left: Avatar with Glowing House Ring */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.ring} p-[2px] shadow-[0_0_12px_rgba(0,0,0,0.5)] flex-shrink-0 relative`}>
                        <div className="w-full h-full rounded-[14px] bg-[#0d0716] flex items-center justify-center font-cinzel font-black text-sm text-[#ffd875]">
                          {theme.crest}
                        </div>
                        {/* Status Ping Dot */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#07040e] ${
                            isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                          }`}
                          title={isOffline ? 'Mất kết nối' : 'Đang trực tuyến'}
                        />
                      </div>

                      {/* Info & Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-sm text-[#f5f1e8] truncate">
                            {p.name}
                          </span>
                          {p.userTag && (
                            <span className="text-[10px] text-[#ffd875]/80 font-mono italic shrink-0">
                              [{p.userTag}]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[#ffd875] border border-amber-500/50 font-serif font-bold">
                              Bạn
                            </span>
                          )}
                          {p.hpvnUid && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono font-bold flex items-center gap-0.5">
                              ✓ HPVN
                            </span>
                          )}
                          {p.isHost && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-950 text-amber-300 border border-red-700/60 font-serif font-bold flex items-center gap-1">
                              <Crown size={10} /> Host
                            </span>
                          )}
                          {p.isAi && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-700/60 font-mono font-semibold flex items-center gap-0.5">
                              <Bot size={10} /> AI
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-cinzel font-semibold uppercase tracking-wider ${theme.badge}`}>
                            {p.house || 'GRYFFINDOR'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action: Host can kick player or AI bot */}
                    {isHost && !p.isHost && (
                      <button
                        onClick={() => {
                          onRemovePlayer(p.id);
                          sound.playButtonChime();
                        }}
                        title="Xóa người chơi / bot này khỏi phòng"
                        className="text-stone-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-950/40 transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty slots preview if under 4 players */}
            {totalPlayers < 4 && (
              <div className="p-3 rounded-2xl border border-dashed border-stone-800 bg-[#0c0612]/50 text-center text-xs text-stone-400 font-serif mt-auto">
                Đang chờ thêm {4 - totalPlayers} phù thủy nữa để ván đấu trở nên kịch tính nhất...
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WAR-ROOM BALANCE DASHBOARD (5 Cols on desktop, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 border border-[#ffd875]/40 shadow-2xl flex flex-col justify-between gap-4 h-full">
            <div>
              <div className="flex items-center justify-between border-b border-[#c8aa6e]/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#2b1742] border border-[#ffd875]/40 text-lg shadow-inner">
                    ⚖️
                  </span>
                  <div>
                    <h3 className="font-cinzel font-black text-[#ffd875] text-base sm:text-lg">
                      CÂN BẰNG LỰC LƯỢNG
                    </h3>
                    <p className="text-[11px] text-stone-400 font-serif">
                      Tương quan sĩ số giữa Học Sinh & Tử Thần
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#ffd875] bg-[#231438] px-2.5 py-1 rounded-full border border-[#c8aa6e]/40 shadow-sm">
                  {participantCount} tham chiến
                </span>
              </div>

              {/* Visual Balance Bar */}
              <div className="mt-4">
                <div className="w-full h-4 bg-black/80 rounded-full overflow-hidden p-0.5 border border-stone-700 flex gap-0.5 shadow-inner">
                  {studentCount > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#ffd875] rounded-l-full transition-all duration-500 shadow-[0_0_10px_rgba(255,216,117,0.5)]"
                      style={{ width: `${(studentCount / Math.max(1, participantCount)) * 100}%` }}
                      title={`Học sinh: ${studentCount}`}
                    />
                  )}
                  {undercoverCount > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      style={{ width: `${(undercoverCount / Math.max(1, participantCount)) * 100}%` }}
                      title={`Tử thần thực tử: ${undercoverCount}`}
                    />
                  )}
                  {mrWhiteCount > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 rounded-r-full transition-all duration-500 shadow-[0_0_10px_rgba(192,132,252,0.5)]"
                      style={{ width: `${(mrWhiteCount / Math.max(1, participantCount)) * 100}%` }}
                      title={`Mr. White: ${mrWhiteCount}`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-between text-xs font-serif text-stone-300 pt-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffd875] shadow-[0_0_6px_#ffd875]" />
                    <span>Học Sinh: <strong className="text-[#ffd875]">{studentCount}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span>Tử Thần: <strong className="text-emerald-400">{undercoverCount}</strong></span>
                  </span>
                  {mrWhiteCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                      <span>Kẻ Không Tên: <strong className="text-purple-300">{mrWhiteCount}</strong></span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Status / Advice Box */}
            <div className="flex flex-col gap-2.5 mt-2">
              {!canStart ? (
                <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs font-serif leading-relaxed flex items-center gap-2.5 shadow-inner">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <span>
                    {isSpectator
                      ? 'Cần thêm ít nhất 3 người chơi khác ngoài Quản trò!'
                      : 'Cần tối thiểu 3 người chơi và số Học Sinh phải nhiều hơn Tử Thần!'}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif leading-relaxed flex items-center gap-2.5 shadow-inner">
                  <span className="text-base flex-shrink-0">✨</span>
                  <span>
                    Bàn chơi đã đủ điều kiện sẵn sàng! Quản trò có thể thiết lập cấu hình bên dưới và phát thẻ bắt đầu.
                  </span>
                </div>
              )}

              <div className="p-2.5 rounded-2xl bg-[#0c0612]/70 border border-stone-800 text-[11px] font-serif text-stone-400 leading-relaxed flex items-center gap-2">
                <span className="text-[#ffd875]">💡</span>
                <span>Học sinh giữ kín từ khóa, Tử thần hòa nhập nghe ngóng, Kẻ không tên đoán bừa sinh tồn.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL ROUND SETUP / HOST CONTROLS (NẰM NGANG TOÀN BỘ CHIỀU RỘNG) */}
      <div className="w-full">
        {isHost ? (
          <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 border border-[#ffd875]/40 shadow-2xl flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8aa6e]/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#2e1c45] border border-[#ffd875]/40 text-lg shadow-inner">
                  🪄
                </span>
                <div>
                  <h3 className="font-cinzel font-black text-[#ffd875] text-base sm:text-lg flex items-center gap-2">
                    <Wand2 size={18} className="text-[#ffd875]" />
                    <span>THIẾT LẬP VÒNG ĐẤU</span>
                  </h3>
                  <p className="text-[11px] text-stone-300 font-serif">
                    Tùy chỉnh vai trò, thể thức thi đấu và kho từ vựng ma thuật
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const deckStats = getWordDeckStats(config.selectedCategories);
                  return (
                    <span className="text-xs text-[#ffd875] font-serif flex items-center gap-1.5 bg-[#231438] px-3 py-1 rounded-full border border-[#c8aa6e]/50 shadow-sm">
                      <span>🃏 Kho từ: <strong>{deckStats.remainingCount}</strong>/{deckStats.totalCount} cặp</span>
                    </span>
                  );
                })()}
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffd875] bg-[#740001]/90 px-3 py-1 rounded-full border border-[#ffd875]/40 shadow-sm">
                  Host Controls
                </span>
              </div>
            </div>

            {/* 3 Horizontal Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 items-stretch">
              {/* Col 1: Chế độ Chủ phòng */}
              <div className="bg-[#0e0716]/90 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between gap-2.5 shadow-inner">
                <div>
                  <label className="text-xs text-[#ffd875] font-cinzel font-bold block mb-2.5 uppercase tracking-wider">
                    🎭 Chế Độ Của Chủ Phòng:
                  </label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ hostRole: 'PLAYER' });
                        sound.playButtonChime();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.hostRole === 'PLAYER'
                          ? 'bg-[#341b52] border-[#ffd875] text-[#ffd875] shadow-lg ring-1 ring-[#ffd875]/60'
                          : 'bg-[#140b20] border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center gap-1.5">
                        <span>🧙‍♂️</span>
                        <span>Cùng Chơi (Người Tham Gia)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5 font-serif leading-relaxed">
                        Nhận thẻ bí mật, cùng miêu tả và suy đoán từ khóa.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ hostRole: 'GAME_MASTER' });
                        sound.playButtonChime();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.hostRole === 'GAME_MASTER'
                          ? 'bg-[#341b52] border-[#ffd875] text-[#ffd875] shadow-lg ring-1 ring-[#ffd875]/60'
                          : 'bg-[#140b20] border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center gap-1.5">
                        <span>📜</span>
                        <span>Quản Trò (Trọng Tài)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5 font-serif leading-relaxed">
                        Thấy toàn bộ đáp án và vai trò, không tham gia đoán từ.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Col 2: Phân bổ vai trò (Tử Thần & Mr. White) */}
              <div className="bg-[#0e0716]/90 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between gap-3 shadow-inner">
                <label className="text-xs text-[#ffd875] font-cinzel font-bold block uppercase tracking-wider">
                  ⚖️ Tỷ Lệ Phe Phái:
                </label>

                {/* Undercover Stepper */}
                <div className="p-3 rounded-xl bg-[#140b20] border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-300 shadow">
                      <Shield size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-serif font-bold text-emerald-300 block">
                        Tử Thần Thực Tử
                      </span>
                      <span className="text-[10px] text-stone-400 font-serif">Gián điệp nhận từ lệch</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[1, 2].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({ undercoverCount: num });
                          sound.playButtonChime();
                        }}
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
                          undercoverCount === num
                            ? 'bg-emerald-700 text-white shadow-[0_0_12px_rgba(52,211,153,0.5)] border border-emerald-300'
                            : 'bg-[#1c102b] text-stone-400 border border-stone-700 hover:bg-[#2e1a47]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mr White Stepper */}
                <div className="p-3 rounded-xl bg-[#140b20] border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-300 shadow">
                      <Ghost size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-serif font-bold text-purple-300 block">
                        Kẻ Không Thừa Nhận
                      </span>
                      <span className="text-[10px] text-stone-400 font-serif">Mr. White (Không có từ)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[0, 1].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({ mrWhiteCount: num });
                          sound.playButtonChime();
                        }}
                        className={`px-3 h-9 rounded-xl font-serif font-bold text-xs transition-all cursor-pointer ${
                          mrWhiteCount === num
                            ? 'bg-purple-700 text-white shadow-[0_0_12px_rgba(192,132,252,0.5)] border border-purple-300'
                            : 'bg-[#1c102b] text-stone-400 border border-stone-700 hover:bg-[#2e1a47]'
                        }`}
                      >
                        {num === 0 ? 'Tắt' : 'Bật'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 3: Secret Words Category Selector */}
              <div className="bg-[#0e0716]/90 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#ffd875] font-cinzel font-bold uppercase tracking-wider">
                    🃏 Chủ Đề Cặp Từ:
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[165px] overflow-y-auto pr-1 custom-scrollbar">
                  {CATEGORIES.map((cat) => {
                    const isAll = cat.id === 'ALL';
                    const selected =
                      config.selectedCategories.includes(cat.id) ||
                      (isAll && config.selectedCategories.includes('ALL'));

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          sound.playButtonChime();
                          if (isAll) {
                            onUpdateConfig({ selectedCategories: ['ALL'] });
                          } else {
                            const current = config.selectedCategories.filter((c) => c !== 'ALL');
                            const alreadySelected = current.includes(cat.id);
                            let next: string[];
                            if (alreadySelected) {
                              next = current.filter((c) => c !== cat.id);
                              if (next.length === 0) next = ['ALL'];
                            } else {
                              next = [...current, cat.id];
                            }
                            onUpdateConfig({ selectedCategories: next });
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition-all text-left border cursor-pointer ${
                          selected
                            ? 'bg-[#341b52] border-[#ffd875] text-[#ffd875] shadow-md ring-1 ring-[#ffd875]/40'
                            : 'bg-[#140b20] border-stone-800 text-stone-400 hover:bg-[#1f1230]'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span className="truncate text-[11px]">{cat.label}</span>
                        {selected && !isAll && <span className="ml-auto text-[#ffd875] text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Client Horizontal Waiting Atmosphere Box */
          <div className="glass-panel-gold rounded-3xl p-5 sm:p-6 border border-[#c8aa6e]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2b1742] border border-[#ffd875]/40 flex items-center justify-center text-2xl animate-pulse flex-shrink-0">
                ⏳
              </div>
              <div>
                <h4 className="font-cinzel font-black text-sm sm:text-base text-[#ffd875]">
                  Đang Chờ Quản Trò Khởi Động Ván Đấu
                </h4>
                <p className="text-xs text-[#e0cfab] font-serif leading-relaxed mt-0.5">
                  Chủ phòng đang cấu hình Tử Thần, chọn gói từ vựng và cân đối bàn chơi...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-serif text-stone-400 bg-[#0d0716]/80 px-4 py-2.5 rounded-xl border border-stone-800">
              <span>⚡</span>
              <span>Hãy giữ tinh thần quan sát nét mặt và lời miêu tả của người bên cạnh!</span>
            </div>
          </div>
        )}
      </div>

      {/* FULL-WIDTH BOTTOM COMMAND DOCK (Sticky on mobile for instant thumb reach) */}
      <div className="w-full mt-2 sticky bottom-3 z-30 sm:static bg-[#07040e]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-1 sm:p-0 rounded-2xl sm:rounded-none">
        {isHost ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (!canStart) return;
                onStartGame();
              }}
              disabled={!canStart}
              className={`w-full py-4 sm:py-5 rounded-2xl font-cinzel font-black text-base sm:text-lg tracking-wider flex items-center justify-center gap-3 shadow-2xl transition-all cursor-pointer relative overflow-hidden group ${
                canStart
                  ? 'bg-gradient-to-r from-[#740001] via-[#c8aa6e] to-[#740001] text-[#120d18] hover:scale-[1.01] active:scale-[0.99] border-2 border-[#ffd875] shadow-[0_8px_35px_rgba(200,170,110,0.5)]'
                  : 'bg-stone-900/80 text-stone-500 border border-stone-800 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="absolute inset-0 shimmer-gold opacity-40 pointer-events-none" />
              <Play size={22} fill="currentColor" />
              <span>PHÁT THẺ & BẮT ĐẦU VÁN ĐẤU</span>
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
            {onLeaveRoom && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn rời và giải tán phòng không? Tất cả người chơi khác trong phòng sẽ tự động bị mời ra ngoài.')) {
                      onLeaveRoom();
                    }
                  }}
                  className="text-xs text-red-400/80 hover:text-red-300 font-serif flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Rời phòng & Giải tán bàn chơi</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 shadow-[0_0_10px_#34d399]" />
              <p className="text-xs sm:text-sm text-stone-200 font-serif">
                Đã gia nhập bàn chơi thành công! Đang đợi Quản trò (Host) bấm nút phát thẻ bí mật...
              </p>
            </div>
            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 text-xs font-serif font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 flex-shrink-0"
              >
                <LogOut size={14} />
                <span>Rời Phòng</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hogwarts Acceptance Letter Modal */}
      {showAcceptanceModal && myPlayer.name.startsWith('Phù thủy #') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-panel-gold border-2 border-[#ffd875] rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
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

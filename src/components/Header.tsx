import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, BookOpen, Volume2, VolumeX, Smartphone, Copy, Check, LogOut, Menu, X, Sparkles, Flame } from 'lucide-react';
import { sound } from '../utils/audio';
import { openFlooDrawer } from './FlooChatDrawer';

interface HeaderProps {
  roomCode?: string;
  onOpenHowToPlay: () => void;
  onOpenCustomWords: () => void;
  onOpenPassAndPlay: () => void;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  onOpenHowToPlay,
  onOpenCustomWords,
  onOpenPassAndPlay,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(sound.isEnabled());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playButtonChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const nextState = sound.toggleSound();
    setSoundOn(nextState);
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Auto-close menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="w-full px-3 py-2 sm:px-4 sm:py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto acrylic-dock rounded-2xl sm:rounded-full px-3.5 py-2 sm:px-5 sm:py-2 flex items-center justify-between gap-2 shadow-2xl">
        {/* Hogwarts Brand & Emblem */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-gradient-to-br from-[#ffd875] via-[#8a1c14] to-[#120a1c] p-[1.5px] shadow-[0_0_15px_rgba(200,170,110,0.35)] transition-transform group-hover:scale-105 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] sm:rounded-full bg-[#10071a] flex items-center justify-center">
                <span className="text-base sm:text-xl select-none filter drop-shadow">🧙‍♂️</span>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ffd875] border border-[#740001] flex items-center justify-center pointer-events-none">
              <Sparkles size={7} className="text-[#740001]" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-title font-black text-xs sm:text-base md:text-lg tracking-wider gold-gradient-text drop-shadow truncate">
                UNDERCOVER
              </h1>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#740001] to-[#8a1c14] text-[#ffd875] border border-[#ffd875]/50 font-serif font-bold tracking-wide shadow-sm shrink-0">
                Hogwarts
              </span>
            </div>
            <p className="text-[10px] text-[#c8aa6e]/80 hidden md:block truncate font-medium">
              Đại Chiến Học Sinh & Tử Thần Thực Tử
            </p>
          </div>
        </div>

        {/* Room Code Badge (if in room) */}
        {roomCode && (
          <div className="flex items-center gap-1.5 bg-[#1a0e2a] px-3 py-1 rounded-full border border-[#ffd875]/40 shadow-sm shrink-0">
            <span className="text-[10px] text-[#c8aa6e] font-serif uppercase tracking-wider hidden xs:inline">
              Phòng:
            </span>
            <span className="font-mono font-black text-xs sm:text-sm tracking-widest text-[#ffd875]">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Sao chép mã phòng"
              className="text-[#c8aa6e] hover:text-[#ffd875] transition-all p-0.5 rounded cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
          <button
            onClick={() => openFlooDrawer()}
            title="Mạng Floo - Trò chuyện HPVN thời gian thực"
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] border border-[#ffd875]/60 transition-all flex items-center gap-1.5 text-xs font-serif font-bold cursor-pointer active:scale-95"
          >
            <Flame size={14} className="text-[#ffd875] animate-pulse" />
            <span>Mạng Floo</span>
          </button>

          <button
            onClick={onOpenPassAndPlay}
            title="Chơi chung 1 máy (Pass & Play)"
            className="px-3 py-1.5 rounded-full bg-[#1b0f2e] text-[#e6d0a1] hover:text-[#ffd875] hover:bg-[#2e1c45] border border-[#c8aa6e]/30 hover:border-[#ffd875]/60 transition-all flex items-center gap-1.5 text-xs font-serif font-semibold cursor-pointer active:scale-95"
          >
            <Smartphone size={14} className="text-[#ffd875]" />
            <span>1 Máy</span>
          </button>

          <button
            onClick={onOpenCustomWords}
            title="Bộ từ vựng tùy chỉnh"
            className="px-3 py-1.5 rounded-full bg-[#1b0f2e] text-[#e6d0a1] hover:text-[#ffd875] hover:bg-[#2e1c45] border border-[#c8aa6e]/30 hover:border-[#ffd875]/60 transition-all flex items-center gap-1.5 text-xs font-serif font-semibold cursor-pointer active:scale-95"
          >
            <BookOpen size={14} className="text-[#ffd875]" />
            <span>Từ Vựng</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            title="Luật chơi & Hướng dẫn"
            className="p-2 rounded-full bg-[#1b0f2e] text-[#c8aa6e] hover:text-[#ffd875] hover:bg-[#2e1c45] border border-[#c8aa6e]/30 hover:border-[#ffd875]/60 transition-all cursor-pointer active:scale-95"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-full bg-[#1b0f2e] text-[#c8aa6e] hover:text-[#ffd875] hover:bg-[#2e1c45] border border-[#c8aa6e]/30 hover:border-[#ffd875]/60 transition-all cursor-pointer active:scale-95"
          >
            {soundOn ? <Volume2 size={16} className="text-[#ffd875]" /> : <VolumeX size={16} className="text-stone-500" />}
          </button>

          {onLeaveRoom && roomCode && (
            <button
              onClick={onLeaveRoom}
              title="Rời khỏi phòng"
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-950 to-red-900 text-red-200 hover:text-white border border-red-700/60 shadow-sm transition-all flex items-center gap-1.5 text-xs font-serif font-bold ml-1 cursor-pointer active:scale-95"
            >
              <LogOut size={13} />
              <span>Rời</span>
            </button>
          )}
        </div>

        {/* Mobile Menu & Sound controls */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Tắt âm' : 'Bật âm'}
            className="p-2 rounded-xl bg-[#1b0f2e] text-[#c8aa6e] hover:text-[#ffd875] border border-[#c8aa6e]/30 transition-all active:scale-95"
          >
            {soundOn ? <Volume2 size={16} className="text-[#ffd875]" /> : <VolumeX size={16} className="text-stone-500" />}
          </button>

          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Menu"
            className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              isMenuOpen
                ? 'bg-[#341b52] text-[#ffd875] border-[#ffd875] shadow-[0_0_12px_rgba(255,216,117,0.3)]'
                : 'bg-[#1b0f2e] text-[#c8aa6e] hover:text-[#ffd875] border-[#c8aa6e]/40'
            }`}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-30 md:hidden animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
          />

          <div
            ref={menuRef}
            className="absolute top-full left-3 right-3 mt-2 p-4 bg-[#140b20]/95 backdrop-blur-2xl border border-[#ffd875]/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 md:hidden flex flex-col gap-2.5 animate-fadeIn max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            {roomCode && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1f1233] border border-[#c8aa6e]/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c8aa6e] font-serif uppercase">Mã phòng:</span>
                  <span className="font-mono font-black text-base text-[#ffd875] tracking-widest">{roomCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#341b52] text-[#ffd875] text-xs font-serif font-bold border border-[#ffd875]/40 active:scale-95 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setIsMenuOpen(false);
                openFlooDrawer();
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#2a0e1c] to-[#1c082b] hover:from-[#3a1428] hover:to-[#280c3e] border border-[#ffd875]/40 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#740001] to-[#8e1d13] border border-[#ffd875]/50 flex items-center justify-center text-[#ffd875] shrink-0">
                <Flame size={20} className="text-[#ffd875] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-serif font-bold text-[#ffd875]">Mạng Floo (Chat HPVN)</div>
                <div className="text-[11px] text-[#c8aa6e]/80 truncate">Trò chuyện thời gian thực toàn thế giới phù thủy</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenPassAndPlay();
              }}
              className="w-full p-3 rounded-2xl bg-[#1c102a]/80 hover:bg-[#2b1842] border border-[#c8aa6e]/25 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-900/50 border border-[#ffd875]/40 flex items-center justify-center text-[#ffd875] shrink-0">
                <Smartphone size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-serif font-bold text-[#ffd875]">Chơi Chung 1 Máy (Pass & Play)</div>
                <div className="text-[11px] text-[#c8aa6e]/80 truncate">Chuyền tay nhau chơi không cần mạng</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenCustomWords();
              }}
              className="w-full p-3 rounded-2xl bg-[#1c102a]/80 hover:bg-[#2b1842] border border-[#c8aa6e]/25 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-900/50 border border-[#ffd875]/40 flex items-center justify-center text-[#ffd875] shrink-0">
                <BookOpen size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-serif font-bold text-[#ffd875]">Bộ Từ Vựng Tùy Chỉnh</div>
                <div className="text-[11px] text-[#c8aa6e]/80 truncate">Kho 166+ cặp từ ma thuật</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenHowToPlay();
              }}
              className="w-full p-3 rounded-2xl bg-[#1c102a]/80 hover:bg-[#2b1842] border border-[#c8aa6e]/25 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-900/50 border border-[#ffd875]/40 flex items-center justify-center text-[#ffd875] shrink-0">
                <HelpCircle size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-serif font-bold text-[#ffd875]">Luật Chơi & Hướng Dẫn</div>
                <div className="text-[11px] text-[#c8aa6e]/80 truncate">Phân vai & bí quyết chiến thắng</div>
              </div>
            </button>

            {onLeaveRoom && roomCode && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLeaveRoom();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 text-red-100 border border-red-700/60 flex items-center justify-center gap-2 text-sm font-serif font-bold transition-all active:scale-[0.99] mt-1 cursor-pointer shadow-lg"
              >
                <LogOut size={16} />
                <span>Rời Phòng Chơi Hiện Tại</span>
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};

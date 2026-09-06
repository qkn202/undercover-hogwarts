import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, BookOpen, Volume2, VolumeX, Smartphone, Copy, Check, LogOut, Menu, X } from 'lucide-react';
import { sound } from '../utils/audio';

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
    <header className="w-full bg-[#120d18]/95 backdrop-blur-md border-b border-[#c8aa6e]/30 px-3 py-2 sm:px-4 sm:py-3 sticky top-0 z-40 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#c8aa6e] to-[#740001] flex items-center justify-center shadow-inner border border-[#f3d994]/40 shrink-0">
            <span className="text-base sm:text-xl select-none">🧙‍♂️</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="font-serif font-bold text-sm sm:text-lg md:text-xl text-[#f3d994] tracking-wide leading-tight drop-shadow-sm truncate">
                UNDERCOVER
              </h1>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-[#740001]/80 text-[#ffd875] border border-[#c8aa6e]/40 font-mono font-semibold shrink-0">
                Hogwarts
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#a49a88] hidden sm:block truncate">
              Học Sinh vs Tử Thần Thực Tử & Kẻ Không Tên
            </p>
          </div>
        </div>

        {/* Room Code Badge (if active) */}
        {roomCode && (
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1f1629] px-2 sm:px-3 py-1 rounded-full border border-[#c8aa6e]/40 shadow-sm shrink-0">
            <span className="text-[10px] sm:text-xs text-[#a49a88] hidden xs:inline">Phòng:</span>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider sm:tracking-widest text-[#f3d994]">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Sao chép mã phòng"
              className="text-[#c8aa6e] hover:text-[#ffd875] transition-colors p-0.5 sm:p-1"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {/* Desktop Action Buttons (md and up) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
          <button
            onClick={onOpenPassAndPlay}
            title="Chơi chung 1 máy (Pass & Play)"
            className="p-2 rounded-lg bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border border-[#c8aa6e]/30 transition-all flex items-center gap-1 text-xs"
          >
            <Smartphone size={16} />
            <span className="font-medium">1 Máy</span>
          </button>

          <button
            onClick={onOpenCustomWords}
            title="Bộ từ tùy chỉnh"
            className="p-2 rounded-lg bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border border-[#c8aa6e]/30 transition-all flex items-center gap-1 text-xs"
          >
            <BookOpen size={16} />
            <span className="font-medium">Từ Vựng</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            title="Luật chơi & Hướng dẫn"
            className="p-2 rounded-lg bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border border-[#c8aa6e]/30 transition-all"
          >
            <HelpCircle size={17} />
          </button>

          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-lg bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border border-[#c8aa6e]/30 transition-all"
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} className="text-stone-500" />}
          </button>

          {onLeaveRoom && roomCode && (
            <button
              onClick={onLeaveRoom}
              title="Rời khỏi phòng hiện tại"
              className="px-2.5 py-1.5 rounded-lg bg-red-950/70 text-red-300 hover:bg-red-900 hover:text-white border border-red-800/50 transition-all flex items-center gap-1 text-xs font-medium ml-1"
            >
              <LogOut size={14} />
              <span>Rời</span>
            </button>
          )}
        </div>

        {/* Mobile Action Controls (< md) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Quick Sound Toggle on Mobile */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-lg bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border border-[#c8aa6e]/30 transition-all active:scale-95"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} className="text-stone-500" />}
          </button>

          {/* Mobile Collapsible Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={isMenuOpen ? 'Đóng menu' : 'Mở menu chức năng'}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              isMenuOpen
                ? 'bg-[#342250] text-[#ffd875] border-[#f3d994]/60 ring-1 ring-[#f3d994]/40'
                : 'bg-[#221633] text-[#c8aa6e] hover:bg-[#342250] hover:text-[#f3d994] border-[#c8aa6e]/40'
            }`}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsed Dropdown Menu & Backdrop */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[49px] sm:top-[57px] bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Dropdown Panel */}
          <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 mx-2 sm:mx-3 mt-1.5 p-3 bg-[#170f24]/95 backdrop-blur-xl border border-[#c8aa6e]/40 rounded-2xl shadow-2xl z-40 md:hidden flex flex-col gap-2 animate-fadeIn max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            {/* Room Info inside menu if active */}
            {roomCode && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#221633]/90 border border-[#c8aa6e]/30 mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#a49a88]">Mã phòng:</span>
                  <span className="font-mono font-bold text-sm text-[#f3d994] tracking-widest">{roomCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#342250] text-[#f3d994] text-xs border border-[#c8aa6e]/40 font-medium active:scale-95 transition-all"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pass & Play (1 Máy) */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenPassAndPlay();
              }}
              className="w-full p-2.5 rounded-xl bg-[#221633]/70 hover:bg-[#342250] border border-[#c8aa6e]/20 hover:border-[#c8aa6e]/50 flex items-center gap-3 text-left transition-all active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600/30 to-amber-900/40 border border-[#c8aa6e]/40 flex items-center justify-center text-[#f3d994] shrink-0">
                <Smartphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#f3d994]">Chơi Chung 1 Máy (Pass & Play)</div>
                <div className="text-[11px] text-[#a49a88] truncate">Chuyền tay nhau chơi không cần mạng</div>
              </div>
            </button>

            {/* Custom Words */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenCustomWords();
              }}
              className="w-full p-2.5 rounded-xl bg-[#221633]/70 hover:bg-[#342250] border border-[#c8aa6e]/20 hover:border-[#c8aa6e]/50 flex items-center gap-3 text-left transition-all active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600/30 to-purple-900/40 border border-[#c8aa6e]/40 flex items-center justify-center text-[#f3d994] shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#f3d994]">Bộ Từ Vựng Tùy Chỉnh</div>
                <div className="text-[11px] text-[#a49a88] truncate">Tạo & chọn danh sách từ Hogwarts</div>
              </div>
            </button>

            {/* How to Play */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenHowToPlay();
              }}
              className="w-full p-2.5 rounded-xl bg-[#221633]/70 hover:bg-[#342250] border border-[#c8aa6e]/20 hover:border-[#c8aa6e]/50 flex items-center gap-3 text-left transition-all active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/30 to-blue-900/40 border border-[#c8aa6e]/40 flex items-center justify-center text-[#f3d994] shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#f3d994]">Luật Chơi & Hướng Dẫn</div>
                <div className="text-[11px] text-[#a49a88] truncate">Phân vai, cách biểu quyết và mẹo thi đấu</div>
              </div>
            </button>

            {/* Sound Toggle row */}
            <button
              onClick={handleToggleSound}
              className="w-full p-2.5 rounded-xl bg-[#221633]/70 hover:bg-[#342250] border border-[#c8aa6e]/20 hover:border-[#c8aa6e]/50 flex items-center justify-between text-left transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600/30 to-emerald-900/40 border border-[#c8aa6e]/40 flex items-center justify-center text-[#f3d994] shrink-0">
                  {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} className="text-stone-400" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#f3d994]">Hiệu Ứng Âm Thanh</div>
                  <div className="text-[11px] text-[#a49a88]">
                    {soundOn ? 'Đang bật hiệu ứng âm' : 'Đang tắt âm'}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  soundOn
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                    : 'bg-stone-900 text-stone-400 border-stone-700'
                }`}
              >
                {soundOn ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            {/* Leave Room (if active) */}
            {onLeaveRoom && roomCode && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLeaveRoom();
                }}
                className="w-full p-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white border border-red-800/50 flex items-center justify-center gap-2 text-sm font-medium transition-all active:scale-[0.99] mt-1"
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

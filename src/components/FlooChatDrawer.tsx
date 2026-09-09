import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  X, 
  Sparkles, 
  Loader2, 
  RotateCw 
} from 'lucide-react';

interface FlooChatDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

/**
 * Global trigger to open Floo Chat Drawer from any component.
 */
export function openFlooDrawer() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-floo-drawer'));
  }
}

export function closeFlooDrawer() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('close-floo-drawer'));
  }
}

export const FlooChatDrawer: React.FC<FlooChatDrawerProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onOpen: propOnOpen 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    propOnClose?.();
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
    propOnOpen?.();
  };

  // Listen for global open/close events
  useEffect(() => {
    const onGlobalOpen = () => handleOpen();
    const onGlobalClose = () => handleClose();

    window.addEventListener('open-floo-drawer', onGlobalOpen);
    window.addEventListener('close-floo-drawer', onGlobalClose);

    return () => {
      window.removeEventListener('open-floo-drawer', onGlobalOpen);
      window.removeEventListener('close-floo-drawer', onGlobalClose);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reload iframe function
  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Dark Ambient Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity" 
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - Undercover Hogwarts Dark Violet & Antique Gold Framing Full Floo App */}
      <aside 
        className="relative w-full sm:w-[500px] md:w-[540px] max-w-full h-full bg-gradient-to-b from-[#1c0c2a] via-[#12061c] to-[#0a0312] border-l-2 border-[#ffd875]/70 text-[#ebdcb0] flex flex-col z-50 select-text animate-in slide-in-from-right duration-250 ease-out overflow-hidden shadow-2xl"
        role="dialog"
        aria-label="Mạng Floo HPVN Chat"
      >
        {/* Hogwarts Header Banner */}
        <div className="px-4 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-[#c8aa6e]/40 bg-[#190b29] z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#28143d] text-[#ffd875] border border-[#ffd875]/50 shrink-0">
              <Flame size={18} className="text-[#ffd875] animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-title font-bold text-sm sm:text-base tracking-wide text-[#ffd875] truncate">
                  Mạng Floo · Undercover Hogwarts
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a1340] border border-[#ffd875]/40 text-[10px] font-mono text-[#ffd875] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-[#c8aa6e] font-serif truncate">
                Đầy đủ tính năng gốc: Emoji, Hình ảnh, Thư Sấm, Cảm xúc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 z-20">
            <button
              type="button"
              onClick={handleReload}
              title="Tải lại Mạng Floo"
              className="p-2 rounded-xl bg-[#12061c] hover:bg-[#28143d] text-[#ffd875] border border-[#c8aa6e]/50 transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              <RotateCw size={15} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              title="Đóng Mạng Floo (Phím Esc)"
              className="p-2 rounded-xl bg-[#12061c] hover:bg-[#28143d] text-[#ffd875] border border-[#c8aa6e]/50 transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Body: Full Original Floo Network Embedded In-App */}
        <div className="relative flex-1 w-full h-full min-h-0 bg-[#05020a]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-[#ebdcb0]/80 gap-3 bg-[#12061c] z-10">
              <Loader2 size={32} className="animate-spin text-[#ffd875]" />
              <p className="font-title text-sm sm:text-base text-[#ffd875] tracking-wide">
                Đang thắp lửa Mạng Floo...
              </p>
              <p className="font-serif text-xs text-[#c8aa6e] text-center max-w-xs leading-relaxed">
                Đang nạp toàn bộ chức năng gốc: bộ emoji Yahoo, gửi ảnh, thư sấm, thả cảm xúc bùa chú và ghim tin.
              </p>
            </div>
          )}

          <iframe
            key={iframeKey}
            src="/api/floo-embed"
            title="Mạng Floo HPVN Full Feature App"
            className="w-full h-full border-none"
            allow="clipboard-write; autoplay; fullscreen"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Themed Bottom Status Strip */}
        <div className="px-3.5 py-2 bg-[#100618] border-t border-[#c8aa6e]/40 flex items-center justify-between text-[11px] text-[#c8aa6e] font-serif shrink-0 z-20">
          <span className="flex items-center gap-1.5 text-[#ffd875]">
            <Sparkles size={12} className="text-[#ffd875]" />
            Mạng Floo HPVN · Full tính năng
          </span>
          <span className="font-mono text-[10px] text-stone-500">
            hpvn-archive.net
          </span>
        </div>
      </aside>
    </div>
  );
};

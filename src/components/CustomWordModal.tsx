import React, { useState, useEffect } from 'react';
import type { WordPair } from '../types';
import {
  getCustomWordPairs,
  saveCustomWordPair,
  deleteCustomWordPair,
  DEFAULT_WORD_PAIRS,
  getWordDeckStats,
  resetPlayedWords,
} from '../data/words';
import { X, Plus, Trash2, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface CustomWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomWordModal: React.FC<CustomWordModalProps> = ({ isOpen, onClose }) => {
  const [customList, setCustomList] = useState<WordPair[]>(getCustomWordPairs());
  const [studentWord, setStudentWord] = useState('');
  const [undercoverWord, setUndercoverWord] = useState('');
  const [category, setCategory] = useState('SPELLS');
  const [deckStats, setDeckStats] = useState(() => getWordDeckStats());
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeckStats(getWordDeckStats());
      setCustomList(getCustomWordPairs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentWord.trim() || !undercoverWord.trim()) return;

    const saved = saveCustomWordPair({
      studentWord: studentWord.trim(),
      undercoverWord: undercoverWord.trim(),
      category,
    });

    setCustomList([saved, ...customList]);
    setDeckStats(getWordDeckStats());
    setStudentWord('');
    setUndercoverWord('');
    sound.playButtonChime();
  };

  const handleDelete = (id: string) => {
    deleteCustomWordPair(id);
    setCustomList(customList.filter((item) => item.id !== id));
    setDeckStats(getWordDeckStats());
    sound.playButtonChime();
  };

  const handleResetDeck = () => {
    setIsResetting(true);
    resetPlayedWords('ALL');
    setDeckStats(getWordDeckStats());
    sound.playVictoryFanfare();
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-[#181122] rounded-2xl border-2 border-[#c8aa6e] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#c8aa6e]/30 flex items-center justify-between bg-[#120d18]">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[#c8aa6e]" size={20} />
            <h3 className="font-serif font-bold text-[#f3d994] text-lg">
              Kho Từ Vựng Ma Thuật & Tự Tạo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {/* Deck Stats & Anti-Repeat Cooldown Tracker */}
          <div className="bg-gradient-to-r from-[#211632] via-[#2a1a3e] to-[#211632] p-4 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                🃏
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-xs sm:text-sm text-[#f3d994]">
                    Tiến Độ Bộ Từ (Chống Trùng Lặp)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Không lặp lại câu đã chơi
                  </span>
                </div>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Đã chơi: <strong className="text-amber-300 font-semibold">{deckStats.playedCount}</strong> / {deckStats.totalCount} cặp từ (Còn <strong className="text-emerald-300 font-semibold">{deckStats.remainingCount}</strong> cặp chưa ra)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetDeck}
              title="Xáo lại bộ từ từ đầu"
              className="px-3 py-1.5 rounded-lg bg-[#180f24] hover:bg-amber-950/50 text-amber-200 border border-amber-500/40 text-xs font-serif font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-end sm:self-auto active:scale-95"
            >
              <RefreshCw size={13} className={isResetting ? 'animate-spin' : ''} />
              <span>Xáo Lại Từ Đầu</span>
            </button>
          </div>
          {/* Add New Word Pair Form */}
          <form onSubmit={handleAdd} className="bg-[#100b17] p-4 rounded-xl border border-stone-800 flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#ffd875] uppercase flex items-center gap-1.5">
              <Sparkles size={14} /> Thêm Cặp Từ Mới Vào Trò Chơi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">
                  Từ của Học Sinh (Civilian) *
                </label>
                <input
                  type="text"
                  value={studentWord}
                  onChange={(e) => setStudentWord(e.target.value)}
                  placeholder="Ví dụ: Áo Choàng Tàng Hình"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1226] border border-stone-700 text-sm text-stone-200 focus:outline-none focus:border-[#c8aa6e]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">
                  Từ của Tử Thần Thực Tử (Undercover) *
                </label>
                <input
                  type="text"
                  value={undercoverWord}
                  onChange={(e) => setUndercoverWord(e.target.value)}
                  placeholder="Ví dụ: Bản Đồ Đạo Tặc"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1226] border border-stone-700 text-sm text-stone-200 focus:outline-none focus:border-[#c8aa6e]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Thể Loại</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1226] border border-stone-700 text-sm text-stone-200 focus:outline-none focus:border-[#c8aa6e]"
              >
                <option value="SPELLS">🪄 Bùa Chú & Ma Pháp</option>
                <option value="ITEMS">🔮 Bảo Bối & Pháp Bảo</option>
                <option value="LOCATIONS">🏰 Địa Danh & Phòng</option>
                <option value="CREATURES">🦅 Sinh Vật Huyền Bí</option>
                <option value="CHARACTERS">🧙 Nhân Vật & Gia Tộc</option>
                <option value="DAILY">☕ Đời Thường & Đố Vui</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#740001] to-[#a31a1a] hover:from-[#8c0304] hover:to-[#be2020] text-amber-100 font-serif font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-600/40 shadow"
            >
              <Plus size={16} />
              <span>LƯU CẶP TỪ NÀY VÀO KHO</span>
            </button>
          </form>

          {/* Custom Pairs List */}
          <div>
            <h4 className="text-xs font-semibold text-stone-300 uppercase mb-2">
              Cặp Từ Tự Tạo ({customList.length})
            </h4>

            {customList.length === 0 ? (
              <p className="text-xs text-stone-500 italic bg-[#120d18] p-3 rounded-lg border border-stone-800 text-center">
                Chưa có cặp từ tự tạo nào. Hãy thêm vào ở khung trên!
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {customList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#100b17] border border-stone-800 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-300">{item.studentWord}</span>
                        <span className="text-stone-500">vs</span>
                        <span className="font-semibold text-emerald-400">{item.undercoverWord}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-stone-500 hover:text-red-400 p-1 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Built-in Sample Count */}
          <div className="bg-[#120d18] p-3 rounded-xl border border-stone-800 text-xs text-stone-400 flex items-center justify-between">
            <span>Thư viện từ có sẵn của Hogwarts:</span>
            <span className="font-mono font-bold text-[#f3d994]">
              {DEFAULT_WORD_PAIRS.length} cặp từ
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-800 bg-[#120d18] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2a1a3e] text-xs text-stone-200 hover:text-white border border-[#c8aa6e]/40"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

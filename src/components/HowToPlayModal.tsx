import React from 'react';
import { X, Wand2, Award, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-[#181122] rounded-2xl border-2 border-[#c8aa6e] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c8aa6e]/30 flex items-center justify-between bg-[#120d18]">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-[#c8aa6e]" size={20} />
            <h3 className="font-serif font-bold text-[#f3d994] text-lg">
              Luật Chơi Undercover Hogwarts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs text-stone-300 leading-relaxed">
          {/* Roles section */}
          <div>
            <h4 className="font-serif font-bold text-[#ffd875] text-sm uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Wand2 size={16} /> 3 Phe Phái Trong Học Viện
            </h4>
            <div className="flex flex-col gap-2">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-200 text-xs">
                ⚡ <strong>LUẬT BÍ MẬT QUAN TRỌNG:</strong> Khi lật mở thẻ, bạn <strong>CHỈ THẤY TỪ MA THUẬT</strong>, hoàn toàn <strong>KHÔNG BIẾT</strong> mình là Học Sinh hay Tử Thần Thực Tử! Bạn phải lắng nghe người khác miêu tả để tự phán đoán xem từ của mình là từ của phe đa số hay mình chính là Gián Điệp!
              </div>

              <div className="p-2.5 rounded-xl bg-[#100b17] border border-amber-800/40">
                <span className="font-bold text-amber-300 text-sm">
                  1. Học Sinh Hogwarts (Civilian - Phe Ánh Sáng)
                </span>
                <p className="mt-1 text-stone-300">
                  Chiếm đa số trong phòng. Tất cả nhận <strong>cùng một từ khóa ma thuật</strong> (ví dụ: "Expelliarmus"). Nhiệm vụ là miêu tả khéo léo để nhận diện đồng đội và bỏ phiếu loại các Tử Thần!
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#100b17] border border-emerald-800/40">
                <span className="font-bold text-emerald-300 text-sm">
                  2. Tử Thần Thực Tử (Undercover - Gián Điệp)
                </span>
                <p className="mt-1 text-stone-300">
                  Thường có 1 hoặc 2 người. Nhận một từ khóa <strong>gần giống với Học Sinh</strong> (ví dụ: "Avada Kedavra"). Ban đầu bạn cũng tưởng mình là học sinh bình thường, nhưng khi nghe mọi người miêu tả thì bạn sẽ nhận ra mình là Gián Điệp và phải ngụy trang lừa mọi người!
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#100b17] border border-purple-800/40">
                <span className="font-bold text-purple-300 text-sm">
                  3. Kẻ Không Tên (Mr. White - Kẻ Trắng Tay)
                </span>
                <p className="mt-1 text-stone-300">
                  Hoàn toàn <strong>KHÔNG CÓ TỪ</strong>! Bạn phải nghe ngóng mọi người miêu tả để đoán xem chủ đề là gì, sau đó tự tin nói một câu bâng quơ để không bị nghi ngờ.
                </p>
              </div>
            </div>
          </div>


          {/* Gameplay flow */}
          <div>
            <h4 className="font-serif font-bold text-[#ffd875] text-sm uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Award size={16} /> Tiến Trình Một Ván Đấu
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                <strong className="text-stone-200">Nhận thẻ:</strong> Mọi người mở điện thoại, xem thẻ bí mật của mình rồi úp thẻ lại.
              </li>
              <li>
                <strong className="text-stone-200">Vòng miêu tả:</strong> Lần lượt từng người nói đúng 1 câu miêu tả từ của mình theo vòng tròn. <em>Tuyệt đối không được nói trực tiếp từ trong thẻ!</em>
              </li>
              <li>
                <strong className="text-stone-200">Tranh luận & Bỏ phiếu:</strong> Cả phòng đếm 1-2-3 và đồng loạt chỉ tay vào người mình nghi ngờ nhất. Người nhận nhiều phiếu nhất bị loại.
              </li>
              <li>
                <strong className="text-stone-200">Cơ hội của Kẻ Không Tên:</strong> Nếu Kẻ Không Tên bị bỏ phiếu loại, người này có quyền <strong>đoán ngay từ của Học Sinh</strong>. Nếu đoán trúng, Kẻ Không Tên lập tức thắng ngược!
              </li>
            </ol>
          </div>

          {/* Win conditions */}
          <div>
            <h4 className="font-serif font-bold text-[#ffd875] text-sm uppercase tracking-wide mb-2 flex items-center gap-1.5">
              🏆 Điều Kiện Chiến Thắng
            </h4>
            <ul className="space-y-1 pl-1">
              <li>✨ <strong className="text-amber-300">Học Sinh:</strong> Thắng khi loại sạch Tử Thần và Kẻ Không Tên.</li>
              <li>🐍 <strong className="text-emerald-300">Tử Thần:</strong> Thắng khi số lượng Tử Thần sống sót bằng số Học Sinh.</li>
              <li>👻 <strong className="text-purple-300">Kẻ Không Tên:</strong> Thắng nếu sống sót đến cuối hoặc đoán trúng từ của Học Sinh khi bị loại.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-[#120d18] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2a1a3e] text-xs text-stone-200 hover:text-white border border-[#c8aa6e]/40"
          >
            Đã Hiểu & Sẵn Sàng Chơi
          </button>
        </div>
      </div>
    </div>
  );
};

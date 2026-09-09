import React, { useState, useEffect, useRef } from "react";
import { 
  Flame, 
  X, 
  Send, 
  CornerDownRight, 
  LogIn, 
  LogOut, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Maximize2 
} from "lucide-react";
import { 
  getFlooFirebase, 
  subscribeToFlooShouts, 
  sendFlooShout, 
  signInHPVN, 
  signOutHPVN, 
  fetchFlooUserProfile, 
  getHouseStyle, 
  type FlooShout, 
  type FlooUserProfile 
} from "../utils/flooFirebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

export const FLOO_DRAWER_EVENT = "hpvn-undercover-open-floo-drawer";
export const FLOO_DRAWER_CLOSE_EVENT = "hpvn-undercover-close-floo-drawer";

export function openFlooDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FLOO_DRAWER_EVENT));
  }
}

export function closeFlooDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FLOO_DRAWER_CLOSE_EVENT));
  }
}

export const FlooChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [shouts, setShouts] = useState<FlooShout[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<FlooUserProfile | null>(null);
  
  // Chat input
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<FlooShout | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Login form in drawer
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Expanded Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen to custom open/close events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener(FLOO_DRAWER_EVENT, handleOpen);
    window.addEventListener(FLOO_DRAWER_CLOSE_EVENT, handleClose);

    return () => {
      window.removeEventListener(FLOO_DRAWER_EVENT, handleOpen);
      window.removeEventListener(FLOO_DRAWER_CLOSE_EVENT, handleClose);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    try {
      const { auth } = getFlooFirebase();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            const profile = await fetchFlooUserProfile(user.uid);
            setUserProfile(profile);
          } catch (e) {
            console.warn("fetchFlooUserProfile error:", e);
          }
        } else {
          setUserProfile(null);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Floo auth init error:", e);
    }
  }, []);

  // Realtime subscription to shouts
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToFlooShouts(
      (newShouts) => {
        setShouts(newShouts);
      },
      (err) => {
        console.error("Floo subscription error:", err);
        setChatError("Lỗi kết nối Mạng Floo. Đang thử lại...");
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouts, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    if (!currentUser) {
      setIsLoginFormOpen(true);
      return;
    }

    setIsSending(true);
    setChatError(null);
    try {
      await sendFlooShout(trimmed, replyTo ? replyTo.id : null);
      setMessage("");
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (err: any) {
      console.error("Error sending shout:", err);
      setChatError(err?.message || "Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = loginAccount.trim();
    if (!acc || !loginPassword) {
      setLoginError("Vui lòng nhập tài khoản và mật khẩu HPVN!");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInHPVN(acc, loginPassword);
      setIsLoginFormOpen(false);
      setLoginAccount("");
      setLoginPassword("");
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err?.message || "Đăng nhập thất bại.";
      if (msg.includes("auth/invalid-credential") || msg.includes("401") || msg.includes("Sai account")) {
        msg = "Sai tài khoản hoặc mật khẩu HPVN.";
      }
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutHPVN();
      setUserProfile(null);
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  };

  const currentHouseStyle = getHouseStyle(userProfile?.house);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/65 z-50 transition-opacity backdrop-blur-xs"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0d0716] border-l border-[#c8aa6e]/40 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#c8aa6e]/30 bg-[#160a24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24113b] border border-[#ffd875]/40 flex items-center justify-center text-lg">
              <Flame className="w-5 h-5 text-[#ffd875] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-title font-bold text-sm sm:text-base text-[#ffd875] tracking-wide">
                  MẠNG FLOO HPVN
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Trực tuyến" />
              </div>
              <p className="text-[10px] text-[#c8aa6e]/80 font-serif">
                Kênh liên lạc phù thủy thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                title="Đăng xuất khỏi Mạng Floo"
                className="p-1.5 rounded-lg bg-[#24113b] hover:bg-red-950/80 border border-[#c8aa6e]/30 hover:border-red-600/50 text-stone-300 hover:text-red-200 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginFormOpen(!isLoginFormOpen)}
                className="px-2.5 py-1 rounded-lg bg-[#ffd875] hover:bg-[#ffe39c] text-[#0d0716] font-serif font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <LogIn size={13} />
                <span>Đăng Nhập</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-[#24113b] hover:bg-[#341854] border border-[#c8aa6e]/30 text-[#ffd875] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* User Status Bar if logged in */}
        {currentUser && userProfile && (
          <div className="px-3.5 py-2 bg-[#12071f] border-b border-[#c8aa6e]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base select-none">{currentHouseStyle.badge}</span>
              <div className="min-w-0">
                <span className="font-serif font-bold text-[#ffd875] truncate block">
                  {userProfile.username}
                </span>
                <span className="text-[10px] text-[#c8aa6e]/80 font-mono">
                  {userProfile.userTag ? `[${userProfile.userTag}] · ` : ""}{currentHouseStyle.name}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-mono flex items-center gap-1">
              <ShieldCheck size={11} /> HPVN
            </span>
          </div>
        )}

        {/* In-drawer HPVN Login Panel */}
        {isLoginFormOpen && !currentUser && (
          <form onSubmit={handleLogin} className="p-3.5 bg-[#170a27] border-b border-[#c8aa6e]/40 space-y-2.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-[#ffd875]">
              <span>Đăng nhập tài khoản hpvn-archive.net:</span>
              <button 
                type="button" 
                onClick={() => setIsLoginFormOpen(false)} 
                className="text-stone-400 hover:text-[#ffd875]"
              >
                <X size={14} />
              </button>
            </div>

            {loginError && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-[11px] flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <input
                type="text"
                value={loginAccount}
                onChange={(e) => setLoginAccount(e.target.value)}
                placeholder="Tài khoản HPVN hoặc Email"
                className="w-full px-3 py-1.5 bg-[#0d0716] border border-[#c8aa6e]/50 rounded-lg text-xs text-[#f5eedb] placeholder-stone-500 focus:outline-none focus:border-[#ffd875]"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-3 py-1.5 bg-[#0d0716] border border-[#c8aa6e]/50 rounded-lg text-xs text-[#f5eedb] placeholder-stone-500 focus:outline-none focus:border-[#ffd875]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2 bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] font-serif font-bold text-xs rounded-lg border border-[#ffd875]/50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn size={13} />
                  <span>Xác Thực Phù Thủy</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Message Feed Container */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {chatError && (
            <div className="p-2 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-serif flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{chatError}</span>
            </div>
          )}

          {shouts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Flame className="w-10 h-10 text-[#ffd875]/40 mb-2 animate-bounce" />
              <p className="font-serif text-xs text-[#c8aa6e]">
                Bếp lửa Mạng Floo đang tĩnh lặng...
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Hãy ném bột Floo và phát biểu thông điệp đầu tiên!
              </p>
            </div>
          ) : (
            shouts.map((shout) => {
              const hStyle = getHouseStyle(shout.house);
              const isMyShout = currentUser && shout.uid === currentUser.uid;

              return (
                <div 
                  key={shout.id} 
                  className={`flex flex-col p-2.5 rounded-xl border transition-colors ${
                    isMyShout 
                      ? "bg-[#200f33] border-[#ffd875]/60" 
                      : `${hStyle.bgColor} ${hStyle.borderColor}`
                  }`}
                >
                  {/* Sender Row */}
                  <div className="flex items-center justify-between gap-1.5 mb-1 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm select-none">{hStyle.badge}</span>
                      <span className="font-serif font-bold text-[#ffd875] truncate">
                        {shout.name}
                      </span>
                      {shout.userTag && (
                        <span className="text-[9px] text-[#c8aa6e] font-mono italic truncate">
                          [{shout.userTag}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {shout.createdAt ? shout.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(shout);
                          inputRef.current?.focus();
                        }}
                        className="text-stone-400 hover:text-[#ffd875] text-[10px] p-0.5 cursor-pointer"
                        title="Trả lời thông điệp này"
                      >
                        <CornerDownRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-xs text-[#f5eedb] font-serif leading-relaxed whitespace-pre-wrap break-words">
                    {shout.message}
                  </div>

                  {/* Optional Image Attachment */}
                  {shout.imageUrl && (
                    <div className="mt-2 relative group max-w-[200px] rounded-lg overflow-hidden border border-[#c8aa6e]/40">
                      <img 
                        src={shout.imageUrl} 
                        alt="Floo Attachment" 
                        className="w-full h-auto object-cover max-h-40 cursor-pointer"
                        onClick={() => setPreviewImage(shout.imageUrl!)}
                      />
                      <button 
                        type="button"
                        onClick={() => setPreviewImage(shout.imageUrl!)}
                        className="absolute bottom-1 right-1 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Indicator */}
        {replyTo && (
          <div className="px-3.5 py-1.5 bg-[#1b0c2c] border-t border-[#c8aa6e]/30 flex items-center justify-between text-[11px] text-[#ffd875]">
            <div className="flex items-center gap-1.5 truncate">
              <CornerDownRight size={12} />
              <span className="truncate">Trả lời: <strong>{replyTo.name}</strong></span>
            </div>
            <button 
              type="button" 
              onClick={() => setReplyTo(null)}
              className="text-stone-400 hover:text-[#ffd875] p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-[#c8aa6e]/30 bg-[#160a24]">
          {currentUser ? (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={replyTo ? `Trả lời ${replyTo.name}...` : "Nói gì đó vào Mạng Floo..."}
                className="flex-1 px-3.5 py-2.5 bg-[#0d0716] border border-[#c8aa6e]/60 rounded-xl text-xs text-[#f5eedb] placeholder-stone-500 focus:outline-none focus:border-[#ffd875]"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#740001] to-[#8e1d13] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] border border-[#ffd875]/50 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
              >
                {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 bg-[#12071f] rounded-xl border border-[#c8aa6e]/40 text-xs">
              <div className="flex items-center gap-1.5 text-[#c8aa6e]">
                <Flame size={14} className="text-[#ffd875]" />
                <span>Đăng nhập HPVN để trò chuyện</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginFormOpen(true)}
                className="px-3 py-1.5 bg-[#ffd875] hover:bg-[#ffe39c] text-[#0d0716] font-serif font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Đăng Nhập
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-[#c8aa6e]">
            <img src={previewImage} alt="Expanded preview" className="w-full h-full object-contain" />
            <button 
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

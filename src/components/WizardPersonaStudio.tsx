import React, { useState, useEffect } from 'react';
import { Dices, ShieldCheck, LogIn, LogOut, User, Lock, AlertCircle, Loader2, Castle, UserCircle2, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { 
  getFlooFirebase, 
  signInHPVN, 
  signOutHPVN, 
  fetchFlooUserProfile, 
  type FlooUserProfile 
} from '../utils/flooFirebase';
import { onAuthStateChanged } from 'firebase/auth';

export type HogwartsHouse = 'GRYFFINDOR' | 'SLYTHERIN' | 'RAVENCLAW' | 'HUFFLEPUFF';

interface HouseData {
  id: HogwartsHouse;
  name: string;
  crestEmoji: string;
  accentColor: string;
  gradientRing: string;
  bgGlow: string;
  characters: string[];
}

export const HOUSES: HouseData[] = [
  {
    id: 'GRYFFINDOR',
    name: 'Gryffindor',
    crestEmoji: '🦁',
    accentColor: '#ffd875',
    gradientRing: 'from-[#740001] via-[#c8aa6e] to-[#ffd875]',
    bgGlow: 'rgba(116, 0, 1, 0.25)',
    characters: ['Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore', 'Sirius Black', 'Minerva McGonagall'],
  },
  {
    id: 'SLYTHERIN',
    name: 'Slytherin',
    crestEmoji: '🐍',
    accentColor: '#52b788',
    gradientRing: 'from-[#1a472a] via-[#2d6a4f] to-[#52b788]',
    bgGlow: 'rgba(26, 71, 42, 0.3)',
    characters: ['Draco Malfoy', 'Severus Snape', 'Bellatrix Lestrange', 'Tom Riddle', 'Lucius Malfoy', 'Regulus Black'],
  },
  {
    id: 'RAVENCLAW',
    name: 'Ravenclaw',
    crestEmoji: '🦅',
    accentColor: '#60a5fa',
    gradientRing: 'from-[#0e1a40] via-[#1d4ed8] to-[#60a5fa]',
    bgGlow: 'rgba(14, 26, 64, 0.3)',
    characters: ['Luna Lovegood', 'Cho Chang', 'Filius Flitwick', 'Garrick Ollivander', 'Rowena Ravenclaw'],
  },
  {
    id: 'HUFFLEPUFF',
    name: 'Hufflepuff',
    crestEmoji: '🦡',
    accentColor: '#fcd34d',
    gradientRing: 'from-[#b8860b] via-[#d97706] to-[#fcd34d]',
    bgGlow: 'rgba(184, 134, 11, 0.25)',
    characters: ['Cedric Diggory', 'Newt Scamander', 'Nymphadora Tonks', 'Pomona Sprout', 'Helga Hufflepuff'],
  },
];

interface WizardPersonaStudioProps {
  playerName: string;
  onNameChange: (name: string) => void;
  selectedHouse: HogwartsHouse;
  onHouseChange: (house: HogwartsHouse) => void;
  userTag?: string;
  onUserTagChange?: (tag: string | undefined) => void;
  hpvnUid?: string;
  onHpvnUidChange?: (uid: string | undefined) => void;
}

export const WizardPersonaStudio: React.FC<WizardPersonaStudioProps> = ({
  playerName,
  onNameChange,
  selectedHouse,
  onHouseChange,
  userTag: _userTag,
  onUserTagChange,
  hpvnUid: _hpvnUid,
  onHpvnUidChange,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [authMode, setAuthMode] = useState<'hpvn' | 'guest'>('hpvn');
  const [currentUserProfile, setCurrentUserProfile] = useState<FlooUserProfile | null>(null);

  // Login inputs
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Listen to Firebase Auth state for auto-session detection
  useEffect(() => {
    let isMounted = true;
    try {
      const { auth } = getFlooFirebase();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        if (user) {
          try {
            const profile = await fetchFlooUserProfile(user.uid);
            if (isMounted) {
              const activeProf = profile || {
                uid: user.uid,
                username: user.displayName || user.email?.split('@')[0] || 'Phù thủy HPVN',
                house: 'NONE',
              };
              setCurrentUserProfile(activeProf);

              // Auto-sync into player persona
              if (activeProf.username) {
                onNameChange(activeProf.username);
                try {
                  localStorage.setItem('hogw_player_name', activeProf.username);
                } catch {}
              }

              // Auto-sync house if valid
              const normalizedHouse = (activeProf.house || '').toUpperCase();
              if (['GRYFFINDOR', 'SLYTHERIN', 'RAVENCLAW', 'HUFFLEPUFF'].includes(normalizedHouse)) {
                onHouseChange(normalizedHouse as HogwartsHouse);
                try {
                  localStorage.setItem('hogw_player_house', normalizedHouse);
                } catch {}
              }

              if (onUserTagChange) onUserTagChange(activeProf.userTag);
              if (onHpvnUidChange) onHpvnUidChange(activeProf.uid);
            }
          } catch (e) {
            console.warn('[WizardStudio] Profile load warning:', e);
          }
        } else {
          if (isMounted) {
            setCurrentUserProfile(null);
            if (onUserTagChange) onUserTagChange(undefined);
            if (onHpvnUidChange) onHpvnUidChange(undefined);
          }
        }
      });
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn('[WizardStudio] Auth init warning:', e);
    }
  }, []);

  const handleLoginHPVN = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = account.trim();
    if (!acc || !password) {
      setLoginError('Vui lòng nhập tài khoản và mật khẩu HPVN!');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const user = await signInHPVN(acc, password);
      const profile = await fetchFlooUserProfile(user.uid);
      const activeProf = profile || {
        uid: user.uid,
        username: user.displayName || acc,
        house: 'NONE',
      };
      setCurrentUserProfile(activeProf);

      if (activeProf.username) {
        onNameChange(activeProf.username);
        try {
          localStorage.setItem('hogw_player_name', activeProf.username);
        } catch {}
      }

      const normalizedHouse = (activeProf.house || '').toUpperCase();
      if (['GRYFFINDOR', 'SLYTHERIN', 'RAVENCLAW', 'HUFFLEPUFF'].includes(normalizedHouse)) {
        onHouseChange(normalizedHouse as HogwartsHouse);
        try {
          localStorage.setItem('hogw_player_house', normalizedHouse);
        } catch {}
      }

      if (onUserTagChange) onUserTagChange(activeProf.userTag);
      if (onHpvnUidChange) onHpvnUidChange(activeProf.uid);

      sound.playVictoryFanfare();
      setPassword('');
    } catch (err: any) {
      console.error('[WizardStudio] Login error:', err);
      let msg = err?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      if (msg.includes('auth/invalid-credential') || msg.includes('401') || msg.includes('Sai account')) {
        msg = 'Sai tài khoản hoặc mật khẩu HPVN. Vui lòng kiểm tra lại!';
      }
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutHPVN();
      setCurrentUserProfile(null);
      if (onUserTagChange) onUserTagChange(undefined);
      if (onHpvnUidChange) onHpvnUidChange(undefined);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  };

  const currentHouse = HOUSES.find((h) => h.id === selectedHouse) || HOUSES[0];

  const handleRollRandomCharacter = () => {
    setIsRolling(true);
    sound.playMagicCardFlip();

    const charPool = currentHouse.characters;
    const nextChar = charPool[Math.floor(Math.random() * charPool.length)];
    onNameChange(nextChar);
    try {
      localStorage.setItem('hogw_player_name', nextChar);
    } catch {}

    setTimeout(() => setIsRolling(false), 400);
  };

  const handleSelectHouse = (houseId: HogwartsHouse) => {
    onHouseChange(houseId);
    try {
      localStorage.setItem('hogw_player_house', houseId);
    } catch {}
    sound.playButtonChime();

    const targetHouse = HOUSES.find((h) => h.id === houseId);
    if (targetHouse && (!playerName.trim() || HOUSES.some((h) => h.characters.includes(playerName)))) {
      const char = targetHouse.characters[0];
      onNameChange(char);
      try {
        localStorage.setItem('hogw_player_name', char);
      } catch {}
    }
  };

  return (
    <div className="w-full glass-panel-gold rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all duration-500">
      {/* Dynamic house colored background aura */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: currentHouse.bgGlow }}
      />

      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-[#c8aa6e]/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl select-none">{currentHouse.crestEmoji}</span>
          <div>
            <h3 className="font-title text-sm sm:text-base gold-gradient-text tracking-wide uppercase">
              Phòng Thiết Lập Danh Xưng Phù Thủy
            </h3>
            <p className="text-[11px] text-[#c8aa6e]/80">
              Đồng bộ tài khoản HPVN hoặc chọn phong cách nhân vật Hogwarts
            </p>
          </div>
        </div>

        {/* Guest Dice Randomizer (only in guest mode) */}
        {!currentUserProfile && authMode === 'guest' && (
          <button
            type="button"
            onClick={handleRollRandomCharacter}
            title="Tung xúc xắc để chọn ngẫu nhiên nhân vật"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#28163f] hover:bg-[#3a205a] border border-[#ffd875]/40 text-[#ffd875] text-xs font-serif font-bold transition-all active:scale-95 cursor-pointer ${
              isRolling ? 'animate-spin' : ''
            }`}
          >
            <Dices size={15} />
            <span className="hidden xs:inline">Đổi Tên</span>
          </button>
        )}
      </div>

      {/* Profile Section: Authenticated Member vs Dual-Mode Selector */}
      {currentUserProfile ? (
        /* Authenticated HPVN Member Card */
        <div className="p-4 rounded-2xl bg-[#140824]/90 border-2 border-[#ffd875]/60 mb-4 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentHouse.gradientRing} p-[2px] shrink-0`}>
                <div className="w-full h-full rounded-[14px] bg-[#0d0716] flex items-center justify-center text-2xl select-none">
                  {currentHouse.crestEmoji}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-base text-[#ffd875] truncate">
                    {currentUserProfile.username}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-[#28163f] text-[#ffd875] border border-[#ffd875]/40">
                    Nhà {currentHouse.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-[#c8aa6e] font-mono truncate">
                    {currentUserProfile.userTag ? `[${currentUserProfile.userTag}] · ` : ''}Tài khoản HPVN đã xác thực
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl bg-[#28163f] hover:bg-red-950/80 border border-[#c8aa6e]/40 hover:border-red-600 text-stone-300 hover:text-red-200 text-xs font-serif flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              title="Đăng xuất khỏi tài khoản HPVN này"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Đổi TK</span>
            </button>
          </div>
        </div>
      ) : (
        /* Unauthenticated Dual-Mode Tabs */
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#10071a] rounded-xl border border-[#c8aa6e]/30">
            <button
              type="button"
              onClick={() => { setAuthMode('hpvn'); setLoginError(null); }}
              className={`py-2 px-2 text-xs font-serif font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'hpvn'
                  ? 'bg-[#28163f] text-[#ffd875] border border-[#ffd875]/50'
                  : 'text-stone-400 hover:text-[#ffd875]'
              }`}
            >
              <Castle size={14} className="text-[#ffd875]" />
              <span>Tài Khoản HPVN</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('guest'); setLoginError(null); }}
              className={`py-2 px-2 text-xs font-serif font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'guest'
                  ? 'bg-[#28163f] text-[#ffd875] border border-[#ffd875]/50'
                  : 'text-stone-400 hover:text-[#ffd875]'
              }`}
            >
              <UserCircle2 size={14} />
              <span>Khách Vãng Lai</span>
            </button>
          </div>

          {/* Tab 1: HPVN Login Form */}
          {authMode === 'hpvn' && (
            <form onSubmit={handleLoginHPVN} className="p-4 bg-[#10071a]/90 rounded-2xl border border-[#c8aa6e]/40 space-y-3">
              <div className="text-xs text-[#e0cfab] font-serif leading-relaxed flex items-start gap-1.5">
                <Sparkles size={14} className="text-[#ffd875] shrink-0 mt-0.5" />
                <span>
                  Đăng nhập tài khoản <strong>hpvn-archive.net</strong> để tự động đồng bộ <strong>Tên, Nhà Hogwarts ({currentHouse.crestEmoji}) và Danh hiệu</strong> vào bàn chơi.
                </span>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-[#ffd875] mb-1 font-bold">
                    Tài Khoản HPVN (hoặc Email)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="Ví dụ: harrypotter, albus..."
                      className="w-full px-3.5 py-2.5 bg-[#0d0716] border border-[#c8aa6e]/50 rounded-xl text-xs text-[#f5eedb] placeholder-stone-500 focus:outline-none focus:border-[#ffd875]"
                      required
                    />
                    <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8aa6e] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-[#ffd875] mb-1 font-bold">
                    Mật Khẩu HPVN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#0d0716] border border-[#c8aa6e]/50 rounded-xl text-xs text-[#f5eedb] placeholder-stone-500 focus:outline-none focus:border-[#ffd875]"
                      required
                    />
                    <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8aa6e] pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] font-serif font-bold text-xs tracking-wider border border-[#ffd875]/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>ĐANG XÁC THỰC VỚI HOGWARTS...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>XÁC THỰC PHÙ THỦY HPVN</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Guest Mode House Picker & Custom Name */}
          {authMode === 'guest' && (
            <>
              {/* 4 Hogwarts Houses Pill Selector */}
              <div>
                <label className="text-[10px] text-[#c8aa6e] uppercase tracking-widest font-title block mb-2">
                  Chọn Nhà Hogwarts của bạn:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HOUSES.map((house) => {
                    const isSelected = house.id === selectedHouse;
                    return (
                      <button
                        key={house.id}
                        type="button"
                        onClick={() => handleSelectHouse(house.id)}
                        className={`py-2.5 px-3 min-h-[44px] rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#2a1740] to-[#1c102b] border-[#ffd875] ring-1 ring-[#ffd875]/70 text-[#fff2be]'
                            : 'bg-[#10071a]/80 border-stone-800/80 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                        }`}
                      >
                        <span className="text-lg">{house.crestEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif font-bold text-xs truncate">
                            {house.name}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#ffd875]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Guest Name Input */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0a0512]/90 p-4 rounded-2xl border border-stone-800">
                <div className="relative group cursor-pointer" onClick={handleRollRandomCharacter}>
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${currentHouse.gradientRing} p-[2px] transition-transform group-hover:scale-105 flex-shrink-0`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-[#120a1c] flex items-center justify-center font-title font-black text-2xl text-[#ffd875] select-none">
                      {playerName ? playerName.charAt(0).toUpperCase() : '🧙'}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#120a1c] border border-[#ffd875]/60 text-[10px] text-[#ffd875]">
                    {currentHouse.crestEmoji}
                  </div>
                </div>

                <div className="flex-1 w-full min-w-0">
                  <label className="text-[11px] font-serif font-bold text-[#ffd875] uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span>Tên Hiển Thị Trong Trò Chơi</span>
                    <span className="text-[10px] text-stone-400 font-sans font-normal">Tối đa 20 ký tự</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => {
                        onNameChange(e.target.value);
                        try {
                          localStorage.setItem('hogw_player_name', e.target.value);
                        } catch {}
                      }}
                      maxLength={20}
                      placeholder="Nhập tên của bạn..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0e0717] border-2 border-stone-700 text-sm font-serif font-bold text-[#f3efe6] focus:outline-none focus:border-[#ffd875] transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm select-none opacity-80 pointer-events-none">
                      🪄
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-stone-400 font-serif mr-1">Gợi ý Nhà {currentHouse.name}:</span>
                    {currentHouse.characters.slice(0, 4).map((charName) => (
                      <button
                        key={charName}
                        type="button"
                        onClick={() => {
                          onNameChange(charName);
                          try {
                            localStorage.setItem('hogw_player_name', charName);
                          } catch {}
                          sound.playButtonChime();
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#1f1230] hover:bg-[#2e1a47] text-[#ffd875] text-[10px] font-serif border border-[#c8aa6e]/30 hover:border-[#ffd875] transition-all cursor-pointer active:scale-95"
                      >
                        {charName.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

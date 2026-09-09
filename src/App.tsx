import { useState, useEffect, useRef } from 'react';
import type { Player, RoomConfig, RoomState, WordPair, GameStatus, PeerMessage, HostRoleMode } from './types';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { SecretCard } from './components/SecretCard';
import { SpeakingOrderBanner } from './components/SpeakingOrderBanner';
import { HostBoard } from './components/HostBoard';
import { CustomWordModal } from './components/CustomWordModal';
import { PassAndPlayModal } from './components/PassAndPlayModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { NetworkManager } from './utils/peerNetwork';
import { selectRandomWordPair } from './data/words';
import { assignOptimalRoles, type PlayerRoleStats } from './utils/roleAssignment';
import { createAiPlayer } from './data/aiBots';
import { sound } from './utils/audio';
import { DetectiveNotepad } from './components/DetectiveNotepad';
import { BackgroundEffects } from './components/BackgroundEffects';
import { WizardPersonaStudio, type HogwartsHouse } from './components/WizardPersonaStudio';
import { RunicCodeInput } from './components/RunicCodeInput';
import confetti from 'canvas-confetti';
import { Crown, LogIn, AlertCircle, LogOut, Sparkles, ArrowRight, Loader2, Flame } from 'lucide-react';
import { fetchRoomFromDatabase, closeRoomInDatabase } from './services/dbSync';
import { FlooChatDrawer, openFlooDrawer } from './components/FlooChatDrawer';

function evaluateWinCondition(
  players: Player[],
  hostRole: HostRoleMode
): 'STUDENT' | 'DEATH_EATER' | null {
  const activePlaying = players.filter(
    (p) => !(p.isHost && hostRole === 'GAME_MASTER') && !p.isEliminated && p.role
  );
  const students = activePlaying.filter((p) => p.role === 'STUDENT');
  const enemies = activePlaying.filter((p) => p.role === 'DEATH_EATER' || p.role === 'MR_WHITE');

  if (enemies.length === 0 && students.length > 0) {
    return 'STUDENT';
  }
  if (enemies.length >= students.length && enemies.length > 0) {
    return 'DEATH_EATER';
  }
  return null;
}

const INITIAL_CONFIG: RoomConfig = {
  hostRole: 'PLAYER',
  undercoverCount: 1,
  mrWhiteCount: 0,
  selectedCategories: ['ALL'],
  customPairs: [],
};

export const HOST_DISCONNECT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const SESSION_KEY = 'hogw_active_session';

interface SavedSession {
  roomCode: string;
  isHost: boolean;
  player: Player;
  gameStatus?: GameStatus;
  roundNumber?: number;
  timestamp?: number;
  lastActiveTimestamp?: number;
  hostDisconnectedAt?: number | null;
}

const saveLocalSession = (session: Partial<SavedSession>) => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    const existing: SavedSession | null = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    const data: SavedSession = {
      roomCode: '',
      isHost: false,
      player: {} as Player,
      timestamp: existing?.timestamp || now,
      lastActiveTimestamp: now,
      ...existing,
      ...session,
    };
    if ('hostDisconnectedAt' in session) {
      data.hostDisconnectedAt = session.hostDisconnectedAt;
    }
    const serialized = JSON.stringify(data);
    // Tab-level isolation prevents desktop multi-tab conflicts
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.setItem(SESSION_KEY, serialized);
  } catch (e) {
    console.warn('[Session] Failed to save session:', e);
  }
};

const getLocalSession = (): SavedSession | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: SavedSession = JSON.parse(raw);
    const now = Date.now();

    // 1. If host was disconnected for > 10 minutes, session is expired for everyone
    if (session.hostDisconnectedAt && now - session.hostDisconnectedAt > HOST_DISCONNECT_EXPIRY_MS) {
      console.log('[Session] Expired: Host has been disconnected for > 10 minutes.');
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // 2. For Host: if host closed tab/disconnected for > 10 minutes
    if (session.isHost && session.lastActiveTimestamp && now - session.lastActiveTimestamp > HOST_DISCONNECT_EXPIRY_MS) {
      console.log('[Session] Expired: Host tab closed/inactive for > 10 minutes.');
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // 3. Fallback: Maximum total session duration (12 hours)
    if (session.timestamp && now - session.timestamp > 12 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch (e) {
    return null;
  }
};

const clearLocalSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore
  }
};

export function App() {
  // Navigation & Game State
  const [gameStatus, setGameStatus] = useState<'WELCOME' | GameStatus>('WELCOME');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');

  // Player Profile
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('hogw_player_name') || 'Harry Potter';
  });
  const [selectedHouse, setSelectedHouse] = useState<HogwartsHouse>(() => {
    return (localStorage.getItem('hogw_player_house') as HogwartsHouse) || 'GRYFFINDOR';
  });
  const [userTag, setUserTag] = useState<string | undefined>(() => {
    return localStorage.getItem('hogw_player_usertag') || undefined;
  });
  const [hpvnUid, setHpvnUid] = useState<string | undefined>(() => {
    return localStorage.getItem('hogw_player_hpvn_uid') || undefined;
  });

  const handleUserTagChange = (tag: string | undefined) => {
    setUserTag(tag);
    try {
      if (tag) localStorage.setItem('hogw_player_usertag', tag);
      else localStorage.removeItem('hogw_player_usertag');
    } catch {}
  };

  const handleHpvnUidChange = (uid: string | undefined) => {
    setHpvnUid(uid);
    try {
      if (uid) localStorage.setItem('hogw_player_hpvn_uid', uid);
      else localStorage.removeItem('hogw_player_hpvn_uid');
    } catch {}
  };

  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<RoomConfig>(INITIAL_CONFIG);
  const [currentPair, setCurrentPair] = useState<WordPair | undefined>(undefined);
  const [roundNumber, setRoundNumber] = useState(1);
  const [usedPairIds, setUsedPairIds] = useState<string[]>([]);

  // Network & UI
  const [connStatus, setConnStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Host disconnect tracking (10-minute timeout before session wiped)
  const [hostDisconnectedAt, setHostDisconnectedAt] = useState<number | null>(() => {
    const sess = getLocalSession();
    return sess?.hostDisconnectedAt || null;
  });
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);

  // Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isCustomWordsOpen, setIsCustomWordsOpen] = useState(false);
  const [isPassAndPlayOpen, setIsPassAndPlayOpen] = useState(false);

  // Turn Spotlight, Win Condition & Mr. White Last Guess
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | undefined>();
  const [winner, setWinner] = useState<'STUDENT' | 'DEATH_EATER' | 'MR_WHITE' | null>(null);
  const [mrWhiteGuessInput, setMrWhiteGuessInput] = useState('');
  const [mrWhiteHasGuessed, setMrWhiteHasGuessed] = useState(false);
  const [hostMrWhitePrompt, setHostMrWhitePrompt] = useState<{
    playerId: string;
    playerName: string;
    guess: string;
  } | null>(null);

  // Network Manager Ref
  const netRef = useRef<NetworkManager | null>(null);
  const pendingJoinRef = useRef<{ client: Player; code: string } | null>(null);
  const gameStatusRef = useRef(gameStatus);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Player role history tracker across rounds (for fair distribution & anti-streak)
  const roleHistoryRef = useRef<Map<string, PlayerRoleStats>>(new Map());

  // Kicked players tracker for Host to block rejoining
  const kickedPlayerIdsRef = useRef<Set<string>>(new Set());

  // Ghost player tracker: timers for players whose presence dropped in LOBBY (10s grace period before auto-eviction)
  const lobbyDisconnectTimersRef = useRef<Map<string, any>>(new Map());
  const [offlinePlayerIds, setOfflinePlayerIds] = useState<string[]>([]);

  // Helper for stable session player IDs
  const getOrCreatePlayerId = (isHost: boolean): string => {
    const key = isHost ? 'hogw_host_id' : 'hogw_tab_player_id';
    let id: string | null = null;
    try {
      // Prioritize sessionStorage so each tab on desktop has its own independent player ID!
      id = sessionStorage.getItem(key);
      if (!id) {
        // Fallback to localStorage client ID if single tab, or generate fresh
        id = localStorage.getItem('hogw_client_id');
        if (!id || !isHost) {
          id = `${isHost ? 'host' : 'client'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        }
        sessionStorage.setItem(key, id);
        localStorage.setItem(isHost ? 'hogw_host_id' : 'hogw_client_id', id);
      }
    } catch {
      id = `${isHost ? 'host' : 'client'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    return id;
  };

  // Init network manager
  useEffect(() => {
    const net = new NetworkManager();
    netRef.current = net;

    // Check URL parameters for room code invite link
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setInputRoomCode(roomParam.toUpperCase());
    }

    return () => {
      net.destroy();
    };
  }, []);

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('hogw_player_name', playerName);
  }, [playerName]);

  // Centralized robust exit & cleanup handler (used for Leaving, Kicking, Room Closed, or Timeout)
  const cleanupAndExitToWelcome = (noticeMessage?: string, wasKickedFromRoom?: string) => {
    // 1. Remove ?room=... from browser address bar immediately so F5 stays on Welcome
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // 2. Remember kicked room in sessionStorage to prevent accidental auto-rejoin
    if (wasKickedFromRoom) {
      try {
        sessionStorage.setItem('hogw_kicked_room', wasKickedFromRoom);
      } catch {}
    }

    // 3. Clear storage and session
    clearLocalSession();
    roleHistoryRef.current.clear();
    lobbyDisconnectTimersRef.current.forEach((t) => clearTimeout(t));
    lobbyDisconnectTimersRef.current.clear();
    setOfflinePlayerIds([]);

    // 4. Destroy network connection cleanly and create a fresh manager
    if (netRef.current) {
      try {
        netRef.current.destroy();
      } catch (e) {
        console.warn('[App] Error destroying network manager:', e);
      }
      const newNet = new NetworkManager();
      netRef.current = newNet;
    }

    // 5. Reset all states to pristine Welcome screen
    setGameStatus('WELCOME');
    setMyPlayer(null);
    setPlayers([]);
    setRoomCode('');
    setInputRoomCode('');
    setCurrentPair(undefined);
    setConnStatus('IDLE');
    setHostDisconnectedAt(null);
    setDisconnectCountdown(null);

    if (noticeMessage) {
      setErrorMsg(noticeMessage);
      sound.playDarkReveal();
    } else {
      sound.playButtonChime();
    }
  };

  // Handle incoming messages
  const handleNetworkMessage = (msg: PeerMessage) => {
    console.log('[App] Received PeerMessage:', msg.type, msg.payload);

    switch (msg.type) {
      case 'JOIN_REQUEST': {
        // Host receives a join request from a player
        if (!myPlayer?.isHost) return;
        const incomingPlayer = msg.payload as Player;

        // Block kicked players from rejoining
        if (kickedPlayerIdsRef.current.has(incomingPlayer.id)) {
          console.log(`[Host] Rejecting join request from kicked player: ${incomingPlayer.name}`);
          netRef.current?.broadcast({
            type: 'KICK_PLAYER',
            senderId: myPlayer.id,
            payload: { playerId: incomingPlayer.id },
          });
          return;
        }

        // If an auto-eviction timer was active for this player, cancel it immediately!
        if (lobbyDisconnectTimersRef.current.has(incomingPlayer.id)) {
          clearTimeout(lobbyDisconnectTimersRef.current.get(incomingPlayer.id));
          lobbyDisconnectTimersRef.current.delete(incomingPlayer.id);
          setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
        }

        setPlayers((prev) => {
          // Check if player with same ID or same Name already exists
          const existingIndex = prev.findIndex(
            (p) => p.id === incomingPlayer.id
          );

          let updated: Player[];

          if (existingIndex !== -1) {
            // RECONNECT: Merge with existing player without adding duplicate!
            const existing = prev[existingIndex];
            console.log(`[Host] Player reconnecting: ${incomingPlayer.name} (old id: ${existing.id}, new id: ${incomingPlayer.id})`);

            if (existing.id !== incomingPlayer.id && lobbyDisconnectTimersRef.current.has(existing.id)) {
              clearTimeout(lobbyDisconnectTimersRef.current.get(existing.id));
              lobbyDisconnectTimersRef.current.delete(existing.id);
            }

            const merged: Player = {
              ...existing,
              id: incomingPlayer.id, // Update to active connection ID
              name: incomingPlayer.name,
              house: incomingPlayer.house || existing.house,
              userTag: incomingPlayer.userTag || existing.userTag,
              hpvnUid: incomingPlayer.hpvnUid || existing.hpvnUid,
            };

            updated = [...prev];
            updated[existingIndex] = merged;

            // If game is currently PLAYING, immediately re-send their secret card!
            if (merged.role) {
              setTimeout(() => {
                netRef.current?.sendSecretCard(merged.id, {
                  role: merged.role!,
                  word: merged.word || null,
                  hint: currentPair?.hint,
                  speakingOrder: merged.speakingOrder,
                });
              }, 150);
            }
          } else {
            // NEW PLAYER
            if (prev.length >= 10) return prev;
            updated = [...prev, incomingPlayer];
          }

          // Host broadcasts updated room state
          if (netRef.current) {
            netRef.current.broadcastRoomState({
              roomCode,
              hostId: myPlayer.id,
              status: gameStatus === 'WELCOME' ? 'LOBBY' : (gameStatus as GameStatus),
              players: updated,
              config,
              roundNumber,
            });
          }

          return updated;
        });

        sound.playButtonChime();
        break;
      }

      case 'PLAYER_LEFT': {
        if (!myPlayer?.isHost) return;
        const leftPlayerId = msg.payload?.playerId || msg.senderId;
        console.log('[Host] Player explicitly left:', leftPlayerId);

        if (lobbyDisconnectTimersRef.current.has(leftPlayerId)) {
          clearTimeout(lobbyDisconnectTimersRef.current.get(leftPlayerId));
          lobbyDisconnectTimersRef.current.delete(leftPlayerId);
          setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
        }

        setPlayers((prev) => {
          const updated = prev.filter((p) => p.id !== leftPlayerId);
          if (netRef.current) {
            netRef.current.broadcastRoomState({
              roomCode,
              hostId: myPlayer.id,
              status: (gameStatus === 'WELCOME' ? 'LOBBY' : gameStatus) as GameStatus,
              players: updated,
              config,
              roundNumber,
            });
          }
          return updated;
        });
        break;
      }

      case 'RENAME_PLAYER': {
        if (!myPlayer?.isHost) return;
        const { playerId, newName } = msg.payload || {};
        if (!playerId || !newName || typeof newName !== 'string') return;
        const trimmed = newName.trim().slice(0, 20);
        if (!trimmed) return;

        console.log(`[Host] Renaming player ${playerId} to: "${trimmed}"`);

        setPlayers((prev) => {
          const updated = prev.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p));
          if (netRef.current) {
            netRef.current.broadcastRoomState({
              roomCode,
              hostId: myPlayer.id,
              status: (gameStatus === 'WELCOME' ? 'LOBBY' : gameStatus) as GameStatus,
              players: updated,
              config,
              roundNumber,
            });
          }
          return updated;
        });
        break;
      }

      case 'ROOM_STATE_SYNC': {
        const state = msg.payload as RoomState;

        // If client is in pending join state for this room, accept it and transition out of WELCOME!
        const isPendingThisRoom = pendingJoinRef.current && pendingJoinRef.current.code === state.roomCode;

        // If client is not currently in a room, has no player, and is not pending join for this room, ignore!
        if ((!myPlayer && !isPendingThisRoom) || (gameStatus === 'WELCOME' && !isPendingThisRoom)) {
          return;
        }

        const effectivePlayer = myPlayer || pendingJoinRef.current?.client;
        if (isPendingThisRoom && pendingJoinRef.current) {
          setMyPlayer(pendingJoinRef.current.client);
          setRoomCode(pendingJoinRef.current.code);
          setConnStatus('CONNECTED');
          saveLocalSession({
            roomCode: pendingJoinRef.current.code,
            isHost: false,
            player: pendingJoinRef.current.client,
            gameStatus: state.status,
            hostDisconnectedAt: null,
          });
        }

        // RESILIENT RECOVERY GUARD: If non-host player is missing from received room roster, re-request join instead of self-kicking!
        // True kicks are handled explicitly via the KICK_PLAYER broadcast event.
        if (effectivePlayer && !effectivePlayer.isHost) {
          const isStillInRoom = state.players.some((p) => p.id === effectivePlayer.id);
          if (!isStillInRoom) {
            console.log('[Client] Missing from received ROOM_STATE_SYNC roster. Auto-requesting re-sync/rejoin from Host...');
            netRef.current?.sendToHost({
              type: 'JOIN_REQUEST',
              senderId: effectivePlayer.id,
              payload: effectivePlayer,
            });
            // If the game is already in progress, keep our player in the local roster so the screen does not blank out
            if (state.status !== 'LOBBY') {
              state.players = [...state.players, effectivePlayer];
            }
          }
        }

        if (hostDisconnectedAt) {
          setHostDisconnectedAt(null);
          setDisconnectCountdown(null);
          const current = getLocalSession();
          if (current) {
            saveLocalSession({
              ...current,
              hostDisconnectedAt: null,
            });
          }
        }
        setPlayers(state.players);
        setConfig(state.config);
        setRoundNumber(state.roundNumber);
        setGameStatus(state.status);
        if (state.currentPair) {
          setCurrentPair(state.currentPair);
        }
        if (state.currentSpeakerId !== undefined) {
          setCurrentSpeakerId(state.currentSpeakerId);
        }
        if (state.winner !== undefined) {
          setWinner(state.winner);
        }

        // Sync player's own speakingOrder if received in state.players
        if (myPlayer) {
          const syncSelf = state.players.find((p) => p.id === myPlayer.id);
          if (syncSelf && syncSelf.speakingOrder !== undefined && syncSelf.speakingOrder !== myPlayer.speakingOrder) {
            setMyPlayer((prev) => (prev ? { ...prev, speakingOrder: syncSelf.speakingOrder } : null));
          }
        }

        // Sync local session with latest status
        const current = getLocalSession();
        if (current) {
          saveLocalSession({
            ...current,
            gameStatus: state.status,
            roundNumber: state.roundNumber,
          });
        }
        break;
      }

      case 'ASSIGN_SECRET_CARD': {
        // Unicast card assignment for this player
        const payload = msg.payload;
        if (myPlayer && payload.targetPlayerId === myPlayer.id) {
          const updatedPlayer: Player = {
            ...myPlayer,
            role: payload.role,
            word: payload.word,
            speakingOrder: payload.speakingOrder ?? myPlayer.speakingOrder,
          };
          setMyPlayer(updatedPlayer);

          // Persist card into local session so tab switching or phone sleep never loses it
          const current = getLocalSession();
          if (current) {
            saveLocalSession({
              ...current,
              player: updatedPlayer,
              gameStatus: 'PLAYING',
            });
          }

          if (payload.role === 'DEATH_EATER') {
            sound.playDarkReveal();
          } else {
            sound.playMagicCardFlip();
          }
        }
        break;
      }

      case 'UPDATE_SPEAKER_TURN': {
        const { speakerId } = msg.payload || {};
        if (speakerId) {
          setCurrentSpeakerId(speakerId);
        }
        break;
      }

      case 'MR_WHITE_GUESS': {
        if (!myPlayer?.isHost) return;
        const { playerId, guess } = msg.payload || {};
        const guessingPlayer = players.find((p) => p.id === playerId);
        if (guessingPlayer && guess) {
          setHostMrWhitePrompt({
            playerId,
            playerName: guessingPlayer.name,
            guess: String(guess).trim(),
          });
          sound.playDarkReveal();
        }
        break;
      }

      case 'REVEAL_ALL_CARDS': {
        setGameStatus('REVEALED');
        if (msg.payload?.currentPair) {
          setCurrentPair(msg.payload.currentPair);
        }
        if (msg.payload?.players) {
          setPlayers(msg.payload.players);
        }
        const current = getLocalSession();
        if (current) {
          saveLocalSession({
            ...current,
            gameStatus: 'REVEALED',
          });
        }
        sound.playVictoryFanfare();
        break;
      }

      case 'KICK_PLAYER': {
        if (myPlayer && msg.payload?.playerId === myPlayer.id) {
          console.log('[Client] Received KICK_PLAYER from host.');
          cleanupAndExitToWelcome('Bạn đã bị chủ phòng mời ra khỏi phòng.', roomCode);
        }
        break;
      }

      case 'HOST_DISCONNECTED': {
        const at = msg.payload?.disconnectedAt || Date.now();
        console.log('[App] Host disconnected at:', new Date(at).toLocaleTimeString());
        setHostDisconnectedAt(at);
        const current = getLocalSession();
        if (current) {
          saveLocalSession({
            ...current,
            hostDisconnectedAt: at,
          });
        }
        break;
      }

      case 'HOST_RECONNECTED': {
        console.log('[App] Host reconnected.');
        setHostDisconnectedAt(null);
        setDisconnectCountdown(null);
        const current = getLocalSession();
        if (current) {
          saveLocalSession({
            ...current,
            hostDisconnectedAt: null,
          });
        }
        
        // Host reloaded, we need to announce our presence again so we reappear in their Lobby
        if (myPlayer && !myPlayer.isHost && gameStatus === 'LOBBY') {
          netRef.current?.sendToHost({
            type: 'JOIN_REQUEST',
            senderId: myPlayer.id,
            payload: myPlayer,
          });
        }
        break;
      }

      case 'ROOM_CLOSED': {
        const reason = msg.payload?.message || 'Chủ phòng đã rời phòng hoặc kết thúc phiên chơi. Bàn chơi đã tự động giải tán!';
        cleanupAndExitToWelcome(reason);
        break;
      }
    }
  };

  // Setup message listener on manager
  useEffect(() => {
    if (netRef.current) {
      netRef.current.onMessageReceived = handleNetworkMessage;
      netRef.current.onConnectionStatusChange = (status, err) => {
        setConnStatus(status === 'DISCONNECTED' ? 'IDLE' : status);
        if ((status === 'ERROR' || status === 'DISCONNECTED') && err) {
          setErrorMsg(err);
        } else if (status === 'CONNECTED') {
          setErrorMsg(null);
          if (hostDisconnectedAt) {
            setHostDisconnectedAt(null);
            setDisconnectCountdown(null);
          }
        }
      };
      netRef.current.onHostDisconnected = (disconnectedAt) => {
        if (myPlayer && !myPlayer.isHost) {
          console.warn('[App] Host disconnected callback triggered at:', new Date(disconnectedAt).toLocaleTimeString());
          setHostDisconnectedAt((prev) => prev || disconnectedAt);
          const current = getLocalSession();
          if (current) {
            saveLocalSession({
              ...current,
              hostDisconnectedAt: current.hostDisconnectedAt || disconnectedAt,
            });
          }
        }
      };
      netRef.current.onHostReconnected = () => {
        if (myPlayer && !myPlayer.isHost) {
          console.log('[App] Host reconnected callback triggered.');
          setHostDisconnectedAt(null);
          setDisconnectCountdown(null);
          const current = getLocalSession();
          if (current) {
            saveLocalSession({
              ...current,
              hostDisconnectedAt: null,
            });
          }
        }
      };
      netRef.current.onPeerJoined = (peerId) => {
        console.log('[Host] Peer presence joined:', peerId);
        if (lobbyDisconnectTimersRef.current.has(peerId)) {
          console.log(`[Host] Player ${peerId} returned to lobby! Cancelling auto-removal.`);
          clearTimeout(lobbyDisconnectTimersRef.current.get(peerId));
          lobbyDisconnectTimersRef.current.delete(peerId);
          setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
        }
      };

      netRef.current.onPresenceSync = (presentPlayerIds) => {
        if (myPlayer?.isHost && (gameStatus === 'LOBBY' || gameStatus === 'WELCOME')) {
          const presentIds = new Set(presentPlayerIds);

          // 1. Cancel eviction timers for any players who are currently present
          let timersChanged = false;
          lobbyDisconnectTimersRef.current.forEach((timer, playerId) => {
            if (presentIds.has(playerId)) {
              console.log(`[Host] Player ${playerId} returned to presence, cancelling eviction timer.`);
              clearTimeout(timer);
              lobbyDisconnectTimersRef.current.delete(playerId);
              timersChanged = true;
            }
          });

          // 2. For players in lobby who are missing from presence, start a 2-minute grace timer (DO NOT immediately evict!)
          setPlayers((prev) => {
            prev.forEach((p) => {
              if (p.id !== myPlayer.id && !p.isAi && !presentIds.has(p.id)) {
                if (!lobbyDisconnectTimersRef.current.has(p.id)) {
                  console.log(`[Host] Player ${p.name} (${p.id}) missing from presence. Starting 2-minute grace timer...`);
                  const targetId = p.id;
                  const timer = setTimeout(() => {
                    lobbyDisconnectTimersRef.current.delete(targetId);
                    setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
                    setPlayers((currentPlayers) => {
                      const evicted = currentPlayers.filter((x) => x.id !== targetId);
                      if (evicted.length !== currentPlayers.length && netRef.current) {
                        console.log(`[Host] Grace period (2m) expired for ghost player ${targetId}. Evicting from lobby.`);
                        const latestStatus = gameStatusRef.current === 'WELCOME' ? 'LOBBY' : gameStatusRef.current;
                        netRef.current.broadcastRoomState({
                          roomCode,
                          hostId: myPlayer.id,
                          status: latestStatus as GameStatus,
                          players: evicted,
                          config,
                          roundNumber,
                        });
                      }
                      return evicted;
                    });
                  }, 120000); // 2-minute grace period
                  lobbyDisconnectTimersRef.current.set(p.id, timer);
                  timersChanged = true;
                }
              }
            });
            return prev; // Never filter out players instantly!
          });

          if (timersChanged) {
            setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
          }
        }
      };

      netRef.current.onPeerLeft = (peerId, playerId) => {
        const targetId = playerId || peerId;
        console.log('[Host] Peer presence left/dropped:', targetId);
        if (myPlayer?.isHost && (gameStatus === 'LOBBY' || gameStatus === 'WELCOME') && targetId !== myPlayer.id) {
          if (!lobbyDisconnectTimersRef.current.has(targetId)) {
            console.log(`[Host] Starting 2m grace timer for departed peer ${targetId}`);
            const timer = setTimeout(() => {
              lobbyDisconnectTimersRef.current.delete(targetId);
              setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
              setPlayers((currentPlayers) => {
                const evicted = currentPlayers.filter((x) => x.id !== targetId);
                if (evicted.length !== currentPlayers.length && netRef.current) {
                  const latestStatus = gameStatusRef.current === 'WELCOME' ? 'LOBBY' : gameStatusRef.current;
                  netRef.current.broadcastRoomState({
                    roomCode,
                    hostId: myPlayer.id,
                    status: latestStatus as GameStatus,
                    players: evicted,
                    config,
                    roundNumber,
                  });
                }
                return evicted;
              });
            }, 120000); // 2-minute grace period
            lobbyDisconnectTimersRef.current.set(targetId, timer);
            setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
          }
        }
      };
    }
  });

  // Handle mobile tab switching & screen unlock: auto-reconnect and self-healing when tab becomes active
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[App] Tab resumed / focused / online. Checking connection and state...');

        // 1. Fast Database Snapshot Recovery (takes < 50ms)
        if (roomCode && myPlayer) {
          fetchRoomFromDatabase(roomCode).then((dbState) => {
            if (dbState) {
              console.log('[App] Restored fresh room snapshot from Database:', dbState.status);
              setPlayers(dbState.players);
              setConfig(dbState.config);
              setRoundNumber(dbState.roundNumber);
              setGameStatus(dbState.status);
              if (dbState.currentPair) setCurrentPair(dbState.currentPair);
              if (dbState.currentSpeakerId !== undefined) setCurrentSpeakerId(dbState.currentSpeakerId);
              if (dbState.winner !== undefined) setWinner(dbState.winner);

              // Restore secret card if available in DB players
              const selfInDb = dbState.players.find((p) => p.id === myPlayer.id);
              if (selfInDb && (selfInDb.role !== myPlayer.role || selfInDb.word !== myPlayer.word)) {
                setMyPlayer((prev) => (prev ? { ...prev, ...selfInDb } : null));
              }
            }
          }).catch(() => {});
        }

        // 2. Realtime WebSocket check & auto-reconnect
        if (myPlayer && !myPlayer.isHost && roomCode) {
          const isHealthy = netRef.current?.isSocketHealthy();
          if (!isHealthy) {
            console.log('[App] Socket down or unhealthy while in background. Reconnecting client...');
            setConnStatus('CONNECTING');
            const ok = await netRef.current?.reconnectClient(roomCode, myPlayer);
            if (ok) {
              setConnStatus('CONNECTED');
              setErrorMsg(null);
              setHostDisconnectedAt(null);
              setDisconnectCountdown(null);
            } else {
              setConnStatus('ERROR');
            }
          } else {
            // Socket is healthy: send sync refresh to Host
            netRef.current?.sendToHost({
              type: 'JOIN_REQUEST',
              senderId: myPlayer.id,
              payload: myPlayer,
            });
          }
        } else if (myPlayer?.isHost) {
          // Host: Ensure signaling connection is active and broadcast state update
          await netRef.current?.reconnectHostIfNeeded(myPlayer);
          setHostDisconnectedAt(null);
          setDisconnectCountdown(null);
          if (netRef.current && players.length > 0) {
            netRef.current.broadcastRoomState({
              roomCode,
              hostId: myPlayer.id,
              status: gameStatus === 'WELCOME' ? 'LOBBY' : (gameStatus as GameStatus),
              players,
              config,
              roundNumber,
            });
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // Mobile tab hidden or user switched to another app (e.g. Zalo, Messenger, phone call).
        // CRITICAL: NEVER destroy connection or send PLAYER_LEFT here!
        console.log('[App] Tab backgrounded. Keeping session persistent.');
      }
    };

    const handleOffline = () => {
      console.warn('[App] Device went offline.');
      setConnStatus('ERROR');
      setErrorMsg('Mất kết nối Internet tạm thời. Đang chờ có sóng để tự động kết nối lại...');
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      window.removeEventListener('online', handleVisibilityOrFocus);
      window.removeEventListener('offline', handleOffline);
    };
  }, [myPlayer, roomCode, players, config, roundNumber, gameStatus]);

  // Auto-restore session on refresh OR Auto-join directly when URL contains ?room=CODE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room')?.trim().toUpperCase();

    const session = getLocalSession();

    // Check if user was previously kicked from this room
    if (roomParam) {
      let kickedRoom: string | null = null;
      try {
        kickedRoom = sessionStorage.getItem('hogw_kicked_room');
      } catch {}
      if (kickedRoom && kickedRoom === roomParam) {
        console.log('[App] Blocking auto-join because player was kicked from room:', roomParam);
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        setErrorMsg(`Bạn đã bị mời ra khỏi phòng "${roomParam}". Không thể tự động vào lại.`);
        return;
      }
    }

    // Priority 1: Direct link invite via ?room=CODE (new room or fresh joiner)
    if (roomParam && roomParam.length >= 3 && (!session || session.roomCode !== roomParam)) {
      console.log('[App] Auto-joining room directly from URL link:', roomParam);
      clearLocalSession();

      let effectiveName = localStorage.getItem('hogw_player_name')?.trim();
      if (!effectiveName || effectiveName.startsWith('Phù thủy #')) {
        effectiveName = `Phù thủy #${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        try {
          localStorage.setItem('hogw_player_name', effectiveName);
        } catch {}
      }
      setPlayerName(effectiveName);

      const client: Player = {
        id: getOrCreatePlayerId(false),
        name: effectiveName,
        isHost: false,
        isAi: false,
      };

      setMyPlayer(client);
      setPlayers([client]);
      setRoomCode(roomParam);
      setInputRoomCode(roomParam);
      setGameStatus('LOBBY');
      setConnStatus('CONNECTING');

      saveLocalSession({
        roomCode: roomParam,
        isHost: false,
        player: client,
        gameStatus: 'LOBBY',
        hostDisconnectedAt: null,
      });

      const timer = setTimeout(async () => {
        if (!netRef.current) return;
        try {
          await netRef.current.initClient(roomParam, client);
          setGameStatus('LOBBY');
          setConnStatus('CONNECTED');
          sound.playVictoryFanfare();
        } catch (e: any) {
          console.warn('[App] URL auto-join failed:', e);
          setConnStatus('IDLE');
          cleanupAndExitToWelcome(
            e?.message?.includes('Timeout')
              ? `Hết thời gian chờ kết nối tới phòng "${roomParam}". Vui lòng kiểm tra lại mã phòng hoặc nhờ Chủ phòng mở phòng!`
              : `Không tìm thấy phòng Hogwarts "${roomParam}" hoặc Chủ phòng đã đóng phòng. Hãy kiểm tra lại mã phòng!`
          );
        }
      }, 150);

      return () => clearTimeout(timer);
    }

    // Priority 2: Standard session restoration from local storage
    if (!session || !session.roomCode || !session.player) return;

    const now = Date.now();
    if (session.hostDisconnectedAt && now - session.hostDisconnectedAt > HOST_DISCONNECT_EXPIRY_MS) {
      clearLocalSession();
      return;
    }
    if (session.isHost && session.lastActiveTimestamp && now - session.lastActiveTimestamp > HOST_DISCONNECT_EXPIRY_MS) {
      clearLocalSession();
      return;
    }

    console.log('[App] Auto-reconnecting from saved local session:', session);
    setRoomCode(session.roomCode);
    setMyPlayer(session.player);
    setPlayers([session.player]);
    if (session.gameStatus) {
      setGameStatus(session.gameStatus);
    }
    if (session.hostDisconnectedAt) {
      setHostDisconnectedAt(session.hostDisconnectedAt);
    }

    const timer = setTimeout(async () => {
      if (!netRef.current) return;
      try {
        if (session.isHost) {
          setPlayers([session.player]);
          await netRef.current.initHost(session.roomCode, session.player);
          saveLocalSession({
            ...session,
            lastActiveTimestamp: Date.now(),
            hostDisconnectedAt: null,
          });
        } else {
          await netRef.current.initClient(session.roomCode, session.player);
        }
      } catch (e) {
        console.warn('[App] Local session reconnection failed:', e);
        if (!session.isHost) {
          const discAt = session.hostDisconnectedAt || session.lastActiveTimestamp || session.timestamp || Date.now();
          if (Date.now() - discAt > HOST_DISCONNECT_EXPIRY_MS) {
            clearLocalSession();
            setGameStatus('WELCOME');
            setMyPlayer(null);
            setRoomCode('');
            setConnStatus('IDLE');
            setHostDisconnectedAt(null);
          } else {
            setHostDisconnectedAt(discAt);
            saveLocalSession({
              ...session,
              hostDisconnectedAt: discAt,
            });
          }
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Action: Create Room (Host)
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setErrorMsg('Vui lòng nhập tên của bạn!');
      return;
    }
    setErrorMsg(null);
    try {
      localStorage.setItem('hogw_player_name', playerName.trim());
    } catch {}

    // Generate 4-letter room code (easy to type on mobile)
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const host: Player = {
      id: getOrCreatePlayerId(true),
      name: playerName.trim(),
      isHost: true,
      isAi: false,
      house: selectedHouse,
      userTag,
      hpvnUid,
    };

    setMyPlayer(host);
    setPlayers([host]);
    setRoomCode(randomCode);

    saveLocalSession({
      roomCode: randomCode,
      isHost: true,
      player: host,
      gameStatus: 'LOBBY',
      hostDisconnectedAt: null,
    });

    try {
      if (netRef.current) {
        setConnStatus('CONNECTING');
        await netRef.current.initHost(randomCode, host);
        setGameStatus('LOBBY');
        setConnStatus('CONNECTED');
        sound.playVictoryFanfare();
      }
    } catch (err: any) {
      clearLocalSession();
      setConnStatus('IDLE');
      setErrorMsg(err.message || 'Không thể tạo phòng. Thử lại sau ít giây!');
    }
  };

  // Action: Join Room (Client)
  const handleJoinRoom = async () => {
    let nameToUse = playerName.trim();
    if (!nameToUse || nameToUse.startsWith('Phù thủy #')) {
      nameToUse = `Phù thủy #${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setPlayerName(nameToUse);
    }
    const code = inputRoomCode.trim().toUpperCase();
    if (!code || code.length < 3) {
      setErrorMsg('Vui lòng nhập mã phòng hợp lệ (4 ký tự)!');
      return;
    }
    setErrorMsg(null);
    try {
      localStorage.setItem('hogw_player_name', nameToUse);
    } catch {}

    const client: Player = {
      id: getOrCreatePlayerId(false),
      name: nameToUse,
      isHost: false,
      isAi: false,
      house: selectedHouse,
      userTag,
      hpvnUid,
    };

    pendingJoinRef.current = { client, code };
    setConnStatus('CONNECTING');

    try {
      if (netRef.current) {
        await netRef.current.initClient(code, client);
        setMyPlayer(client);
        setPlayers([client]);
        setRoomCode(code);
        setGameStatus('LOBBY');
        setConnStatus('CONNECTED');
        saveLocalSession({
          roomCode: code,
          isHost: false,
          player: client,
          gameStatus: 'LOBBY',
          hostDisconnectedAt: null,
        });
        sound.playVictoryFanfare();
      }
    } catch (err: any) {
      clearLocalSession();
      setConnStatus('IDLE');
      setGameStatus('WELCOME');
      setMyPlayer(null);
      setPlayers([]);
      setRoomCode('');
      setErrorMsg(
        err?.message?.includes('Timeout')
          ? `Hết thời gian chờ kết nối tới phòng "${code}". Vui lòng kiểm tra lại mã phòng và đảm bảo Chủ phòng đang mở tab!`
          : err?.message || `Không tìm thấy phòng "${code}". Vui lòng kiểm tra lại mã phòng do Chủ phòng cung cấp!`
      );
    } finally {
      pendingJoinRef.current = null;
    }
  };

  // Action: Rename Player (Host or Client directly in room)
  const handleRenamePlayer = (newName: string) => {
    const trimmed = newName.trim().slice(0, 20);
    if (!trimmed || !myPlayer) return;

    setPlayerName(trimmed);
    try {
      localStorage.setItem('hogw_player_name', trimmed);
    } catch {}

    const updatedSelf: Player = {
      ...myPlayer,
      name: trimmed,
    };
    setMyPlayer(updatedSelf);

    const current = getLocalSession();
    if (current) {
      saveLocalSession({
        ...current,
        player: updatedSelf,
      });
    }

    if (myPlayer.isHost) {
      // Host renames themselves: update players roster & broadcast to all clients
      setPlayers((prev) => {
        const updated = prev.map((p) => (p.id === myPlayer.id ? updatedSelf : p));
        if (netRef.current) {
          netRef.current.broadcastRoomState({
            roomCode,
            hostId: myPlayer.id,
            status: (gameStatus === 'WELCOME' ? 'LOBBY' : gameStatus) as GameStatus,
            players: updated,
            config,
            roundNumber,
          });
        }
        return updated;
      });
    } else {
      // Client renames themselves: update local roster & notify Host via P2P
      setPlayers((prev) => prev.map((p) => (p.id === myPlayer.id ? updatedSelf : p)));
      netRef.current?.sendRename(myPlayer.id, trimmed);
    }
  };

  // Host inactivity watchdog: tracks user interaction (pointer/touch/key) and auto-disbands if Host is AFK > 30 mins
  useEffect(() => {
    if (!myPlayer?.isHost || !roomCode || gameStatus === 'WELCOME') return;

    let lastUserAction = Date.now();
    const markAction = () => {
      lastUserAction = Date.now();
    };

    window.addEventListener('pointerdown', markAction);
    window.addEventListener('keydown', markAction);
    window.addEventListener('touchstart', markAction);

    const afkInterval = setInterval(() => {
      const now = Date.now();
      const sess = getLocalSession();
      if (sess && sess.isHost) {
        saveLocalSession({
          ...sess,
          lastActiveTimestamp: now,
          hostDisconnectedAt: null,
        });
      }

      // Check if Host has had zero interaction for > 30 minutes
      if (now - lastUserAction > HOST_DISCONNECT_EXPIRY_MS) {
        console.warn('[App] Host has been idle/AFK with no interaction for > 30 minutes. Disbanding room...');
        if (netRef.current) {
          netRef.current.broadcast({
            type: 'ROOM_CLOSED',
            senderId: myPlayer.id,
            payload: { message: 'Chủ phòng đã không có thao tác (AFK) quá 30 phút. Bàn chơi đã được tự động giải tán!' },
          });
          if (roomCode) {
            closeRoomInDatabase(roomCode).catch(() => {});
          }
        }
        setTimeout(() => {
          cleanupAndExitToWelcome('Bạn đã bị tự động mời ra khỏi phòng do không có thao tác (AFK) quá 30 phút.');
        }, 350);
      }
    }, 10000);

    return () => {
      clearInterval(afkInterval);
      window.removeEventListener('pointerdown', markAction);
      window.removeEventListener('keydown', markAction);
      window.removeEventListener('touchstart', markAction);
    };
  }, [myPlayer?.isHost, roomCode, gameStatus]);

  // Host socket health check: automatically reconnect if socket dies without a visibility change
  useEffect(() => {
    if (!myPlayer?.isHost || !roomCode) return;
    const healthInterval = setInterval(() => {
      // ONLY check if tab is active/visible! Never thrash when tab is hidden or backgrounded!
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      if (netRef.current && !netRef.current.isSocketHealthy()) {
        console.warn('[App] Host socket unhealthy detected while active! Reconnecting softly...');
        netRef.current.reconnectHostIfNeeded(myPlayer);
      }
    }, 15000);
    return () => clearInterval(healthInterval);
  }, [myPlayer, roomCode]);

  // Host beforeunload listener: notify peers on true tab close without killing connection prematurely
  useEffect(() => {
    const handleHostUnload = () => {
      if (myPlayer?.isHost && netRef.current) {
        const now = Date.now();
        const sess = getLocalSession();
        if (sess && sess.isHost) {
          saveLocalSession({
            ...sess,
            lastActiveTimestamp: now,
            hostDisconnectedAt: now,
          });
        }
        netRef.current.broadcast({
          type: 'HOST_DISCONNECTED',
          senderId: myPlayer.id,
          payload: {
            disconnectedAt: now,
            message: 'Chủ phòng tạm thời gián đoạn kết nối.',
          },
        });
      }
    };

    window.addEventListener('beforeunload', handleHostUnload);
    return () => {
      window.removeEventListener('beforeunload', handleHostUnload);
    };
  }, [myPlayer]);

  // Guest beforeunload listener: inform Host on true tab close while in Lobby (NEVER on pagehide/tab-switch)
  useEffect(() => {
    const handleGuestUnload = () => {
      // Only inform host if client is truly unloading while in Lobby
      // NEVER destroy connection here so mobile tab restore/bfcache can recover seamlessly!
      if (myPlayer && !myPlayer.isHost && netRef.current && (gameStatus === 'LOBBY' || gameStatus === 'WELCOME')) {
        netRef.current.sendToHost({
          type: 'PLAYER_LEFT',
          senderId: myPlayer.id,
          payload: { playerId: myPlayer.id },
        });
      }
    };

    window.addEventListener('beforeunload', handleGuestUnload);
    return () => {
      window.removeEventListener('beforeunload', handleGuestUnload);
    };
  }, [myPlayer, gameStatus]);

  // 10-minute host disconnect countdown timer (clears session and evicts zombie room)
  useEffect(() => {
    if (!hostDisconnectedAt || gameStatus === 'WELCOME') {
      setDisconnectCountdown(null);
      return;
    }

    const checkHostTimeout = () => {
      const elapsed = Date.now() - hostDisconnectedAt;
      const remainingMs = HOST_DISCONNECT_EXPIRY_MS - elapsed;

      if (remainingMs <= 0) {
        console.log('[Session] Host disconnected for > 30 minutes. Evicting session and resetting.');
        cleanupAndExitToWelcome('Phòng chơi đã tự động giải tán vì chủ phòng đã ngắt kết nối quá 30 phút.');
      } else {
        setDisconnectCountdown(Math.ceil(remainingMs / 1000));
      }
    };

    checkHostTimeout();
    const interval = setInterval(checkHostTimeout, 1000);
    return () => clearInterval(interval);
  }, [hostDisconnectedAt, gameStatus]);

  // Action: Leave Room (Client or Host)
  const handleLeaveRoom = () => {
    if (netRef.current && myPlayer) {
      if (myPlayer.isHost) {
        console.log('[App] Host is leaving. Disbanding room and kicking all players...');
        // 1. Broadcast to all connected clients that the room has closed
        netRef.current.broadcast({
          type: 'ROOM_CLOSED',
          senderId: myPlayer.id,
          payload: { message: 'Chủ phòng đã rời khỏi phòng. Bàn chơi đã được tự động giải tán!' },
        });
        // 2. Delete room from database
        if (roomCode) {
          closeRoomInDatabase(roomCode).catch(() => {});
        }
      } else {
        netRef.current.sendToHost({
          type: 'PLAYER_LEFT',
          senderId: myPlayer.id,
          payload: { playerId: myPlayer.id },
        });
      }
    }
    // Allow 350ms for the message to be dispatched over websocket buffer before teardown
    setTimeout(() => {
      cleanupAndExitToWelcome(myPlayer?.isHost ? 'Bạn đã rời và giải tán phòng chơi.' : 'Bạn đã rời khỏi phòng.');
    }, 350);
  };

  // Action: Host adds AI Bot
  const handleAddBot = () => {
    if (!myPlayer?.isHost || players.length >= 10) return;
    const bot = createAiPlayer(players.length, players);
    const updated = [...players, bot];
    setPlayers(updated);

    if (netRef.current) {
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: gameStatus as GameStatus,
        players: updated,
        config,
        roundNumber,
      });
    }
  };

  // Action: Host removes Player / Bot
  const handleRemovePlayer = (playerId: string) => {
    if (!myPlayer?.isHost) return;
    if (lobbyDisconnectTimersRef.current.has(playerId)) {
      clearTimeout(lobbyDisconnectTimersRef.current.get(playerId));
      lobbyDisconnectTimersRef.current.delete(playerId);
      setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
    }
    kickedPlayerIdsRef.current.add(playerId);
    const updated = players.filter((p) => p.id !== playerId);
    setPlayers(updated);

    if (netRef.current) {
      netRef.current.broadcast({
        type: 'KICK_PLAYER',
        senderId: myPlayer.id,
        payload: { playerId },
      });
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: gameStatus as GameStatus,
        players: updated,
        config,
        roundNumber,
      });
    }
  };

  // Action: Host updates config
  const handleUpdateConfig = (newConfig: Partial<RoomConfig>) => {
    if (!myPlayer?.isHost) return;
    const updated = { ...config, ...newConfig };
    setConfig(updated);

    if (netRef.current) {
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: gameStatus as GameStatus,
        players,
        config: updated,
        roundNumber,
      });
    }
  };

  // Action: Host starts/restarts game round
  const handleStartGame = () => {
    if (!myPlayer?.isHost) return;

    // Clean up any confirmed ghost players whose presence dropped in lobby
    let presentIds: Set<string> | null = null;
    if (netRef.current) {
      presentIds = new Set(netRef.current.getPresentPlayerIds());
    }
    
    const activePlayers = players.filter((p) => {
      if (p.isAi || p.isHost) return true;
      
      // If we know exactly who is present via Supabase, forcefully evict those who aren't.
      // This catches "silent drops" (Airplane mode) where Supabase never emitted a 'leave' event yet.
      if (presentIds && !presentIds.has(p.id)) {
        console.log(`[Host] Evicting offline ghost player before game start: ${p.name}`);
        if (lobbyDisconnectTimersRef.current.has(p.id)) {
          clearTimeout(lobbyDisconnectTimersRef.current.get(p.id));
          lobbyDisconnectTimersRef.current.delete(p.id);
        }
        return false;
      }
      return true;
    });

    if (activePlayers.length !== players.length) {
      setPlayers(activePlayers);
      setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
      if (netRef.current) {
        netRef.current.broadcastRoomState({
          roomCode,
          hostId: myPlayer.id,
          status: 'LOBBY',
          players: activePlayers,
          config,
          roundNumber,
        });
      }
    }

    const isSpectator = config.hostRole === 'GAME_MASTER';
    // When Host is GAME_MASTER, only non-host players receive secret cards
    const cardPlayers = isSpectator ? activePlayers.filter((p) => !p.isHost) : activePlayers;
    if (cardPlayers.length < 3) return;

    // Pick random word pair based on category
    const pair = selectRandomWordPair(config.selectedCategories, usedPairIds);
    setCurrentPair(pair);
    setUsedPairIds((prev) => [...prev, pair.id]);

    // Use optimal role assignment algorithm with streak protection, fair rotation & random speaking order
    const { roleMap, updatedHistory, speakingOrderMap } = assignOptimalRoles({
      cardPlayers,
      undercoverCount: config.undercoverCount,
      mrWhiteCount: config.mrWhiteCount,
      roleHistory: roleHistoryRef.current,
    });
    roleHistoryRef.current = updatedHistory;

    // Assign roles & speaking order to players
    const assignedPlayers: Player[] = activePlayers.map((p) => {
      if (isSpectator && p.isHost) {
        return {
          ...p,
          role: undefined,
          word: null,
          isEliminated: false,
          speakingOrder: undefined,
        };
      }

      const assignedRole = roleMap.get(p.id) || 'STUDENT';
      const order = speakingOrderMap.get(p.id);
      let assignedWord: string | null = null;
      if (assignedRole === 'STUDENT') assignedWord = pair.studentWord;
      if (assignedRole === 'DEATH_EATER') assignedWord = pair.undercoverWord;

      // Dispatch secret card to connected peer via unicast
      if (netRef.current && !p.isHost) {
        netRef.current.sendSecretCard(p.id, {
          role: assignedRole,
          word: assignedWord,
          speakingOrder: order,
        });
      }

      return {
        ...p,
        role: assignedRole,
        word: assignedWord,
        isEliminated: false,
        speakingOrder: order,
      };
    });

    setPlayers(assignedPlayers);

    const firstSpeaker = assignedPlayers.find((p) => p.speakingOrder === 1) || assignedPlayers[0];
    const initialSpeakerId = firstSpeaker?.id;
    setCurrentSpeakerId(initialSpeakerId);
    setWinner(null);
    setMrWhiteHasGuessed(false);
    setHostMrWhitePrompt(null);

    // Update host's own player card
    const hostUpdated = assignedPlayers.find((p) => p.id === myPlayer.id);
    if (hostUpdated) {
      setMyPlayer(hostUpdated);
      saveLocalSession({
        roomCode,
        isHost: true,
        player: hostUpdated,
        gameStatus: 'PLAYING',
      });
    }

    setGameStatus('PLAYING');

    // Broadcast sanitized state to all clients
    if (netRef.current) {
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: 'PLAYING',
        players: assignedPlayers,
        config,
        roundNumber,
        currentSpeakerId: initialSpeakerId,
        winner: null,
      });
    }

    sound.playVictoryFanfare();
  };

  // Action: Host reveals all cards
  const handleRevealAll = () => {
    if (!myPlayer?.isHost || !currentPair) return;
    setGameStatus('REVEALED');
    if (myPlayer) {
      saveLocalSession({
        roomCode,
        isHost: true,
        player: myPlayer,
        gameStatus: 'REVEALED',
      });
    }
    if (netRef.current) {
      netRef.current.revealAll(currentPair, players);
    }
  };

  // Action: Host starts next round
  const handleNextRound = () => {
    setRoundNumber((prev) => prev + 1);
    handleStartGame();
  };

  // Action: Return to lobby
  const handleBackToLobby = () => {
    if (!myPlayer?.isHost) return;
    
    // Clean up offline ghost players when transitioning back to Lobby
    let cleanPlayers = players;
    if (netRef.current) {
      const presentIds = new Set(netRef.current.getPresentPlayerIds());
      cleanPlayers = players.filter(p => p.id === myPlayer.id || presentIds.has(p.id));
      if (cleanPlayers.length !== players.length) {
        console.log('[Host] Evicted ghost players during transition back to Lobby.');
      }
    }
    
    setGameStatus('LOBBY');
    setPlayers(cleanPlayers);
    
    if (myPlayer) {
      saveLocalSession({
        roomCode,
        isHost: true,
        player: myPlayer,
        gameStatus: 'LOBBY',
      });
    }
    if (netRef.current) {
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: 'LOBBY',
        players: cleanPlayers,
        config,
        roundNumber,
      });
    }
  };

  // Action: Toggle player elimination status (Host)
  const handleToggleEliminated = (playerId: string) => {
    if (!myPlayer?.isHost) return;
    const updated = players.map((p) =>
      p.id === playerId ? { ...p, isEliminated: !p.isEliminated } : p
    );
    setPlayers(updated);

    const detectedWinner = evaluateWinCondition(updated, config.hostRole);
    setWinner(detectedWinner);

    if (detectedWinner) {
      if (detectedWinner === 'STUDENT') {
        sound.playVictoryFanfare();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } else {
        sound.playDarkReveal();
      }
    }

    if (netRef.current) {
      netRef.current.broadcastRoomState({
        roomCode,
        hostId: myPlayer.id,
        status: gameStatus as GameStatus,
        players: updated,
        config,
        roundNumber,
        currentSpeakerId,
        winner: detectedWinner,
      });
    }
  };

  const handleUpdateSpeaker = (speakerId: string) => {
    setCurrentSpeakerId(speakerId);
    sound.playButtonChime();
    if (netRef.current) {
      netRef.current.broadcastSpeakerTurn(speakerId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07040e] text-stone-200 selection:bg-[#740001] selection:text-[#ffd875] relative overflow-x-hidden">
      {/* 60FPS Ambient Starlight & Aurora Effects */}
      <BackgroundEffects />

      {/* Top Floating Glass Capsule Dock Header */}
      <Header
        roomCode={gameStatus !== 'WELCOME' ? roomCode : undefined}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenCustomWords={() => setIsCustomWordsOpen(true)}
        onOpenPassAndPlay={() => setIsPassAndPlayOpen(true)}
        onLeaveRoom={gameStatus !== 'WELCOME' ? handleLeaveRoom : undefined}
      />

      {/* Main Tabletop Arena Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-8 flex flex-col justify-start relative z-10">
        {/* Host Disconnected 10-Minute Countdown Banner */}
        {gameStatus !== 'WELCOME' && hostDisconnectedAt && disconnectCountdown !== null && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="text-lg flex-shrink-0">⏳</span>
              <div>
                <span className="font-semibold text-amber-300">Chủ phòng đang tạm ngắt kết nối hoặc đóng tab!</span>
                <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5">
                  Phòng sẽ tự động giải tán sau{' '}
                  <span className="font-mono font-bold text-amber-100 bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-600/40">
                    {Math.floor(disconnectCountdown / 60)}:{(disconnectCountdown % 60).toString().padStart(2, '0')}
                  </span>{' '}
                  nếu chủ phòng không quay lại.
                </p>
              </div>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-red-900/90 hover:bg-red-800 text-white font-serif font-bold text-xs border border-red-500/60 transition-all flex items-center gap-1.5 active:scale-95 shadow-md flex-shrink-0 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Rời phòng ngay</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/90 border border-red-700/80 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {gameStatus !== 'WELCOME' && (
                <button
                  onClick={handleLeaveRoom}
                  className="px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-serif font-bold text-xs border border-red-600 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  <LogOut size={12} />
                  <span>Về Trang Chủ</span>
                </button>
              )}
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white p-1 text-base">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 1: WELCOME & ROOM ENTRANCE */}
        {(gameStatus === 'WELCOME' || !myPlayer) && (
          <div className="w-full flex flex-col items-center gap-8 animate-fadeIn max-w-4xl mx-auto py-2 sm:py-4">
            {/* Cinematic Hero Title */}
            <div className="text-center relative flex flex-col items-center">
              {/* Floating House Crest Aura */}
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#740001] via-[#c8aa6e] to-[#0d6241] p-[2.5px] shadow-[0_0_40px_rgba(200,170,110,0.45)] animate-[breathingPulse_4s_ease-in-out_infinite]">
                  <div className="w-full h-full rounded-full bg-[#0d0718] flex items-center justify-center text-4xl sm:text-5xl select-none filter drop-shadow">
                    🏰
                  </div>
                </div>
                <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#740001] to-[#8a1c14] border border-[#ffd875] text-[#ffd875] text-[10px] sm:text-xs font-cinzel font-black tracking-widest uppercase shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                  HOGWARTS 1890
                </div>
              </div>

              <h1 className="font-title font-black text-3xl sm:text-5xl tracking-wide gold-gradient-text drop-shadow-[0_2px_15px_rgba(255,216,117,0.3)]">
                UNDERCOVER HOGWARTS
              </h1>
              <p className="text-xs sm:text-sm text-[#e0cfab] mt-2 max-w-lg mx-auto leading-relaxed font-serif">
                Đại chiến suy luận ma thuật bí mật giữa{' '}
                <span className="text-[#ffd875] font-bold border-b border-[#ffd875]/40 pb-0.5">Học Sinh Hogwarts</span>{' '}
                và <span className="text-red-400 font-bold border-b border-red-500/40 pb-0.5">Tử Thần Thực Tử</span>.
              </p>

              <div className="flex items-center justify-center mt-3">
                <button
                  type="button"
                  onClick={() => openFlooDrawer()}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] border border-[#ffd875]/70 flex items-center gap-2 font-cinzel font-black text-xs tracking-wider shadow-[0_4px_20px_rgba(116,0,1,0.5)] transition-all active:scale-95 cursor-pointer"
                >
                  <Flame size={16} className="text-[#ffd875] animate-pulse" />
                  <span>MẠNG FLOO (CHAT THỜI GIAN THỰC)</span>
                </button>
              </div>
            </div>

            {/* Wizard Persona Studio Component */}
            <div className="w-full max-w-2xl">
              <WizardPersonaStudio
                playerName={playerName}
                onNameChange={(name) => {
                  setPlayerName(name);
                  try {
                    localStorage.setItem('hogw_player_name', name);
                  } catch {}
                }}
                selectedHouse={selectedHouse}
                onHouseChange={(house) => {
                  setSelectedHouse(house);
                  try {
                    localStorage.setItem('hogw_player_house', house);
                  } catch {}
                }}
                userTag={userTag}
                onUserTagChange={handleUserTagChange}
                hpvnUid={hpvnUid}
                onHpvnUidChange={handleHpvnUidChange}
              />
            </div>

            {/* Dual Grand Portals (Side-by-side on desktop, stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
              {/* Portal 1: Tạo phòng mới (Host) */}
              <div className="glass-panel-gold rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#ffd875] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd875]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#ffd875]/15 transition-all" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-[#740001]/60 border border-[#ffd875]/40 text-xl shadow-inner">
                        👑
                      </span>
                      <div>
                        <h3 className="font-cinzel font-black text-base text-[#ffd875] tracking-wide">
                          KHỞI TẠO BÀN ĐẤU
                        </h3>
                        <p className="text-[11px] text-stone-400 font-serif">Trở thành Chủ Trì (Host)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#26143d] text-[#c8aa6e] border border-[#c8aa6e]/30">
                      Host Mode
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 font-serif leading-relaxed mb-4">
                    Triệu tập các phù thủy vào Đại Sảnh Đường, tùy biến tỉ lệ Gián Điệp, thêm AI Bot hỗ trợ và điều phối phiên biểu quyết.
                  </p>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={connStatus === 'CONNECTING'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] font-cinzel font-black text-sm tracking-wider border border-[#ffd875]/60 shadow-[0_4px_20px_rgba(116,0,1,0.5)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group/btn disabled:opacity-50"
                >
                  <div className="absolute inset-0 shimmer-gold opacity-30 pointer-events-none" />
                  <Crown size={18} className="text-[#ffd875]" />
                  <span>TẠO PHÒNG MỚI</span>
                  <ArrowRight size={16} className="text-[#ffd875] transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>

              {/* Portal 2: Gia nhập bàn chơi (Join) */}
              <div className="glass-panel-gold rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#38bdf8] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#38bdf8]/15 transition-all" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-[#0e3b66]/60 border border-[#38bdf8]/40 text-xl shadow-inner">
                        🗝️
                      </span>
                      <div>
                        <h3 className="font-cinzel font-black text-base text-[#7dd3fc] tracking-wide">
                          GIA NHẬP BÀN CHƠI
                        </h3>
                        <p className="text-[11px] text-stone-400 font-serif">Bước qua Cổng Không Gian</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#0f2847] text-[#7dd3fc] border border-[#38bdf8]/30">
                      Runic Code
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 font-serif leading-relaxed mb-3">
                    Nhập mã phòng 4 ký tự do Chủ Phòng cung cấp để nhận thẻ thân phận bí mật:
                  </p>

                  <div className="my-2">
                    <RunicCodeInput
                      value={inputRoomCode}
                      onChange={setInputRoomCode}
                      length={4}
                      onEnter={handleJoinRoom}
                      disabled={connStatus === 'CONNECTING'}
                    />
                  </div>
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={connStatus === 'CONNECTING' || inputRoomCode.trim().length === 0}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#0e3b66] via-[#1a4e7e] to-[#0e3b66] hover:from-[#174d82] hover:to-[#22639e] text-[#bae6fd] font-cinzel font-black text-sm tracking-wider border border-[#38bdf8]/50 shadow-[0_4px_20px_rgba(14,59,102,0.5)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                >
                  {connStatus === 'CONNECTING' ? (
                    <>
                      <Loader2 size={18} className="text-[#38bdf8] animate-spin" />
                      <span>ĐANG TÌM PHÒNG...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} className="text-[#38bdf8]" />
                      <span>BƯỚC VÀO PHÒNG</span>
                      <ArrowRight size={16} className="text-[#38bdf8] transition-transform group-hover/btn:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-serif text-stone-400 mt-1">
              <button
                type="button"
                onClick={() => setIsPassAndPlayOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b1029]/80 border border-[#c8aa6e]/30 hover:border-[#ffd875] text-[#e0cfab] hover:text-[#ffd875] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>📱</span>
                <span>Chơi chung trên 1 điện thoại (Pass & Play)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHowToPlayOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b1029]/80 border border-[#c8aa6e]/30 hover:border-[#ffd875] text-[#e0cfab] hover:text-[#ffd875] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Sparkles size={13} className="text-[#ffd875]" />
                <span>Luật chơi & Bí quyết suy luận</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: LOBBY */}
        {gameStatus === 'LOBBY' && myPlayer && (
          <Lobby
            roomCode={roomCode}
            isHost={myPlayer.isHost}
            myPlayer={myPlayer}
            players={players}
            config={config}
            offlinePlayerIds={offlinePlayerIds}
            onUpdateConfig={handleUpdateConfig}
            onAddBot={handleAddBot}
            onRemovePlayer={handleRemovePlayer}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onRenamePlayer={handleRenamePlayer}
          />
        )}

        {/* SCREEN 3: IN-GAME (PLAYING OR REVEALED) */}
        {(gameStatus === 'PLAYING' || gameStatus === 'REVEALED') && myPlayer && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* If Host is Game Master, show Game Master Banner instead of secret card */}
            {myPlayer.isHost && config.hostRole === 'GAME_MASTER' ? (
              <div className="w-full max-w-md bg-gradient-to-r from-[#241538] via-[#341b52] to-[#241538] p-4 rounded-2xl border border-[#ffd875]/50 shadow-xl text-center animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[#ffd875] text-xs font-bold font-serif mb-2 border border-amber-500/30">
                  <Crown size={14} />
                  <span>BẠN ĐANG LÀ QUẢN TRÒ (TRỌNG TÀI)</span>
                </div>
                <h3 className="text-stone-100 font-serif font-bold text-sm sm:text-base">
                  Bạn không cầm thẻ bí mật — hãy quan sát và điều phối bàn chơi!
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Xem toàn bộ từ khóa và phe phái của từng người chơi ở bảng bên dưới.
                </p>
              </div>
            ) : !myPlayer.role && !myPlayer.isHost ? (
              /* Mid-Game Spectator Mode View */
              <div className="w-full max-w-md bg-gradient-to-b from-[#1b1428] via-[#140c20] to-[#0c0714] p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 shadow-2xl text-center animate-fadeIn flex flex-col items-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[#ffd875] text-xs font-bold font-serif border border-amber-500/30 shadow-sm">
                  <span className="text-sm animate-pulse">👀</span>
                  <span>CHẾ ĐỘ KHÁN GIẢ (SPECTATOR)</span>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-[#281a3e] border border-[#c8aa6e]/40 flex items-center justify-center text-3xl shadow-inner">
                  🔮
                </div>

                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#f3d994]">
                  Ván Đấu #{roundNumber} Đang Diễn Ra
                </h3>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed px-2">
                  Bạn vừa vào phòng giữa trận! Hiện tại các phù thủy đang miêu tả từ bí mật và tìm kiếm Tử Thần Thực Tử.
                </p>

                <div className="w-full bg-[#1e132e]/90 border border-amber-500/30 rounded-xl p-3 text-left flex items-start gap-2.5 shadow-inner">
                  <span className="text-base shrink-0 mt-0.5">⚡</span>
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong>Bạn sẽ thi đấu ở ván tiếp theo:</strong> Ngay khi Quản trò kết thúc vòng này và bấm <em>"Ván tiếp theo"</em>, hệ thống sẽ tự động phát Thẻ Bí Mật cho bạn!
                  </div>
                </div>

                {/* Quick Leave Option for Spectator */}
                <button
                  onClick={handleLeaveRoom}
                  className="mt-1 text-xs text-stone-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-red-950/30"
                >
                  <LogOut size={13} />
                  <span>Rời phòng nếu không muốn chờ</span>
                </button>
              </div>
            ) : (
              /* Player's Secret Card (Normal player OR Host playing) */
              <>
                <SecretCard
                  role={myPlayer.role}
                  word={myPlayer.word}
                  playerName={myPlayer.name}
                  roundNumber={roundNumber}
                  speakingOrder={myPlayer.speakingOrder}
                />
                {gameStatus === 'PLAYING' && (
                  <DetectiveNotepad players={players} myPlayerId={myPlayer.id} />
                )}
              </>
            )}

            {/* Speaking Turn Order Roster during PLAYING phase */}
            {gameStatus === 'PLAYING' && (
              <SpeakingOrderBanner
                players={players}
                myPlayerId={myPlayer.id}
                roundNumber={roundNumber}
                currentSpeakerId={currentSpeakerId}
                onUpdateSpeaker={handleUpdateSpeaker}
                isHost={myPlayer.isHost}
              />
            )}

            {/* Host Dashboard Controls */}
            {myPlayer.isHost ? (
              <HostBoard
                status={gameStatus}
                hostRole={config.hostRole}
                currentPair={currentPair}
                players={players}
                roundNumber={roundNumber}
                winner={winner}
                onRevealAll={handleRevealAll}
                onNextRound={handleNextRound}
                onBackToLobby={handleBackToLobby}
                onToggleEliminated={handleToggleEliminated}
              />
            ) : (
              gameStatus === 'REVEALED' && (
                <div className="w-full max-w-md glass-panel-gold p-5 sm:p-6 rounded-3xl border-2 border-[#ffd875]/70 text-center animate-fadeIn shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Victory Banner */}
                  {winner ? (
                    <div
                      className={`w-full p-5 rounded-2xl border-2 text-center shadow-2xl flex flex-col items-center gap-2 relative overflow-hidden ${
                        winner === 'STUDENT'
                          ? 'bg-gradient-to-b from-[#3d0a08] via-[#240605] to-[#140303] border-[#ffd875] text-[#ffe699]'
                          : winner === 'DEATH_EATER'
                          ? 'bg-gradient-to-b from-[#0a2e18] via-[#051a0d] to-[#030d07] border-emerald-400 text-emerald-100'
                          : 'bg-gradient-to-b from-[#280c3d] via-[#160624] to-[#0c0314] border-purple-400 text-purple-100'
                      }`}
                    >
                      <div className="text-4xl filter drop-shadow animate-bounce">
                        {winner === 'STUDENT' ? '⚡ 🏆 ⚡' : winner === 'DEATH_EATER' ? '🐍 💀 🐍' : '👻 🔮 👻'}
                      </div>
                      <h3 className="font-cinzel font-black text-xl sm:text-2xl tracking-wider uppercase">
                        {winner === 'STUDENT'
                          ? 'PHE HỌC SINH CHIẾN THẮNG!'
                          : winner === 'DEATH_EATER'
                          ? 'TỬ THẦN THỰC TỬ THẮNG CUỘC!'
                          : 'KẺ KHÔNG TÊN LẬT KÈO THÀNH CÔNG!'}
                      </h3>
                      <p className="text-xs opacity-95 max-w-sm leading-relaxed font-medium">
                        {winner === 'STUDENT'
                          ? 'Các phù thủy chân chính đã vạch trần toàn bộ kẻ phản bội và bảo vệ an toàn cho Hogwarts!'
                          : winner === 'DEATH_EATER'
                          ? 'Tử Thần Thực Tử đã ẩn mình hoàn hảo, thao túng bàn chơi và chiếm thế thượng phong!'
                          : 'Mr. White đã giải mã chính xác mật từ của Học Sinh trong gang tấc!'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffd875] to-[#740001] p-0.5 shadow-lg mb-2">
                        <div className="w-full h-full rounded-[14px] bg-[#120a1c] flex items-center justify-center text-3xl">
                          🏆
                        </div>
                      </div>
                      <h4 className="font-cinzel font-black text-xl sm:text-2xl text-[#ffd875] tracking-wide">
                        Ván Đấu Đã Kết Thúc!
                      </h4>
                      <p className="text-xs text-[#c8aa6e] mt-1">
                        Quản trò đã công bố toàn bộ danh tính vòng đấu #{roundNumber}
                      </p>
                    </div>
                  )}

                  {/* Revealed Word Pair */}
                  {currentPair && (
                    <div className="w-full bg-[#0d0714]/90 rounded-2xl p-4 border border-[#ffd875]/40 text-left shadow-inner">
                      <span className="text-[11px] text-[#ffd875] font-cinzel font-bold uppercase tracking-widest block mb-2.5 text-center">
                        📜 Cặp Từ Bí Mật Vòng Này
                      </span>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-gradient-to-b from-[#241312] to-[#140a0a] p-3 rounded-xl border border-amber-500/40 shadow-sm">
                          <span className="text-[10px] text-[#ffd875] font-serif font-bold uppercase tracking-wider block mb-1">
                            ⚡ Học Sinh:
                          </span>
                          <span className="font-serif font-black text-[#fff2be] text-base break-words">
                            {currentPair.studentWord}
                          </span>
                        </div>
                        <div className="bg-gradient-to-b from-[#0e2115] to-[#07130b] p-3 rounded-xl border border-emerald-500/40 shadow-sm">
                          <span className="text-[10px] text-emerald-400 font-serif font-bold uppercase tracking-wider block mb-1">
                            🐍 Tử Thần:
                          </span>
                          <span className="font-serif font-black text-emerald-200 text-base break-words">
                            {currentPair.undercoverWord}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Player Roster Breakdown */}
                  {players.length > 0 && (
                    <div className="w-full bg-[#0a0512]/90 rounded-2xl p-3.5 border border-stone-800 text-left max-h-56 overflow-y-auto custom-scrollbar shadow-inner">
                      <span className="text-[10px] text-[#c8aa6e] uppercase tracking-widest font-cinzel font-bold block mb-2 text-center">
                        Danh Tính & Vai Trò Các Phù Thủy
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {players.map((p) => {
                          const isSpectator = !p.isHost && !p.role;
                          const isDeathEater = p.role === 'DEATH_EATER';
                          const isMrWhite = p.role === 'MR_WHITE';
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl text-xs border transition-all ${
                                p.isEliminated
                                  ? 'bg-stone-900/50 border-stone-800 text-stone-500 line-through opacity-70'
                                  : isSpectator
                                  ? 'bg-[#150e20]/60 border-stone-800 text-stone-400'
                                  : isDeathEater
                                  ? 'bg-gradient-to-r from-red-950/60 to-red-900/40 border-red-700/50 text-red-200 shadow-sm'
                                  : isMrWhite
                                  ? 'bg-gradient-to-r from-purple-950/60 to-purple-900/40 border-purple-700/50 text-purple-200 shadow-sm'
                                  : 'bg-gradient-to-r from-[#1e132c]/80 to-[#170e22]/80 border-amber-600/30 text-[#f3efe6]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {typeof p.speakingOrder === 'number' && (
                                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#ffd875] border border-amber-500/40 text-[10px] font-black font-mono flex items-center justify-center shrink-0">
                                    {p.speakingOrder}
                                  </span>
                                )}
                                <span className="font-serif font-bold truncate">
                                  {p.name}
                                </span>
                                {p.id === myPlayer.id && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#ffd875] border border-amber-500/40 font-bold shrink-0">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 font-medium shrink-0 ml-2">
                                {isSpectator ? (
                                  <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px] font-medium border border-stone-700">
                                    👀 Khán Giả
                                  </span>
                                ) : isDeathEater ? (
                                  <span className="px-2.5 py-0.5 rounded-md bg-red-950 text-red-300 text-[11px] font-serif font-bold border border-red-600/70">
                                    🐍 Tử Thần
                                  </span>
                                ) : isMrWhite ? (
                                  <span className="px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-300 text-[11px] font-serif font-bold border border-purple-600/70">
                                    👻 Kẻ Không Tên
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-md bg-amber-950/90 text-[#ffd875] text-[11px] font-serif font-bold border border-amber-600/60">
                                    ⚡ Học Sinh
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions & Leave Room */}
                  <div className="w-full flex flex-col gap-2 pt-2 border-t border-stone-800/80">
                    <button
                      onClick={handleLeaveRoom}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-red-100 hover:text-white font-cinzel font-bold text-sm shadow-xl border border-red-600/70 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>RỜI PHÒNG & VỀ TRANG CHỦ</span>
                    </button>
                    <p className="text-[11px] text-[#c8aa6e]/80 italic leading-relaxed">
                      💡 Bạn có thể tự do bấm <strong>Rời Phòng</strong> bất cứ lúc nào mà không cần chờ Quản trò.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

        )}
      </main>

      {/* Modals */}
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
      <CustomWordModal isOpen={isCustomWordsOpen} onClose={() => setIsCustomWordsOpen(false)} />
      <PassAndPlayModal isOpen={isPassAndPlayOpen} onClose={() => setIsPassAndPlayOpen(false)} />

      {/* Mr. White Last Chance Guess Modal (For Eliminated Mr. White) */}
      {myPlayer?.role === 'MR_WHITE' && myPlayer.isEliminated && gameStatus === 'PLAYING' && !mrWhiteHasGuessed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-[#2a133d] via-[#1c0d2b] to-[#12071c] border-2 border-purple-500 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-purple-950/80 border-2 border-purple-400 shadow-lg flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">
              👻
            </div>
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block font-mono">
              BẠN ĐÃ BỊ LOẠI KHỎI BÀN CHƠI!
            </span>
            <h3 className="font-serif font-black text-xl sm:text-2xl text-purple-200 tracking-wide mt-1 mb-2">
              CƠ HỘI LẬT KÈO CUỐI CÙNG
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              Bạn là <strong>Kẻ Không Tên (Mr. White)</strong>! Hãy đoán từ bí mật của phe Học Sinh. Nếu đoán đúng, bạn sẽ <strong>LẬT KÈO CHIẾN THẮNG MỘT MÌNH</strong>!
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mrWhiteGuessInput.trim()) {
                  setMrWhiteHasGuessed(true);
                  netRef.current?.sendMrWhiteGuess(mrWhiteGuessInput.trim());
                  sound.playMagicCardFlip();
                }
              }}
              className="flex flex-col gap-3"
            >
              <input
                type="text"
                value={mrWhiteGuessInput}
                onChange={(e) => setMrWhiteGuessInput(e.target.value)}
                maxLength={30}
                autoFocus
                placeholder="Nhập từ của Học sinh bạn đoán..."
                className="w-full px-4 py-3 rounded-xl bg-[#0d0714] border-2 border-purple-400 text-sm font-serif font-bold text-purple-200 text-center placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
              />

              <button
                type="submit"
                disabled={!mrWhiteGuessInput.trim()}
                className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:to-purple-400 text-white font-serif font-bold text-sm tracking-wider shadow-lg transition active:scale-98 disabled:opacity-40 cursor-pointer"
              >
                🔮 GỬI ĐÁP ÁN ĐOÁN LẬT KÈO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Host Modal to judge Mr. White's Guess */}
      {myPlayer?.isHost && hostMrWhitePrompt && currentPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-[#251838] via-[#1a1028] to-[#120a1c] border-2 border-[#ffd875] rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-purple-950/80 border-2 border-purple-400 shadow-lg flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">
              👻
            </div>
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block font-mono">
              PHÁN QUYẾT CỦA TRỌNG TÀI
            </span>
            <h3 className="font-serif font-black text-xl text-[#ffd875] tracking-wide mt-1 mb-2">
              KẺ KHÔNG TÊN ĐOÁN TỪ!
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-3">
              Phù thủy <strong className="text-purple-300 font-bold">{hostMrWhitePrompt.playerName}</strong> đã gửi đáp án đoán từ của phe Học Sinh:
            </p>

            <div className="bg-[#0e0814] p-3.5 rounded-xl border border-purple-500/50 my-2 text-left">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                Từ Mr. White đoán:
              </span>
              <span className="font-serif font-black text-lg text-purple-300 block">
                "{hostMrWhitePrompt.guess}"
              </span>
              <span className="text-[10px] text-amber-400 uppercase font-semibold block mt-2 mb-0.5">
                Từ đúng của Học sinh:
              </span>
              <span className="font-serif font-bold text-base text-[#ffd875] block">
                "{currentPair.studentWord}"
              </span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  sound.playVictoryFanfare();
                  confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                  setWinner('MR_WHITE');
                  setGameStatus('REVEALED');
                  if (netRef.current) {
                    netRef.current.broadcastRoomState({
                      roomCode,
                      hostId: myPlayer.id,
                      status: 'REVEALED',
                      players,
                      config,
                      roundNumber,
                      currentSpeakerId,
                      winner: 'MR_WHITE',
                    });
                    netRef.current.revealAll(currentPair, players);
                  }
                  setHostMrWhitePrompt(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-serif font-bold text-xs tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
              >
                ✔ ĐOÁN ĐÚNG (MR. WHITE THẮNG)
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playDarkReveal();
                  setHostMrWhitePrompt(null);
                  // Check if students win after Mr. White failed
                  const win = evaluateWinCondition(players, config.hostRole);
                  if (win) {
                    setWinner(win);
                    if (netRef.current) {
                      netRef.current.broadcastRoomState({
                        roomCode,
                        hostId: myPlayer.id,
                        status: gameStatus as GameStatus,
                        players,
                        config,
                        roundNumber,
                        currentSpeakerId,
                        winner: win,
                      });
                    }
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#2a1b3d] hover:bg-[#3d2757] text-stone-300 hover:text-white font-serif font-bold text-xs border border-stone-700 transition active:scale-95 cursor-pointer"
              >
                ✕ ĐOÁN SAI (TIẾP TỤC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Floo Chat Trigger - Always accessible */}
      <button
        type="button"
        onClick={() => openFlooDrawer()}
        className="fixed bottom-4 right-4 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#740001] via-[#8e1d13] to-[#740001] hover:from-[#941c14] hover:to-[#b32317] text-[#ffd875] border border-[#ffd875]/80 flex items-center gap-1.5 text-xs font-serif font-bold cursor-pointer transition-all active:scale-95 shadow-[0_4px_25px_rgba(116,0,1,0.7)]"
        title="Mở Mạng Floo (Chat HPVN)"
      >
        <Flame size={16} className="text-[#ffd875] animate-pulse" />
        <span className="hidden sm:inline">Mạng Floo</span>
      </button>

      {/* Embedded Mạng Floo Slide-out Drawer */}
      <FlooChatDrawer />
    </div>
  );
}

export default App;


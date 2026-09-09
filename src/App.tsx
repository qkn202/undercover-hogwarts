import { useState, useEffect, useRef } from 'react';
import type { Player, RoomConfig, RoomState, WordPair, GameStatus, PeerMessage } from './types';
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
import { Crown, LogIn, AlertCircle, LogOut } from 'lucide-react';

const INITIAL_CONFIG: RoomConfig = {
  hostRole: 'PLAYER',
  undercoverCount: 1,
  mrWhiteCount: 0,
  selectedCategories: ['ALL'],
  customPairs: [],
};

export const HOST_DISCONNECT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

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

  // Network Manager Ref
  const netRef = useRef<NetworkManager | null>(null);
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
            (p) =>
              p.id === incomingPlayer.id ||
              (!p.isAi && !p.isHost && p.name.trim().toLowerCase() === incomingPlayer.name.trim().toLowerCase())
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
        // If client is not currently in a room or has no player, NEVER process room sync!
        if (!myPlayer || gameStatus === 'WELCOME') {
          return;
        }

        const state = msg.payload as RoomState;

        // CRITICAL GUARD: If non-host player was previously in room roster and now removed, they were kicked
        if (!myPlayer.isHost) {
          const wasInRoom = players.some((p) => p.id === myPlayer.id);
          const isStillInRoom = state.players.some((p) => p.id === myPlayer.id);
          if (wasInRoom && !isStillInRoom) {
            console.log('[Client] Detected removal from room roster in ROOM_STATE_SYNC');
            cleanupAndExitToWelcome('Bạn đã bị chủ phòng mời ra khỏi phòng.', state.roomCode);
            return;
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
        break;
      }

      case 'ROOM_CLOSED': {
        const reason = msg.payload?.message || 'Chủ phòng đã đóng phòng hoặc kết thúc phiên chơi.';
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

      netRef.current.onPeerLeft = (peerId, playerId) => {
        console.log('[Host] Peer presence left/dropped:', peerId, playerId);
        // Only auto-evict if we are in LOBBY (phòng chờ). In PLAYING mode, positions and cards are preserved.
        if (myPlayer?.isHost && (gameStatus === 'LOBBY' || gameStatus === 'WELCOME')) {
          if (!lobbyDisconnectTimersRef.current.has(playerId)) {
            console.log(`[Host] Scheduling auto-removal of ghost player ${playerId} from lobby in 60s if not returned...`);
            const timer = setTimeout(() => {
              lobbyDisconnectTimersRef.current.delete(playerId);
              setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));

              const isStillOnline = netRef.current?.isPlayerInPresence(playerId);
              if (!isStillOnline) {
                console.log(`[Host] Auto-evicting confirmed ghost player ${playerId} from waiting lobby.`);
                setPlayers((prev) => {
                  const updated = prev.filter((p) => p.id !== playerId);
                  if (netRef.current) {
                    const latestStatus = gameStatusRef.current === 'WELCOME' ? 'LOBBY' : gameStatusRef.current;
                    netRef.current.broadcastRoomState({
                      roomCode,
                      hostId: myPlayer.id,
                      status: latestStatus as GameStatus,
                      players: updated,
                      config,
                      roundNumber,
                    });
                  }
                  return updated;
                });
              }
            }, 60000);

            lobbyDisconnectTimersRef.current.set(playerId, timer);
            setOfflinePlayerIds(Array.from(lobbyDisconnectTimersRef.current.keys()));
          }
        }
      };
    }
  });

  // Handle mobile tab switching & screen unlock: auto-reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[App] Tab resumed / focused. Checking connection status...');

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
            // Socket is healthy: immediately send sync refresh to Host
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
        if (netRef.current && myPlayer && !myPlayer.isHost) {
          console.log('[App] Client tab hidden. Destroying connection to prevent ghosting.');
          // Send explicit leave before destruction just in case
          netRef.current.sendToHost({
            type: 'PLAYER_LEFT',
            senderId: myPlayer.id,
            payload: { playerId: myPlayer.id },
          });
          netRef.current.destroy();
        } else if (myPlayer?.isHost) {
          console.log('[App] Host tab hidden. Keeping connection alive but browser may throttle.');
        }
      }
    };

    const handleOffline = () => {
      console.warn('[App] Device went offline.');
      setConnStatus('ERROR');
      setErrorMsg('Mất kết nối Internet. Vui lòng kiểm tra lại mạng!');
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
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
      if (!effectiveName) {
        effectiveName = `Phù thủy #${Math.floor(100 + Math.random() * 900)}`;
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
    if (!nameToUse) {
      nameToUse = `Phù thủy #${Math.floor(100 + Math.random() * 900)}`;
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
    };

    setMyPlayer(client);
    setPlayers([client]);
    setRoomCode(code);
    setGameStatus('LOBBY');

    saveLocalSession({
      roomCode: code,
      isHost: false,
      player: client,
      gameStatus: 'LOBBY',
      hostDisconnectedAt: null,
    });

    try {
      if (netRef.current) {
        setConnStatus('CONNECTING');
        await netRef.current.initClient(code, client);
        setGameStatus('LOBBY');
        setConnStatus('CONNECTED');
        sound.playVictoryFanfare();
      }
    } catch (err: any) {
      clearLocalSession();
      setConnStatus('IDLE');
      setErrorMsg(
        err?.message?.includes('Timeout')
          ? `Hết thời gian chờ kết nối tới phòng "${code}". Vui lòng kiểm tra lại mã phòng và đảm bảo Chủ phòng đang mở tab!`
          : err?.message || 'Không tìm thấy phòng Hogwarts hoặc lỗi kết nối. Kiểm tra lại mã phòng!'
      );
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

  // Host periodic activity tracker: continuously updates lastActiveTimestamp in localStorage
  useEffect(() => {
    if (!myPlayer?.isHost || !roomCode) return;
    const interval = setInterval(() => {
      const sess = getLocalSession();
      if (sess && sess.isHost) {
        saveLocalSession({
          ...sess,
          lastActiveTimestamp: Date.now(),
          hostDisconnectedAt: null,
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [myPlayer?.isHost, roomCode]);

  // Host beforeunload listener: notify peers on true tab close and destroy connection
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
            message: 'Chủ phòng đã đóng tab.',
          },
        });
        netRef.current.destroy();
      }
    };

    window.addEventListener('beforeunload', handleHostUnload);
    // iOS Safari / Android Chrome typically use visibilitychange or pagehide which we cover above.
    return () => {
      window.removeEventListener('beforeunload', handleHostUnload);
    };
  }, [myPlayer]);

  // Guest beforeunload listener: inform Host when closing tab so nick is immediately removed from lobby
  useEffect(() => {
    const handleGuestUnload = () => {
      if (myPlayer && !myPlayer.isHost && netRef.current) {
        netRef.current.sendToHost({
          type: 'PLAYER_LEFT',
          senderId: myPlayer.id,
          payload: { playerId: myPlayer.id },
        });
        netRef.current.destroy();
      }
    };

    window.addEventListener('beforeunload', handleGuestUnload);
    window.addEventListener('pagehide', handleGuestUnload);
    return () => {
      window.removeEventListener('beforeunload', handleGuestUnload);
      window.removeEventListener('pagehide', handleGuestUnload);
    };
  }, [myPlayer]);

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
        console.log('[Session] Host disconnected for > 10 minutes. Evicting session and resetting.');
        cleanupAndExitToWelcome('Phòng chơi đã tự động giải tán vì chủ phòng đã ngắt kết nối quá 10 phút.');
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
        // Broadcast to all connected clients that the room has closed
        netRef.current.broadcast({
          type: 'ROOM_CLOSED',
          senderId: myPlayer.id,
          payload: { message: 'Chủ phòng đã đóng phòng hoặc kết thúc phiên chơi.' },
        });
      } else {
        netRef.current.sendToHost({
          type: 'PLAYER_LEFT',
          senderId: myPlayer.id,
          payload: { playerId: myPlayer.id },
        });
      }
    }
    // Allow 120ms for the message to be dispatched over websocket buffer before teardown
    setTimeout(() => {
      cleanupAndExitToWelcome();
    }, 120);
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
    const activePlayers = players.filter((p) => {
      if (p.isAi || p.isHost) return true;
      if (lobbyDisconnectTimersRef.current.has(p.id) && !netRef.current?.isPlayerInPresence(p.id)) {
        console.log(`[Host] Evicting ghost player before game start: ${p.name}`);
        clearTimeout(lobbyDisconnectTimersRef.current.get(p.id));
        lobbyDisconnectTimersRef.current.delete(p.id);
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
    setGameStatus('LOBBY');
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
        players,
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0813] text-stone-200 selection:bg-[#740001] selection:text-[#ffd875]">
      {/* Top Header */}
      <Header
        roomCode={gameStatus !== 'WELCOME' ? roomCode : undefined}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenCustomWords={() => setIsCustomWordsOpen(true)}
        onOpenPassAndPlay={() => setIsPassAndPlayOpen(true)}
        onLeaveRoom={gameStatus !== 'WELCOME' ? handleLeaveRoom : undefined}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
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
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
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
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white p-1">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 1: WELCOME & ROOM ENTRANCE */}
        {(gameStatus === 'WELCOME' || !myPlayer) && (
          <div className="w-full max-w-md mx-auto flex flex-col gap-6 animate-fadeIn">
            {/* Title & Introduction */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#c8aa6e] via-[#740001] to-[#120d18] p-0.5 shadow-2xl border border-[#f3d994]/50">
                <div className="w-full h-full rounded-2xl bg-[#120d18] flex items-center justify-center text-3xl">
                  ⚡
                </div>
              </div>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#f3d994] tracking-wide">
                HỌC VIỆN HOGWARTS
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Trò chơi tìm kiếm Gián Điệp (Undercover) dành cho 3 - 10 phù thủy. Phát thẻ bí mật trực tiếp lên từng điện thoại!
              </p>
            </div>

            {/* Profile Setup Box */}
            <div className="bg-[#181122]/90 rounded-2xl p-5 border border-[#c8aa6e]/40 shadow-xl flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#ffd875] uppercase block mb-1.5">
                  Tên Phù Thủy Của Bạn
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={18}
                  placeholder="Nhập tên của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100b17] border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-[#c8aa6e] shadow-inner font-medium"
                />
              </div>
            </div>


            {/* Entrance Buttons */}
            <div className="flex flex-col gap-3">
              {/* Create Room Button */}
              <button
                onClick={handleCreateRoom}
                disabled={connStatus === 'CONNECTING'}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#740001] via-[#a31a1a] to-[#740001] hover:from-[#8c0304] hover:to-[#b01e1e] text-amber-100 font-serif font-bold text-sm sm:text-base tracking-wider border-2 border-amber-500/50 shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Crown size={18} className="text-[#f3d994]" />
                <span>TẠO PHÒNG MỚI (LÀM HOST)</span>
              </button>

              {/* Join Room Box */}
              <div className="bg-[#140e1f] p-3 rounded-2xl border border-stone-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="NHẬP MÃ PHÒNG (VD: HOGW)"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#0d0914] border border-stone-700 text-xs font-mono font-bold tracking-widest text-[#f3d994] uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-[#c8aa6e]"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={connStatus === 'CONNECTING'}
                  className="px-4 py-2.5 rounded-xl bg-[#2e1c45] hover:bg-[#402761] text-[#f3d994] font-serif font-bold text-xs border border-[#c8aa6e]/40 flex items-center gap-1.5 transition-all"
                >
                  <LogIn size={15} />
                  <span>Vào</span>
                </button>
              </div>

              {/* Offline fallback mode */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setIsPassAndPlayOpen(true)}
                  className="text-xs text-stone-400 hover:text-[#ffd875] underline decoration-dotted transition-colors"
                >
                  📱 Hoặc chơi chung trên 1 máy điện thoại (Chuyền tay nhau)
                </button>
              </div>
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
              <SecretCard
                role={myPlayer.role}
                word={myPlayer.word}
                playerName={myPlayer.name}
                roundNumber={roundNumber}
                speakingOrder={myPlayer.speakingOrder}
              />
            )}

            {/* Speaking Turn Order Roster during PLAYING phase */}
            {gameStatus === 'PLAYING' && (
              <SpeakingOrderBanner
                players={players}
                myPlayerId={myPlayer.id}
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
                onRevealAll={handleRevealAll}
                onNextRound={handleNextRound}
                onBackToLobby={handleBackToLobby}
                onToggleEliminated={handleToggleEliminated}
              />
            ) : (
              gameStatus === 'REVEALED' && (
                <div className="w-full max-w-md bg-gradient-to-b from-[#1f142e] via-[#160d23] to-[#10081a] p-5 sm:p-6 rounded-2xl border-2 border-[#ffd875]/60 text-center animate-fadeIn shadow-2xl flex flex-col items-center gap-4">
                  {/* Header */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-900/40 border border-[#ffd875]/40 flex items-center justify-center text-3xl mb-2 shadow-inner">
                      🏆
                    </div>
                    <h4 className="font-serif font-bold text-xl sm:text-2xl text-[#f3d994] tracking-wide">
                      Ván Đấu Đã Kết Thúc!
                    </h4>
                    <p className="text-xs text-stone-300 mt-1">
                      Quản trò đã mở toàn bộ kết quả vòng đấu #{roundNumber}
                    </p>
                  </div>

                  {/* Revealed Word Pair */}
                  {currentPair && (
                    <div className="w-full bg-[#0c0812]/90 rounded-xl p-3.5 border border-[#c8aa6e]/40 text-left shadow-inner">
                      <span className="text-[11px] text-[#ffd875] font-semibold uppercase tracking-wider block mb-2 text-center font-serif">
                        Cặp Từ Bí Mật Vòng Này
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#1f152b] p-2.5 rounded-lg border border-amber-500/30">
                          <span className="text-[10px] text-amber-400 font-semibold block mb-0.5">
                            ⚡ Học Sinh:
                          </span>
                          <span className="font-bold text-[#f3d994] text-sm break-words">
                            {currentPair.studentWord}
                          </span>
                        </div>
                        <div className="bg-[#121c17] p-2.5 rounded-lg border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">
                            🐍 Tử Thần:
                          </span>
                          <span className="font-bold text-emerald-300 text-sm break-words">
                            {currentPair.undercoverWord}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Player Roster Breakdown */}
                  {players.length > 0 && (
                    <div className="w-full bg-[#0c0812]/80 rounded-xl p-3 border border-stone-800 text-left max-h-48 overflow-y-auto custom-scrollbar">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold block mb-2 text-center font-serif">
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
                              className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-colors ${
                                p.isEliminated
                                  ? 'bg-stone-900/60 border-stone-800 text-stone-500 line-through opacity-70'
                                  : isSpectator
                                  ? 'bg-[#140e1e]/60 border-stone-800 text-stone-400'
                                  : isDeathEater
                                  ? 'bg-red-950/40 border-red-800/40 text-red-200'
                                  : isMrWhite
                                  ? 'bg-purple-950/40 border-purple-800/40 text-purple-200'
                                  : 'bg-[#1a1224] border-stone-800 text-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {typeof p.speakingOrder === 'number' && (
                                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#ffd875] border border-amber-500/40 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                                    {p.speakingOrder}
                                  </span>
                                )}
                                <span className="font-medium text-stone-200">
                                  {p.name}
                                </span>
                                {p.id === myPlayer.id && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 font-medium">
                                {isSpectator ? (
                                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[11px] font-medium border border-stone-700">
                                    👀 Khán Giả
                                  </span>
                                ) : isDeathEater ? (
                                  <span className="px-2 py-0.5 rounded bg-red-900/80 text-red-300 text-[11px] font-serif font-bold border border-red-700/60">
                                    🐍 Tử Thần
                                  </span>
                                ) : isMrWhite ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-900/80 text-purple-300 text-[11px] font-serif font-bold border border-purple-700/60">
                                    👻 Kẻ Không Tên
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 text-[11px] font-serif font-bold border border-amber-700/50">
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
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-red-200 hover:text-white font-serif font-bold text-sm shadow-xl border border-red-700/60 transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      <LogOut size={16} />
                      <span>Rời Phòng & Về Trang Chủ</span>
                    </button>
                    <p className="text-[11px] text-stone-400 italic leading-relaxed">
                      💡 Bạn có thể tự do bấm <strong>Rời Phòng</strong> ngay lập tức để thoát ra mà không cần đợi Quản trò thao tác.
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
    </div>
  );
}

export default App;


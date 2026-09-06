import Peer, { type DataConnection } from 'peerjs';
import type { PeerMessage, Player, RoomState, WordPair, Role } from '../types';

export const PEER_PREFIX = 'hogw-undercover-';

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // Google Public STUN (UDP 19302)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Cloudflare STUN (Standard STUN Port 3478)
  { urls: 'stun:stun.cloudflare.com:3478' },
  // Twilio Global STUN (Standard STUN Port 3478)
  { urls: 'stun:global.stun.twilio.com:3478' },
  // Mozilla Public STUN (Port 3478)
  { urls: 'stun:stun.services.mozilla.com:3478' },
  // Nextcloud & Open STUN on standard HTTPS port 443 (Crucial for desktop corporate/school firewalls blocking 19302/3478)
  { urls: 'stun:stun.nextcloud.com:443' },
  { urls: 'stun:stun.syncthing.net:3478' },
];

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private playerConnections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private myPlayerId: string = '';
  private roomCode: string = '';

  public onMessageReceived?: (msg: PeerMessage) => void;
  public onConnectionStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR', errorMsg?: string) => void;
  public onPeerJoined?: (peerId: string) => void;
  public onPeerLeft?: (peerId: string, playerId: string) => void;
  public onHostDisconnected?: (disconnectedAt: number) => void;
  public onHostReconnected?: () => void;

  private hostDisconnectedAt: number | null = null;
  private missedPongs: number = 0;

  constructor() {}

  /**
   * Host initializes room with a room code (e.g. "HOGW")
   */
  public async initHost(roomCode: string, hostPlayer: Player): Promise<string> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = hostPlayer.id;

    const hostPeerId = `${PEER_PREFIX}${this.roomCode.toLowerCase()}`;

    // Also init BroadcastChannel for instant local multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(`bc-${hostPeerId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as PeerMessage;
        if (msg && msg.senderId !== this.myPlayerId) {
          this.handleIncomingMessage(msg);
        }
      };
    }

    return new Promise((resolve, reject) => {
      this.onConnectionStatusChange?.('CONNECTING');
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          this.onConnectionStatusChange?.(
            'ERROR',
            'Không thể khởi tạo phòng P2P (Hết thời gian chờ máy chủ tín hiệu). Vui lòng tải lại trang hoặc thử lại!'
          );
          try {
            this.peer?.destroy();
          } catch {}
          reject(new Error('Host init timeout'));
        }
      }, 10000);

      const tryCreatePeer = (attempt = 1) => {
        try {
          this.peer = new Peer(hostPeerId, {
            debug: 1,
            config: {
              iceServers: DEFAULT_ICE_SERVERS,
              iceCandidatePoolSize: 10,
            },
          });

          this.peer.on('open', (id) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);
            console.log('[Host] Peer opened with ID:', id);
            this.onConnectionStatusChange?.('CONNECTED');
            this.broadcast({
              type: 'HOST_RECONNECTED',
              senderId: this.myPlayerId,
              payload: { timestamp: Date.now() },
            });
            resolve(id);
          });

          this.peer.on('connection', (conn) => {
            console.log('[Host] Incoming peer connection:', conn.peer);
            this.setupHostConnection(conn);
          });

          this.peer.on('error', (err) => {
            console.warn(`[Host] Peer error (attempt ${attempt}):`, err);
            // If ID already taken on refresh, wait 1.2s and retry once (old socket cleanup)
            if (err.type === 'unavailable-id' && attempt < 2) {
              console.log('[Host] ID unavailable, waiting 1.2s to retry (old socket cleanup)...');
              try {
                this.peer?.destroy();
              } catch {}
              setTimeout(() => {
                if (!isSettled) tryCreatePeer(attempt + 1);
              }, 1200);
              return;
            }

            if (!isSettled) {
              isSettled = true;
              clearTimeout(timer);
              if (err.type === 'unavailable-id') {
                this.onConnectionStatusChange?.('ERROR', 'Mã phòng này đang bị chiếm dụng. Vui lòng bấm Tạo Mã Mới.');
              } else {
                this.onConnectionStatusChange?.('ERROR', `Lỗi mạng: ${err.type || err.message}`);
              }
              reject(err);
            }
          });

          this.peer.on('disconnected', () => {
            console.log('[Host] Disconnected from signaling server, attempting reconnect...');
            this.peer?.reconnect();
          });
        } catch (err: any) {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            this.onConnectionStatusChange?.('ERROR', err.message);
            reject(err);
          }
        }
      };

      tryCreatePeer(1);
    });
  }

  /**
   * Client joins room via Host's code
   */
  public async initClient(roomCode: string, player: Player): Promise<void> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = player.id;

    const hostPeerId = `${PEER_PREFIX}${this.roomCode.toLowerCase()}`;
    // Generate unique client peer ID with random suffix to prevent ID collision across tabs/refreshes
    const tabSuffix = Math.random().toString(36).substring(2, 6);
    const clientPeerId = `c-${player.id}-${tabSuffix}`;

    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(`bc-${hostPeerId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as PeerMessage;
        if (msg && msg.senderId !== this.myPlayerId) {
          this.handleIncomingMessage(msg);
        }
      };
    }

    return new Promise((resolve, reject) => {
      this.onConnectionStatusChange?.('CONNECTING');
      let isSettled = false;
      let conn: DataConnection | null = null;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          this.onConnectionStatusChange?.(
            'ERROR',
            `Không thể kết nối P2P tới phòng "${this.roomCode}". Kiểm tra lại mã phòng hoặc Chủ phòng có thể đã tắt tab/đổi mạng.`
          );
          try {
            conn?.close();
            this.peer?.destroy();
          } catch {}
          reject(new Error(`Timeout connecting to room ${this.roomCode}`));
        }
      }, 10000);

      try {
        this.peer = new Peer(clientPeerId, {
          debug: 1,
          config: {
            iceServers: DEFAULT_ICE_SERVERS,
            iceCandidatePoolSize: 10,
          },
        });

        this.peer.on('open', () => {
          console.log('[Client] Connected to signaling, contacting host:', hostPeerId);
          conn = this.peer!.connect(hostPeerId, { reliable: true });

          conn.on('open', () => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);
            console.log('[Client] Connected to Host directly!');
            this.connections.set('host', conn!);
            this.hostDisconnectedAt = null;
            this.missedPongs = 0;
            this.onHostReconnected?.();
            this.onConnectionStatusChange?.('CONNECTED');
            this.startHeartbeat(conn!);

            // Send Join Request
            const joinMsg: PeerMessage = {
              type: 'JOIN_REQUEST',
              senderId: this.myPlayerId,
              payload: player,
            };
            this.sendToHost(joinMsg);
            resolve();
          });

          conn.on('data', (data) => {
            const msg = data as PeerMessage;
            this.missedPongs = 0;
            if (this.hostDisconnectedAt) {
              this.hostDisconnectedAt = null;
              this.onHostReconnected?.();
            }
            if (msg?.type === 'PONG') {
              // Heartbeat acknowledged
              return;
            }
            this.handleIncomingMessage(msg);
          });

          conn.on('close', () => {
            console.log('[Client] Connection to host closed. Pausing heartbeat...');
            this.stopHeartbeat();
            this.connections.delete('host');
            if (!this.hostDisconnectedAt) {
              this.hostDisconnectedAt = Date.now();
              this.onHostDisconnected?.(this.hostDisconnectedAt);
            }
            // Attempt silent reconnect if tab is active
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
              setTimeout(async () => {
                if (this.roomCode && this.myPlayerId) {
                  const ok = await this.reconnectClient(this.roomCode, player);
                  if (!ok) {
                    this.onConnectionStatusChange?.('DISCONNECTED', 'Chủ phòng đã ngắt kết nối hoặc tắt tab.');
                  }
                }
              }, 800);
            }
          });

          conn.on('error', (err) => {
            console.warn('[Client] Conn error:', err);
            this.stopHeartbeat();
            this.connections.delete('host');
            if (!this.hostDisconnectedAt) {
              this.hostDisconnectedAt = Date.now();
              this.onHostDisconnected?.(this.hostDisconnectedAt);
            }
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timer);
              this.onConnectionStatusChange?.('ERROR', 'Không thể kết nối tới phòng. Kiểm tra lại mã phòng!');
              reject(err);
            }
          });
        });

        this.peer.on('error', (err) => {
          console.warn('[Client] Peer error:', err);
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            let userMsg = 'Lỗi mạng hoặc không tìm thấy phòng Hogwarts.';
            if (err.type === 'peer-unavailable') {
              userMsg = `Phòng "${this.roomCode}" hiện không khả dụng. Vui lòng kiểm tra lại mã phòng hoặc nhờ Chủ phòng mở phòng!`;
            } else if (err.type === 'network' || err.type === 'server-error') {
              userMsg = 'Không thể kết nối máy chủ điều phối mạng (Signaling Server). Vui lòng thử lại sau vài giây!';
            }
            this.onConnectionStatusChange?.('ERROR', userMsg);
            reject(err);
          }
        });
      } catch (err: any) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          this.onConnectionStatusChange?.('ERROR', err.message);
          reject(err);
        }
      }
    });
  }

  private heartbeatTimer: any = null;

  private startHeartbeat(hostConn: DataConnection): void {
    this.stopHeartbeat();
    this.missedPongs = 0;
    this.heartbeatTimer = setInterval(() => {
      if (hostConn && hostConn.open) {
        // If 3 consecutive pings went unacknowledged and no other data arrived (~15s)
        if (this.missedPongs >= 3) {
          console.warn('[Client] Host unresponsive after multiple heartbeats.');
          if (!this.hostDisconnectedAt) {
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
          }
        }
        try {
          this.missedPongs++;
          hostConn.send({
            type: 'PING',
            senderId: this.myPlayerId,
            payload: { timestamp: Date.now() },
          });
        } catch (e) {
          console.warn('[Client] Heartbeat ping failed:', e);
          if (!this.hostDisconnectedAt) {
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
          }
        }
      } else {
        if (!this.hostDisconnectedAt) {
          this.hostDisconnectedAt = Date.now();
          this.onHostDisconnected?.(this.hostDisconnectedAt);
        }
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Check if client's direct connection to host is active and open
   */
  public isHostConnected(): boolean {
    const conn = this.connections.get('host');
    return !!(conn && conn.open);
  }

  /**
   * Reconnect Host peer to signaling server if dropped while in background
   */
  public reconnectHostIfNeeded(): void {
    if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
      console.log('[Host] Reconnecting host peer to signaling server...');
      try {
        this.peer.reconnect();
      } catch (e) {
        console.warn('[Host] Reconnect error:', e);
      }
    }
  }

  /**
   * Seamlessly reconnect client to host when tab becomes visible after being backgrounded
   */
  public async reconnectClient(roomCode: string, player: Player): Promise<boolean> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = player.id;
    const hostPeerId = `${PEER_PREFIX}${this.roomCode.toLowerCase()}`;

    console.log('[Client] Attempting seamless reconnect to host:', hostPeerId);

    // If existing connection is already open, simply send a refresh sync request
    const existingConn = this.connections.get('host');
    if (existingConn && existingConn.open) {
      console.log('[Client] Host connection is still open. Sending refresh sync...');
      this.sendToHost({
        type: 'JOIN_REQUEST',
        senderId: this.myPlayerId,
        payload: player,
      });
      return true;
    }

    // Ensure peer signaling is active
    if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
      console.log('[Client] Reconnecting peer signaling...');
      try {
        this.peer.reconnect();
      } catch (e) {
        console.warn('[Client] Peer reconnect warning:', e);
      }

      await new Promise<void>((resolve) => {
        if (!this.peer || !this.peer.disconnected) {
          resolve();
          return;
        }
        const handler = () => {
          this.peer?.off('open', handler);
          resolve();
        };
        this.peer.once('open', handler);
        setTimeout(resolve, 1500);
      });
    }

    // If peer is completely destroyed, disconnected, or missing, re-init cleanly
    if (!this.peer || this.peer.destroyed || this.peer.disconnected) {
      console.log('[Client] Rebuilding peer from scratch...');
      try {
        this.destroy();
        await this.initClient(roomCode, player);
        return true;
      } catch (e) {
        console.warn('[Client] Full re-init failed:', e);
        return false;
      }
    }

    // Establish a new direct connection to the Host
    return new Promise((resolve) => {
      try {
        const conn = this.peer!.connect(hostPeerId, { reliable: true });

        const timeout = setTimeout(() => {
          console.warn('[Client] Reconnect attempt timed out.');
          if (!this.hostDisconnectedAt) {
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
          }
          resolve(false);
        }, 5000);

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log('[Client] Successfully reconnected to Host!');
          this.connections.set('host', conn);
          this.hostDisconnectedAt = null;
          this.missedPongs = 0;
          this.onHostReconnected?.();
          this.onConnectionStatusChange?.('CONNECTED');
          this.startHeartbeat(conn);

          // Re-send join request to get fresh state and secret card
          this.sendToHost({
            type: 'JOIN_REQUEST',
            senderId: this.myPlayerId,
            payload: player,
          });
          resolve(true);
        });

        conn.on('data', (data) => {
          const msg = data as PeerMessage;
          this.missedPongs = 0;
          if (this.hostDisconnectedAt) {
            this.hostDisconnectedAt = null;
            this.onHostReconnected?.();
          }
          if (msg?.type === 'PONG') return;
          this.handleIncomingMessage(msg);
        });

        conn.on('close', () => {
          this.stopHeartbeat();
          this.connections.delete('host');
          if (!this.hostDisconnectedAt) {
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
          }
          console.log('[Client] Host connection closed in background.');
        });

        conn.on('error', (err) => {
          clearTimeout(timeout);
          console.warn('[Client] Reconnect conn error:', err);
          if (!this.hostDisconnectedAt) {
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
          }
          resolve(false);
        });
      } catch (e) {
        console.warn('[Client] Reconnect exception:', e);
        if (!this.hostDisconnectedAt) {
          this.hostDisconnectedAt = Date.now();
          this.onHostDisconnected?.(this.hostDisconnectedAt);
        }
        resolve(false);
      }
    });
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.onPeerJoined?.(conn.peer);
    });

    conn.on('data', (data) => {
      const msg = data as PeerMessage;
      if (msg?.senderId) {
        this.playerConnections.set(msg.senderId, conn);
      }
      if (msg?.type === 'PING') {
        // Auto-reply with PONG to keep connection alive
        try {
          conn.send({
            type: 'PONG',
            senderId: this.myPlayerId,
            payload: { timestamp: Date.now() },
          });
        } catch (e) {
          // ignore
        }
        return;
      }
      this.handleIncomingMessage(msg);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      for (const [pId, c] of this.playerConnections.entries()) {
        if (c === conn) this.playerConnections.delete(pId);
      }
      const playerId = conn.peer.replace(/^client-/, '');
      this.onPeerLeft?.(conn.peer, playerId);
    });

    conn.on('error', (err) => {
      console.warn('[Host] Connection error with peer:', conn.peer, err);
      this.connections.delete(conn.peer);
      for (const [pId, c] of this.playerConnections.entries()) {
        if (c === conn) this.playerConnections.delete(pId);
      }
      const playerId = conn.peer.replace(/^client-/, '');
      this.onPeerLeft?.(conn.peer, playerId);
    });
  }

  /**
   * Check if a client player currently has an active connection
   */
  public isPlayerConnected(playerId: string): boolean {
    const peerId = `client-${playerId}`;
    const conn = this.connections.get(peerId);
    return !!(conn && conn.open);
  }

  private handleIncomingMessage(msg: PeerMessage) {
    if (msg?.type === 'HOST_DISCONNECTED') {
      const at = msg.payload?.disconnectedAt || Date.now();
      this.hostDisconnectedAt = at;
      this.onHostDisconnected?.(at);
    } else if (msg?.type === 'HOST_RECONNECTED') {
      this.hostDisconnectedAt = null;
      this.missedPongs = 0;
      this.onHostReconnected?.();
    } else if (this.hostDisconnectedAt) {
      // Any incoming message from host signifies host is active
      this.hostDisconnectedAt = null;
      this.missedPongs = 0;
      this.onHostReconnected?.();
    }

    if (this.onMessageReceived) {
      this.onMessageReceived(msg);
    }
  }

  /**
   * Host broadcasts public room state to all clients (without secret words of others)
   */
  public broadcastRoomState(state: RoomState): void {
    // Sanitize state for public broadcast: do not reveal role or word of players during PLAYING
    const sanitizedPlayers = state.players.map((p) => {
      if (state.status === 'PLAYING') {
        return {
          ...p,
          role: undefined,
          word: undefined,
        };
      }
      return p;
    });

    const sanitizedState: RoomState = {
      ...state,
      players: sanitizedPlayers,
      currentPair: state.status === 'REVEALED' ? state.currentPair : undefined,
    };

    const msg: PeerMessage = {
      type: 'ROOM_STATE_SYNC',
      senderId: this.myPlayerId,
      payload: sanitizedState,
    };

    this.broadcast(msg);
  }

  /**
   * Host sends secret card directly to a specific player
   */
  public sendSecretCard(
    playerId: string,
    card: { role: Role; word: string | null; hint?: string; speakingOrder?: number }
  ): void {
    const msg: PeerMessage = {
      type: 'ASSIGN_SECRET_CARD',
      senderId: this.myPlayerId,
      payload: {
        targetPlayerId: playerId,
        ...card,
      },
    };

    // Try direct peer connection first
    const conn = this.playerConnections.get(playerId) || this.connections.get(`client-${playerId}`);
    if (conn && conn.open) {
      try {
        conn.send(msg);
      } catch (e) {
        console.warn('[Host] Direct card send error:', e);
      }
    }

    // Broadcast via network and BroadcastChannel
    this.broadcast(msg);
  }

  /**
   * Host reveals all cards to everyone at round end
   */
  public revealAll(pair: WordPair, players: Player[]): void {
    const msg: PeerMessage = {
      type: 'REVEAL_ALL_CARDS',
      senderId: this.myPlayerId,
      payload: {
        currentPair: pair,
        players,
      },
    };
    this.broadcast(msg);
  }

  public sendRename(playerId: string, newName: string): void {
    this.sendToHost({
      type: 'RENAME_PLAYER',
      senderId: this.myPlayerId,
      payload: { playerId, newName },
    });
  }

  public sendToHost(msg: PeerMessage): void {
    const hostConn = this.connections.get('host');
    if (hostConn && hostConn.open) {
      hostConn.send(msg);
    }
    // Also post to local BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg);
    }
  }

  public broadcast(msg: PeerMessage): void {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg);
    }
  }

  public destroy(): void {
    this.stopHeartbeat();
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

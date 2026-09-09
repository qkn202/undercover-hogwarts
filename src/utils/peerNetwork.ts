import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { PeerMessage, Player, RoomState, WordPair, Role } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fxucyrofcsuqtlkukcrx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zEiG2Py5kDmGhkTgw0uWIA_We0rOCGu';

export class NetworkManager {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private roomCode: string = '';
  private myPlayerId: string = '';
  private hostPresent: boolean = true;
  private hostDisconnectedAt: number | null = null;
  private hostDisconnectTimer: any = null;
  private heartbeatInterval: any = null;

  public onMessageReceived?: (msg: PeerMessage) => void;
  public onConnectionStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR', errorMsg?: string) => void;
  public onPeerJoined?: (peerId: string) => void;
  public onPeerLeft?: (peerId: string, playerId: string) => void;
  public onHostDisconnected?: (disconnectedAt: number) => void;
  public onHostReconnected?: () => void;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }

  public isSocketHealthy(): boolean {
    if (!this.channel) return false;
    const isJoined = this.channel.state === 'joined';
    const isSocketConnected = (this.supabase as any)?.realtime?.isConnected?.() ?? true;
    return isJoined && isSocketConnected;
  }

  private checkIsHostInPresence(): boolean {
    if (!this.channel) return false;
    const presenceState = this.channel.presenceState() || {};
    for (const key in presenceState) {
      const list = presenceState[key] as any[];
      if (list && list.some((p) => p.isHost)) {
        return true;
      }
    }
    return false;
  }

  public isPlayerInPresence(playerId: string): boolean {
    if (!this.channel) return false;
    const presenceState = this.channel.presenceState() || {};
    const list = presenceState[playerId] as any[];
    return !!(list && list.length > 0);
  }

  public getPresentPlayerIds(): string[] {
    if (!this.channel) return [];
    const presenceState = this.channel.presenceState() || {};
    return Object.keys(presenceState).filter(key => {
      const list = presenceState[key] as any[];
      return list && list.length > 0;
    });
  }

  private startHeartbeat(isHost: boolean) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.channel && this.channel.state === 'joined') {
        if (isHost) {
          // Host sends lightweight ping to keep mobile cellular NAT ports open
          this.broadcast({
            type: 'PING',
            senderId: this.myPlayerId,
            payload: { timestamp: Date.now() },
          });
        }
      }
    }, 12000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Host initializes room via Supabase Realtime Channel
   */
  public async initHost(roomCode: string, hostPlayer: Player): Promise<string> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = hostPlayer.id;

    this.onConnectionStatusChange?.('CONNECTING');

    return new Promise((resolve, reject) => {
      let isSettled = false;
      const timeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          this.onConnectionStatusChange?.('ERROR', 'Không thể tạo phòng. Vui lòng kiểm tra kết nối mạng!');
          reject(new Error('Timeout connecting to Supabase realtime'));
        }
      }, 25000);

      try {
        if (this.channel) {
          try { this.supabase.removeChannel(this.channel); } catch {}
          this.channel = null;
        }
        try { this.supabase.realtime.disconnect(); } catch {}
        
        // Completely recreate the Supabase client to ensure a pristine WebSocket connection
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: { params: { eventsPerSecond: 20 } },
        });

        const channelName = `room-${this.roomCode.toLowerCase()}`;
        this.channel = this.supabase.channel(channelName, {
          config: {
            presence: { key: this.myPlayerId },
            broadcast: { self: false },
          },
        });

        // Listen for all broadcast messages
        this.channel.on('broadcast', { event: 'game_message' }, (payload: any) => {
          const msg = payload.payload as PeerMessage;
          if (msg && msg.senderId !== this.myPlayerId) {
            this.handleIncomingMessage(msg);
          }
        });

        // Track presence to detect join/leave
        this.channel.on('presence', { event: 'join' }, (payload: any) => {
          const key = payload?.key;
          if (key && key !== this.myPlayerId) {
            console.log('[Supabase Host] Player joined presence:', key);
            this.onPeerJoined?.(key);
          }
        });

        this.channel.on('presence', { event: 'leave' }, (payload: any) => {
          const key = payload?.key;
          if (key && key !== this.myPlayerId) {
            console.log('[Supabase Host] Player left presence:', key);
            this.onPeerLeft?.(key, key);
          }
        });

        this.channel.subscribe(async (status) => {
          console.log('[Supabase Host] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeout);
              await this.channel?.track({
                id: this.myPlayerId,
                name: hostPlayer.name,
                isHost: true,
                onlineAt: Date.now(),
              });
              this.startHeartbeat(true);
              this.onConnectionStatusChange?.('CONNECTED');
              this.broadcast({
                type: 'HOST_RECONNECTED',
                senderId: this.myPlayerId,
                payload: { timestamp: Date.now() },
              });
              resolve(this.roomCode);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeout);
              this.onConnectionStatusChange?.('ERROR', 'Lỗi kết nối phòng Supabase.');
              reject(new Error(`Supabase channel ${status}`));
            }
          }
        });
      } catch (err: any) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          this.onConnectionStatusChange?.('ERROR', err?.message || 'Lỗi khởi tạo phòng.');
          reject(err);
        }
      }
    });
  }

  /**
   * Client joins room via Host code
   */
  public async initClient(roomCode: string, player: Player): Promise<void> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = player.id;

    this.onConnectionStatusChange?.('CONNECTING');

    return new Promise((resolve, reject) => {
      let isSettled = false;
      const timeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          this.onConnectionStatusChange?.(
            'ERROR',
            `Không thể kết nối tới phòng "${this.roomCode}". Vui lòng kiểm tra lại mã phòng!`
          );
          reject(new Error(`Timeout connecting to room ${this.roomCode}`));
        }
      }, 25000);

      try {
        if (this.channel) {
          try { this.supabase.removeChannel(this.channel); } catch {}
          this.channel = null;
        }
        try { this.supabase.realtime.disconnect(); } catch {}
        
        // Completely recreate the Supabase client to ensure a pristine WebSocket connection
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: { params: { eventsPerSecond: 20 } },
        });

        const channelName = `room-${this.roomCode.toLowerCase()}`;
        this.channel = this.supabase.channel(channelName, {
          config: {
            presence: { key: this.myPlayerId },
            broadcast: { self: false },
          },
        });

        // Listen for all broadcast messages
        this.channel.on('broadcast', { event: 'game_message' }, (payload: any) => {
          const msg = payload.payload as PeerMessage;
          if (msg && msg.senderId !== this.myPlayerId) {
            this.handleIncomingMessage(msg);
          }
        });

        // Track presence to detect if Host goes offline with grace period
        this.channel.on('presence', { event: 'sync' }, () => {
          const hostOnline = this.checkIsHostInPresence();

          if (hostOnline) {
            if (this.hostDisconnectTimer) {
              clearTimeout(this.hostDisconnectTimer);
              this.hostDisconnectTimer = null;
            }
            if (!this.hostPresent) {
              console.log('[Supabase Client] Host detected back online via presence.');
              this.hostPresent = true;
              this.hostDisconnectedAt = null;
              this.onHostReconnected?.();
            }
          } else {
            // Grace period: do not immediately declare host disconnected on brief tab switches
            if (this.hostPresent && !this.hostDisconnectTimer) {
              console.log('[Supabase Client] Host presence not found in sync, starting 6s grace timer...');
              this.hostDisconnectTimer = setTimeout(() => {
                this.hostDisconnectTimer = null;
                if (!this.checkIsHostInPresence()) {
                  console.log('[Supabase Client] Host presence confirmed lost after 6s grace period.');
                  this.hostPresent = false;
                  this.hostDisconnectedAt = Date.now();
                  this.onHostDisconnected?.(this.hostDisconnectedAt);
                }
              }, 6000);
            }
          }
        });

        this.channel.on('presence', { event: 'leave' }, (payload: any) => {
          const leftPresences = payload?.leftPresences;
          const hostLeft = Array.isArray(leftPresences) && leftPresences.some((p: any) => p?.isHost);
          if (hostLeft) {
            if (this.hostPresent && !this.hostDisconnectTimer) {
              console.log('[Supabase Client] Host leave event received, starting 6s grace timer...');
              this.hostDisconnectTimer = setTimeout(() => {
                this.hostDisconnectTimer = null;
                if (!this.checkIsHostInPresence()) {
                  console.log('[Supabase Client] Host confirmed left after grace period.');
                  this.hostPresent = false;
                  this.hostDisconnectedAt = Date.now();
                  this.onHostDisconnected?.(this.hostDisconnectedAt);
                }
              }, 6000);
            }
          }
        });

        this.channel.subscribe(async (status) => {
          console.log('[Supabase Client] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeout);

              await this.channel?.track({
                id: this.myPlayerId,
                name: player.name,
                isHost: false,
                onlineAt: Date.now(),
              });

              this.startHeartbeat(false);
              this.hostPresent = true;
              this.hostDisconnectedAt = null;
              this.onHostReconnected?.();
              this.onConnectionStatusChange?.('CONNECTED');

              // Send Join Request to Host immediately
              this.sendToHost({
                type: 'JOIN_REQUEST',
                senderId: this.myPlayerId,
                payload: player,
              });

              resolve();
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeout);
              this.onConnectionStatusChange?.('ERROR', 'Không thể kết nối kênh phòng.');
              reject(new Error(`Supabase client ${status}`));
            }
          }
        });
      } catch (err: any) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          this.onConnectionStatusChange?.('ERROR', err?.message || 'Lỗi tham gia phòng.');
          reject(err);
        }
      }
    });
  }

  public isHostConnected(): boolean {
    if (!this.channel) return false;
    return this.hostPresent && this.isSocketHealthy();
  }

  public async reconnectHostIfNeeded(hostPlayer?: Player): Promise<void> {
    if (!this.channel || this.channel.state !== 'joined' || !this.isSocketHealthy()) {
      console.log('[Supabase Host] Channel dead or disconnected. Re-subscribing...');
      if (this.roomCode && hostPlayer) {
        try {
          await this.initHost(this.roomCode, hostPlayer);
        } catch (e) {
          console.warn('[Supabase Host] Failed to re-init host:', e);
        }
      } else if (this.channel) {
        this.channel.subscribe();
      }
    } else {
      if (hostPlayer) {
        this.channel.track({
          id: this.myPlayerId,
          name: hostPlayer.name,
          isHost: true,
          onlineAt: Date.now(),
        }).catch(() => {});
      }
      this.broadcast({
        type: 'HOST_RECONNECTED',
        senderId: this.myPlayerId,
        payload: { timestamp: Date.now() },
      });
    }
  }

  public async reconnectClient(roomCode: string, player: Player): Promise<boolean> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = player.id;

    console.log('[Supabase Client] Reconnecting client to room:', this.roomCode);

    if (this.channel && this.channel.state === 'joined') {
      // Re-track presence to ensure server presence table is refreshed
      this.channel.track({
        id: this.myPlayerId,
        name: player.name,
        isHost: false,
        onlineAt: Date.now(),
      }).catch(() => {});

      this.sendToHost({
        type: 'JOIN_REQUEST',
        senderId: this.myPlayerId,
        payload: player,
      });
      return true;
    }

    try {
      await this.initClient(roomCode, player);
      return true;
    } catch (e) {
      console.warn('[Supabase Client] Reconnect failed:', e);
      return false;
    }
  }

  public isPlayerConnected(_playerId: string): boolean {
    return true;
  }

  private handleIncomingMessage(msg: PeerMessage) {
    if (msg?.type === 'PING') {
      if (this.hostDisconnectTimer) {
        clearTimeout(this.hostDisconnectTimer);
        this.hostDisconnectTimer = null;
      }
      if (!this.hostPresent) {
        this.hostPresent = true;
        this.hostDisconnectedAt = null;
        this.onHostReconnected?.();
      }
      // Auto-reply PONG for latency benchmark or keep-alive
      this.sendToHost({
        type: 'PONG',
        senderId: this.myPlayerId,
        payload: { timestamp: Date.now(), seq: msg.payload?.seq },
      });
      return;
    }

    if (msg?.type === 'HOST_DISCONNECTED') {
      const at = msg.payload?.disconnectedAt || Date.now();
      this.hostDisconnectedAt = at;
      this.hostPresent = false;
      this.onHostDisconnected?.(at);
    } else if (msg?.type === 'HOST_RECONNECTED') {
      if (this.hostDisconnectTimer) {
        clearTimeout(this.hostDisconnectTimer);
        this.hostDisconnectTimer = null;
      }
      this.hostDisconnectedAt = null;
      this.hostPresent = true;
      this.onHostReconnected?.();
    } else {
      // Any other valid game message from Host clears host disconnect
      if (this.hostDisconnectTimer) {
        clearTimeout(this.hostDisconnectTimer);
        this.hostDisconnectTimer = null;
      }
      if (!this.hostPresent) {
        this.hostDisconnectedAt = null;
        this.hostPresent = true;
        this.onHostReconnected?.();
      }
    }

    if (this.onMessageReceived) {
      this.onMessageReceived(msg);
    }
  }

  /**
   * Host broadcasts public room state to all clients (without secret words of others)
   */
  public broadcastRoomState(state: RoomState): void {
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
    this.broadcast(msg);
  }

  public broadcast(msg: PeerMessage): void {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_message',
      payload: msg,
    });
  }

  public destroy(): void {
    this.stopHeartbeat();
    if (this.hostDisconnectTimer) {
      clearTimeout(this.hostDisconnectTimer);
      this.hostDisconnectTimer = null;
    }
    if (this.channel) {
      const chan = this.channel;
      this.channel = null;
      try {
        chan.untrack().finally(() => {
          try {
            this.supabase.removeChannel(chan);
          } catch (e) {
            console.warn('[Supabase] Channel remove warning:', e);
          }
        });
      } catch (e) {
        try {
          this.supabase.removeChannel(chan);
        } catch (e2) {
          console.warn('[Supabase] Channel remove warning:', e2);
        }
      }
    }
  }
}

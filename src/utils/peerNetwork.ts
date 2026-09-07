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
          this.onConnectionStatusChange?.('ERROR', 'Không thể kết nối máy chủ Supabase. Vui lòng kiểm tra lại mạng!');
          reject(new Error('Host init timeout'));
        }
      }, 10000);

      try {
        if (this.channel) {
          this.supabase.removeChannel(this.channel);
        }

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
        this.channel.on('presence', { event: 'join' }, ({ key }) => {
          console.log('[Supabase Host] Player joined presence:', key);
          this.onPeerJoined?.(key);
        });

        this.channel.on('presence', { event: 'leave' }, ({ key }) => {
          console.log('[Supabase Host] Player left presence:', key);
          this.onPeerLeft?.(key, key);
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
      }, 10000);

      try {
        if (this.channel) {
          this.supabase.removeChannel(this.channel);
        }

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

        // Track presence to detect if Host goes offline
        this.channel.on('presence', { event: 'sync' }, () => {
          const presenceState = this.channel?.presenceState() || {};
          let hostOnline = false;
          for (const key in presenceState) {
            const list = presenceState[key] as any[];
            if (list.some((p) => p.isHost)) {
              hostOnline = true;
              break;
            }
          }

          if (hostOnline) {
            if (!this.hostPresent) {
              console.log('[Supabase Client] Host detected back online via presence.');
              this.hostPresent = true;
              this.hostDisconnectedAt = null;
              this.onHostReconnected?.();
            }
          } else {
            if (this.hostPresent) {
              console.log('[Supabase Client] Host presence lost.');
              this.hostPresent = false;
              this.hostDisconnectedAt = Date.now();
              this.onHostDisconnected?.(this.hostDisconnectedAt);
            }
          }
        });

        this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const hostLeft = (leftPresences as any[]).some((p) => p.isHost);
          if (hostLeft) {
            console.log('[Supabase Client] Host left event received.');
            this.hostPresent = false;
            this.hostDisconnectedAt = Date.now();
            this.onHostDisconnected?.(this.hostDisconnectedAt);
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
    return this.hostPresent;
  }

  public reconnectHostIfNeeded(): void {
    if (!this.channel || this.channel.state === 'closed' || this.channel.state === 'errored') {
      console.log('[Supabase Host] Reconnecting channel...');
      this.channel?.subscribe();
    }
  }

  public async reconnectClient(roomCode: string, player: Player): Promise<boolean> {
    this.roomCode = roomCode.toUpperCase();
    this.myPlayerId = player.id;

    console.log('[Supabase Client] Reconnecting client to room:', this.roomCode);

    if (this.channel && this.channel.state === 'joined') {
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
    if (msg?.type === 'HOST_DISCONNECTED') {
      const at = msg.payload?.disconnectedAt || Date.now();
      this.hostDisconnectedAt = at;
      this.hostPresent = false;
      this.onHostDisconnected?.(at);
    } else if (msg?.type === 'HOST_RECONNECTED') {
      this.hostDisconnectedAt = null;
      this.hostPresent = true;
      this.onHostReconnected?.();
    } else if (this.hostDisconnectedAt) {
      this.hostDisconnectedAt = null;
      this.hostPresent = true;
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
    if (this.channel) {
      try {
        this.channel.untrack();
        this.supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[Supabase] Channel remove warning:', e);
      }
      this.channel = null;
    }
  }
}

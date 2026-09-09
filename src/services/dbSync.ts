import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RoomState, Player } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fxucyrofcsuqtlkukcrx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zEiG2Py5kDmGhkTgw0uWIA_We0rOCGu';

let supabaseClient: SupabaseClient | null = null;
let isDbAvailableCache: boolean | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }
  return supabaseClient;
}

/**
 * Check if PostgreSQL rooms table is available in the current Supabase project
 */
export async function checkDbAvailability(): Promise<boolean> {
  if (isDbAvailableCache !== null) return isDbAvailableCache;

  try {
    const sb = getSupabase();
    const { error } = await sb.from('rooms').select('code').limit(1);
    if (error) {
      // Table doesn't exist yet or permission denied
      console.warn('[DbSync] PostgreSQL rooms table not yet initialized or pending SQL migration. Falling back to Realtime.');
      isDbAvailableCache = false;
      return false;
    }
    isDbAvailableCache = true;
    console.log('[DbSync] PostgreSQL Database Authoritative storage is active.');
    return true;
  } catch {
    isDbAvailableCache = false;
    return false;
  }
}

/**
 * Persist room state and players snapshot to PostgreSQL
 */
export async function saveRoomToDatabase(state: RoomState): Promise<boolean> {
  try {
    const isAvail = await checkDbAvailability();
    if (!isAvail) return false;

    const sb = getSupabase();
    const code = state.roomCode.toUpperCase();

    // 1. Upsert Room Row
    const { error: roomErr } = await sb.from('rooms').upsert(
      {
        code,
        host_id: state.hostId,
        status: state.status,
        config: state.config,
        round_number: state.roundNumber,
        current_pair: state.currentPair || null,
        current_speaker_id: state.currentSpeakerId || null,
        winner: state.winner || null,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
      { onConflict: 'code' }
    );

    if (roomErr) {
      console.warn('[DbSync] Error saving room to DB:', roomErr.message);
      return false;
    }

    // 2. Upsert Players
    if (state.players && state.players.length > 0) {
      const playerRows = state.players.map((p) => ({
        id: p.id,
        room_code: code,
        name: p.name,
        house: p.house || 'GRYFFINDOR',
        role: p.role || null,
        word: p.word || null,
        is_host: Boolean(p.isHost),
        is_ai: Boolean(p.isAi),
        is_eliminated: Boolean(p.isEliminated),
        speaking_order: p.speakingOrder || 0,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      }));

      const { error: playersErr } = await sb.from('players').upsert(playerRows, {
        onConflict: 'id,room_code',
      });

      if (playersErr) {
        console.warn('[DbSync] Error saving players to DB:', playersErr.message);
      }
    }

    return true;
  } catch (err: any) {
    console.warn('[DbSync] saveRoomToDatabase exception:', err?.message);
    return false;
  }
}

/**
 * Fetch latest RoomState snapshot from PostgreSQL (Takes < 50ms)
 */
export async function fetchRoomFromDatabase(roomCode: string): Promise<RoomState | null> {
  try {
    const isAvail = await checkDbAvailability();
    if (!isAvail) return null;

    const sb = getSupabase();
    const code = roomCode.toUpperCase();

    const { data: roomData, error: roomErr } = await sb
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (roomErr || !roomData) {
      return null;
    }

    const { data: playersData, error: playersErr } = await sb
      .from('players')
      .select('*')
      .eq('room_code', code);

    if (playersErr) {
      console.warn('[DbSync] Error fetching players from DB:', playersErr.message);
    }

    const mappedPlayers: Player[] = (playersData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      house: p.house,
      isHost: Boolean(p.is_host),
      isAi: Boolean(p.is_ai),
      role: p.role,
      word: p.word,
      isEliminated: Boolean(p.is_eliminated),
      speakingOrder: p.speaking_order,
    }));

    const state: RoomState = {
      roomCode: roomData.code,
      hostId: roomData.host_id,
      status: roomData.status,
      config: roomData.config,
      roundNumber: roomData.round_number,
      currentPair: roomData.current_pair || undefined,
      currentSpeakerId: roomData.current_speaker_id || undefined,
      winner: roomData.winner || null,
      players: mappedPlayers,
    };

    return state;
  } catch (err: any) {
    console.warn('[DbSync] fetchRoomFromDatabase exception:', err?.message);
    return null;
  }
}

/**
 * Update player heartbeat/online status in DB
 */
export async function updatePlayerHeartbeatInDatabase(
  roomCode: string,
  playerId: string,
  isOnline: boolean
): Promise<void> {
  try {
    const isAvail = await checkDbAvailability();
    if (!isAvail) return;

    const sb = getSupabase();
    await sb
      .from('players')
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      })
      .match({ room_code: roomCode.toUpperCase(), id: playerId });
  } catch {
    // Ignore heartbeat errors
  }
}

/**
 * Remove player from database when explicitly leaving or kicked
 */
export async function removePlayerFromDatabase(roomCode: string, playerId: string): Promise<void> {
  try {
    const isAvail = await checkDbAvailability();
    if (!isAvail) return;

    const sb = getSupabase();
    await sb
      .from('players')
      .delete()
      .match({ room_code: roomCode.toUpperCase(), id: playerId });
  } catch {
    // Ignore delete errors
  }
}

/**
 * Disband and delete room completely from PostgreSQL when host leaves or is forced out
 */
export async function closeRoomInDatabase(roomCode: string): Promise<void> {
  try {
    const isAvail = await checkDbAvailability();
    if (!isAvail) return;

    const sb = getSupabase();
    await sb
      .from('rooms')
      .delete()
      .match({ code: roomCode.toUpperCase() });
    console.log('[DbSync] Room deleted from database:', roomCode);
  } catch (e: any) {
    console.warn('[DbSync] closeRoomInDatabase error:', e?.message);
  }
}

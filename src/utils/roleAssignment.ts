import type { Role, Player } from '../types';

export interface PlayerRoleStats {
  lastRole?: Role;
  roundsSinceDeathEater: number; // 0 if was Death Eater in previous round
  roundsSinceMrWhite: number;
  totalDeathEaterCount: number;
  totalMrWhiteCount: number;
}

/**
 * Cryptographically secure random float in [0, 1) using crypto.getRandomValues
 */
export function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / (0xffffffff + 1);
  }
  return Math.random();
}

/**
 * Modern Fisher-Yates (Knuth) Shuffle using secure randomness
 */
export function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RoleAssignmentOptions {
  cardPlayers: Player[];
  undercoverCount: number;
  mrWhiteCount: number;
  roleHistory?: Map<string, PlayerRoleStats>;
}

export interface RoleAssignmentResult {
  roleMap: Map<string, Role>;
  speakingOrderMap: Map<string, number>;
  updatedHistory: Map<string, PlayerRoleStats>;
}

/**
 * Randomize speaking order for all eligible card players in the round (1-based index)
 */
export function generateRandomSpeakingOrder(players: Player[]): Map<string, number> {
  const orderMap = new Map<string, number>();
  const shuffled = fisherYatesShuffle(players);
  shuffled.forEach((p, idx) => {
    orderMap.set(p.id, idx + 1);
  });
  return orderMap;
}

/**
 * Optimal Role Assignment Algorithm for Undercover Hogwarts
 * 
 * Features:
 * 1. Cryptographic high-entropy randomness (no Timsort bias).
 * 2. Consecutive Death Eater fatigue protection (prevents players from being Undercover repeatedly).
 * 3. Drought protection (gradually increases odds for players who haven't had a turn as Undercover).
 * 4. Lifetime balance dampening (ensures even spy distribution across party game sessions).
 * 5. Dynamic adaptation for any player count (3 - 10 players, 1 - 2 Undercovers, Mr. White).
 * 6. True randomized speaking turn order assignment (thứ tự phát biểu) for each game round.
 */
export function assignOptimalRoles(options: RoleAssignmentOptions): RoleAssignmentResult {
  const { cardPlayers, undercoverCount, mrWhiteCount, roleHistory = new Map() } = options;
  const N = cardPlayers.length;
  if (N === 0) {
    return {
      roleMap: new Map(),
      speakingOrderMap: new Map(),
      updatedHistory: new Map(roleHistory),
    };
  }

  const targetUndercover = Math.min(undercoverCount, Math.max(1, N - 1));
  const targetMrWhite = Math.min(mrWhiteCount, Math.max(0, N - targetUndercover - 1));

  // Clone previous history
  const updatedHistory = new Map<string, PlayerRoleStats>(roleHistory);
  const getStats = (id: string): PlayerRoleStats => {
    return (
      updatedHistory.get(id) || {
        roundsSinceDeathEater: 10,
        roundsSinceMrWhite: 10,
        totalDeathEaterCount: 0,
        totalMrWhiteCount: 0,
      }
    );
  };

  // Step 1: Detect if we can strictly avoid picking players who were Death Eater last round
  const playersWhoWereNotDE = cardPlayers.filter(
    (p) => getStats(p.id).lastRole !== 'DEATH_EATER'
  );
  const canStrictlyAvoidRecentDE = playersWhoWereNotDE.length >= targetUndercover;

  // Step 2: Calculate Efraimidis-Spirakis weighted score for each candidate:
  // score = U ^ (1 / weight), where U ~ Uniform(0, 1)
  const deCandidateScores = cardPlayers.map((player) => {
    const stats = getStats(player.id);
    let weight = 100;

    // Consecutive role cooldown penalty
    if (stats.lastRole === 'DEATH_EATER') {
      if (canStrictlyAvoidRecentDE) {
        weight = 0.001; // Strongly deprioritize if enough other candidates exist
      } else {
        weight = 15; // Soft penalty for small rooms (3 players)
      }
    } else {
      // Drought boost: each round without playing Death Eater gives +30 bonus weight
      const droughtRounds = Math.min(stats.roundsSinceDeathEater, 8);
      weight += droughtRounds * 30;

      // Cumulative dampener: if player already played Death Eater multiple times, softly adjust
      weight = Math.max(25, weight - stats.totalDeathEaterCount * 25);
    }

    const u = Math.max(0.00001, secureRandom());
    const score = Math.pow(u, 1 / Math.max(0.1, weight));

    return { player, score, stats };
  });

  // Sort descending by weighted score -> top N candidates become Death Eaters
  deCandidateScores.sort((a, b) => b.score - a.score);

  const deathEaters = deCandidateScores.slice(0, targetUndercover).map((c) => c.player);
  const remainingAfterDE = deCandidateScores.slice(targetUndercover).map((c) => c.player);

  // Step 3: Pick Mr. White among remaining candidates (if enabled)
  let mrWhitePlayer: Player | undefined = undefined;
  if (targetMrWhite > 0 && remainingAfterDE.length > 0) {
    const canAvoidRecentMrWhite = remainingAfterDE.some(
      (p) => getStats(p.id).lastRole !== 'MR_WHITE'
    );

    const mrWhiteCandidates = remainingAfterDE.map((player) => {
      const stats = getStats(player.id);
      let weight = 100;
      if (stats.lastRole === 'MR_WHITE') {
        weight = canAvoidRecentMrWhite ? 0.001 : 20;
      } else {
        weight += Math.min(stats.roundsSinceMrWhite, 8) * 25;
      }
      const u = Math.max(0.00001, secureRandom());
      const score = Math.pow(u, 1 / Math.max(0.1, weight));
      return { player, score };
    });

    mrWhiteCandidates.sort((a, b) => b.score - a.score);
    mrWhitePlayer = mrWhiteCandidates[0].player;
  }

  // Step 4: Construct final Role Map and update player stats
  const roleMap = new Map<string, Role>();
  const deSet = new Set(deathEaters.map((p) => p.id));
  const mwId = mrWhitePlayer?.id;

  cardPlayers.forEach((p) => {
    let assignedRole: Role = 'STUDENT';
    if (deSet.has(p.id)) {
      assignedRole = 'DEATH_EATER';
    } else if (p.id === mwId) {
      assignedRole = 'MR_WHITE';
    }
    roleMap.set(p.id, assignedRole);

    const prevStats = getStats(p.id);
    updatedHistory.set(p.id, {
      lastRole: assignedRole,
      roundsSinceDeathEater:
        assignedRole === 'DEATH_EATER' ? 0 : prevStats.roundsSinceDeathEater + 1,
      roundsSinceMrWhite:
        assignedRole === 'MR_WHITE' ? 0 : prevStats.roundsSinceMrWhite + 1,
      totalDeathEaterCount:
        prevStats.totalDeathEaterCount + (assignedRole === 'DEATH_EATER' ? 1 : 0),
      totalMrWhiteCount:
        prevStats.totalMrWhiteCount + (assignedRole === 'MR_WHITE' ? 1 : 0),
    });
  });

  // Step 5: Randomize speaking turn order for all card players in this round
  const speakingOrderMap = generateRandomSpeakingOrder(cardPlayers);

  return { roleMap, speakingOrderMap, updatedHistory };
}

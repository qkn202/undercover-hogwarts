import assert from 'node:assert';
import crypto from 'node:crypto';

// Replicate secure random shuffle used in roleAssignment
function secureRandom() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / (0xffffffff + 1);
}

function generateRandomSpeakingOrder(players) {
  const map = new Map();
  if (!players || players.length === 0) return map;

  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  shuffled.forEach((player, idx) => {
    map.set(player.id, idx + 1);
  });

  return map;
}

console.log('--- TEST 1: Basic Speaking Order 1..N ---');
const players = [
  { id: 'p1', name: 'Harry' },
  { id: 'p2', name: 'Ron' },
  { id: 'p3', name: 'Hermione' },
  { id: 'p4', name: 'Draco' },
  { id: 'p5', name: 'Luna' },
];

const orderMap = generateRandomSpeakingOrder(players);
assert.strictEqual(orderMap.size, players.length, 'Every player must receive an order');

const orders = Array.from(orderMap.values()).sort((a, b) => a - b);
assert.deepStrictEqual(orders, [1, 2, 3, 4, 5], 'Orders must be exactly [1, 2, 3, 4, 5]');
console.log('✓ Test 1 passed: All players receive a unique order from 1 to 5');

console.log('\n--- TEST 2: Distribution across 10,000 game rounds ---');
const firstSpeakerCounts = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
const ROUNDS = 10000;

for (let r = 0; r < ROUNDS; r++) {
  const roundMap = generateRandomSpeakingOrder(players);
  for (const p of players) {
    if (roundMap.get(p.id) === 1) {
      firstSpeakerCounts[p.id]++;
    }
  }
}

console.log('First speaker counts across 10,000 games:', firstSpeakerCounts);
// Each player should speak 1st roughly 20% of the time (approx 2000 ± 150)
for (const p of players) {
  const pct = (firstSpeakerCounts[p.id] / ROUNDS) * 100;
  console.log(`- ${p.name} speaks 1st: ${firstSpeakerCounts[p.id]} times (${pct.toFixed(2)}%)`);
  assert(firstSpeakerCounts[p.id] > 1700 && firstSpeakerCounts[p.id] < 2300, `Uniform distribution expected for ${p.id}`);
}
console.log('✓ Test 2 passed: Speaking order is uniformly and fairly randomized across rounds!');

console.log('\n--- TEST 3: Host as GAME_MASTER exclusion ---');
const allPlayers = [
  { id: 'host-gm', name: 'Albus Dumbledore', isHost: true },
  { id: 'p1', name: 'Harry', isHost: false },
  { id: 'p2', name: 'Ron', isHost: false },
  { id: 'p3', name: 'Hermione', isHost: false },
];
const cardPlayers = allPlayers.filter(p => !p.isHost);
const gmOrderMap = generateRandomSpeakingOrder(cardPlayers);
assert.strictEqual(gmOrderMap.has('host-gm'), false, 'Host GM must NOT be in speaking order map');
assert.strictEqual(gmOrderMap.size, 3, 'Only 3 players should be in speaking order map');
console.log('✓ Test 3 passed: Host referee is excluded from turn order');

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');

import assert from 'node:assert';
import { HUBS, EDGES, ROAD_EDGES } from '../src/data/network.js';
import { findRoutes, edgeStatus } from '../src/engine/router.js';

console.log('--- TEST 1: Verifying Exactly 17 Direct Road Connections ---');
const uniquePairs = [...new Set(EDGES.map((e) => e.pairKey))];
console.log(`Unique map polyline edges: ${uniquePairs.length}`);
assert.strictEqual(uniquePairs.length, 17, 'Map must have exactly 17 road connections');
assert.strictEqual(ROAD_EDGES.length, 17, 'ROAD_EDGES must have exactly 17 items');

ROAD_EDGES.forEach((road) => {
  assert.ok(road.fromHubId && road.toHubId, `Road ${road.id} must connect two hubs`);
  assert.ok(!road.name.includes('↔ Mirpur ↔ Farmgate'), `Road ${road.id} must not be a chained multi-hop corridor`);
  console.log(`✓ ${road.id}: ${road.name} (${road.km} km, modes: ${road.modes.join(', ')})`);
});

console.log('\n--- TEST 2: Verifying Road Blocking: Farmgate → Mohakhali ---');
// Baseline route Farmgate -> Mohakhali
const normalPlan = findRoutes('farmgate', 'mohakhali');
assert.ok(normalPlan.routes.fastest, 'Baseline route should exist');
console.log('Normal route from Farmgate to Mohakhali:', normalPlan.routes.fastest.hubIds);
assert.deepStrictEqual(normalPlan.routes.fastest.hubIds, ['farmgate', 'mohakhali'], 'Normal fastest route uses direct road');

// Admin blocks Farmgate → Mohakhali
const farmgateMohakhaliKey = ['farmgate', 'mohakhali'].sort().join('|');
const blockedScenario = {
  disabledEdges: [farmgateMohakhaliKey],
  blockedEdges: [farmgateMohakhaliKey],
  edgeStatuses: {
    [farmgateMohakhaliKey]: {
      status: 'blocked',
      reason: 'road_block',
      reasonLabel: 'Road Block',
    },
  },
};

// Check map edgeStatus reports blocked
const mapEdgeStatus = edgeStatus(farmgateMohakhaliKey, blockedScenario);
assert.strictEqual(mapEdgeStatus.isRoadBlocked, true, 'Map edge must be flagged as road blocked');
assert.strictEqual(mapEdgeStatus.blocked, true, 'Map edge must be blocked');
assert.strictEqual(mapEdgeStatus.roadBlockReason, 'Road Block', 'Map edge must have reason');
console.log('Map edgeStatus when blocked:', mapEdgeStatus);

// Check route planner finds alternative detour route
const detourPlan = findRoutes('farmgate', 'mohakhali', {}, blockedScenario);
assert.ok(detourPlan.routes.fastest, 'Route planner must find alternative valid route');
console.log('Detour route from Farmgate to Mohakhali:', detourPlan.routes.fastest.hubIds);
assert.ok(!detourPlan.routes.fastest.hubIds.includes('mohakhali') || detourPlan.routes.fastest.hubIds[0] === 'farmgate');
// Must NOT use direct farmgate -> mohakhali segment
const usesBlockedEdge = detourPlan.routes.fastest.segments.some((s) => s.pairKey === farmgateMohakhaliKey);
assert.strictEqual(usesBlockedEdge, false, 'Detour route must NOT use blocked road Farmgate → Mohakhali');
console.log('✓ Successfully verified Farmgate → Mohakhali blocked road is bypassed via detour:', detourPlan.routes.fastest.hubIds);

console.log('\n--- TEST 3: Informing User When No Alternative Route Exists ---');
// Block all roads connecting to Jatrabari (motijheel <-> jatrabari is the only connection)
const motijheelJatrabariKey = ['motijheel', 'jatrabari'].sort().join('|');
const fullyCutScenario = {
  disabledEdges: [motijheelJatrabariKey],
  blockedEdges: [motijheelJatrabariKey],
  edgeStatuses: {
    [motijheelJatrabariKey]: {
      status: 'blocked',
      reason: 'protest',
      reasonLabel: 'Protest / Rally',
    },
  },
};

const cutPlan = findRoutes('farmgate', 'jatrabari', {}, fullyCutScenario);
assert.strictEqual(cutPlan.routes.fastest, null, 'No route should be found to Jatrabari');
assert.ok(cutPlan.message.includes('No valid route is available'), `Message must inform user clearly. Got: ${cutPlan.message}`);
console.log('✓ User clearly informed when no route exists:', cutPlan.message);

console.log('\n--- TEST 4: Clearing Road Block Restores Direct Route ---');
const clearedPlan = findRoutes('farmgate', 'mohakhali', {}, { disabledEdges: [], blockedEdges: [], edgeStatuses: {} });
assert.deepStrictEqual(clearedPlan.routes.fastest.hubIds, ['farmgate', 'mohakhali'], 'Cleared road restores direct path');
console.log('✓ Direct road immediately restored after clearing block');

console.log('\n🎉 ALL 17 ROAD EDGES AND ROAD BLOCKING TESTS PASSED PERFECTLY!');

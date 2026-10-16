import assert from 'node:assert/strict';
import { findRoutes, segTime, legFare } from '../src/engine/router.js';
import { EDGES } from '../src/data/network.js';

const e = EDGES[0];
assert.equal(segTime({ lineId: 'X', mode: 'bus', baseTimeMinutes: 10 }, e, { delays: [{ lineId: 'X', rate: 0.3, extra: 3 }] }), 16, 'admin delay 10*1.3+3');
assert.equal(legFare({ mode: 'bus', km: 1 }, {}, false).max, 10, 'bus min fare 10');
assert.equal(legFare({ mode: 'bus', km: 8 }, {}, true).min, 11, 'student fare ceil(22/2)=11');
assert.equal(findRoutes('nope', 'motijheel').status, 'INVALID_INPUT');
assert.equal(findRoutes('mirpur', 'mirpur').status, 'SAME_LOCATION');

const r = findRoutes('mirpur', 'motijheel', {}, {});
assert.equal(r.status, 'OK');
const cheap = r.routes.cheapest, fast = r.routes.fastest;
assert.ok(cheap.fare.est <= fast.fare.est && fast.timeMinutes <= cheap.timeMinutes);
assert.ok(new Set(cheap.hubIds).size === cheap.hubIds.length, 'no cycles');
assert.ok(cheap.hubIds.length - 1 <= 6, 'hop limit');
// same continuous line = one leg, zero transfers
const metro = findRoutes('mirpur', 'motijheel', {}, {}).routes.fastest;
assert.ok(metro.legs.length >= 1 && metro.transfers === metro.legs.filter((l) => l.mode !== 'walking').length - 1);
// disabled line never selected; blocked intermediate hub never passed
const s2 = findRoutes('mirpur', 'motijheel', {}, { disabledLines: ['MRT-6'], blockedHubs: ['farmgate'] });
for (const g of ['cheapest', 'fastest', 'balanced']) {
  assert.ok(!s2.routes[g].legs.some((l) => l.lineId === 'MRT-6'));
  assert.ok(!s2.routes[g].hubIds.slice(1, -1).includes('farmgate'));
}
// backup avoids primary's critical line
const b = r.backups.fastest; assert.ok(b && !b.legs.some((l) => l.lineId === b.trigger.split(' ')[0]));
// heavy rain suspends buses
const rain = findRoutes('mirpur', 'motijheel', {}, { rainSeverity: 2 });
assert.ok(['OK', 'NO_ROUTE_WITHIN_CONSTRAINTS'].includes(rain.status));
if (rain.status === 'OK') assert.ok(!rain.routes.fastest.legs.some((l) => l.mode === 'bus'));
// strict budget uses max fare
const tight = findRoutes('mirpur', 'motijheel', { maxBudget: 5 });
assert.equal(tight.status, 'NO_ROUTE_WITHIN_CONSTRAINTS'); assert.ok(tight.overBudgetCheapest);
// determinism
assert.equal(JSON.stringify(findRoutes('uttara', 'jatrabari')), JSON.stringify(findRoutes('uttara', 'jatrabari')));
console.log('All engine tests passed. Mirpur→Motijheel candidates:', r.candidateCount, r.stats);

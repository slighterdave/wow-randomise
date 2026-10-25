const test = require('node:test');
const assert = require('node:assert');
const R = require('../public/rules.js');

test('all four roles start open', () => {
  assert.deepStrictEqual(R.remainingRoles([]).sort(), ['DPS', 'DPS', 'Healer', 'Tank']);
});
test('taken classes leave the pool', () => {
  const a = [{ role: 'Tank', className: 'Warrior' }];
  assert.ok(!R.availableClasses('DPS', a, 'Any').includes('Warrior'));
});
test('last slot is forced to healer', () => {
  const a = [{ role: 'Tank', className: 'Warrior' }, { role: 'DPS', className: 'Mage' }, { role: 'DPS', className: 'Rogue' }];
  assert.deepStrictEqual(R.remainingRoles(a), ['Healer']);
  assert.ok(R.validate(a, { role: 'DPS', className: 'Hunter', race: 'Orc' }));
  assert.strictEqual(R.validate(a, { role: 'Healer', className: 'Priest', race: 'Undead' }), null);
});
test('pool never strands a role', () => {
  const a = [{ role: 'DPS', className: 'Priest' }, { role: 'DPS', className: 'Shaman' }, { role: 'Tank', className: 'Warrior' }];
  assert.deepStrictEqual(R.availableClasses('Healer', a, 'Any'), ['Paladin', 'Druid']);
  const b = [{ role: 'DPS', className: 'Paladin' }, { role: 'DPS', className: 'Druid' }];
  assert.ok(!R.availableClasses('DPS', b, 'Any').includes('Warrior'));
});
test('faction filters races', () => {
  assert.deepStrictEqual(R.racesFor('Paladin', 'Horde'), []);
  assert.ok(R.racesFor('Warrior', 'Horde').includes('Undead'));
});

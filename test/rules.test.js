const test = require('node:test');
const assert = require('node:assert');
const R = require('../public/rules.js');

test('all five roles start open', () => {
  assert.deepStrictEqual(R.remainingRoles([]).sort(), ['DPS', 'DPS', 'DPS', 'Healer', 'Tank']);
});
test('taken classes leave the pool', () => {
  const a = [{ role: 'Tank', className: 'Warrior' }];
  assert.ok(!R.availableClasses('DPS', a, 'Any').includes('Warrior'));
});
test('last slot is forced to healer', () => {
  const a = [{ role: 'Tank', className: 'Warrior' }, { role: 'DPS', className: 'Mage' }, { role: 'DPS', className: 'Rogue' }, { role: 'DPS', className: 'Hunter' }];
  assert.deepStrictEqual(R.remainingRoles(a), ['Healer']);
  assert.ok(R.validate(a, { role: 'DPS', className: 'Warlock', race: 'Orc' }));
  assert.strictEqual(R.validate(a, { role: 'Healer', className: 'Priest', race: 'Undead' }), null);
});
test('pool never strands a role', () => {
  const a = [{ role: 'DPS', className: 'Priest' }, { role: 'DPS', className: 'Shaman' }, { role: 'DPS', className: 'Mage' }, { role: 'Tank', className: 'Warrior' }];
  assert.deepStrictEqual(R.availableClasses('Healer', a, 'Any'), ['Paladin', 'Druid']);
  const b = [{ role: 'DPS', className: 'Paladin' }, { role: 'DPS', className: 'Druid' }];
  assert.ok(!R.availableClasses('DPS', b, 'Any').includes('Warrior'));
});
test('faction filters races', () => {
  assert.deepStrictEqual(R.racesFor('Paladin', 'Horde'), []);
  assert.ok(R.racesFor('Warrior', 'Horde').includes('Undead'));
});
test('blocklist options only offer real combos', () => {
  const o = R.blockOptions({ race: 'Gnome' }, 'Any');
  assert.deepStrictEqual(o.classes, ['Warrior', 'Rogue', 'Mage', 'Warlock']);
  assert.ok(!R.blockOptions({ className: 'Paladin' }, 'Any').races.includes('Orc'));
  assert.ok(!R.validBlock({ className: 'Paladin', race: 'Orc' }, 'Any'));
});
test('blocklist only removes options for the person who set it', () => {
  const b = { role: 'Tank', className: 'Mage', race: 'Orc' };
  assert.ok(R.remainingRoles([]).includes('Tank'));
  assert.deepStrictEqual(R.availableClasses('Tank', [], 'Any', b), []);
  assert.ok(!R.availableClasses('DPS', [], 'Any', b).includes('Mage'));
  assert.ok(!R.racesFor('Warrior', 'Any', b).includes('Orc'));
  assert.ok(R.availableClasses('Tank', [], 'Any').includes('Warrior'));
  assert.strictEqual(R.validate([], { role: 'Tank', className: 'Warrior', race: 'Human' }, 'Any', b),
    'That role is blocked for this person.');
});

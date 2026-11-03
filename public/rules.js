(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ROLE_SLOTS = { Tank: 1, Healer: 1, DPS: 3 };
  const FACTION = {
    Human: 'Alliance', Dwarf: 'Alliance', 'Night Elf': 'Alliance', Gnome: 'Alliance',
    Orc: 'Horde', Undead: 'Horde', Tauren: 'Horde', Troll: 'Horde',
  };
  // WoW Classic (Forever) race -> classes
  const RACE_CLASSES = {
    Human: ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'],
    Dwarf: ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest'],
    'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
    Gnome: ['Warrior', 'Rogue', 'Mage', 'Warlock'],
    Orc: ['Warrior', 'Hunter', 'Rogue', 'Shaman', 'Warlock'],
    Undead: ['Warrior', 'Rogue', 'Priest', 'Mage', 'Warlock'],
    Tauren: ['Warrior', 'Hunter', 'Shaman', 'Druid'],
    Troll: ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage'],
  };
  const CLASS_ROLES = {
    Warrior: ['Tank', 'DPS'],
    Paladin: ['Tank', 'Healer', 'DPS'],
    Druid: ['Tank', 'Healer', 'DPS'],
    Priest: ['Healer', 'DPS'],
    Shaman: ['Healer', 'DPS'],
    Hunter: ['DPS'],
    Rogue: ['DPS'],
    Mage: ['DPS'],
    Warlock: ['DPS'],
  };
  const CLASSES = Object.keys(CLASS_ROLES);
  const RACES = Object.keys(RACE_CLASSES);

  // roles still needed, given assignments [{role, className}]
  function remainingRoles(assignments, block) {
    const left = Object.assign({}, ROLE_SLOTS);
    if (block && block.role) delete left[block.role];
    assignments.forEach((a) => { if (left[a.role] > 0) left[a.role]--; });
    return Object.keys(left).flatMap((r) => Array(left[r]).fill(r));
  }

  // can the still-needed roles be filled with distinct unused classes?
  function canFill(roles, usedClasses, faction, block) {
    if (!roles.length) return true;
    const [role, ...rest] = roles;
    return CLASSES.some((c) => !usedClasses.includes(c) && CLASS_ROLES[c].includes(role) &&
      racesFor(c, faction, block).length > 0 && c !== (block && block.className) &&
      canFill(rest, usedClasses.concat(c), faction, block));
  }

  function racesFor(className, faction, block) {
    return RACES.filter((r) => RACE_CLASSES[r].includes(className) && r !== (block && block.race) &&
      (!faction || faction === 'Any' || FACTION[r] === faction));
  }

  function availableClasses(role, assignments, faction, block) {
    const used = assignments.map((a) => a.className);
    const rest = remainingRoles(assignments, block);
    const idx = rest.indexOf(role);
    if (idx < 0) return [];
    rest.splice(idx, 1);
    return CLASSES.filter((c) => !used.includes(c) && c !== (block && block.className) &&
      CLASS_ROLES[c].includes(role) && racesFor(c, faction, block).length > 0 &&
      canFill(rest, used.concat(c), faction, block));
  }

  // What can be blocked: only races/classes that still form a real combo with the other pick.
  function blockOptions(block, faction) {
    block = block || {};
    const ok = (r, c) => RACE_CLASSES[r].includes(c) && (!faction || faction === 'Any' || FACTION[r] === faction);
    return {
      roles: Object.keys(ROLE_SLOTS),
      classes: CLASSES.filter((c) => RACES.some((r) => ok(r, c) && (!block.race || r === block.race))),
      races: RACES.filter((r) => CLASSES.some((c) => ok(r, c) && (!block.className || c === block.className))),
    };
  }

  // a blocklist is valid if each entry is a real option and at least one race/class combo survives
  function validBlock(block, faction) {
    const b = block || {};
    const o = blockOptions(b, faction);
    return (!b.role || o.roles.includes(b.role)) && (!b.className || o.classes.includes(b.className)) &&
      (!b.race || o.races.includes(b.race));
  }

  function validate(assignments, pick, faction, block) {
    if (!remainingRoles(assignments, block).includes(pick.role)) return 'That role is already full (or blocked).';
    if (!availableClasses(pick.role, assignments, faction, block).includes(pick.className)) return 'That class is not available for that role.';
    if (!racesFor(pick.className, faction, block).includes(pick.race)) return 'That race cannot be that class (or wrong faction).';
    return null;
  }

  return { ROLE_SLOTS, FACTION, RACE_CLASSES, CLASS_ROLES, CLASSES, RACES,
    remainingRoles, availableClasses, racesFor, validate, blockOptions, validBlock };
});

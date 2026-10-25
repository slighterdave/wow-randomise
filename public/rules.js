(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ROLE_SLOTS = { Tank: 1, Healer: 1, DPS: 2 };
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
  function remainingRoles(assignments) {
    const left = Object.assign({}, ROLE_SLOTS);
    assignments.forEach((a) => { if (left[a.role] > 0) left[a.role]--; });
    return Object.keys(left).flatMap((r) => Array(left[r]).fill(r));
  }

  // can the still-needed roles be filled with distinct unused classes?
  function canFill(roles, usedClasses) {
    if (!roles.length) return true;
    const [role, ...rest] = roles;
    return CLASSES.some((c) => !usedClasses.includes(c) && CLASS_ROLES[c].includes(role) &&
      canFill(rest, usedClasses.concat(c)));
  }

  function racesFor(className, faction) {
    return RACES.filter((r) => RACE_CLASSES[r].includes(className) &&
      (!faction || faction === 'Any' || FACTION[r] === faction));
  }

  function availableClasses(role, assignments, faction) {
    const used = assignments.map((a) => a.className);
    const rest = remainingRoles(assignments);
    const idx = rest.indexOf(role);
    if (idx < 0) return [];
    rest.splice(idx, 1);
    return CLASSES.filter((c) => !used.includes(c) && CLASS_ROLES[c].includes(role) &&
      racesFor(c, faction).length > 0 && canFill(rest, used.concat(c)));
  }

  function validate(assignments, pick, faction) {
    if (!remainingRoles(assignments).includes(pick.role)) return 'That role is already full.';
    if (!availableClasses(pick.role, assignments, faction).includes(pick.className)) return 'That class is not available for that role.';
    if (!racesFor(pick.className, faction).includes(pick.race)) return 'That race cannot be that class (or wrong faction).';
    return null;
  }

  return { ROLE_SLOTS, FACTION, RACE_CLASSES, CLASS_ROLES, CLASSES, RACES,
    remainingRoles, availableClasses, racesFor, validate };
});

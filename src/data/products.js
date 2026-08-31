const curated = [
  {
    id: 'p1',
    name: 'Gotham Night Cruiser',
    tag: 'vehicle',
    rarity: 'legendary',
    price: 185000,
    inspiredBy: 'Batman',
    description: 'Armored matte-black pursuit vehicle built for a billionaire vigilante’s nightly patrols.',
  },
  {
    id: 'p2',
    name: "Desert Smuggler's Poncho",
    tag: 'costume',
    rarity: 'rare',
    price: 340,
    inspiredBy: 'Star Wars',
    description: 'Weathered scoundrel’s over-the-shoulder cloak, scorched by twin suns and blaster fire.',
  },
  {
    id: 'p3',
    name: "Boy Wizard's Round Spectacles",
    tag: 'eyewear',
    rarity: 'common',
    price: 45,
    inspiredBy: 'Harry Potter',
    description: 'Wire-rimmed glasses fixed with spell tape, favored by a certain lightning-scarred student.',
  },
  {
    id: 'p4',
    name: 'Ancient Golden Band',
    tag: 'jewelry',
    rarity: 'legendary',
    price: 999999,
    inspiredBy: 'The Lord of the Rings',
    description: 'A plain gold ring that whispers in a forgotten tongue when the wearer is alone.',
  },
  {
    id: 'p5',
    name: "Rebel Pilot's Blaster Pistol",
    tag: 'weapon',
    rarity: 'rare',
    price: 420,
    inspiredBy: 'Star Wars',
    description: 'Standard-issue sidearm favored by scruffy-looking smugglers turned reluctant heroes.',
  },
  {
    id: 'p6',
    name: 'Obsidian Energy Blade',
    tag: 'weapon',
    rarity: 'legendary',
    price: 12000,
    inspiredBy: 'Star Wars',
    description: 'A humming plasma sword with a crimson core, said to belong to a fallen blade-master.',
  },
  {
    id: 'p7',
    name: 'Flux Roadster',
    tag: 'vehicle',
    rarity: 'legendary',
    price: 88000,
    inspiredBy: 'Back to the Future',
    description: 'Stainless steel sports coupe modified for unconventional road trips through time.',
  },
  {
    id: 'p8',
    name: 'Wizarding School Robe',
    tag: 'costume',
    rarity: 'common',
    price: 65,
    inspiredBy: 'Harry Potter',
    description: 'House-crested wool robe, slightly singed at the hem from a potions mishap.',
  },
  {
    id: 'p9',
    name: "Master Detective's Deerstalker",
    tag: 'headwear',
    rarity: 'rare',
    price: 210,
    inspiredBy: 'Sherlock Holmes',
    description: "Tweed hunting cap favored by the world's only consulting detective.",
  },
  {
    id: 'p10',
    name: "Last Son's Crimson Cape",
    tag: 'costume',
    rarity: 'legendary',
    price: 50000,
    inspiredBy: 'Superman',
    description: 'Indestructible crimson cape, said to catch the wind of a man who can fly.',
  },
  {
    id: 'p11',
    name: "Web-Slinger's Utility Belt",
    tag: 'costume',
    rarity: 'rare',
    price: 150,
    inspiredBy: 'Spider-Man',
    description: 'Canister-lined belt built for a wall-crawling neighborhood hero.',
  },
  {
    id: 'p12',
    name: 'Ancient Prophecy Scroll',
    tag: 'prop',
    rarity: 'rare',
    price: 780,
    inspiredBy: 'Harry Potter',
    description: 'Sealed parchment said to foretell the fate of a chosen one. Do not read aloud.',
  },
  {
    id: 'p13',
    name: "Ringbearer's Traveling Cloak",
    tag: 'costume',
    rarity: 'rare',
    price: 290,
    inspiredBy: 'The Lord of the Rings',
    description: 'Elven-woven traveling cloak, nearly invisible in wooded terrain.',
  },
  {
    id: 'p14',
    name: "Vampire Hunter's Silver Kit",
    tag: 'prop',
    rarity: 'common',
    price: 95,
    inspiredBy: 'Dracula',
    description: 'Wooden stakes, silver bullets, and a well-worn journal of monster lore.',
  },
  {
    id: 'p15',
    name: 'Time Machine Control Panel',
    tag: 'prop',
    rarity: 'legendary',
    price: 250000,
    inspiredBy: 'Back to the Future',
    description: 'Dashboard salvaged from an experimental time-displacement vehicle. Flux capacitor not included.',
  },
  {
    id: 'p16',
    name: "Knight's Ceremonial Longsword",
    tag: 'weapon',
    rarity: 'rare',
    price: 1200,
    inspiredBy: 'Arthurian Legend',
    description: 'Hand-forged blade etched with a royal crest, said to only answer to the true king.',
  },
  {
    id: 'p17',
    name: "Spy's Retro Sunglasses",
    tag: 'eyewear',
    rarity: 'common',
    price: 180,
    inspiredBy: 'James Bond',
    description: 'Tuxedo-ready shades with a hidden gadget compartment. Shaken, not stirred.',
  },
  {
    id: 'p18',
    name: "Bounty Hunter's Battle Helmet",
    tag: 'headwear',
    rarity: 'legendary',
    price: 75000,
    inspiredBy: 'Star Wars',
    description: 'Weathered battle-worn helm, dented from a hundred bounties collected.',
  },
];

const ADJECTIVES = [
  'Weathered', 'Pristine', 'Cursed', 'Enchanted', 'Battle-Worn', 'Gilded', 'Ancient', 'Prototype',
  'Signature', 'Limited-Edition', 'Reforged', 'Forgotten', 'Sacred', 'Rogue', 'Midnight', 'Twilight',
  'Shattered', 'Restored', 'Deluxe', 'Salvaged', 'Ceremonial', 'Renegade', 'Phantom', 'Obsidian',
  'Ember-Forged', 'Frostbitten', 'Sunworn', 'Storm-Chased', 'Ironclad', 'Velvet',
];

const CATEGORY_NOUNS = {
  weapon: ['Blade', 'Saber', 'Blaster', 'Bow', 'Dagger', 'Staff', 'Battle-Axe', 'Cannon', 'Whip', 'Spear'],
  costume: ['Cloak', 'Cape', 'Robe', 'Armor Plate', 'Field Jacket', 'Duster', 'Tunic', 'Battle Vest', 'Uniform', 'Mantle'],
  headwear: ['Helm', 'Crown', 'Hood', 'Field Cap', 'Mask', 'Circlet', 'Visor', 'Headpiece', 'Tiara', 'Cowl'],
  eyewear: ['Goggles', 'Spectacles', 'Tactical Visor', 'Shades', 'Field Lenses', 'Monocle'],
  vehicle: ['Cruiser', 'Speeder', 'Roadster', 'Skiff', 'Transport', 'Chopper', 'Sled', 'Shuttle'],
  prop: ['Scroll', 'Amulet', 'Compass', 'Field Journal', 'Star Chart', 'Orb', 'Talisman', 'Relic Case', 'Ledger', 'Signal Box'],
  jewelry: ['Ring', 'Signet Band', 'Pendant', 'Bracelet', 'Brooch', 'Locket', 'Signet'],
};

const FRANCHISES = [
  'Batman', 'Star Wars', 'Harry Potter', 'The Lord of the Rings', 'Back to the Future',
  'Sherlock Holmes', 'Superman', 'Spider-Man', 'Dracula', 'James Bond', 'Arthurian Legend',
  'Greek Mythology', 'Norse Mythology', 'Pirate Legend', 'Wild West Lore', 'Samurai Cinema',
  'Kung Fu Cinema', 'Noir Detective Films', 'Space Opera Serials', 'Classic Fairy Tales',
];

// Roughly weighted toward common/rare, legendary stays scarce — like a real drop table.
const RARITY_CYCLE = ['common', 'common', 'common', 'rare', 'rare', 'legendary'];

function priceFor(rarity, idx) {
  if (rarity === 'legendary') return 5000 + ((idx * 733) % 245000);
  if (rarity === 'rare') return 100 + ((idx * 197) % 3900);
  return 15 + ((idx * 37) % 385);
}

function generateProducts(count) {
  const categories = Object.keys(CATEGORY_NOUNS);
  const generated = [];
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    // Index within this category only (0, 1, 2, ...) — NOT the global i. Deriving noun/adjective
    // selection from the global i caused a modulus collision: every category's items share the
    // same (i % categories.length) residue, so any further "(i * k) % arrayLength" pick from that
    // could only ever land on gcd(k * categories.length, arrayLength) distinct values — e.g. with
    // categories.length = 7 and a 10-word noun list, only 2 of the 10 words were ever reachable,
    // and for the 7-word jewelry list every single item got the identical noun. Stepping by 1
    // through `withinCategory` instead (with per-field strides chosen coprime to each array's
    // length) visits every word before repeating.
    const withinCategory = Math.floor(i / categories.length);
    const nouns = CATEGORY_NOUNS[category];
    const noun = nouns[withinCategory % nouns.length];
    const adjective = ADJECTIVES[(withinCategory * 7 + 3) % ADJECTIVES.length];
    const franchise = FRANCHISES[(withinCategory * 3 + 5) % FRANCHISES.length];
    const rarity = RARITY_CYCLE[i % RARITY_CYCLE.length];
    const edition = i + 1;
    generated.push({
      id: `p${curated.length + i + 1}`,
      name: `${adjective} ${noun} — Edition ${edition}`,
      tag: category,
      rarity,
      price: Math.round(priceFor(rarity, i)),
      inspiredBy: franchise,
      description: `A ${adjective.toLowerCase().replace(/-/g, ' ')} ${category} piece drawn from the ${franchise} archive, catalog run #${edition}.`,
    });
  }
  return generated;
}

export const products = [...curated, ...generateProducts(1000)];

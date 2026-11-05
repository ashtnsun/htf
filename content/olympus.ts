import "server-only";

/**
 * The family reveal (/olympus): nine families, each led by an exec as a Greek god. A family's
 * trial is a chain (components/olympus/journey), each step the key to the next, and no step
 * explains itself:
 *
 * 1. Five riddles, oblique on purpose (none names its answer's best-known fact outright). The
 *    first letter of each answer is one letter of `word`, a five-letter Greek word that says
 *    nothing of the god. The riddles are listed out of word order (the letters arrive
 *    scrambled; no order spells a word).
 * 2. `word`, played like Wordle: six tries, then a minute's silence.
 * 3. `hiding`, where the family's letter is hidden in the room, carved in a Vigenère cipher
 *    whose key is `word` with each letter moved by a count written under its wheel (cipher.ts
 *    `KEY_STEPS`: + the shortest name, − the faces, + the group × 2, + the longest name, − the
 *    nine execs). The family turns five wheels; nothing says the counts start from the word
 *    (the stone can also be cracked by eye, slowly).
 * 4. The herald's letter: a folded A4 sheet hidden in the room (printed from
 *    /archive/olympus/letters, which exists only in `next dev`), addressed to the group, holding
 *    CLUE and the group's `seal`. Typing the seal on the laptop breaks it.
 * 5. `doorWord`, signalled by the Hall's fires on a square keyed by the seal, pressed on the floor
 *    to open the great door (no J: I and J share a cell).
 * 6. `finalWord`, given by the altar past the door. They take it to the Oracle (/oracle), which
 *    reveals the god to the whole room.
 *
 * The game is components/olympus/crawl. app/archive/olympus keeps the flow from before it, in
 * `next dev` only, where the fires spell `finalWord` on the plain square.
 *
 * Server only: every answer is checked in app/olympus/actions.ts, and nothing of a later step
 * reaches the browser before the step before it is solved.
 *
 * `also` lists other accepted answers. Every guess is compared without case, spaces,
 * punctuation, leading words like "a", "the", "in" or "mount", or a trailing plural "s".
 * Each god's dinosaur is in components/dino/reveal.ts, by name.
 */
export type Riddle = { riddle: string; answer: string; also?: readonly string[] };

export type Family = {
  god: string;
  exec: string;
  word: string;
  riddles: readonly Riddle[];
  /**
   * Step 3's message: where the family's letter is hidden, one cryptic line in capitals, after
   * "IN LAWSON COMMONS," (the stone carves letters and keeps spaces and punctuation as they are).
   */
  hiding: string;
  /** The word printed inside the family's letter, typed on the laptop to break its seal. */
  seal: string;
  /**
   * What the fires spell. It opens the great door and nothing else; the
   * Sanctum's altar then gives `finalWord`, which this must never equal. No J: the fires' square
   * has none, so a word with one could not be pressed on the floor.
   */
  doorWord: string;
  finalWord: string;
};

/** Inside every letter (step 4), the same for every family. Points to step 5, barely. */
export const CLUE = "IN THE SQUARE OF POLYBIUS, THE LEFT FIRES COUNT THE ROW";

/** In family order: index 0 is Family I. */
export const FAMILIES: readonly Family[] = [
  {
    god: "Apollo",
    exec: "Jason",
    word: "GYROS",
    hiding: "IN LAWSON COMMONS, SITTING COMFORTABLY WITH THE WORST VIEW OF THE THEATRE",
    seal: "ARETE",
    doorWord: "ITHACA",
    finalWord: "DRACHMA",
    riddles: [
      {
        riddle:
          "I eat bridges and ships without a single tooth. Water and air set my table, and a whole red planet is dressed in me. What am I?",
        answer: "Rust",
      },
      {
        riddle:
          "Three hearts beat in me, and not one has ever been broken by love. My blood runs blue without royalty, my mind lives mostly in my arms, and when danger comes I write my escape in ink. What am I?",
        answer: "Octopus",
        also: ["Octopi", "Octopuses"],
      },
      {
        riddle:
          "The more people keep me, the less I’m worth. Give me to one friend and I might survive; give me to everyone and I no longer exist. What am I?",
        answer: "Secret",
      },
      {
        riddle:
          "I was sand until fire changed my mind. People look through me all day without seeing me, and one high note is said to be enough to shatter me. What am I?",
        answer: "Glass",
      },
      {
        riddle:
          "I’m the sun of a tiny world, ringed by a sky that turns white in the heat, sealed in a shell no key can open. Break my world and I bleed gold onto your breakfast. What am I?",
        answer: "Yolk",
        also: ["Egg yolk", "Yoke"],
      },
    ],
  },
  {
    god: "Hades",
    exec: "Ben",
    word: "DELTA",
    hiding: "IN LAWSON COMMONS, SNEAK PAST THE TYRANT LIZARD KING",
    seal: "KLEOS",
    doorWord: "CORINTH",
    finalWord: "MARATHON",
    riddles: [
      {
        riddle:
          "I do my best work lying on the bottom, holding a giant still with a grip on nothing but mud. Sailors raise me to leave, and every evening news desk has someone named after me. What am I?",
        answer: "Anchor",
      },
      {
        riddle:
          "I lend and never charge interest. I hold a thousand voices and ask you to keep yours down, and if you don’t bring back what you took, I’ll fine you. What am I?",
        answer: "Library",
        also: ["Libraries"],
      },
      {
        riddle:
          "I’m a film shown to an audience of one, with the eyes closed. I’m usually gone by breakfast, and a preacher once told a quarter of a million people he had me. What am I?",
        answer: "Dream",
      },
      {
        riddle:
          "You hold me without hands and bite me when you shouldn’t speak. I taste everything you do, and I’m the one muscle you can stick out at people. What am I?",
        answer: "Tongue",
      },
      {
        riddle:
          "A goddess cursed me so I could never speak first. Now I live in caves and canyons and only ever repeat your last words back to you. What am I?",
        answer: "Echo",
      },
    ],
  },
  {
    god: "Athena",
    exec: "Arushi",
    word: "TITAN",
    hiding: "IN LAWSON COMMONS, SAD SEAT WAITING TO BE WELCOMED",
    seal: "XENIA",
    doorWord: "CYCLOPS",
    finalWord: "PHOENIX",
    riddles: [
      {
        riddle:
          "I have feathers but no wings and a head but no thoughts. I go nowhere until I’m pulled back. What am I?",
        answer: "Arrow",
      },
      {
        riddle:
          "Twice a day I come in and twice I leave, always on schedule, with no clock. The moon pulls my strings, and no sandcastle survives me. What am I?",
        answer: "Tide",
        also: ["High tide", "Low tide"],
      },
      {
        riddle:
          "I’m greater than the gods and worse than the devil. The poor have me, the rich need me, and if you eat me, you’ll die. What am I?",
        answer: "Nothing",
      },
      {
        riddle:
          "I’m surrounded on all sides and have never surrendered. Castaways get stuck on me, and a poet swore that no man is one of me. What am I?",
        answer: "Island",
      },
      {
        riddle:
          "I’m killed but never die, spent but never bought, and you’re losing me as you read this. What am I?",
        answer: "Time",
      },
    ],
  },
  {
    god: "Zeus",
    exec: "Arav",
    word: "HOMER",
    hiding: "IN LAWSON COMMONS, WHO CONTROLS DAY AND NIGHT",
    seal: "NOSTOS",
    doorWord: "LABYRINTH",
    finalWord: "SPARTAN",
    riddles: [
      {
        riddle:
          "I know every story in the building and I’ve never told one. I go up without climbing and down without falling, and one press of a button calls me. What am I?",
        answer: "Elevator",
        also: ["Lift"],
      },
      {
        riddle:
          "I have more buttons than a coat but no shirt to fasten. I rule a glowing box from across the room, and I hide exactly when I’m needed. What am I?",
        answer: "Remote",
        also: ["Remote control"],
      },
      {
        riddle:
          "I have mountains you can’t climb, rivers you can’t drink from, and roads that lead nowhere you can walk. Fold me wrong and I’ll never lie flat again. What am I?",
        answer: "Map",
      },
      {
        riddle:
          "I keep my armour shut and hide a jewel I made from an irritation. The whole world is said to be me, and I’m usually swallowed alive. What am I?",
        answer: "Oyster",
      },
      {
        riddle:
          "I’m a line no one has ever crossed. Walk toward me for a lifetime and I keep my distance, and every sunset goes down behind me. What am I?",
        answer: "Horizon",
      },
    ],
  },
  {
    god: "Aphrodite",
    exec: "Khang",
    word: "SIGMA",
    hiding: "IN LAWSON COMMONS, BEHIND THE LAW WE BROKE ALREADY",
    seal: "MOIRA",
    doorWord: "PANDORA",
    finalWord: "PEGASUS",
    riddles: [
      {
        riddle:
          "I’m born without parents, I weigh nothing yet I can be stolen, and the moment you share me there are two of me. What am I?",
        answer: "Idea",
      },
      {
        riddle:
          "I copy your every move without a sound. I’m longest when the sun is lowest, I vanish in the dark, and a boy who never grew up once lost his. What am I?",
        answer: "Shadow",
      },
      {
        riddle:
          "I cost nothing, yet pride can’t afford me. I’m easy to owe and hard to give, and the later I arrive the less I’m worth. What am I?",
        answer: "Apology",
        also: ["Sorry"],
      },
      {
        riddle:
          "Crushed, I become what kings raise to toast. Dried, I wrinkle and take a new name. A fox who couldn’t reach me once called me sour. What am I?",
        answer: "Grape",
      },
      {
        riddle:
          "Everyone makes me and no one wants to claim me. I can’t be unmade, yet you learn more from me than from being right. What am I?",
        answer: "Mistake",
      },
    ],
  },
  {
    god: "Ares",
    exec: "Naks",
    word: "PLATO",
    hiding: "IN LAWSON COMMONS, AN OPENING IN THE WALL GIVES WAY TO THE VIEW",
    seal: "LOGOS",
    doorWord: "SPHINX",
    finalWord: "AMPHORA",
    riddles: [
      {
        riddle:
          "I’m eighth in a famous table. I’m in every breath you take and every glass of water you drink, and fire dies the moment I leave. What am I?",
        answer: "Oxygen",
      },
      {
        riddle:
          "I take years to build and a second to break. You have to give me before you can earn me back. What am I?",
        answer: "Trust",
      },
      {
        riddle:
          "I have eighty-eight keys but open no doors, hammers but build nothing, and I can be grand without being proud. What am I?",
        answer: "Piano",
        also: ["Grand piano"],
      },
      {
        riddle:
          "Presidents give me to a nation, and every letter needs me to find its way. I’m where you live, but I’m not your home. What am I?",
        answer: "Address",
      },
      {
        riddle:
          "I have steps but go nowhere unless you carry me. Walk under me and your luck leaves; climb me and you might rise in a company. What am I?",
        answer: "Ladder",
      },
    ],
  },
  {
    god: "Poseidon",
    exec: "Emily",
    word: "CHAOS",
    hiding: "IN LAWSON COMMONS, JOURNEY TOWARDS OLYMPUS BUT ITS NOT ABOUT THE DESTINATION",
    seal: "KAIROS",
    doorWord: "GORGON",
    finalWord: "CENTAUR",
    riddles: [
      {
        riddle:
          "Say my name and you break me. I’m said to be golden, and a library begs for me. What am I?",
        answer: "Silence",
      },
      {
        riddle:
          "I show up before the trouble does. I can be good or bad, and one black cat crossing your path is enough to make me. What am I?",
        answer: "Omen",
      },
      {
        riddle:
          "I’m a pump that never rests and a shape that looks nothing like me. You give me away when you give it everything you have. What am I?",
        answer: "Heart",
      },
      {
        riddle:
          "Everyone has me and most people hide me. I only ever climb, and wine and cheese love me far more than people do. What am I?",
        answer: "Age",
      },
      {
        riddle:
          "I have a needle and I’ve never sewn a stitch. I have no legs and I’ve never been lost, and I’ve pointed the same way my whole life. What am I?",
        answer: "Compass",
      },
    ],
  },
  {
    god: "Hermes",
    exec: "Ashton",
    word: "OMEGA",
    hiding: "IN LAWSON COMMONS, IN THE SHADOWS OF THE THEATRES LIGHT",
    seal: "ETHOS",
    doorWord: "ARGONAUT",
    finalWord: "MINOTAUR",
    riddles: [
      {
        riddle:
          "You reach for me the moment you’re late. I’m easy to make and hard to believe, and I’ve never fixed anything. What am I?",
        answer: "Excuse",
      },
      {
        riddle:
          "I paint whole forests without a brush, then strip them bare. I have two names, and one of them is what my leaves do. What am I?",
        answer: "Autumn",
        also: ["Fall"],
      },
      {
        riddle:
          "I have no weight, yet people carry me for decades. I’m nursed but never healed, and I only hurt the one holding me. What am I?",
        answer: "Grudge",
        also: ["Guilt"],
      },
      {
        riddle:
          "I have no words, yet I bring grown adults to tears. Peel me back and there’s only more of me. What am I?",
        answer: "Onion",
      },
      {
        riddle:
          "I can be jogged without running and lost without going anywhere. I fade as you age, and I play tricks on you. What am I?",
        answer: "Memory",
      },
    ],
  },
  {
    god: "Artemis",
    exec: "Shreeya",
    word: "ATLAS",
    hiding: "IN LAWSON COMMONS, A COMMON FIRST MOVE IN A GAME OF TIC TAC TOE",
    seal: "AGON",
    doorWord: "ACROPOLIS",
    finalWord: "ODYSSEY",
    riddles: [
      {
        riddle:
          "I’m always on my way and I never arrive. You can promise me anything, and the moment you reach me I’ve changed my name. What am I?",
        answer: "Tomorrow",
      },
      {
        riddle:
          "Every question is looking for me. I’m kept at the back of the book, and you’re hunting for me right now. What am I?",
        answer: "Answer",
        also: ["Solution"],
      },
      {
        riddle:
          "I’m a curve that sets a lot of things straight. A famous painting wears only a little of me, and I mean the same thing in every country. What am I?",
        answer: "Smile",
      },
      {
        riddle:
          "I can’t be earned, only wished on you. Beginners are said to have me, and gamblers swear theirs is about to change. What am I?",
        answer: "Luck",
        also: ["Fortune"],
      },
      {
        riddle:
          "I’m only a name, worth nothing until that name gets famous. Fans queue for hours for me. What am I?",
        answer: "Autograph",
        also: ["Signature"],
      },
    ],
  },
];

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
 * 4. The herald's letter: a folded A4 sheet hidden in the room (printed from /olympus/letters,
 *    which exists only in `next dev`), addressed to the group, holding CLUE and the group's
 *    `seal`. Typing the seal on the laptop breaks it.
 * 5. `finalWord`, signalled by torches on Polybius's square, which is never drawn: the family
 *    builds it themselves (no J: I and J share a cell). They take the word to the Oracle
 *    (/oracle), which reveals the god to the whole room.
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
   * Step 3's message: where the family's letter is hidden, one cryptic line in capitals and
   * spaces only (the stone carves letters and keeps spaces; punctuation would show as is).
   */
  hiding: string;
  /** The word printed inside the family's letter, typed on the laptop to break its seal. */
  seal: string;
  /**
   * /olympus3 only: what the fires spell there. It opens the great door and nothing else; the
   * Sanctum's altar then gives `finalWord`, which this must never equal. No J: the fires' square
   * has none, so a word with one could not be pressed on the floor.
   */
  doorWord: string;
  finalWord: string;
};

/** Inside every letter (step 4), the same for every family. Points to step 5, barely. */
export const CLUE = "IN THE SQUARE OF POLYBIUS, THE LEFT FIRES COUNT THE ROW";

/**
 * TODO(Ashton): the letters are hidden on the day; replace each family's `hiding` with a line for
 * its spot, every one starting IN LAWSON COMMONS. Until then every stone carries this.
 */
const HIDING_TODO = "IN LAWSON COMMONS YOUR LETTER IS HIDDEN";

/** In family order: index 0 is Family I. */
export const FAMILIES: readonly Family[] = [
  {
    god: "Apollo",
    exec: "Jason",
    word: "GYROS",
    hiding: HIDING_TODO,
    seal: "ARETE",
    doorWord: "ITHACA",
    finalWord: "DRACHMA",
    riddles: [
      {
        riddle:
          "I’m an arch with no stones and a bridge no foot has crossed. I keep a promise made after a flood, you only see me with your back to the light, and seven is my number. What am I?",
        answer: "Rainbow",
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
          "I have five fingers but no flesh or bone. Thrown down, I start a duel; I’m only warm when I’m worn, and I’m forever losing my other half. What am I?",
        answer: "Glove",
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
    hiding: HIDING_TODO,
    seal: "KLEOS",
    doorWord: "CORINTH",
    finalWord: "MARATHON",
    riddles: [
      {
        riddle:
          "We are a family of twenty-six who never meet in person. Together we have written every book; alone, most of us say nothing at all. What are we?",
        answer: "Alphabet",
        also: ["ABC", "ABCs"],
      },
      {
        riddle:
          "I’m a car that never runs right, a fruit that never sweetens, and the start of life’s most famous piece of advice. What am I?",
        answer: "Lemon",
      },
      {
        riddle:
          "Twenty-one eyes and not one of them sees. I decide fortunes with a single throw, and a general once cast me before crossing a river. What am I?",
        answer: "Dice",
        also: ["Die"],
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
    hiding: HIDING_TODO,
    seal: "XENIA",
    doorWord: "CYCLOPS",
    finalWord: "PHOENIX",
    riddles: [
      {
        riddle:
          "I’m loved the night before and hated the morning after. I’m set but never placed, and I go off without ever leaving. What am I?",
        answer: "Alarm",
        also: ["Alarm clock"],
      },
      {
        riddle:
          "I have rings but no fingers and a trunk but no luggage. I’m usually older than anyone who climbs me, and your family is drawn as one of me. What am I?",
        answer: "Tree",
      },
      {
        riddle:
          "I’m greater than the gods and worse than the devil. The poor have me, the rich need me, and if you eat me, you’ll die. What am I?",
        answer: "Nothing",
      },
      {
        riddle:
          "Born of water, I float on my own mother. The sun kills me, the cold brings me back, and I once sank a ship that could not sink. What am I?",
        answer: "Ice",
        also: ["Iceberg"],
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
    hiding: HIDING_TODO,
    seal: "NOSTOS",
    doorWord: "LABYRINTH",
    finalWord: "SPARTAN",
    riddles: [
      {
        riddle:
          "I’m sealed with a lick, I carry words I never read, and I’m torn open the moment I arrive. What am I?",
        answer: "Envelope",
      },
      {
        riddle:
          "I have more buttons than a coat but no shirt to fasten. I rule a glowing box from across the room, and I vanish into the sofa exactly when I’m needed. What am I?",
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
          "Nobody agrees whether I was named for a colour or the colour was named for me, and poets have searched for my rhyme for centuries. What am I?",
        answer: "Orange",
      },
      {
        riddle:
          "A worker spends her whole life making a twelfth of a spoonful of me. I never spoil: jars of me came out of ancient tombs still sweet. What am I?",
        answer: "Honey",
      },
    ],
  },
  {
    god: "Aphrodite",
    exec: "Khang",
    word: "SIGMA",
    hiding: HIDING_TODO,
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
          "I’m built without tools, given eyes of coal and a nose from the vegetable drawer, and a single warm afternoon is my whole life story. What am I?",
        answer: "Snowman",
        also: ["Snowmen", "Snow man"],
      },
      {
        riddle:
          "I carry fifty times my own weight, I farm smaller insects for their sweetness, and the queen I serve is also my mother. What am I?",
        answer: "Ant",
      },
      {
        riddle:
          "Crushed, I become what kings raise to toast. Dried, I wrinkle and take a new name. A fox who couldn’t reach me once called me sour. What am I?",
        answer: "Grape",
      },
      {
        riddle:
          "I’m neither plant nor animal. I wear a cap with no head and stand on a stem with no flower, and one of my family is said to have killed an emperor. What am I?",
        answer: "Mushroom",
      },
    ],
  },
  {
    god: "Ares",
    exec: "Naks",
    word: "PLATO",
    hiding: HIDING_TODO,
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
    hiding: HIDING_TODO,
    seal: "KAIROS",
    doorWord: "GORGON",
    finalWord: "CENTAUR",
    riddles: [
      {
        riddle:
          "We’re born in pairs and die alone, because something in the laundry eats one of us every week. What are we?",
        answer: "Sock",
      },
      {
        riddle:
          "I’m an art with one rule: one square, no cuts. Make a thousand of my cranes and you’re granted a wish. What am I?",
        answer: "Origami",
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
          "I cry tears of wax as I work and shrink as I shine. Once a year someone makes a wish and then kills me with a breath. What am I?",
        answer: "Candle",
      },
    ],
  },
  {
    god: "Hermes",
    exec: "Ashton",
    word: "OMEGA",
    hiding: HIDING_TODO,
    seal: "ETHOS",
    doorWord: "ARGONAUT",
    finalWord: "MINOTAUR",
    riddles: [
      {
        riddle:
          "I’m one side of the oldest argument about who came first. I must be broken before I’m any use, and every spring I’m hidden for children to find. What am I?",
        answer: "Egg",
      },
      {
        riddle:
          "I’m made with hands but never held. I’m loudest at the end, and an actor fears me most when I stop too soon. What am I?",
        answer: "Applause",
      },
      {
        riddle:
          "I keep the moon on a leash I never let go. I hold your feet down and your hopes humble, and a falling apple introduced me. What am I?",
        answer: "Gravity",
      },
      {
        riddle:
          "I’m water in a place that forgot water. Travellers chase me, and sometimes I’m only a lie the heat tells. What am I?",
        answer: "Oasis",
        also: ["Oases"],
      },
      {
        riddle:
          "I’m a face that belongs to no one. Greek actors wore me to become gods and kings, and at certain balls I’m the price of entry. What am I?",
        answer: "Mask",
      },
    ],
  },
  {
    god: "Artemis",
    exec: "Shreeya",
    word: "ATLAS",
    hiding: HIDING_TODO,
    seal: "AGON",
    doorWord: "ACROPOLIS",
    finalWord: "ODYSSEY",
    riddles: [
      {
        riddle:
          "I live in a tube and get squeezed every morning, and I’m the reason orange juice tastes terrible right after. What am I?",
        answer: "Toothpaste",
      },
      {
        riddle:
          "I start as a whisper on a mountainside and end as a roar in the valley. Shout too loudly and you might wake me. What am I?",
        answer: "Avalanche",
      },
      {
        riddle:
          "I’m a curve that sets a lot of things straight. A famous painting wears only a little of me, and I mean the same thing in every country. What am I?",
        answer: "Smile",
      },
      {
        riddle:
          "I have more than seven thousand faces. Some of me are dying, one of me rules the Church though no one is born speaking it, and you are using me this very second. What am I?",
        answer: "Language",
      },
      {
        riddle:
          "I’m the highest room in the house and the lowest in its regard. Old things come to me to be forgotten, and in ancient Greece my name meant “from Athens.” What am I?",
        answer: "Attic",
      },
    ],
  },
];

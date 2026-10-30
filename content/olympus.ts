import "server-only";

/**
 * The family reveal (/olympus): nine families, each led by an exec as a Greek god. A family
 * solves its riddles in order; the first letter of each answer is one letter of `word`, which
 * points to the god. The riddles are listed out of word order on purpose (the letters arrive
 * scrambled; none of the orders spells a word). Server only: the answers and the gods are
 * checked in app/olympus/actions.ts and never reach the browser before they are solved.
 *
 * `also` lists other accepted answers. Every guess is compared without case, spaces,
 * punctuation, leading words like "a", "the", "in" or "mount", or a trailing plural "s".
 * `dino` is the god's sprite id in the /dino editor (components/dino/gods.ts).
 */
export type Riddle = { riddle: string; answer: string; also?: readonly string[] };

export type Family = {
  god: string;
  exec: string;
  word: string;
  dino: string;
  riddles: readonly Riddle[];
};

/** In family order: index 0 is Family I. */
export const FAMILIES: readonly Family[] = [
  {
    god: "Apollo",
    exec: "Jason",
    word: "LYRE",
    dino: "apollo-pick-2",
    riddles: [
      {
        riddle:
          "I have a lid but no box and a pupil but no teacher. A needle has one, yet it can’t see. What am I?",
        answer: "Eye",
      },
      {
        riddle:
          "I grow bigger every time I’m passed along, and I travel faster than the truth. Nobody ever admits to starting me. What am I?",
        answer: "Rumor",
        also: ["Rumour"],
      },
      {
        riddle:
          "I’m contagious but carry no germs. I spread by sight alone, and just reading about me may set me off right now. What am I?",
        answer: "Yawn",
        also: ["Yawning"],
      },
      {
        riddle:
          "I hold more stories than the world’s tallest skyscraper, even if I’m only one floor high. Speak too loudly inside me and someone will shush you. What am I?",
        answer: "Library",
        also: ["Libraries"],
      },
    ],
  },
  {
    god: "Hades",
    exec: "Ben",
    word: "SOUL",
    dino: "hades-pick-2",
    riddles: [
      {
        riddle:
          "I go up when the rain comes down. I’m useless indoors, and superstition says opening me there brings bad luck. What am I?",
        answer: "Umbrella",
      },
      {
        riddle:
          "I’m the opposite of right, but I’m never wrong. I’m what remains after everyone else is gone, and I’m what you did when you walked out the door. What am I?",
        answer: "Left",
      },
      {
        riddle: "I’m so fragile that saying my name breaks me. What am I?",
        answer: "Silence",
      },
      {
        riddle:
          "I wear many coats but I’m never cold. Undress me and you’ll cry, even though I never hurt you. What am I?",
        answer: "Onion",
      },
    ],
  },
  {
    god: "Athena",
    exec: "Arushi",
    word: "WISE",
    dino: "athena-shield",
    riddles: [
      {
        riddle:
          "I follow you everywhere in daylight and vanish the moment the lights go out. You can step on me all day and I’ll never complain. What am I?",
        answer: "Shadow",
      },
      {
        riddle:
          "I go up and down all day but never move an inch sideways. I have buttons but no shirt. What am I?",
        answer: "Elevator",
      },
      {
        riddle:
          "I have a face and two hands but no arms. I’m always running, but I never leave your wrist. What am I?",
        answer: "Watch",
        also: ["Wristwatch"],
      },
      {
        riddle: "The more you scratch me, the more I demand to be scratched. What am I?",
        answer: "Itch",
      },
    ],
  },
  {
    god: "Zeus",
    exec: "Arav",
    word: "BOLT",
    dino: "zeus-final-gem",
    riddles: [
      {
        riddle: "The more I dry, the wetter I get. What am I?",
        answer: "Towel",
      },
      {
        riddle:
          "A proverb says I knock only once. If you don’t answer the door in time, people say you let me slip through your fingers. What am I?",
        answer: "Opportunity",
      },
      {
        riddle:
          "You’ll find me in any accounting office. My name has three pairs of double letters in a row, which almost no other common English word can claim. What am I?",
        answer: "Bookkeeper",
        also: ["Bookkeeping"],
      },
      {
        riddle:
          "I appear the moment you sit down and vanish the moment you stand up. You can never sit on your own. Runners also have to complete me, over and over. What am I?",
        answer: "Lap",
      },
    ],
  },
  {
    god: "Aphrodite",
    exec: "Khang",
    word: "LOVE",
    dino: "aphrodite-final-roses",
    riddles: [
      {
        riddle:
          "Lay me on my side and I become endless. Stand me back up and I’m just one more than a lucky number. What am I?",
        answer: "Eight",
        also: ["8"],
      },
      {
        riddle:
          "You can tell me, but nobody can see me. If you’re caught in me, you’re in trouble. Some people insist theirs are white. What am I?",
        answer: "Lie",
      },
      {
        riddle:
          "I can be raised without lifting and lost without being misplaced. I’m cast at elections, and I crack in nearly every teenage boy. What am I?",
        answer: "Voice",
      },
      {
        riddle:
          "To make me, you first have to break something, and a famous proverb says there’s no other way to do it. I’m often folded around cheese. What am I?",
        answer: "Omelet",
        also: ["Omelette"],
      },
    ],
  },
  {
    god: "Ares",
    exec: "Naks",
    word: "SPEAR",
    dino: "ares-final2-fitted",
    riddles: [
      {
        riddle: "Before it was discovered, what was the tallest mountain on Earth?",
        answer: "Everest",
      },
      {
        riddle: "I travel all around the world while staying in one corner. What am I?",
        answer: "Stamp",
        also: ["Postage stamp"],
      },
      {
        riddle:
          "I go up and never come down. Once a year, a cake full of candles keeps count of me. What am I?",
        answer: "Age",
      },
      {
        riddle:
          "I have a mouth but never speak, a bed but never sleep, and a bank but no money. I run without legs. What am I?",
        answer: "River",
      },
      {
        riddle:
          "I can be broken without being touched, kept without being held, and made without hands. Politicians are famous for making me before elections. What am I?",
        answer: "Promise",
      },
    ],
  },
  {
    god: "Poseidon",
    exec: "Emily",
    word: "TIDE",
    dino: "poseidon-final-trident",
    riddles: [
      {
        riddle:
          "Every mistake I fix costs me a piece of myself, and if I work hard enough I disappear entirely. I usually ride on the end of a stick. What am I?",
        answer: "Eraser",
      },
      {
        riddle:
          "I’m always on my way but never arrive. The moment you think you’ve reached me, I’ve turned into something else. What am I?",
        answer: "Tomorrow",
      },
      {
        riddle: "Where does Thursday come before Wednesday, and “success” come before “work”?",
        answer: "Dictionary",
      },
      {
        riddle:
          "Every dictionary contains one word that is always spelled incorrectly, no matter how carefully you write it. What is the word?",
        answer: "Incorrectly",
      },
    ],
  },
  {
    god: "Hermes",
    exec: "Ashton",
    word: "WING",
    dino: "hermes2-final-spiral",
    riddles: [
      {
        riddle:
          "I have four fingers and a thumb but no flesh or bone. I usually go missing one at a time, and my partner gets left behind. What am I?",
        answer: "Glove",
      },
      {
        riddle:
          "I’m black and white and read all over. Yesterday I was urgent; today I line a birdcage. What am I?",
        answer: "Newspaper",
      },
      {
        riddle:
          "I grow downward from the edge of a roof, getting sharper as I grow, and the sun is what kills me. What am I?",
        answer: "Icicle",
      },
      {
        riddle:
          "I start out crushed underfoot, then I’m locked away in the dark, and the longer I’m kept, the more I’m worth. What am I?",
        answer: "Wine",
      },
    ],
  },
  {
    god: "Artemis",
    exec: "Shreeya",
    word: "HUNT",
    dino: "artemis-leaf-headband",
    riddles: [
      {
        riddle: "It belongs to you, but other people use it far more than you do. What is it?",
        answer: "Name",
      },
      {
        riddle:
          "I can fall from your eye or be made in a sheet of paper. I’m spelled the same both ways but pronounced differently. What am I?",
        answer: "Tear",
      },
      {
        riddle: "The more you take away from me, the bigger I get. What am I?",
        answer: "Hole",
      },
      {
        riddle:
          "I’m the official national animal of Scotland, yet nobody has ever seen me alive. In the business world, I’m a startup worth over a billion dollars. What am I?",
        answer: "Unicorn",
      },
    ],
  },
];

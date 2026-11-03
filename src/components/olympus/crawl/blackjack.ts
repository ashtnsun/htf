/**
 * Blackjack, by the usual rules: six decks, the dealer stands on all 17s and peeks for blackjack,
 * double on any first two cards, one split of two cards of equal value (split aces get one card
 * each), a natural pays 3:2 (coins are whole, so odd bets round up in the player's favour).
 * No screen in here: a round is plain data, and every step returns a new one.
 */

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Card = { rank: string; suit: Suit };
export type Result = "blackjack" | "win" | "push" | "lose" | "bust";
export type Hand = {
  cards: Card[];
  bet: number;
  /** Takes no more cards. */
  done: boolean;
  split: boolean;
  result: Result | null;
};
export type Round = {
  shoe: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number;
  /** The player has finished: the hole card is up and the dealer plays. */
  dealerTurn: boolean;
  over: boolean;
};

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

export function newShoe(decks = 6, random: () => number = Math.random): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < decks; d += 1) {
    for (const suit of SUITS) for (const rank of RANKS) shoe.push({ rank, suit });
  }
  for (let i = shoe.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j]!, shoe[i]!];
  }
  return shoe;
}

const valueOf = (card: Card) =>
  card.rank === "A" ? 11 : ["J", "Q", "K"].includes(card.rank) ? 10 : Number(card.rank);

/** The hand's best total: an ace counts 11 until that would bust it, then 1. */
export function total(cards: readonly Card[]) {
  let sum = cards.reduce((n, c) => n + valueOf(c), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces -= 1;
  }
  return { total: sum, soft: aces > 0 };
}

export const isNatural = (cards: readonly Card[]) =>
  cards.length === 2 && total(cards).total === 21;

const take = (round: Round) => round.shoe.pop()!;

/** What comes back to the player for a hand: the stake and any winnings. */
export function payout(hand: Hand) {
  switch (hand.result) {
    case "blackjack":
      return hand.bet + Math.ceil(hand.bet * 1.5);
    case "win":
      return hand.bet * 2;
    case "push":
      return hand.bet;
    default:
      return 0;
  }
}

export const totalPayout = (round: Round) => round.hands.reduce((n, h) => n + payout(h), 0);

export function deal(bet: number, shoe: Card[] = newShoe()): Round {
  const round: Round = {
    shoe: [...shoe],
    dealer: [],
    hands: [{ cards: [], bet, done: false, split: false, result: null }],
    active: 0,
    dealerTurn: false,
    over: false,
  };
  const hand = round.hands[0]!;
  hand.cards.push(take(round));
  round.dealer.push(take(round));
  hand.cards.push(take(round));
  round.dealer.push(take(round));
  // The dealer peeks: a natural on either side ends it at once.
  if (isNatural(hand.cards) || isNatural(round.dealer)) {
    hand.done = true;
    return finish(round);
  }
  return round;
}

function finish(round: Round): Round {
  const next = { ...round, shoe: [...round.shoe], dealer: [...round.dealer], dealerTurn: true };
  const alive = next.hands.some((h) => total(h.cards).total <= 21);
  const natural = next.hands.length === 1 && isNatural(next.hands[0]!.cards);
  if (alive && !natural && !isNatural(next.dealer)) {
    while (total(next.dealer).total < 17) next.dealer.push(next.shoe.pop()!);
  }
  const dealer = total(next.dealer).total;
  next.hands = next.hands.map((hand) => {
    const mine = total(hand.cards).total;
    let result: Result;
    if (mine > 21) result = "bust";
    else if (isNatural(hand.cards) && !hand.split) {
      result = isNatural(next.dealer) ? "push" : "blackjack";
    } else if (isNatural(next.dealer)) result = "lose";
    else if (dealer > 21 || mine > dealer) result = "win";
    else if (mine === dealer) result = "push";
    else result = "lose";
    return { ...hand, result };
  });
  next.over = true;
  return next;
}

/** On to the next hand still in play, or to the dealer. */
function advance(round: Round): Round {
  const next = round.hands.findIndex((h, i) => i > round.active && !h.done);
  if (next >= 0) return { ...round, active: next };
  const first = round.hands.findIndex((h) => !h.done);
  if (first >= 0) return { ...round, active: first };
  return finish(round);
}

function withHand(round: Round, change: (hand: Hand, round: Round) => Hand): Round {
  const copy = { ...round, shoe: [...round.shoe], hands: [...round.hands] };
  copy.hands[copy.active] = change({ ...copy.hands[copy.active]! }, copy);
  return copy;
}

export function hit(round: Round): Round {
  const next = withHand(round, (hand, r) => {
    const cards = [...hand.cards, r.shoe.pop()!];
    return { ...hand, cards, done: total(cards).total >= 21 };
  });
  return next.hands[next.active]!.done ? advance(next) : next;
}

export function stand(round: Round): Round {
  return advance(withHand(round, (hand) => ({ ...hand, done: true })));
}

export const canDouble = (round: Round, coins: number) => {
  const hand = round.hands[round.active]!;
  return hand.cards.length === 2 && coins >= hand.bet;
};

/** Twice the bet, exactly one more card. The caller takes the extra stake. */
export function doubleDown(round: Round): Round {
  return advance(
    withHand(round, (hand, r) => ({
      ...hand,
      bet: hand.bet * 2,
      cards: [...hand.cards, r.shoe.pop()!],
      done: true,
    })),
  );
}

export const canSplit = (round: Round, coins: number) => {
  const hand = round.hands[round.active]!;
  return (
    round.hands.length === 1 &&
    hand.cards.length === 2 &&
    valueOf(hand.cards[0]!) === valueOf(hand.cards[1]!) &&
    coins >= hand.bet
  );
};

/** Two hands from one, a card dealt to each. The caller takes the extra stake. */
export function split(round: Round): Round {
  const copy = { ...round, shoe: [...round.shoe] };
  const [a, b] = copy.hands[0]!.cards as [Card, Card];
  const bet = copy.hands[0]!.bet;
  const aces = a.rank === "A";
  const make = (card: Card): Hand => {
    const cards = [card, copy.shoe.pop()!];
    return { cards, bet, split: true, result: null, done: aces || total(cards).total >= 21 };
  };
  copy.hands = [make(a), make(b)];
  copy.active = 0;
  if (copy.hands[0]!.done) return advance(copy);
  return copy;
}

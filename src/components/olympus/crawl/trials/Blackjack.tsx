"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import {
  canDouble,
  canSplit,
  deal,
  doubleDown,
  hit,
  split,
  stand,
  total,
  totalPayout,
  type Card,
  type Result,
  type Round,
  type Suit,
} from "@/components/olympus/crawl/blackjack";
import type { TombSound } from "@/components/olympus/crawl/sound";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

/** The four suits, in the black figure of a painted pot: owl, jar, helm and lyre. */
const SUIT_MAPS: Record<Suit, readonly string[]> = {
  spade: [
    "##.....##",
    "#########",
    "#..###..#",
    "#.#.#.#.#",
    "#..###..#",
    "####.####",
    ".#######.",
    ".#.###.#.",
    "..#.#.#..",
  ],
  heart: [
    "..#####..",
    "...###...",
    ".#.###.#.",
    "#..###..#",
    "#.#####.#",
    ".#######.",
    "..#####..",
    "...###...",
    "..#####..",
  ],
  diamond: [
    "..#####..",
    ".#######.",
    "#########",
    "###..####",
    "###..####",
    "#########",
    "##.###.##",
    "##.....##",
    "##.....##",
  ],
  club: [
    "#.......#",
    "##.....##",
    ".#.#.#.#.",
    ".#.#.#.#.",
    ".#.#.#.#.",
    ".#.#.#.#.",
    ".#######.",
    "...###...",
    "..#####..",
  ],
};
const SUIT_NAMES: Record<Suit, string> = {
  spade: "owls",
  heart: "jars",
  diamond: "helms",
  club: "lyres",
};
const RESULT_WORDS: Record<Result, string> = {
  blackjack: "Blackjack",
  win: "You win",
  push: "Push",
  lose: "The Fates win",
  bust: "Bust",
};

function SuitIcon({ suit }: { suit: Suit }) {
  return (
    <svg
      viewBox="0 0 9 9"
      className="block size-full"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      {SUIT_MAPS[suit].flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null,
        ),
      )}
    </svg>
  );
}

function CardFace({ card, hidden }: { card: Card; hidden?: boolean }) {
  if (hidden) {
    return (
      <li aria-label="A card, face down" className="crawl-card crawl-card-back">
        <span aria-hidden="true" />
      </li>
    );
  }
  // Half the deck is red-figure clay, half white-ground, like the pots they came off.
  const pale = card.suit === "heart" || card.suit === "club";
  return (
    <li
      aria-label={`${card.rank} of ${SUIT_NAMES[card.suit]}`}
      className={cn("crawl-card font-olympus", pale && "crawl-card-pale")}
    >
      <span aria-hidden="true" className="crawl-card-rank">
        {card.rank}
      </span>
      <span aria-hidden="true" className="crawl-card-suit">
        <SuitIcon suit={card.suit} />
      </span>
      <span aria-hidden="true" className="crawl-card-rank crawl-card-rank-low">
        {card.rank}
      </span>
    </li>
  );
}

/**
 * The blackjack machine, up close: traditional rules (blackjack.ts). A bet of whole coins, a hand
 * against the Fates, hit, stand, double or split. The stake leaves as it is played, and winnings
 * land the moment the round is decided, so stepping away never costs anything: the hand waits.
 */
export function Blackjack({
  coins,
  round,
  onRound,
  onSpend,
  onWin,
  sound,
}: {
  coins: number;
  round: Round | null;
  onRound: (round: Round | null) => void;
  onSpend: (coins: number) => void;
  onWin: (coins: number) => void;
  sound: TombSound;
}) {
  const reduce = useReducedMotionSafe();
  const [bet, setBet] = useState(1);
  // The dealer's cards turn over one at a time once the player is done.
  const [shown, setShown] = useState(2);
  const stake = Math.max(1, Math.min(bet, Math.max(1, coins)));
  const dealerDone = !round?.over || reduce || shown >= (round?.dealer.length ?? 0);

  useEffect(() => {
    if (!round?.over || reduce || shown >= round.dealer.length) return;
    const id = window.setTimeout(() => {
      sound.card();
      setShown((n) => n + 1);
    }, 520);
    return () => window.clearTimeout(id);
  }, [reduce, round, shown, sound]);

  // Once the Fates have shown their hand: a win sings, a loss knocks, a push says nothing.
  const announced = useRef(round);
  useEffect(() => {
    if (!round?.over || !dealerDone || announced.current === round) return;
    announced.current = round;
    const results = round.hands.map((h) => h.result);
    if (results.some((r) => r === "win" || r === "blackjack")) sound.solved();
    else if (results.some((r) => r === "lose" || r === "bust")) sound.thud();
  }, [dealerDone, round, sound]);

  function update(next: Round) {
    sound.card();
    onRound(next);
    if (next.over) onWin(totalPayout(next));
  }

  function start() {
    if (coins < stake) return;
    onSpend(stake);
    setShown(2);
    update(deal(stake));
  }

  const hand = round && !round.over ? round.hands[round.active] : null;
  const dealerCards = round?.dealer ?? [];
  const dealerUp = round?.over ?? false;
  const visible = dealerUp && !reduce ? dealerCards.slice(0, shown) : dealerCards;

  return (
    <div className="crawl-cabinet journey-rise">
      <p className="crawl-marquee font-olympus">Blackjack</p>
      <div className="crawl-table">
        <p className="crawl-table-rule font-olympus">
          Blackjack pays 3 to 2 · The Fates stand on 17
        </p>

        <section aria-label="The Fates" className="crawl-hand">
          <h2 className="crawl-hand-name font-olympus">
            The Fates
            {dealerUp && dealerDone ? ` · ${total(dealerCards).total}` : ""}
          </h2>
          <ol className="crawl-cards">
            {round ? (
              visible.map((card, i) => (
                <CardFace key={i} card={card} hidden={!dealerUp && i === 1} />
              ))
            ) : (
              <li className="crawl-card crawl-card-ghost" aria-hidden="true" />
            )}
          </ol>
        </section>

        <section aria-label="Your hand" className="crawl-hand">
          {round ? (
            round.hands.map((h, i) => (
              <div key={i} data-active={!round.over && i === round.active ? "" : undefined}>
                <h2 className="crawl-hand-name font-olympus">
                  {round.hands.length > 1 ? `Hand ${i + 1}` : "You"} · {total(h.cards).total} ·{" "}
                  {h.bet} {h.bet === 1 ? "coin" : "coins"}
                </h2>
                <ol className="crawl-cards">
                  {h.cards.map((card, c) => (
                    <CardFace key={c} card={card} />
                  ))}
                </ol>
                {round.over && dealerDone && h.result ? (
                  <p
                    role="status"
                    className={cn(
                      "crawl-result font-olympus",
                      (h.result === "win" || h.result === "blackjack") && "text-green",
                      h.result === "push" && "text-text",
                      (h.result === "lose" || h.result === "bust") && "text-muted",
                    )}
                  >
                    {RESULT_WORDS[h.result]}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <>
              <h2 className="crawl-hand-name font-olympus">You</h2>
              <ol className="crawl-cards">
                <li className="crawl-card crawl-card-ghost" aria-hidden="true" />
              </ol>
            </>
          )}
        </section>
      </div>

      <div className="crawl-panel crawl-panel-play font-olympus">
        {hand && round ? (
          <>
            <OlympusButton onClick={() => update(hit(round))}>Hit</OlympusButton>
            <OlympusButton onClick={() => update(stand(round))}>Stand</OlympusButton>
            {canDouble(round, coins) ? (
              <OlympusButton
                variant="secondary"
                onClick={() => {
                  onSpend(hand.bet);
                  update(doubleDown(round));
                }}
              >
                Double
              </OlympusButton>
            ) : null}
            {canSplit(round, coins) ? (
              <OlympusButton
                variant="secondary"
                onClick={() => {
                  onSpend(hand.bet);
                  update(split(round));
                }}
              >
                Split
              </OlympusButton>
            ) : null}
          </>
        ) : coins > 0 ? (
          <>
            <div role="group" aria-label="Your bet" className="crawl-bet">
              <button
                type="button"
                aria-label="Bet one coin less"
                disabled={stake <= 1}
                onClick={() => setBet(stake - 1)}
              >
                −
              </button>
              <output aria-live="polite">{stake}</output>
              <button
                type="button"
                aria-label="Bet one coin more"
                disabled={stake >= coins}
                onClick={() => setBet(stake + 1)}
              >
                +
              </button>
            </div>
            <OlympusButton onClick={start}>{round ? "Deal again" : "Deal"}</OlympusButton>
          </>
        ) : (
          <p role="status" className="text-sm text-cyan normal-case">
            You have no coins to bet.
          </p>
        )}
        <span className="crawl-panel-coins">{coins} coins</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
/** The opening deal: you, the Fates, you, the Fates, face down. */
const OPENING = 4;
/** Milliseconds between cards in the deal; before the hole card turns; between the Fates' draws. */
const DEAL_STEP = 320;
const HOLE_WAIT = 480;
const DRAW_STEP = 620;

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

function CardFace({
  card,
  hidden,
  dealt = false,
  flipped = false,
}: {
  card: Card;
  hidden?: boolean;
  /** Comes out of the shoe as it appears. */
  dealt?: boolean;
  /** Turns over as it appears. */
  flipped?: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  // What it does on arriving, fixed then: a later deal must not send this one out again.
  const [arrival] = useState(flipped ? "crawl-card-flip" : dealt ? "crawl-card-dealt" : "");
  // Only the card knows where it lands, so it measures its own way from the shoe.
  useLayoutEffect(() => {
    const el = ref.current;
    const shoe = el?.closest(".crawl-table")?.querySelector(".crawl-shoe");
    if (!el || !shoe || arrival !== "crawl-card-dealt") return;
    const from = shoe.getBoundingClientRect();
    const to = el.getBoundingClientRect();
    el.style.setProperty("--from-x", `${Math.round(from.left - to.left)}px`);
    el.style.setProperty("--from-y", `${Math.round(from.top - to.top)}px`);
  }, [arrival]);
  if (hidden) {
    return (
      <li
        ref={ref}
        aria-label="A card, face down"
        className={cn("crawl-card crawl-card-back", arrival)}
      >
        <span aria-hidden="true" />
      </li>
    );
  }
  // Half the deck is red-figure clay, half white-ground, like the pots they came off.
  const pale = card.suit === "heart" || card.suit === "club";
  return (
    <li
      ref={ref}
      aria-label={`${card.rank} of ${SUIT_NAMES[card.suit]}`}
      className={cn("crawl-card font-olympus", pale && "crawl-card-pale", arrival)}
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
 * against the Fates, hit, stand, double or split. The cards come out of the shoe one at a time, the
 * Fates' hole card turns over once the player is done, and they draw one at a time. The round is
 * decided, and the coins saved, the moment it is played, so stepping away or refreshing never costs
 * anything; the screen only tells it slowly: the purse here and the result wait for the last card.
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
  // A table come back to is as it was left: nothing deals itself again.
  const [dealtCount, setDealtCount] = useState(OPENING);
  const [holeUp, setHoleUp] = useState(round?.over ? round : null);
  const [shown, setShown] = useState(round?.dealer.length ?? 2);
  const [played, setPlayed] = useState(false);

  const dealing = !!round && !reduce && dealtCount < OPENING;
  const dealerUp = !!round?.over && !dealing && (reduce || holeUp === round);
  const dealerDone = !round?.over || reduce || (dealerUp && shown >= round.dealer.length);
  const settled = !round || (round.over && dealerDone);
  const animate = played && !reduce;
  const stake = Math.max(1, Math.min(bet, Math.max(1, coins)));
  // The winnings are safe already; they just do not show before the Fates have.
  const purse = coins - (round?.over && !settled ? totalPayout(round) : 0);

  useEffect(() => {
    if (!dealing) return;
    const id = window.setTimeout(() => {
      sound.card();
      setDealtCount((n) => n + 1);
    }, DEAL_STEP);
    return () => window.clearTimeout(id);
  }, [dealing, dealtCount, sound]);

  useEffect(() => {
    if (!round?.over || reduce || dealing || holeUp === round) return;
    const id = window.setTimeout(() => {
      sound.card();
      setHoleUp(round);
    }, HOLE_WAIT);
    return () => window.clearTimeout(id);
  }, [dealing, holeUp, reduce, round, sound]);

  useEffect(() => {
    if (!round?.over || !dealerUp || reduce || shown >= round.dealer.length) return;
    const id = window.setTimeout(() => {
      sound.card();
      setShown((n) => n + 1);
    }, DRAW_STEP);
    return () => window.clearTimeout(id);
  }, [dealerUp, reduce, round, shown, sound]);

  // Once the Fates have shown their hand: a win sings and pays, a loss knocks, a push says nothing.
  const announced = useRef(round);
  useEffect(() => {
    if (!round?.over || !settled || announced.current === round) return;
    announced.current = round;
    const results = round.hands.map((h) => h.result);
    if (results.some((r) => r === "win" || r === "blackjack")) {
      sound.solved();
      sound.coin();
    } else if (results.some((r) => r === "lose" || r === "bust")) sound.thud();
  }, [round, settled, sound]);

  function update(next: Round) {
    sound.card();
    setPlayed(true);
    onRound(next);
    if (next.over) onWin(totalPayout(next));
  }

  function start() {
    if (coins < stake) return;
    onSpend(stake);
    setShown(2);
    setHoleUp(null);
    setDealtCount(reduce ? OPENING : 1);
    update(deal(stake));
  }

  const hand = round && !round.over && !dealing ? round.hands[round.active] : null;
  const dealerCards = round?.dealer ?? [];
  const dealerCount = reduce
    ? dealerCards.length
    : dealing
      ? Math.floor(dealtCount / 2)
      : dealerUp
        ? shown
        : 2;
  const visible = dealerCards.slice(0, dealerCount);

  return (
    <div className="crawl-cabinet journey-rise">
      <p className="crawl-marquee font-olympus">Blackjack</p>
      <div className="crawl-table">
        <div aria-hidden="true" className="crawl-shoe">
          <span className="crawl-card crawl-card-back" />
          <span className="crawl-card crawl-card-back" />
          <span className="crawl-card crawl-card-back" />
        </div>
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
              visible.map((card, i) => {
                const faceDown = !dealerUp && i === 1 && !reduce;
                return (
                  <CardFace
                    key={`${i}-${faceDown}`}
                    card={card}
                    hidden={!round.over ? i === 1 : faceDown}
                    dealt={animate}
                    flipped={animate && i === 1 && !faceDown}
                  />
                );
              })
            ) : (
              <li className="crawl-card crawl-card-ghost" aria-hidden="true" />
            )}
          </ol>
        </section>

        <section aria-label="Your hand" className="crawl-hand">
          {round ? (
            round.hands.map((h, i) => {
              const cards = dealing ? h.cards.slice(0, Math.ceil(dealtCount / 2)) : h.cards;
              return (
                <div key={i} data-active={!round.over && i === round.active ? "" : undefined}>
                  <h2 className="crawl-hand-name font-olympus">
                    {round.hands.length > 1 ? `Hand ${i + 1}` : "You"} · {total(cards).total} ·{" "}
                    {h.bet} {h.bet === 1 ? "coin" : "coins"}
                  </h2>
                  <ol className="crawl-cards">
                    {cards.map((card, c) => (
                      <CardFace
                        key={`${c}-${card.rank}-${card.suit}`}
                        card={card}
                        dealt={animate}
                      />
                    ))}
                  </ol>
                  {round.over && settled && h.result ? (
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
              );
            })
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
        ) : !settled || dealing ? (
          <span />
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
        <span className="crawl-panel-coins">
          {purse} {purse === 1 ? "coin" : "coins"}
        </span>
      </div>
    </div>
  );
}

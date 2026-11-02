"use client";

/**
 * Step VII, the end of the trial on the family's laptop: where to take the word, and the word the
 * fires spelled, nothing else. The god waits at the Oracle (/oracle, on the projectors), and is
 * never shown here.
 */
export function Finale({ word }: { word: string }) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2 className="journey-rise font-olympus text-h3 leading-tight font-semibold text-balance">
        Bring this word to the Oracle
      </h2>
      <ol
        aria-label={`Your word: ${word}`}
        className="journey-rise mt-10 flex flex-wrap justify-center gap-2"
        style={{ "--d": "300ms" } as React.CSSProperties}
      >
        {[...word].map((letter, i) => (
          <li
            key={i}
            className="journey-wake flex size-12 items-center justify-center bg-green font-olympus text-2xl font-semibold text-bg sm:size-16 sm:text-h3"
            style={{ animationDelay: `${600 + i * 120}ms` }}
          >
            {letter}
          </li>
        ))}
      </ol>
    </div>
  );
}

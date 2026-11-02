"use client";

import dynamic from "next/dynamic";
import type { PrologueExec } from "@/components/olympus/prologue/Prologue";

/** The deck needs the window from its first frame (the size, the address, the place in the hash). */
const Prologue = dynamic(
  () => import("@/components/olympus/prologue/Prologue").then((m) => m.Prologue),
  { ssr: false },
);

export function PrologueLoader({ execs }: { execs: readonly PrologueExec[] }) {
  return <Prologue execs={execs} />;
}

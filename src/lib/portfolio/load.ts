import "server-only";
import { connection } from "next/server";
import { getPortfolioEnv, listPortfolios } from "./db";
import type { Portfolio, PortfolioKind } from "./shared";

/** A grid's rows at request time, or null when the database is unset or unreachable. */
export async function loadPortfolios(kind: PortfolioKind): Promise<Portfolio[] | null> {
  await connection();
  if (!getPortfolioEnv()) return null;
  try {
    return await listPortfolios(kind);
  } catch (error) {
    console.error(error);
    return null;
  }
}

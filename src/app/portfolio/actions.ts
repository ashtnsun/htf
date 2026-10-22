"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { capturePortfolio } from "@/lib/portfolio/capture";
import * as store from "@/lib/portfolio/db";
import {
  ensureOwnerHash,
  isHost,
  ownerHash,
  signInHost,
  signOutHost,
} from "@/lib/portfolio/session";
import {
  displayUrl,
  goalPatchSchema,
  portfolioInputSchema,
  type Goal,
  type GoalColor,
  type PortfolioKind,
} from "@/lib/portfolio/shared";

/** `values` puts the fields back after an error (React resets a form once its action ends). */
export type FormState = { error?: string; done?: number; values?: { url: string; title: string } };

const OFFLINE = "The board isn't connected right now. Try again in a minute.";

async function addPortfolio(kind: PortfolioKind, formData: FormData): Promise<FormState> {
  const values = {
    url: String(formData.get("url") ?? ""),
    title: String(formData.get("title") ?? ""),
  };
  if (kind === "reference" && !(await isHost())) {
    return { error: "Sign in as the host first.", values };
  }
  const parsed = portfolioInputSchema.safeParse({
    url: values.url,
    title: values.title || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, values };
  const { url, title } = parsed.data;

  try {
    if (await store.portfolioExists(kind, url)) {
      return { error: "That one is already here.", values };
    }
    const id = randomUUID();
    const capture = await capturePortfolio(url);
    const screenshot_url = capture.jpeg ? await store.uploadScreenshot(id, capture.jpeg) : null;
    await store.insertPortfolio({
      id,
      kind,
      url,
      title: title || capture.title || displayUrl(url),
      screenshot_url,
    });
  } catch (error) {
    console.error(error);
    return { error: OFFLINE, values };
  }
  refresh();
  return { done: Date.now() };
}

export async function addCommunityPortfolio(_: FormState, formData: FormData) {
  return addPortfolio("community", formData);
}

export async function addReferencePortfolio(_: FormState, formData: FormData) {
  return addPortfolio("reference", formData);
}

export async function removePortfolio(id: string): Promise<void> {
  if (!(await isHost())) return;
  await store.deletePortfolio(id);
  refresh();
}

export async function recapturePortfolio(id: string): Promise<void> {
  if (!(await isHost())) return;
  const portfolio = await store.getPortfolio(id);
  if (!portfolio) return;
  const { jpeg } = await capturePortfolio(portfolio.url);
  if (jpeg) await store.setScreenshot(id, await store.uploadScreenshot(id, jpeg));
  refresh();
}

export async function hostSignIn(_: FormState, formData: FormData): Promise<FormState> {
  const ok = await signInHost(String(formData.get("password") ?? ""));
  if (!ok) return { error: "That isn't the password." };
  refresh();
  return {};
}

export async function hostSignOut(): Promise<void> {
  await signOutHost();
  refresh();
}

/** The host can move, recolour and remove any note; everyone else only their own. */
async function editorHash(): Promise<string | null | false> {
  if (await isHost()) return null;
  return (await ownerHash()) ?? false;
}

export async function createGoal(input: {
  x: number;
  y: number;
  color: GoalColor;
}): Promise<Goal | null> {
  const parsed = goalPatchSchema.required({ x: true, y: true, color: true }).safeParse(input);
  if (!parsed.success) return null;
  try {
    return await store.insertGoal({
      ...parsed.data,
      text: "",
      owner_hash: await ensureOwnerHash(),
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function updateGoal(
  id: string,
  patch: Partial<Pick<Goal, "x" | "y" | "color" | "text">>,
): Promise<boolean> {
  const parsed = goalPatchSchema.safeParse(patch);
  const editor = await editorHash();
  if (!parsed.success || editor === false) return false;
  try {
    return await store.updateGoal(id, editor, parsed.data);
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function deleteGoal(id: string): Promise<boolean> {
  const editor = await editorHash();
  if (editor === false) return false;
  try {
    return await store.deleteGoal(id, editor);
  } catch (error) {
    console.error(error);
    return false;
  }
}

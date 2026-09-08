import { useSyncExternalStore } from "react";
import {
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  DEFAULT_HERO,
  DEFAULT_INVOLVED,
  isHeroVariantId,
  isInvolvedVariantId,
  type SiteConfig,
} from "./options";

/**
 * The site configuration as a tiny external store over localStorage. Components read it with
 * `useSiteConfig()`; the server (and the first client render, during hydration) always sees
 * the defaults, so pages stay static and a saved choice appears right after hydration.
 * Other tabs follow along through the `storage` event.
 */

const listeners = new Set<() => void>();

let snapshot: SiteConfig = DEFAULT_CONFIG;
/** The raw string the snapshot was parsed from; `undefined` until the first read. */
let snapshotRaw: string | null | undefined;
/** Set when localStorage refuses writes (private mode, quota): the choice lives in memory. */
let memoryOnly = false;

/** Unknown keys and values fall back to the defaults, so an old saved shape never breaks. */
function parse(raw: string | null): SiteConfig {
  if (!raw) return DEFAULT_CONFIG;
  try {
    const data: unknown = JSON.parse(raw);
    const saved =
      typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
    return {
      hero: isHeroVariantId(saved.hero) ? saved.hero : DEFAULT_HERO,
      involved: isInvolvedVariantId(saved.involved) ? saved.involved : DEFAULT_INVOLVED,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(CONFIG_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Client snapshot. Returns the same object until the stored value changes. */
function getSnapshot(): SiteConfig {
  if (memoryOnly) return snapshot;
  const raw = readStorage();
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = parse(raw);
  }
  return snapshot;
}

function getServerSnapshot(): SiteConfig {
  return DEFAULT_CONFIG;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONFIG_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** True when every setting is at its shipped default. */
export function isDefaultConfig(config: SiteConfig): boolean {
  return (Object.keys(DEFAULT_CONFIG) as (keyof SiteConfig)[]).every(
    (key) => config[key] === DEFAULT_CONFIG[key],
  );
}

/** Save a change. Defaults are stored as "nothing" so a fresh browser and a reset look alike. */
export function setSiteConfig(patch: Partial<SiteConfig>) {
  const next: SiteConfig = { ...getSnapshot(), ...patch };
  const raw = isDefaultConfig(next) ? null : JSON.stringify(next);
  try {
    if (raw === null) window.localStorage.removeItem(CONFIG_STORAGE_KEY);
    else window.localStorage.setItem(CONFIG_STORAGE_KEY, raw);
  } catch {
    memoryOnly = true;
  }
  snapshotRaw = raw;
  snapshot = next;
  listeners.forEach((fn) => fn());
}

export function resetSiteConfig() {
  setSiteConfig(DEFAULT_CONFIG);
}

/** The current configuration; re-renders when it changes (this tab or another). */
export function useSiteConfig(): SiteConfig {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

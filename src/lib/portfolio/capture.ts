import "server-only";

/**
 * One screenshot (and the page's title) per portfolio, from Microlink. Called once when a
 * link is added (or when the host asks for a recapture); the image is then stored in our own
 * bucket, so the grid never depends on Microlink. The free tier allows about 50 calls a day;
 * MICROLINK_API_KEY (optional) moves to the paid endpoint.
 */

export type Capture = { title: string | null; jpeg: ArrayBuffer | null };

export async function capturePortfolio(url: string): Promise<Capture> {
  const key = process.env.MICROLINK_API_KEY?.trim();
  const api = new URL(key ? "https://pro.microlink.io/" : "https://api.microlink.io/");
  api.search = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "true",
    type: "jpeg",
    "viewport.width": "1280",
    "viewport.height": "800",
    "viewport.deviceScaleFactor": "1",
    // Let intro animations settle before the shot.
    waitForTimeout: "1500",
  }).toString();

  try {
    const response = await fetch(api, {
      headers: key ? { "x-api-key": key } : undefined,
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const body = (await response.json()) as {
      status?: string;
      data?: { title?: string | null; screenshot?: { url?: string } };
    };
    if (body.status !== "success" || !body.data) return { title: null, jpeg: null };

    const title = body.data.title?.trim().slice(0, 80) || null;
    const shot = body.data.screenshot?.url;
    if (!shot) return { title, jpeg: null };
    const image = await fetch(shot, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    return { title, jpeg: image.ok ? await image.arrayBuffer() : null };
  } catch (error) {
    console.error("[portfolio] capture failed", url, error);
    return { title: null, jpeg: null };
  }
}

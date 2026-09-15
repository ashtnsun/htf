"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { mediaSrc } from "@content/media";

type MediaProps = Omit<ImageProps, "src"> & {
  /** A key from content/media.ts or a /public path. */
  src: string;
};

/**
 * next/image with the media map applied. SVG placeholders are served as-is
 * (the optimizer does not process SVG); raster files go through optimization.
 * A picture fades in once it has loaded (`[data-media]` in globals.css) instead of popping in
 * after the copy around it; a `priority` picture is the first paint and shows at once.
 */
export function Media({ src, alt, unoptimized, priority, onLoad, ...rest }: MediaProps) {
  const [loaded, setLoaded] = useState(false);
  const resolved = mediaSrc(src);
  const isSvg = resolved.endsWith(".svg");
  return (
    <Image
      src={resolved}
      alt={alt}
      unoptimized={unoptimized ?? isSvg}
      priority={priority}
      data-media={priority ? undefined : ""}
      data-loaded={loaded ? "" : undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      {...rest}
    />
  );
}

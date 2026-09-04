import Image, { type ImageProps } from "next/image";
import { mediaSrc } from "@content/media";

type MediaProps = Omit<ImageProps, "src"> & {
  /** A key from content/media.ts or a /public path. */
  src: string;
};

/**
 * next/image with the media map applied. SVG placeholders are served as-is
 * (the optimizer does not process SVG); raster files go through optimization.
 */
export function Media({ src, alt, unoptimized, ...rest }: MediaProps) {
  const resolved = mediaSrc(src);
  const isSvg = resolved.endsWith(".svg");
  return <Image src={resolved} alt={alt} unoptimized={unoptimized ?? isSvg} {...rest} />;
}

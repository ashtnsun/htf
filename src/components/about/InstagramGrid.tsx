import { site } from "@content/site";
import type { InstagramPost } from "@/lib/content/schemas";
import { InstagramIcon } from "@/components/icons/Social";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { isTodo } from "@/lib/utils";

/**
 * Curated Instagram grid (content/instagram.ts): square tiles linking to the posts, plus the
 * follow button. No embed script, no Meta app; tiles without a post URL yet are unlinked.
 */
export function InstagramGrid({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) return null;
  const tile = "relative block aspect-square overflow-hidden border border-line bg-surface";
  return (
    <Section id="instagram" aria-labelledby="instagram-title" className="border-t border-line">
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Follow along</Eyebrow>
            <Headline
              as="h2"
              id="instagram-title"
              size="h2"
              lines={["Callouts, kickoffs", "*and demo days.*"]}
              className="mt-5"
            />
          </div>
          <SplitButton href={site.socials.instagram} variant="secondary">
            <span className="inline-flex items-center gap-2">
              <InstagramIcon className="size-4" aria-hidden="true" />
              {site.socials.instagramHandle}
            </span>
          </SplitButton>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {posts.map((post) => {
            const href = isTodo(post.href) ? null : post.href;
            const image = (
              <Media
                src={post.image}
                alt={post.alt}
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover"
              />
            );
            return (
              <li key={post.id}>
                <Reveal>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${post.alt} (opens Instagram)`}
                      className={`${tile} hover-corners transition-[border-color] duration-200 hover:border-line-strong`}
                    >
                      {image}
                    </a>
                  ) : (
                    <div className={tile}>{image}</div>
                  )}
                  {post.caption ? <p className="mt-2 text-xs text-muted">{post.caption}</p> : null}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </RevealGroup>
    </Section>
  );
}

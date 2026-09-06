import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import Link from "next/link";
import {
  isValidElement,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/mdx";
import { cn } from "@/lib/utils";

type Components = NonNullable<MDXRemoteProps["components"]>;

/** Plain text of a heading's children, so ids match `extractHeadings()` in lib/mdx. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function heading(Tag: "h2" | "h3") {
  return function MdxHeading({ children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
    return (
      <Tag id={slugify(textOf(children))} {...rest}>
        {children}
      </Tag>
    );
  };
}

/** Internal links go through next/link; external ones open in a new tab. */
function MdxLink({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

const components: Components = {
  h2: heading("h2"),
  h3: heading("h3"),
  a: MdxLink,
};

type ProjectBodyProps = {
  /** MDX source without frontmatter (Project.body). */
  source: string;
  className?: string;
};

/**
 * Renders a project's MDX write-up on the server with the site's long-form typography
 * (`rich-text` in globals.css). Headings get ids so the "On this page" list can link to them.
 * JS expressions are blocked (next-mdx-remote default), so content stays content.
 */
export function ProjectBody({ source, className }: ProjectBodyProps) {
  return (
    <div className={cn("rich-text", className)}>
      <MDXRemote
        source={source}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </div>
  );
}

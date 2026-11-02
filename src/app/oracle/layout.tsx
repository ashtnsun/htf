import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { ButtonMenu } from "@/components/olympus/buttons/ButtonMenu";
import { cinzel, cormorant } from "@/components/olympus/fonts";
import { Meander } from "@/components/olympus/Meander";

export const metadata: Metadata = {
  title: "The Oracle",
  description: "Hack the Future's family reveal, on the projectors.",
  robots: { index: false, follow: false },
};

/**
 * The Oracle: the exec laptop on the projectors during the family reveal. Families bring their
 * final word here and the god is revealed to the whole room. The /olympus frame (logo and Greek
 * key, no site header or footer), with no link away: nobody should click off it mid-event.
 */
export default function OracleLayout({ children }: LayoutProps<"/oracle">) {
  return (
    <div
      className={`${cinzel.variable} ${cormorant.variable} relative flex min-h-dvh flex-col overflow-x-clip`}
    >
      <div className="container-max flex h-16 items-center container-x">
        <Logo height={20} />
      </div>
      <Meander className="text-green-deep" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col container-x py-12 md:py-20">
        {children}
      </div>
      <ButtonMenu />
    </div>
  );
}

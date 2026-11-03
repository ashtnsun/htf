import Link from "next/link";
import { FAMILIES } from "@content/olympus";
import { Logo } from "@/components/brand/Logo";
import { Meander } from "@/components/olympus/Meander";
import { Temple } from "@/components/olympus/Temple";
import { TempleBuild } from "@/components/olympus/TempleBuild";

/** /olympus3: pick your group, one temple column each, the same front as /olympus. */
export default function Olympus3Page() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <div className="temple-after container-max flex h-16 items-center container-x">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo height={20} />
        </Link>
      </div>
      <Meander className="temple-after text-green-deep" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col container-x py-12 md:py-20">
        <h1 className="temple-after text-center font-olympus text-[2.5rem] leading-tight font-semibold sm:text-h2">
          Who is your <span className="text-green">god</span>?
        </h1>
        <div className="mt-12 flex flex-col">
          <Temple count={FAMILIES.length} base="/olympus3" />
        </div>
      </div>
      <TempleBuild />
    </div>
  );
}

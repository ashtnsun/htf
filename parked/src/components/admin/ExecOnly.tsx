import { signOut } from "@/app/apply/actions";
import { PageHero } from "@/components/layout/PageHero";
import { SplitButton } from "@/components/ui/SplitButton";

/** What a signed-in account that is not on public.admins sees on any /admin page. */
export function ExecOnly({ email }: { email: string }) {
  return (
    <PageHero
      eyebrow="Admin"
      lines={["Exec", "*only.*"]}
      stagger={false}
      blurb={`${email} is not on the exec list. If it should be, ask whoever manages the Supabase project to add it to the admins table.`}
    >
      <div className="flex flex-wrap gap-4">
        <SplitButton href="/apply" variant="secondary">
          Back to applications
        </SplitButton>
        <form action={signOut}>
          <SplitButton type="submit" variant="secondary">
            Sign out
          </SplitButton>
        </form>
      </div>
    </PageHero>
  );
}

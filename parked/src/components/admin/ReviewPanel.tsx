import {
  removeReview,
  saveReview,
  setApplicationStatus,
} from "@/app/admin/applications/[id]/actions";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChoiceField, TextAreaField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  ADMIN_STATUSES,
  DECISION_LABELS,
  REVIEW_DECISIONS,
  SCORES,
  STATUS_LABELS,
  type Review,
  type ReviewWithReviewer,
} from "@/lib/portal/admin";
import type { ApplicationStatus } from "@/lib/portal/data";
import { formatPortalDate } from "@/lib/portal/format";
import { cn } from "@/lib/utils";

type ReviewPanelProps = {
  applicationId: string;
  status: ApplicationStatus;
  /** The signed-in exec member's review, if any. */
  mine: Review | null;
  others: ReviewWithReviewer[];
  average: number | null;
  reviewCount: number;
  /** Flash values from the query string after an action (`?review=saved`, `?status=failed`). */
  flash: { review?: string; status?: string };
};

const REVIEW_FLASH: Record<string, string> = {
  saved: "Review saved.",
  removed: "Review removed.",
  failed: "The review could not be saved. Try again in a moment.",
  invalid: "Check the review: a score from 1 to 5, and notes under 5,000 characters.",
};

const STATUS_FLASH: Record<string, string> = {
  saved: "Status updated.",
  failed: "The status could not be updated. Try again in a moment.",
  refused: "The database refused that change; drafts cannot be moved.",
  invalid: "Unknown status.",
};

function Flash({ text, ok }: { text: string | undefined; ok: boolean }) {
  if (!text) return null;
  return (
    <p role="status" className={cn("text-sm", ok ? "text-green" : "text-cyan")}>
      {text}
    </p>
  );
}

/**
 * The right-hand column of the review page: the signed-in member's review (score, decision,
 * notes; one row per member, saved by upsert), the status control, and everyone else's
 * reviews. Plain forms posting to server actions, so it works without JavaScript; the
 * result comes back as a flash in the query string. Drafts show text instead of the forms.
 */
export function ReviewPanel({
  applicationId,
  status,
  mine,
  others,
  average,
  reviewCount,
  flash,
}: ReviewPanelProps) {
  const reviewable = status !== "draft";
  const reviewOk = flash.review === "saved" || flash.review === "removed";
  return (
    <div className="space-y-6">
      <section id="review" aria-labelledby="review-title" className="border border-line glass p-6">
        <Eyebrow as="h2" id="review-title" tone="green">
          Your review
        </Eyebrow>
        <p className="mt-3 text-sm text-muted">
          {average == null
            ? "No scores yet."
            : `Average ${average.toFixed(1)} from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}.`}
        </p>
        {reviewable ? (
          <>
            <form action={saveReview} className="mt-6 space-y-6">
              <input type="hidden" name="application" value={applicationId} />
              <ChoiceField
                id="review-score"
                name="score"
                legend="Score"
                hint="1 is a no, 5 is a definite yes."
                options={SCORES.map((score) => ({ value: String(score), label: String(score) }))}
                defaultValue={mine?.score != null ? String(mine.score) : undefined}
                required={false}
                optionalNote={false}
              />
              <ChoiceField
                id="review-decision"
                name="decision"
                legend="Decision"
                options={REVIEW_DECISIONS.map((decision) => ({
                  value: decision,
                  label: DECISION_LABELS[decision],
                }))}
                defaultValue={mine?.decision ?? undefined}
                required={false}
                optionalNote={false}
              />
              <TextAreaField
                id="review-notes"
                name="notes"
                label="Notes"
                hint="Only exec members see these."
                rows={5}
                maxLength={5000}
                defaultValue={mine?.notes ?? ""}
                required={false}
                optionalNote={false}
              />
              <Flash text={REVIEW_FLASH[flash.review ?? ""]} ok={reviewOk} />
              <div className="flex flex-wrap items-center gap-4">
                <SplitButton type="submit">Save review</SplitButton>
                {mine ? (
                  <span className="text-sm text-muted">
                    Saved {formatPortalDate(mine.updated_at)}
                  </span>
                ) : null}
              </div>
            </form>
            {mine ? (
              <form action={removeReview} className="mt-4">
                <input type="hidden" name="application" value={applicationId} />
                <button
                  type="submit"
                  className="min-h-11 text-sm font-medium text-green transition-colors duration-200 hover:text-text"
                >
                  Remove my review
                </button>
              </form>
            ) : null}
          </>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Drafts cannot be reviewed. The form opens once the applicant submits.
          </p>
        )}
      </section>

      <section aria-labelledby="status-title" className="border border-line bg-surface p-6">
        <Eyebrow as="h2" id="status-title">
          Status
        </Eyebrow>
        {reviewable ? (
          <form action={setApplicationStatus} className="mt-6 space-y-6">
            <input type="hidden" name="application" value={applicationId} />
            <ChoiceField
              id="status-choice"
              name="status"
              legend="Move to"
              hint="Applicants never see this; decisions go out by email."
              options={ADMIN_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
              defaultValue={status}
              optionalNote={false}
            />
            <Flash text={STATUS_FLASH[flash.status ?? ""]} ok={flash.status === "saved"} />
            <SplitButton type="submit" variant="secondary">
              Update status
            </SplitButton>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Still a draft: the applicant has not submitted yet.
          </p>
        )}
      </section>

      <section aria-labelledby="others-title" className="border border-line bg-surface p-6">
        <Eyebrow as="h2" id="others-title">
          Other reviews
        </Eyebrow>
        {others.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No other exec member has reviewed this one yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {others.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text">
                    {review.reviewer?.full_name || review.reviewer?.email || "Exec member"}
                  </p>
                  <p className="text-xs text-muted">{formatPortalDate(review.updated_at)}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-text tabular-nums">
                    {review.score != null ? `${review.score} / 5` : "No score"}
                  </span>
                  {review.decision ? (
                    <Chip selected={review.decision === "yes"}>
                      {DECISION_LABELS[review.decision]}
                    </Chip>
                  ) : null}
                </div>
                {review.notes ? (
                  <p className="mt-2 text-sm whitespace-pre-line text-muted">{review.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

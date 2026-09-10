# people/

Small round avatars: the person quoted in a testimonial, and project team members on a project
page. Everything else that is a face belongs in `about/exec/`.

Name the file for the entry that shows it: the testimonial's `id` in
`content/testimonials.ts` (`placeholder-student-1.jpg` today, the person's slug once a real
quote replaces it), or the team member's name in kebab-case for a project page.

Square, **400 × 400 or larger**, face centered — these render at 48–56px, so anything smaller
turns to mush on a retina screen and anything off-center loses the face to the circle.

Avatars are optional: a card with no avatar renders as initials rather than looking broken, so
do not chase a photo for a quote that does not have one. Every quote in
`content/testimonials.ts` is still unpublished until the person approves it.

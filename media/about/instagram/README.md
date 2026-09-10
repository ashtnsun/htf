# about/instagram/

Six tiles in the Instagram grid on /about. There is no Instagram API on the site: each tile is
a picture you drop plus a post URL typed into `content/instagram.ts`.

Name each file for the post id in that file: `post-1.jpg` … `post-6.jpg`.

Square, **1080 × 1080 or larger** — the size Instagram exports, so the original graphic or a
full-resolution screenshot of the post both work. `.png` keeps text sharp on graphics.

For every tile, `content/instagram.ts` also needs the real post URL (the tile is not a link
while the value starts with `TODO`), alt text, and an optional caption.

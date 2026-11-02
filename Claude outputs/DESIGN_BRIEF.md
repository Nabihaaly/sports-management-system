# Court Connect — restyle brief ("court club" look)

Working tree: `/mnt/user-data/outputs/ui2/client` (Next.js 16 App Router, React 19, TS strict, Tailwind v4).
Design system is ALREADY DONE in `app/global.css` — read it first and use ONLY its tokens/classes.
Reference vibe: Gen-Z minimal but luxury sports club. Deep forest green + electric lime + warm off-white,
condensed UPPERCASE display headings (Archivo, font-stretch set globally), black pill buttons, lime accent
buttons/chips, big rounded (rounded-3xl) photo cards with dark gradient overlays, lots of whitespace,
thin `border-line` borders, NO heavy shadows, NO gradient washes, NO maroon/terracotta/sun/teal/cream-dark
(those are legacy aliases — do not use them in new code).

## Tokens (Tailwind utilities)
Colors: `forest`, `forest-deep`, `lime`, `lime-dark`, `cream` (page bg), `sand` (white cards), `mist` (alt surface/inputs/skeleton),
`ink` (text + black buttons), `muted`, `line`, `success(-soft)`, `warning(-soft)`, `danger(-soft)`.
Fonts: `font-heading` (Archivo, display), body is DM Sans by default. Radius: `rounded-pill`, `rounded-3xl` for cards, `rounded-2xl` for inputs/thumbnails.

## Component classes (use these, don't reinvent)
`.btn-primary` (black pill) · `.btn-accent` (lime pill — the main CTA like "Book now"/"Join") · `.btn-outline` · `.btn-ghost` · `.btn-danger`
`.card` (white, rounded-3xl, border) · `.card-dark` (forest, white text) · `.card-lime`
`.input` · `.label` · `.eyebrow` · `.display` (hero) · `.page-title` · `.section-title`
`.chip` · `.chip-active` (lime) · `.badge-success/-warning/-danger`
`.page` · `.page-narrow` · `.modal-backdrop` · `.modal`

## Layout patterns to follow
- Page header: `.eyebrow` line above a `.page-title` (uppercase), optional one-line `text-muted` subtitle. Actions on the right.
- Photo cards: `relative overflow-hidden rounded-3xl` with `<img className="absolute inset-0 h-full w-full object-cover">`,
  `bg-gradient-to-t from-ink/80 via-ink/20 to-transparent` overlay, white uppercase `font-heading` title bottom-left,
  small `chip`-style tag top-left (`bg-white/90 text-ink` or `bg-lime text-ink`). Hover: `hover:-translate-y-0.5` + `group-hover:scale-105` on the img.
- Stat / highlight blocks: `.card-dark` or `.card-lime` with big `font-heading` number and `.eyebrow` label.
- Lists of slots/times: pill or `rounded-2xl` tiles, selected = `bg-ink text-white` or `bg-lime text-ink`, disabled/booked = `bg-mist text-muted line-through`.
- Filters: row of `.chip` / `.chip-active`.
- Forms: `.label` + `.input`, grouped inside `.card`, primary submit `.btn-primary` full width on mobile.
- Empty states: `rounded-3xl border border-dashed border-line p-10 text-center` with `font-heading uppercase` title + muted line.
- Loading: `animate-pulse rounded-3xl bg-mist` skeletons.
- Uppercase display text uses `font-heading font-black uppercase tracking-tight leading-[0.95]`.

## HARD RULES
1. Logic, state, hooks, data fetching, routes, hrefs, handler names, props, service imports: UNCHANGED. Only JSX structure/classes/copy may change. Do not rename/move files. Do not add new components unless strictly needed for the layout (then put them in `Components/`).
2. No dummy/hardcoded data. No new npm packages. No external images except the Unsplash URLs already present in a file (you may keep them).
3. TypeScript strict must still pass. Keep `"use client"` where it exists.
4. Keep accessibility basics (labels, alt text, button types).
5. Mobile-first; grid collapses to 1 column on small screens; no horizontal overflow.
6. When done, list the files you changed and anything you were unsure about. Do not commit anywhere — just edit the files in the working tree.

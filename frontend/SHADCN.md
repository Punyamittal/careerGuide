# shadcn/ui on this project

## What’s already set up

- **Tailwind CSS v4** is configured via `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). There is **no** `tailwind.config.js` — theme tokens live in CSS (see [Tailwind v4 docs](https://tailwindcss.com/docs)).
- **TypeScript** is enabled; components use `.tsx`.
- **Path aliases**: `@/*` → project root (`tsconfig.json`), so `@/components/ui/...` and `@/lib/utils` resolve correctly.

## Default component path: `components/ui`

The shadcn CLI expects **`/components/ui`** (here: `frontend/components/ui`) so generated primitives stay in one place and imports stay consistent (`@/components/ui/button`, etc.). This repo follows that layout.

## Utilities: `lib/utils.ts`

`cn()` combines `clsx` + `tailwind-merge` for class composition — required by shadcn-style components.

## Installing more shadcn components

```bash
cd frontend
npx shadcn@latest init   # if prompted, point CSS to app/globals.css
npx shadcn@latest add button
```

If the CLI expects a `tailwind.config` file, either let it create a stub or merge its theme keys into `app/globals.css` `@theme inline` (this project uses the latter).

## Neo-brutalist tokens

Accordion and 3D cards use CSS variables in `:root` (`--nb-*`, `--cg-3d-*`) and matching `--color-*` / `--shadow-brut` entries in `@theme inline`.

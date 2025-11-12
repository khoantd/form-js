# Migration Checklist — Apply TextFlow Stack/UI To New App

Use this checklist to port the tech stack and design system.

## Core Stack

- [ ] Initialize Vite React TS project
- [ ] Install Tailwind, PostCSS, Autoprefixer
- [ ] Install shadcn/ui and required Radix components
- [ ] Install React Router, React Query
- [ ] Install i18next + react-i18next (optional)
- [ ] Install next-themes (dark mode)
- [ ] Install Lucide React (icons)
- [ ] Install TipTap + extensions (if rich text needed)
- [ ] Install styling utilities (cva, clsx, tailwind-merge)

## Configuration

- [ ] Configure `vite.config.ts` alias `@` → `./src`
- [ ] Add Tailwind content globs and `tailwindcss-animate` plugin
- [ ] Create `src/index.css` with HSL tokens for light/dark
- [ ] Bridge tokens in `tailwind.config.ts` under `theme.extend.colors`
- [ ] Add `src/lib/utils.ts` with `cn` helper
- [ ] Add `postcss.config.js` with Tailwind + Autoprefixer
- [ ] Confirm dark mode toggles class on root

## UI Library

- [ ] Generate `components.json` (shadcn/ui config)
- [ ] Add core primitives: button, card, input, textarea, select, checkbox, radio, switch
- [ ] Add overlays: dialog, sheet, alert-dialog, toast
- [ ] Add navigation: sidebar, breadcrumb, navigation-menu, menubar, tabs, pagination
- [ ] Add layout: resizable, separator, scroll-area, skeleton
- [ ] Add data display: table, badge, avatar, progress
- [ ] Verify variants and sizes for Button

## Patterns

- [ ] Page container: `p-6 space-y-8`
- [ ] Card headers with `pb-3`
- [ ] Grid spacing `gap-6`, sections `space-y-6`
- [ ] Accessible focus rings via `ring` token
- [ ] Use `tracking-tight` and semantic typography sizes

## Theming

- [ ] Validate tokens for primary, success, warning, destructive
- [ ] Validate sidebar/editor/suggestion tokens if applicable
- [ ] Verify dark theme values and contrast

## Optional Features

- [ ] Rich text editor styles for TipTap `.ProseMirror`
- [ ] OCR tooling (Tesseract.js) if needed
- [ ] Vector DB integration (Qdrant/pgvector/Pinecone)
- [ ] LiteLLM integration and quotas (if applicable)

## Verification

- [ ] Lint/build passes in dev/prod
- [ ] Tokens render correctly; no hard-coded colors
- [ ] Components visually consistent across pages
- [ ] Keyboard/focus accessibility intact
- [ ] Theming and animations operate as expected

For details and code references, see:
- `docs/TECH_STACK_EXTRACTION.md`
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/SETUP_GUIDE.md`
- `docs/COMPONENT_REFERENCE.md`



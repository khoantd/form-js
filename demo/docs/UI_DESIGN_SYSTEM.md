# UI Design System — TextFlow AI Studio

This guide extracts the design system (tokens, components, patterns) for reuse in another application.

## Foundations

- Tailwind CSS with custom theme tokens (HSL-based CSS variables)
- shadcn/ui component library built on Radix primitives
- Dark mode via class switching (next-themes)
- Motion: subtle, fast-easing animations

### Design Tokens

Color variables are defined in `src/index.css` and referenced via Tailwind as `hsl(var(--token))`.

Light mode (excerpt):

```183:246:src/index.css
@layer base {
  :root {
    --background: 40 40% 99%;
    --foreground: 220 15% 20%;
    --card: 0 0% 100%;
    --card-foreground: 220 15% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 15% 20%;
    --primary: 185 70% 45%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 15% 95%;
    --secondary-foreground: 220 15% 25%;
    --muted: 40 20% 96%;
    --muted-foreground: 220 10% 50%;
    --accent: 185 65% 92%;
    --accent-foreground: 185 70% 25%;
    --success: 145 60% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 35 90% 60%;
    --warning-foreground: 35 50% 15%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 15% 90%;
    --input: 220 15% 90%;
    --ring: 185 70% 45%;
    --radius: 0.75rem;
    --sidebar-background: 40 25% 97%;
    --sidebar-foreground: 220 15% 25%;
    --sidebar-primary: 185 70% 45%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 185 65% 95%;
    --sidebar-accent-foreground: 185 70% 25%;
    --sidebar-border: 220 15% 92%;
    --sidebar-ring: 185 70% 45%;
    --editor-bg: 40 40% 99%;
    --editor-selection: 185 65% 85%;
    --suggestion-bg: 145 55% 95%;
    --suggestion-border: 145 60% 75%;
  }
}
```

Dark mode (excerpt):

```247:296:src/index.css
.dark {
  --background: 220 20% 12%;
  --foreground: 40 30% 95%;
  --card: 220 20% 15%;
  --card-foreground: 40 30% 95%;
  --popover: 220 20% 15%;
  --popover-foreground: 40 30% 95%;
  --primary: 185 65% 50%;
  --primary-foreground: 220 20% 10%;
  --secondary: 220 15% 20%;
  --secondary-foreground: 40 30% 90%;
  --muted: 220 15% 18%;
  --muted-foreground: 220 10% 60%;
  --accent: 185 50% 25%;
  --accent-foreground: 185 70% 85%;
  --success: 145 55% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 35 85% 55%;
  --warning-foreground: 35 50% 15%;
  --destructive: 0 65% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 15% 25%;
  --input: 220 15% 25%;
  --ring: 185 65% 50%;
  --sidebar-background: 220 20% 10%;
  --sidebar-foreground: 40 30% 90%;
  --sidebar-primary: 185 65% 50%;
  --sidebar-primary-foreground: 220 20% 10%;
  --sidebar-accent: 220 15% 18%;
  --sidebar-accent-foreground: 185 70% 80%;
  --sidebar-border: 220 15% 20%;
  --sidebar-ring: 185 65% 50%;
  --editor-bg: 220 20% 12%;
  --editor-selection: 185 50% 30%;
  --suggestion-bg: 145 40% 20%;
  --suggestion-border: 145 50% 35%;
}
```

Tailwind bridges these tokens to utilities:

```1:119:tailwind.config.ts
extend: {
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
    /* ...semantic, sidebar, editor, suggestion, etc. */
  },
  borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
  keyframes: { /* accordion, fade, scale, slide */ },
  animation: { /* accordion, fade, scale, slide */ },
}
```

### Typography

- Headers: `text-3xl font-bold tracking-tight` (page titles), `text-2xl font-semibold tracking-tight` (section)
- Body/base: Tailwind defaults + `text-sm text-muted-foreground` for descriptions

### Spacing

- Pages: `p-6 space-y-8`
- Admin sections: `space-y-6`
- Card header: `pb-3`
- Grids: `gap-6`

### Motion

- `fade-in` / `fade-out` (0.3s)
- `scale-in` (0.2s)
- `slide-in-right` (0.3s)
- `accordion-up/down` (0.2s)

### Components (shadcn/ui)

Button variants and sizes:

```1:47:src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

Card primitives:

```1:44:src/components/ui/card.tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm" />
```

Other primitives available in `src/components/ui`: accordion, alert, avatar, badge, breadcrumb, calendar, checkbox, dialog, dropdown, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, toast, table, tabs, textarea, toggle, tooltip, etc.

## Patterns

- Page layout: header + stats + filters + content + help card
- Editor layout: sticky header, content, right suggestions rail, sticky status bar
- Mobile: sheet-based sidebars, floating action for suggestions

## Accessibility

- Use Radix primitives for accessible behavior
- Color contrast via tokens; focus rings via `ring` token

## Theming Guidance

- Modify CSS variables in `:root` and `.dark` only
- Keep all colors in HSL for predictable theming
- Derive new semantic tokens via Tailwind `extend.colors`



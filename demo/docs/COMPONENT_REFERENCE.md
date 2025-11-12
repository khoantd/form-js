# Component Reference — shadcn/ui Catalog (Project Usage)

This catalog lists UI primitives present in `src/components/ui/` and notes usage patterns.

## Index

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, color-picker, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner/toast, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

Source directory: `src/components/ui/`

## Buttons

- File: `button.tsx`
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`
- Example:

```1:47:src/components/ui/button.tsx
const buttonVariants = cva(/* base classes */, {
  variants: { variant: { default: "...", destructive: "...", outline: "...", secondary: "...", ghost: "...", link: "..." },
             size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" } },
  defaultVariants: { variant: "default", size: "default" },
});
```

Usage:

```tsx
import { Button } from "@/components/ui/button";
<Button variant="secondary" size="sm">Action</Button>
```

## Cards

- File: `card.tsx`
- Primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Example:

```1:44:src/components/ui/card.tsx
<Card className="border-muted">
  <CardHeader className="pb-3">
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

## Forms

- Files: `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `form.tsx`
- Notes:
  - Inputs match tokens: `bg-background`, `border-input`, `focus-visible:ring-ring`
  - `form.tsx` provides React Hook Form shorthands

## Navigation

- Files: `sidebar.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `menubar.tsx`, `pagination.tsx`
- Patterns: Sidebar layout + breadcrumb at top for context

## Data Display

- Files: `table.tsx`, `badge.tsx`, `avatar.tsx`, `progress.tsx`, `skeleton.tsx`
- Notes: Tables often wrapped in a `Card` and use `text-sm`

## Overlays & Feedback

- Files: `dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `alert.tsx`, `alert-dialog.tsx`, `toast.tsx`, `toaster.tsx`, `sonner.tsx`, `tooltip.tsx`, `hover-card.tsx`, `popover.tsx`, `context-menu.tsx`
- Notes: Use for modals, sheets, alerts; consistent padding `p-6`, headers `pb-3`

## Layout Utilities

- Files: `resizable.tsx`, `separator.tsx`, `scroll-area.tsx`, `aspect-ratio.tsx`, `collapsible.tsx`
- Notes: Combine with Tailwind grid utilities (`gap-6`, `space-y-6/8`)

## Pickers & Commands

- Files: `calendar.tsx`, `color-picker.tsx`, `command.tsx`, `input-otp.tsx`
- Notes: Follow tokenized colors and focus rings

## Examples — Compositions

Page layout pattern:

```tsx
<div className="p-6 space-y-8">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground mt-1">Description</p>
    </div>
  </div>

  {/* Content */}
  <div className="grid gap-6 md:grid-cols-3">
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle>Card</CardTitle>
        <CardDescription>Subtitle</CardDescription>
      </CardHeader>
      <CardContent>...</CardContent>
    </Card>
  </div>
</div>
```

Editor layout pattern (summary):

```tsx
<div className="h-full flex-col bg-background">
  {/* Sticky header, content area, suggestions rail, status bar */}
  {/* Compose from shadcn/ui primitives */}
  {/* TipTap editor mounted inside content area */}
</div>
```



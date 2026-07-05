---
name: frontend-design
description: >-
  Distinctive, intentional UI design for Framinator. Use when building or
  reshaping components, overlays, templates, or any visual/interaction work in
  this repo. Covers aesthetic direction, typography, copy, and required
  hover/active/focus states.
---

# Frontend Design (Framinator)

Upstream: [anthropics/claude-code frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. Make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

Framinator is a browser-only Instagram carousel builder: film frames, polaroids, Kodak strip, LUT filters, feed/profile mockups, mobile-first export. The subject's world is photography, darkroom, film stock, social feed craft. Distinctive choices should come from that vernacular, not generic SaaS chrome.

If the brief does not pin down what to build, name the concrete subject, audience, and the screen's single job before designing.

## Design principles

Typography carries personality. Pair display and body deliberately; set a clear type scale. Structure is information: numbering and labels only when order matters (slide 1/5, frame numbers on Kodak strip). Motion serves the subject: one orchestrated moment beats scattered effects; respect `prefers-reduced-motion`.

Match complexity to the vision. Build to a quality floor: responsive to mobile, visible keyboard focus, touch targets ≥ 44px where possible.

Copy is design material. Sentence case, active voice, plain verbs. A button says what happens ("Save", "Share all"). Errors explain how to fix; empty states invite action.

## Process

AI design defaults to avoid unless the brief asks for them: warm cream + terracotta serif, near-black + acid accent, broadsheet hairline columns. Where the brief is open, do not default to those.

Two passes: (1) compact token plan (4-6 hex colors, type roles, layout sentence, one signature element), (2) self-critique for templated choices, then build from the revised plan.

## Framinator interaction checklist (required)

Every interactive control must have **hover**, **active/pressed**, and **focus-visible** states. Mobile users rely on active; keyboard users rely on focus.

### Use existing primitives

| Control | Use |
|---------|-----|
| Primary actions | `Button` from `@/components/ui/button` |
| Native `<button>` outside `Button` | `pressable` from `@/lib/utils` via `cn(pressable, ...)` |
| Toggle chips (filters, aspect) | `cn(pressable, selected ? "bg-blue-600 ... active:bg-blue-700" : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600")` |

### `Button` variants (do not weaken)

- `default`: `hover:bg-blue-500`, `active:bg-blue-700`, `active:scale-[0.98]`
- `secondary`: border + `hover:bg-zinc-700`, `active:bg-zinc-600`
- `ghost` / `outline`: background shift on hover and active
- All: `focus-visible:ring-2 focus-visible:ring-blue-500`, `cursor-pointer`, `disabled:opacity-50`

### Before finishing UI work

1. Grep new components for `<button` and confirm each has `pressable` or uses `Button`.
2. Confirm no control is hover-only (missing `active:`).
3. Tap targets on carousel dots, icon buttons, drag handles: min ~16px visual with padding or `h-4 w-4+`.
4. Do not add `console.log` for UI debugging; no mixed interaction patterns per file.

### Palette baseline (app shell)

Dark zinc shell (`bg-zinc-950`, borders `zinc-800`), blue accent (`blue-600`), feed mockups use Instagram white/gray. Template previews and exports may use template-specific palettes (Kodak cream `#f3f0e9`, polaroid `#f5f0e8`).

## Restraint

One signature element per screen. Cut decoration that does not serve the brief. Critique before shipping: screenshot if possible, remove one accessory.

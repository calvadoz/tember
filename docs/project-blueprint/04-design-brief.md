# 04. Design brief

[View visual brief](visuals/04-design-brief.svg)

## Direction

Tember should feel steady, warm, and practical: a personal care journal rather than a clinical dashboard. The supplied Stitch archive is the visual baseline. Its forest-and-cream character, generous spacing, and subtle scute/nature motif remain, but accessibility, local-first clarity, and information density take precedence over decoration.

This Markdown blueprint intentionally uses direct headings and compact tables for planning clarity. It is not a specification for the application’s visual treatment.

## Visual system

| Element | Direction |
| --- | --- |
| Colour | Warm cream page surfaces; forest green for primary action and identity; fresh sage for supporting areas; coral-gold for warmth and compact highlights; white cards. Meet contrast requirements in every state. |
| Type | Montserrat for identity, headings, and key measurements; Inter for UI, dense histories, and long-form text. Do not add a third family without an approved accessibility or language reason. |
| Shape and depth | 16px cards, 12px inputs and buttons, gentle borders and soft shadows. Pills only for compact statuses. |
| Motif | Faint, non-essential nature/scute texture. Never place it behind dense text or rely on it to convey meaning. |
| Hierarchy | Lead with pet name, current measurement, and the next useful action. Supporting history, notes, and optional data follow in predictable sections. |

## Components and interaction

Use semantic sections, headings, forms, tables, dialogs, buttons, and status text. Forms maintain clear visible labels, required/optional distinction, contextual errors, and at least 44px touch targets. Destructive actions name their exact consequence and require confirmation. Status uses text plus colour, particularly for sync, declines, and selected chart data.

Charts are a summary, not the only way to access data. They have labelled axes, a legend, touch and keyboard record exploration, and a readable selected-record result. A drop of 10% or more may be shown as a red comparison cue, never as a health conclusion.

## Responsive rules

Mobile is the primary composition: one fluid column with 20px gutters. Desktop uses a centred grid up to 1280px with 24px gutters, a sidebar where helpful, and mobile bottom navigation on compact widths. At 320, 390, 430, 640, and 768px, no descendant may widen the document. History becomes year-grouped expandable rows on phones and small tablets; larger screens may use a contained horizontally scrollable table with its action column retained.

Dialogs use a full-height mobile pattern and a constrained centred panel on larger screens. Use safe-area padding. Do not prevent browser zoom as a layout workaround.

## Accessibility and motion

Meet WCAG 2.2 AA colour contrast for text and controls, retain a visible focus indicator, maintain logical focus through dialogs, give icon-only controls accessible names, and expose text alternatives for sex symbols and portrait previews. Support `prefers-reduced-motion`; transitions are short fades or lifts and never essential to understanding. The animated mark appears only during genuine loading.

## Content rules

Use short, natural English in shared messages. Avoid technical jargon, claims of guaranteed cloud safety, and medical language. State plainly that records stay on the device when sync fails. Format dates, weights, lengths, and numbers through shared locale helpers; storage remains ISO dates, grams, and millimetres.

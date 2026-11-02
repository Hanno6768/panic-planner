# Panic Planner identity

The supplied UI references informed the warm neutral canvas, generous rounded surfaces, charcoal controls, restrained pastel summaries and uncluttered navigation. Typography is self-hosted **Geist Variable**, installed through `@fontsource-variable/geist`; there are no runtime font requests to Google or another service.

The original logo was generated with the **built-in image-generation tool** (not the API/CLI fallback). It combines a planner, a checkmark/lightning shape and coral urgency marks. The transparent PNG is stored at `public/panic-planner-logo.png`; `src/app/icon.png` is the application icon. `src/components/brand.tsx` adds a real text wordmark for crisp typography and accessibility.

## Exact generation prompt

> Use case: logo-brand. Create an original production-ready app icon for Panic Planner, a friendly university deadline task tracker. Single compact geometric symbol: a rounded charcoal-black planner/checklist silhouette, with a bold warm-white checkmark inside that subtly also reads as a lightning bolt, and one tiny coral-orange urgency spark above its upper-right corner. Clever, calm, slightly playful; polished Swiss software identity, clean thick shapes, highly legible at 32 pixels. Flat vector-like raster design, crisp edges, no gradients, no shadows, no 3D, no texture. Centered square composition, mark fills 85 percent of canvas, transparent background with genuine alpha. No text, no letters, no wordmark, no mockup, no border, no presentation sheet. This logo will sit next to live Geist typography in a warm off-white app with rounded white cards, charcoal buttons and restrained pale lime and butter yellow accents.

## Component provenance

Official shadcn CLI, `new-york` style, Radix primitives:

```sh
npx shadcn@latest add button card input label form select tabs dialog alert-dialog dropdown-menu badge checkbox table sheet skeleton avatar separator sonner progress textarea --yes --overwrite
```

The installed component source is in `src/components/ui/`. App-specific composition, spacing, colors and responsive behavior live in the surrounding components and global theme. Light and dark themes share the same primitives.

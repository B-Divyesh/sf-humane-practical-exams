# Luminous evidence landscape

## Thesis

Humane Practical Exams should feel like a calm instrument panel at night: work is visible as a sequence of illuminated evidence, not as a person under a spotlight. Translucent planes, thin plotted paths, and small hash-like marks create a **luminous glass data landscape**. The interface is intentionally quiet and exact. Depth explains the relationship between task, evidence, and judgement; it never imitates surveillance footage.

## Palette

The dark treatment is primary because luminous evidence reads clearly against the deep ink field. The light treatment is fully supported through `prefers-color-scheme` and an in-product switch.

| Token | Dark | Light | Purpose |
|---|---:|---:|---|
| Night / background | `#07111F` | `#F4F8F8` | Deep working field / misted paper |
| Deep surface | `#0D1B2B` | `#FFFFFF` | Primary surface |
| Glass | `rgba(20, 44, 65, .78)` | `rgba(255,255,255,.82)` | Layered evidence panels |
| Frost / text | `#F2FAF8` | `#13282D` | Primary text (AA/AAA) |
| Sea glass / muted | `#A8C1C2` | `#49666B` | Secondary text (AA) |
| Aurora / accent | `#6DE7C5` | `#087C69` | Focus and primary actions |
| Signal blue | `#76B9FF` | `#1769AA` | Links and evidence paths |
| Amber | `#FFD18A` | `#8A5100` | Time and warnings |
| Coral | `#FF9A9F` | `#A62F3A` | Errors/destructive actions |
| Green | `#7DE3A6` | `#18733A` | Submitted/verified states |

Focus is a 3px aurora ring with a 2px night offset. State always includes a word or icon, never color alone.

## Type

Two system-first families keep payloads tiny and avoid network disclosure:

- Display: `ui-rounded, "Avenir Next", "Segoe UI", sans-serif` — open, humane headings without looking playful.
- Working text: `Inter var` when locally available, otherwise `system-ui, "Segoe UI", sans-serif`. The app ships the system stack in v1 to remain below the font budget.
- Evidence hashes, timer digits, and metadata: `ui-monospace, "SFMono-Regular", Consolas, monospace`, tabular figures.

Scale: 14 metadata, 16 body, 20 section, 28 page, 48–68 marketing display. Body leading is 1.55 and prose stays below 68 characters.

## Spacing and shape

The base unit is 4px with a practical rhythm of 8 / 12 / 16 / 24 / 32 / 48 / 72. Content maxes at 1180px; readable task prose at 720px. Corners use 14px for controls and 24px for independent glass planes. Hairline separators are translucent and inset rather than boxing every group. Targets are at least 44px.

## Interaction grammar

- Evidence moves left-to-right through three named stages: **Task → Evidence → Decision**.
- Selected or completed items emit a restrained inner glow and gain a textual state pill.
- Forms save locally as work is typed; the save line says exactly where data lives.
- Dialogs emerge from their triggering control and return focus to it.
- The timer is informational, never threatening: amber only in the final ten minutes and it never locks typing.
- Candidate and assessor capability links are visibly distinct and explained before copying.

## Motion

Transitions last 160–240ms and animate only opacity and transform. The hero planes drift into alignment once on load; no element loops. `prefers-reduced-motion: reduce` removes transforms and uses immediate opacity changes. Progress and timers remain legible without animation.

## Responsive intent

At 390px the three-stage diagram becomes a short vertical trail, navigation collapses to the relevant current actions, metadata stacks, and rubric rows become labeled blocks. Nothing essential is hidden. Artifact and export actions stay full-width and reachable above browser safe areas.

## Asset plan and provenance

The hero uses one original generated illustration: an abstract, people-free landscape of translucent task cards, a glowing evidence path, checksum crystals, and a calm completed record. It explains that assessment is assembled from visible artifacts rather than observation. UI icons and the logo mark are hand-authored inline SVG.

### Prompt sheet

- **Use case:** stylized-concept
- **Subject:** a quiet evidence trail made of three translucent glass platforms—task brief, artifact/checkpoint cluster, completed rubric—connected by a fine luminous path
- **World/materials:** deep ink data landscape, frosted glass, etched grid lines, tiny checksum facets, no screens showing text
- **Light/lens:** low oblique editorial isometric view, soft mint and ice-blue internal light, crisp controlled reflections, generous negative space
- **Palette words:** midnight ink, sea glass, aurora mint, signal blue, restrained amber
- **Negative list:** people, faces, cameras, eyes, surveillance imagery, locks, logos, readable text, watermark, generic office desk, purple gradient, excessive bloom

Generation command: `/opt/fleet/lib/gen-image.sh "<prompt derived from the sheet>" assets/src/evidence-landscape.png 1536x1024 high` using the factory image deployment on 2026-08-28. Generated imagery is original to this product; output is reviewed for artifacts and converted locally to responsive WebP variants. No third-party visual assets are used.


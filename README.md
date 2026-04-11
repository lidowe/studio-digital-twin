# Signal Atlas

Signal Atlas is a standalone educational studio signal-flow reference. It is designed to help a user read a patchbay, understand what a routing choice actually does, and compare how circuit selection changes sonic character before the signal ever reaches the recorder.

The current app is intentionally patchbay-first. It treats the patchbay as both the builder and the teaching surface: normalled paths stay visible, insert decisions have consequences, and different perspectives explain the same chain in musical, engineering, or technical language.

## Product Focus

- Teach how a real patchbay is read from row to row and left to right
- Show how default normalling differs from an explicitly patched route
- Explain what microphones, preamps, EQs, compressors, and parallel returns are doing in the path
- Surface sonic character as a consequence of circuit selection, not marketing adjectives alone
- Serve as a guide, reference, and training tool rather than a static gear catalog

## Current Scope

- Patchbay-driven signal-chain construction
- Route analysis and consequence summaries
- Perspective switching for musician, engineer, and technical readings
- Component inspection with context, tendencies, tradeoffs, and workflow implications
- Parallel path modeling for send/return style processing

The room model was intentionally removed from this app so the product can stay focused. If a room-planning tool is built later, it should live as a separate application.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

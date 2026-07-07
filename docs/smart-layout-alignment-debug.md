# Smart Layout Alignment Debug

Use this process when AI Arrange crops feel wrong horizontally, vertically, or by zoom.

## Fast Check

```bash
npm run debug:smart-layout-alignment
```

The debug spec uploads a generated image with a red subject low and to the right, mocks an AI crop of `offsetX: 200`, `offsetY: 200`, `scale: 1.2`, and then reads pixels from the live feed preview.

Passing means:

- positive `offsetX` reveals more of the right side of the source image
- positive `offsetY` reveals more of the lower part of the source image
- larger `scale` visibly zooms in
- the values returned by AI are the values applied by the UI

## When It Fails

1. Check [src/lib/smart-layout.ts](/Users/mascarpone/Personal/framinator/src/lib/smart-layout.ts) for the prompt sign convention sent to Gemini.
2. Check [src/lib/crop-math.ts](/Users/mascarpone/Personal/framinator/src/lib/crop-math.ts) for the `drawCover` source rectangle math.
3. Check [src/components/customization-panel.tsx](/Users/mascarpone/Personal/framinator/src/components/customization-panel.tsx) to confirm slider values are applied without sign inversion.
4. Re-run the debug spec and inspect the Playwright trace if needed:

```bash
npx playwright test e2e/smart-layout-alignment-debug.spec.ts --project=chromium --trace=on
```

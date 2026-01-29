# Audio Architecture Strategy

To prevent Safari 8s delay, we must ensure **AudioContext** is NOT created globally or during the initial bundle load.

## Rules

1. **Lazy Initialization**: Only initialize `Tone.js` or `AudioContext` inside a `useEffect` or event handler (e.g., "Play" button click).
2. **No Global Side Effects**: Do not import `tone` at the top level of any component that is rendered on the landing page or layouts.
3. **Dynamic Imports**: Use `next/dynamic` or `import()` for heavy audio engines.

## Hook Structure

- `useAudioContext.ts`: Manages the single instance of AudioContext, initializing it only when requested.
- `useAudioPlayer.ts`: Interface for playback controls.

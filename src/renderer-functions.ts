export const rendererChannels = ['get-replays-path', 'minimized', 'open', 'run-custom-game', 'run-game', 'run-random-game'] as const;
export type RendererChannel = typeof rendererChannels[number];

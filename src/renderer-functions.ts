import { CustomGame, GameName } from "./data-types";

export type RendererProcessFunctions = {
    'get-replays-path' : (...args: [string]) => Promise<void>,
    'minimized': () => void,
    'open': () => void,
    'run-custom-game': (customGame: CustomGame) => void,
    'run-game': (game: GameName) => void,
    'run-random-game': () => void
}
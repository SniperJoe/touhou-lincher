import { GameName, NamedPath, SupportedLang, ThcrapConfig } from "./data-types";

export type MainProcessFunctions = {
    'show-in-taskbar' : (...args: []) => void,
    'hide-from-taskbar': (...args: []) => void,
    'hide-tray-icon': (...args: []) => void,
    'set-tray-menu': (...args: [GameName[], string]) => void,
    'edit-vpatch': (...args: [string]) => void,
    'search-windows-path': (...args: [string, string[]]) => string,
    'close-replays-repository': (...args: []) => void,
    'save-replay': (...args: [string, string, GameName]) => void,
    'open-replays-repository': (...args: [string, number]) => void,
    'open-folder': (...args: [string]) => void,
    'load-img-from-exe': (...args: [string]) => string,
    'save-thcrap-game-profiles': (...args: [string, string]) => void,
    'load-thcrap-game-profiles': (...args: [string]) => string,
    'save-thcrap-profile': (...args: [string, string, string]) => void,
    'save-thcrap-patch-file': (...args: [string, string, string, string]) => void,
    'save-thcrap-repository-file': (...args: [string, string, string]) => void,
    'run-pc98-game': (...args: [string]) => string,
    'load-thcrap-repository-by-url': (...args: [string]) => string,
    'try-load-remote-thcrap-patch': (...args: [string]) => string,
    'try-load-local-thcrap-patch': (...args: [string, string, string]) => string,
    'load-local-thcrap-repositories': (...args: [string]) => string[],
    'try-load-local-thcrap-profile': (...args: [string, string]) => string,
    'load-img': (...args: [string]) => string,
    'check-banner': (...args: [string]) => boolean,
    'run-game': (...args: [string]) => void,
    'look-for-wine': (...args: []) => NamedPath[],
    'get-wine-version': (...args: [string]) => string,
    'pick-banner': (...args: []) => string,
    'pick-folder': (...args: []) => string,
    'pick-linux-exe': (...args: []) => string,
    'run-custom-game': (...args: [string]) => void,
    'configure-thcrap': (...args: [string]) => void,
    'check-neko-project-path': (...args: [string]) => boolean,
    'pick-hdi': (...args: []) => string,
    'pick-exe': (allowLinuxExe?: boolean) => string,
    'set-settings': (...args: [string]) => void,
    'get-thcrap-config': (...args: [string]) => ThcrapConfig | null,
    'get-settings': (...args: []) => string,
    'set-lang': (...args: [SupportedLang]) => void
}
export type MainProcessHandler<C extends keyof MainProcessFunctions> = (event: Electron.IpcMainInvokeEvent, ...args: Parameters<MainProcessFunctions[C]>) => Promise<ReturnType<MainProcessFunctions[C]>>;
export type MainProcessHandlers = {[K in keyof MainProcessFunctions]: MainProcessHandler<K>};


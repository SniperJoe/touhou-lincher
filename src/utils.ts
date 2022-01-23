import { configurableExecutables, CustomExeLaunchProfile, customExeLaunchProfiles, CustomGame, gameConfigurableExecutables, GameLaunchProfile, GameName, gameNames, GameSettings, RunCustomGameParams, RunPC98GameParams, RunWindowsGameParams } from './data-types';
import type { Store } from './store';

export async function findGamePath(gameName: GameName, store: Store) : Promise<string> {
    for (const configurableExecutable of configurableExecutables) {
        const path = store.getters.gameSettings(gameName).executables[configurableExecutable].path;
        if (path) {
            return path;
        }
        const thcrapMainGamePath = store.getters.thcrapMainGamePath(gameName);
        if (thcrapMainGamePath) {
            const path = await invokeInMain('search-windows-path', thcrapMainGamePath, store.getters.namedPaths('winePrefix').map(wp => wp.path));
            if (path) {
                return path;
            }
        }
    }
    return '';
}
export function isPC98(gameName: GameName): boolean {
    return ['hrtp', 'soew', 'podd', 'lls', 'ms'].includes(gameName);
}
function isPC98GameConfigured(gameSettings: GameSettings, nekoProjectPathValid: boolean): boolean {
    return nekoProjectPathValid && !!gameSettings.hdiPath;
}
function isWindowsGameConfigured(gameSettings: GameSettings, thcrapFound: boolean): boolean {
    return (gameSettings.thcrapProfile &&
        gameSettings.thcrapGameProfile &&
        thcrapFound
    ) || gameConfigurableExecutables.some(exec => gameSettings.executables[exec].path);
}
export function isGameConfigured(gameName: GameName, gameSettings: GameSettings, nekoProjectPathValid: boolean, thcrapFound: boolean): boolean {
    return isPC98(gameName) ? isPC98GameConfigured(gameSettings, nekoProjectPathValid) : isWindowsGameConfigured(gameSettings, thcrapFound);
}
export async function runCustomGame(game: CustomGame, store: Store, withAppLocale: boolean) : Promise<void> {
    const params: RunCustomGameParams = {
        gameSettings: game,
        defaultWinePrefix: store.getters.defaultNamedPath('winePrefix'),
        defaultWineExec: store.getters.defaultNamedPath('wineExec'),
        winePrefixes: store.getters.namedPaths('winePrefix'),
        wineExecs: store.getters.namedPaths('wineExec'),
        commandsBefore: [store.getters.commandBefore],
        commandsAfter: [store.getters.commandAfter],
        withAppLocale: withAppLocale,
        path: game.path
    };
    await invokeInMain('run-custom-game', JSON.stringify(params));
}
function isGameLaunchProfile(typ: GameLaunchProfile | CustomExeLaunchProfile): typ is GameLaunchProfile {
    return typ !== 'custom';
}
function isCustomExeLaunchProfile(typ: GameLaunchProfile | CustomExeLaunchProfile): typ is CustomExeLaunchProfile {
    return (Array.from(customExeLaunchProfiles) as string[]).includes(typ);
}
export async function runGame(game: GameName, store: Store, isCustomExe: boolean, type?: GameLaunchProfile | CustomExeLaunchProfile): Promise<string> {
    const settings = store.getters.gameSettings(game);
    if (isPC98(game)) {
        const params: RunPC98GameParams = {
            gameSettings: settings,
            defaultWinePrefix: store.getters.defaultNamedPath('winePrefix'),
            defaultWineExec: store.getters.defaultNamedPath('wineExec'),
            winePrefixes: store.getters.namedPaths('winePrefix'),
            wineExecs: store.getters.namedPaths('wineExec'),
            nekoProjectPath: store.getters.nekoProjectPath,
            nekoProjectPathValid: store.getters.nekoProjectPathValid,
            commandsBefore: [store.getters.commandBefore, settings.commandBefore],
            commandsAfter: [store.getters.commandAfter, settings.commandAfter],
            autoClose: store.getters.autoClose
        };
        return await invokeInMain('run-pc98-game', JSON.stringify(params));
    } else {
        if (type) {
            if (!isCustomExe && isGameLaunchProfile(type)) {
                settings.defaultExecutable = type;
            } else if (isCustomExe && isCustomExeLaunchProfile(type)) {
                settings.defaultCustomExeExecutable = type;
            }
        }
        const params: RunWindowsGameParams = {
            gameSettings: settings,
            defaultWinePrefix: store.getters.defaultNamedPath('winePrefix'),
            defaultWineExec: store.getters.defaultNamedPath('wineExec'),
            winePrefixes: store.getters.namedPaths('winePrefix'),
            wineExecs: store.getters.namedPaths('wineExec'),
            thcrapPath: store.getters.thcrapPath,
            thcrapFound: store.getters.thcrapFound,
            isCustomExe,
            commandsBefore: [store.getters.commandBefore, settings.commandBefore],
            commandsAfter: [store.getters.commandAfter, settings.commandAfter],
            autoClose: store.getters.autoClose
        };
        await invokeInMain('run-game', JSON.stringify(params));
        return '';
    }
}
export async function runRandomGame(store: Store) : Promise<void> {
    const configuredGames = gameNames.filter(gn => isGameConfigured(gn, store.getters.gameSettings(gn), store.getters.nekoProjectPathValid, store.getters.thcrapFound));
    const index = Math.floor(Math.random() * (configuredGames.length - 0.001));
    await runGame(configuredGames[index], store, false);
}

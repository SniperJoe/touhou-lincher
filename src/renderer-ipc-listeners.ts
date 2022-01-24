import { thcrapGameNames } from './constants';
import { CustomGame, GameName, gameNames } from './data-types';
import type { Store } from './store';
import { ActionTypes } from './store/actions';
import { runCustomGame, runGame, runRandomGame, findGamePath } from './utils';

export function addRendererIpcListeners(store: Store): void {
    onIpcMessage('get-replays-path', (_, url: string) => getReplaysPath(url, store));
    onIpcMessage('minimized', () => {
        // console.log('minimized received');
        if (store.getters.minimizeToTray) {
            store.dispatch(ActionTypes.UPSERT_TRAY_CONTEXT_MENU);
            invokeInMain('hide-from-taskbar');
            // console.log('sending hide-from-taskbar');
        }
    });
    onIpcMessage('open', () => {
        // console.log('open received');
        if (store.getters.minimizeToTray) {
            invokeInMain('show-in-taskbar');
            if (!store.getters.showTrayIcon) {
                invokeInMain('hide-tray-icon');
            }
        }
    });
    onIpcMessage('run-custom-game', (_, customGame: CustomGame) => {
        runCustomGame(customGame, store, false);
    });
    onIpcMessage('run-game', (_, game: GameName) => {
        runGame(game, store, false);
    });
    onIpcMessage('run-random-game', () => {
        runRandomGame(store);
    });
}
function gameNameFromReplayFilename(fileName: string): GameName | undefined {
    const thcrapLikeGameNameMatch = fileName.match(/^th\d+/);
    if (thcrapLikeGameNameMatch) {
        const thcrapGameName = thcrapLikeGameNameMatch[0].replace(/^th(\d)$/, 'th0$1');
        return gameNames.find(gn => thcrapGameNames[gn] === thcrapGameName);
    }
}
async function getReplaysPath(url:string, store: Store) {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const gameName = gameNameFromReplayFilename(fileName);
    if (gameName) {
        const gamePath = await findGamePath(gameName, store);
        if (gamePath) {
            await invokeInMain('save-replay', url, gamePath, gameName);
            return;
        }
        await invokeInMain('save-replay', url, '', gameName);
    }
}

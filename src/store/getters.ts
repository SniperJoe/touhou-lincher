import { GetterTree } from 'vuex';
import State from './state';
import { thcrapGameNames } from '../constants';
import { CustomGame, CustomGameCategory, GameName, GameSettings, NamedPath, NamedPathType, SupportedLang } from '@/data-types';
import { findCategoryAndRun } from './utils';

export type Getters = {
    gameSettings: (state: State) => (gameName: GameName) => GameSettings;
    thcrapGameProfiles: (state: State) => (gameName: GameName) => string[];
    randomGamesIncludes: (state: State) => (gameName: GameName) => boolean;
    autoClose: (state: State) => boolean;
    thcrapPath: (state: State) => string;
    thcrapFound: (state: State) => boolean;
    minimizeToTray: (state: State) => boolean;
    showTrayIcon: (state: State) => boolean;
    nekoProjectPath: (state: State) => string;
    nekoProjectPathValid: (state: State) => boolean;
    thcrapStartingRepository: (state: State) => string;
    thcrapStartingRepositoryValid: (state: State) => boolean;
    thcrapProfiles: (state: State) => string[];
    namedPaths: (state: State) => (type: NamedPathType) => NamedPath[];
    defaultNamedPath: (state: State) => (type: NamedPathType) => number;
    commandBefore: (state: State) => string;
    commandAfter: (state: State) => string;
    customGames: (state: State) => CustomGameCategory[];
    customGamesCategoryExists: (state: State) => (id: number) => boolean;
    customGamesOfCategory: (state: State) => (id: number) => CustomGame[];
    thcrapMainGamePath: (state: State) => (gameName: GameName) => string;
    customGamesCategoryName: (state: State) => (categoryId: number) => string;
    language: (state: State) => SupportedLang;
}

export const getters: GetterTree<State, State> & Getters = {
    gameSettings: (state: State) => (gameName: GameName) => Object.assign({}, state.gamesSettings[gameName]),
    thcrapGameProfiles: (state: State) => (gameName: GameName) => {
        const thcrapGameName = thcrapGameNames[gameName];
        if (thcrapGameName) {
            return Object.keys(state.thcrapConfig.games).filter(g => g.includes(thcrapGameName));
        }
        return [];
    },
    randomGamesIncludes: (state: State) => (gameName: GameName) => state.randomGames.includes(gameName),
    autoClose: (state: State) => state.autoClose,
    thcrapPath: (state: State) => state.thcrapPath,
    thcrapFound: (state: State) => state.thcrapFound,
    minimizeToTray: (state: State) => state.minimizeToTray,
    showTrayIcon: (state: State) => state.showTrayIcon,
    nekoProjectPath: (state: State) => state.nekoProjectPath,
    nekoProjectPathValid: (state: State) => state.nekoProjectPathValid,
    thcrapStartingRepository: (state: State) => state.thcrapStartingRepository,
    thcrapStartingRepositoryValid: (state: State) => state.thcrapStartingRepositoryValid,
    thcrapProfiles: (state: State) => state.thcrapConfig.profiles,
    namedPaths: (state: State) => (type: NamedPathType) => {
        if (!state.namedPaths[type]) {
            debugger;
        }
        return Array.from(state.namedPaths[type].values);
    },
    defaultNamedPath: (state: State) => (type: NamedPathType) => state.namedPaths[type].default,
    commandBefore: (state: State) => state.commandBefore,
    commandAfter: (state: State) => state.commandAfter,
    customGames: (state: State) => state.customGames.children,
    customGamesCategoryExists: (state: State) => (id: number) => {
        let exists = false;
        findCategoryAndRun(id, () => { exists = true; }, state.customGames.children);
        return exists;
    },
    customGamesOfCategory: (state: State) => (id: number) => {
        let games: CustomGame[] = [];
        findCategoryAndRun(id, (c) => { games = c.games; }, state.customGames.children);
        return games;
    },
    thcrapMainGamePath: (state: State) => (gameName: GameName) => {
        const thcrapGameName = thcrapGameNames[gameName];
        if (thcrapGameName) {
            return state.thcrapConfig.games[thcrapGameName] || '';
        }
        return '';
    },
    customGamesCategoryName: (state: State) => (categoryId: number) => {
        let categoryName = '';
        findCategoryAndRun(categoryId, c => { categoryName = c.name; }, state.customGames.children);
        return categoryName;
    },
    language: (state: State) => state.language
};

import { CustomGame, CustomGameCategory, GameName, GameSettings, NamedPath, NamedPathType, SupportedLang, ThcrapConfig } from '@/data-types';
import { MutationTree } from 'vuex';
import State from './state';
import { findCategoryAndRun, forEachCategory } from './utils';

interface OmitInObj {
    <T extends object, K extends [...(keyof T)[]]> // eslint-disable-line @typescript-eslint/ban-types
    (obj: T, ...keys: K): {
        [K2 in Exclude<keyof T, K[number]>]: T[K2]
    }
}

const omit: OmitInObj = (obj, ...keys) => {
    const ret = {} as {
        [K in keyof typeof obj]: (typeof obj)[K] // eslint-disable-line no-use-before-define
    };
    let key: keyof typeof obj;
    for (key in obj) {
        if (!(keys.includes(key))) {
            ret[key] = obj[key];
        }
    }
    return ret;
};

export enum MutationTypes {
    SET_GAME_SETTINGS = '1',
    SET_RANDOM_GAME = '2',
    SET_AUTO_CLOSE = '3',
    SET_THCRAP_CONFIG = '4',
    SET_THCRAP_PATH = '5',
    SET_THCRAP_FOUND = '6',
    SET_MINIMIZE_TO_TRAY = '7',
    SET_SHOW_TRAY_ICON = '8',
    SET_NEKO_PROJECT_PATH = '9',
    SET_NEKO_PROJECT_PATH_VALID = '10',
    SET_THCRAP_STARTING_REPOSITORY = '11',
    SET_THCRAP_STARTING_REPOSITORY_VALID = '12',
    SET_NAMED_PATH_NAME = '13',
    SET_NAMED_PATHS = '14',
    ADD_NAMED_PATH = '15',
    DELETE_NAMED_PATHS = '16',
    SET_DEFAULT_NAMED_PATH = '17',
    SET_COMMAND_BEFORE = '18',
    SET_COMMAND_AFTER = '19',
    SET_CUSTOM_GAMES = '20',
    SET_CUSTOM_GAMES_CATEGORY_NAME = '21',
    ADD_CUSTOM_GAME = '22',
    ADD_CUSTOM_GAMES_CATEGORY = '23',
    DELETE_CUSTOM_GAMES_CATEGORY = '24',
    EDIT_CUSTOM_GAME = '25',
    DELETE_CUSTOM_GAME = '26',
    SET_LANG = '27'
}

export type TMutations = {
    [MutationTypes.SET_GAME_SETTINGS](state: State, payload: GameSettings & {gameName: GameName}): void;
    [MutationTypes.SET_RANDOM_GAME](state: State, payload: {gameName: GameName, enabled: boolean}): void;
    [MutationTypes.SET_AUTO_CLOSE](state: State, payload: boolean): void;
    [MutationTypes.SET_THCRAP_CONFIG](state: State, payload: ThcrapConfig): void;
    [MutationTypes.SET_THCRAP_FOUND](state: State, payload: boolean): void;
    [MutationTypes.SET_THCRAP_PATH](state: State, payload: string): void;
    [MutationTypes.SET_MINIMIZE_TO_TRAY](state: State, payload: boolean): void;
    [MutationTypes.SET_SHOW_TRAY_ICON](state: State, payload: boolean): void;
    [MutationTypes.SET_NEKO_PROJECT_PATH](state: State, payload: string): void;
    [MutationTypes.SET_NEKO_PROJECT_PATH_VALID](state: State, payload: boolean): void;
    [MutationTypes.SET_THCRAP_STARTING_REPOSITORY](state: State, payload: string): void;
    [MutationTypes.SET_THCRAP_STARTING_REPOSITORY_VALID](state: State, payload: boolean): void;
    [MutationTypes.SET_NAMED_PATH_NAME](state: State, payload: {name: string, id: number, type: NamedPathType}): void;
    [MutationTypes.SET_NAMED_PATHS](state: State, payload: {type: NamedPathType, values: NamedPath[]}): void;
    [MutationTypes.ADD_NAMED_PATH](state: State, payload: {type: NamedPathType, value: Omit<NamedPath, 'id'>}): void;
    [MutationTypes.DELETE_NAMED_PATHS](state: State, payload: {type: NamedPathType, value: number[]}): void;
    [MutationTypes.SET_DEFAULT_NAMED_PATH](state: State, payload: {type: NamedPathType, value: number}): void;
    [MutationTypes.SET_COMMAND_BEFORE](state: State, payload: string): void;
    [MutationTypes.SET_COMMAND_AFTER](state: State, payload: string): void;
    [MutationTypes.SET_CUSTOM_GAMES](state: State, payload: CustomGameCategory): void;
    [MutationTypes.SET_CUSTOM_GAMES_CATEGORY_NAME](state: State, payload: {id: number, name: string}): void;
    [MutationTypes.ADD_CUSTOM_GAME](state: State, payload: {parentId: number, game: CustomGame}): void;
    [MutationTypes.ADD_CUSTOM_GAMES_CATEGORY](state: State, payload: number | null): void;
    [MutationTypes.DELETE_CUSTOM_GAMES_CATEGORY](state: State, payload: number): void;
    [MutationTypes.EDIT_CUSTOM_GAME](state: State, payload: {parentId: number, game: CustomGame; index: number}): void;
    [MutationTypes.DELETE_CUSTOM_GAME](state: State, payload: {parentId: number, index: number}): void;
    [MutationTypes.SET_LANG](state: State, payload: SupportedLang): void;
}
type MutationsTypeCorrect = TMutations extends {[K in `${MutationTypes}`]: (state: State, payload: any) => void } ? true : false; // eslint-disable-line @typescript-eslint/no-explicit-any
type Mutations = MutationsTypeCorrect extends true ? TMutations : null;

export const mutations: MutationTree<State> & Mutations = {
    [MutationTypes.SET_GAME_SETTINGS](state: State, payload: GameSettings & {gameName: GameName}) {
        state.gamesSettings[payload.gameName] = omit(payload, 'gameName');
    },
    [MutationTypes.SET_RANDOM_GAME](state: State, payload: {gameName: GameName, enabled: boolean}) {
        if (payload.enabled) {
            if (!state.randomGames.includes(payload.gameName)) {
                state.randomGames.push(payload.gameName);
            }
        } else {
            const index = state.randomGames.indexOf(payload.gameName);
            if (index > -1) {
                state.randomGames.splice(index, 1);
            }
        }
    },
    [MutationTypes.SET_AUTO_CLOSE](state: State, payload: boolean) {
        state.autoClose = payload;
    },
    [MutationTypes.SET_THCRAP_CONFIG](state: State, payload: ThcrapConfig) {
        state.thcrapConfig = payload;
    },
    [MutationTypes.SET_THCRAP_FOUND](state: State, payload: boolean) {
        state.thcrapFound = payload;
    },
    [MutationTypes.SET_THCRAP_PATH](state: State, payload: string) {
        state.thcrapPath = payload;
    },
    [MutationTypes.SET_MINIMIZE_TO_TRAY](state: State, payload: boolean) {
        state.minimizeToTray = payload;
    },
    [MutationTypes.SET_SHOW_TRAY_ICON](state: State, payload: boolean) {
        state.showTrayIcon = payload;
    },
    [MutationTypes.SET_NEKO_PROJECT_PATH](state: State, payload: string) {
        state.nekoProjectPath = payload;
    },
    [MutationTypes.SET_NEKO_PROJECT_PATH_VALID](state: State, payload: boolean) {
        state.nekoProjectPathValid = payload;
    },
    [MutationTypes.SET_THCRAP_STARTING_REPOSITORY](state: State, payload: string) {
        state.thcrapStartingRepository = payload;
    },
    [MutationTypes.SET_THCRAP_STARTING_REPOSITORY_VALID](state: State, payload: boolean) {
        state.thcrapStartingRepositoryValid = payload;
    },
    [MutationTypes.SET_NAMED_PATH_NAME](state: State, payload: {name: string, id: number, type: NamedPathType}) {
        const pathIndex = state.namedPaths[payload.type].values.findIndex(we => we.id === payload.id);
        if (pathIndex > -1) {
            state.namedPaths[payload.type].values[pathIndex].name = payload.name;
        }
    },
    [MutationTypes.SET_NAMED_PATHS](state: State, payload: {type: NamedPathType, values: NamedPath[]}) {
        state.namedPaths[payload.type].values = payload.values;
    },
    [MutationTypes.ADD_NAMED_PATH](state: State, payload: {type: NamedPathType, value: Omit<NamedPath, 'id'>}) {
        let newId = 0;
        state.namedPaths[payload.type].values.forEach(we => {
            if (we.id >= newId) {
                newId = we.id + 1;
            }
        });
        const path : NamedPath = { ...payload.value, id: newId };
        state.namedPaths[payload.type].values.push(path);
    },
    [MutationTypes.DELETE_NAMED_PATHS](state: State, payload: {type: NamedPathType, value: number[]}) {
        payload.value.forEach(id => {
            const wineExecIndex = state.namedPaths[payload.type].values.findIndex(we => we.id === id);
            if (wineExecIndex > -1) {
                state.namedPaths[payload.type].values.splice(wineExecIndex, 1);
            }
        });
    },
    [MutationTypes.SET_DEFAULT_NAMED_PATH](state: State, payload: {type: NamedPathType, value: number}) {
        state.namedPaths[payload.type].default = payload.value;
    },
    [MutationTypes.SET_COMMAND_BEFORE](state: State, payload: string) {
        state.commandBefore = payload;
    },
    [MutationTypes.SET_COMMAND_AFTER](state: State, payload: string) {
        state.commandAfter = payload;
    },
    [MutationTypes.SET_CUSTOM_GAMES](state: State, payload: CustomGameCategory) {
        state.customGames = payload;
    },
    [MutationTypes.SET_CUSTOM_GAMES_CATEGORY_NAME](state: State, payload: {id: number, name: string}) {
        findCategoryAndRun(payload.id, c => { c.name = payload.name; }, state.customGames.children);
    },
    [MutationTypes.ADD_CUSTOM_GAME](state: State, payload: {parentId: number, game: CustomGame}) {
        findCategoryAndRun(payload.parentId, c => { c.games.push(payload.game); }, state.customGames.children);
    },
    [MutationTypes.ADD_CUSTOM_GAMES_CATEGORY](state: State, payload: number | null) {
        let newId = 1;
        forEachCategory(c => {
            if (c.id >= newId) {
                newId = c.id + 1;
            }
        }, state.customGames.children);
        if (!payload) {
            state.customGames.children.push({
                id: newId,
                name: 'New Category',
                children: [],
                games: []
            });
        } else {
            findCategoryAndRun(payload, c => {
                c.children.push({
                    id: newId,
                    name: 'New Category',
                    children: [],
                    games: []
                });
            }, state.customGames.children);
        }
    },
    [MutationTypes.DELETE_CUSTOM_GAMES_CATEGORY](state: State, payload: number) {
        findCategoryAndRun(payload, (_, container, index) => { container.splice(parseInt(index), 1); }, state.customGames.children);
    },
    [MutationTypes.EDIT_CUSTOM_GAME](state: State, payload: {parentId: number, game: CustomGame; index: number}) {
        findCategoryAndRun(payload.parentId, (_, container, index) => { container[parseInt(index)].games[payload.index] = payload.game; }, state.customGames.children);
    },
    [MutationTypes.DELETE_CUSTOM_GAME](state: State, payload: {parentId: number, index: number}) {
        findCategoryAndRun(payload.parentId, (_, container, index) => { container[parseInt(index)].games.splice(payload.index, 1); }, state.customGames.children);
    },
    [MutationTypes.SET_LANG](state: State, payload: SupportedLang) {
        state.language = payload;
    }
};

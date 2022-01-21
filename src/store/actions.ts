import { ActionContext, ActionTree } from 'vuex';
import State from './state';
import { TMutations, MutationTypes } from './mutations';
import { CustomGame, GameName, GameSettings, NamedPath, NamedPathType, namedPathTypes, ThcrapConfig } from '@/data-types';
import { defaultThcrapConfig, defaultThcrapStartingRepository } from './defaults';
import { thcrapGameNames } from '@/constants';

export enum ActionTypes {
    RESTORE_APP_STATE = '1',
    SET_GAME_SETTINGS = '2',
    SAVE_SETTINGS = '3',
    SET_RANDOM_GAME = '4',
    SET_RANDOM_GAMES = '5',
    SET_AUTO_CLOSE = '6',
    SET_THCRAP_PATH = '7',
    SET_MINIMIZE_TO_TRAY = '8',
    SET_SHOW_TRAY_ICON = '9',
    SET_NEKO_PROJECT_PATH = '10',
    SET_THCRAP_STARTING_REPOSITORY = '11',
    SET_DEFAULT_THCRAP_STARTING_REPOSITORY = '12',
    CONFIGURE_GAMES_FOR_THCRAP = '13',
    SET_NAMED_PATH_NAME = '14',
    ADD_NAMED_PATH = '15',
    DELETE_NAMED_PATHS = '16',
    SET_DEFAULT_NAMED_PATH = '17',
    TRY_LOAD_THCRAP = '18',
    SET_COMMAND_BEFORE = '19',
    SET_COMMAND_AFTER = '20',
    SET_CUSTOM_GAMES_CATEGORY_NAME = '21',
    ADD_CUSTOM_GAME = '22',
    ADD_CUSTOM_GAMES_CATEGORY = '23',
    DELETE_CUSTOM_GAMES_CATEGORY = '24',
    EDIT_CUSTOM_GAME = '25',
    DELETE_CUSTOM_GAME = '26'
}

type AugmentedActionContext = {
    commit<K extends keyof TMutations>(
        key: K,
        payload: Parameters<TMutations[K]>[1]
    ): ReturnType<TMutations[K]>;
} & Omit<ActionContext<State, State>, 'commit'>;

export interface IActions {
    [ActionTypes.RESTORE_APP_STATE]({ commit }: AugmentedActionContext): Promise<void>;
    [ActionTypes.SET_GAME_SETTINGS]({ commit, dispatch }: AugmentedActionContext, payload: GameSettings & {gameName: GameName}): Promise<void>;
    [ActionTypes.SAVE_SETTINGS]({ commit, state }: AugmentedActionContext): Promise<void>;
    [ActionTypes.SET_RANDOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {gameName: GameName, enabled: boolean}): Promise<void>;
    [ActionTypes.SET_RANDOM_GAMES]({ commit, dispatch }: AugmentedActionContext, payload: {gameNames: GameName[], enabled: boolean}): Promise<void>;
    [ActionTypes.SET_AUTO_CLOSE]({ commit, dispatch }: AugmentedActionContext, payload: boolean): Promise<void>;
    [ActionTypes.SET_THCRAP_PATH]({ commit, dispatch }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_MINIMIZE_TO_TRAY]({ commit, dispatch }: AugmentedActionContext, payload: boolean): Promise<void>;
    [ActionTypes.SET_SHOW_TRAY_ICON]({ commit, dispatch }: AugmentedActionContext, payload: boolean): Promise<void>;
    [ActionTypes.SET_NEKO_PROJECT_PATH]({ commit, dispatch }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_THCRAP_STARTING_REPOSITORY]({ commit, dispatch }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_DEFAULT_THCRAP_STARTING_REPOSITORY]({ commit, dispatch }: AugmentedActionContext): Promise<void>;
    [ActionTypes.CONFIGURE_GAMES_FOR_THCRAP]({ commit, dispatch }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_NAMED_PATH_NAME]({ commit, dispatch }: AugmentedActionContext, payload: {name: string, id: number, type: NamedPathType}): Promise<void>;
    [ActionTypes.ADD_NAMED_PATH]({ commit, dispatch }: AugmentedActionContext, payload: {type: NamedPathType, value: Omit<NamedPath, 'id'>}): Promise<void>;
    [ActionTypes.DELETE_NAMED_PATHS]({ commit, dispatch }: AugmentedActionContext, payload: {type: NamedPathType, value: number[]}): Promise<void>;
    [ActionTypes.SET_DEFAULT_NAMED_PATH]({ commit, dispatch, state }: AugmentedActionContext, payload: {type: NamedPathType, value: number}): Promise<void>;
    [ActionTypes.TRY_LOAD_THCRAP]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_COMMAND_BEFORE]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_COMMAND_AFTER]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    [ActionTypes.SET_CUSTOM_GAMES_CATEGORY_NAME]({ commit, dispatch }: AugmentedActionContext, payload: {id: number, name: string}): Promise<void>;
    [ActionTypes.ADD_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, game: CustomGame}): Promise<void>;
    [ActionTypes.ADD_CUSTOM_GAMES_CATEGORY]({ commit, dispatch }: AugmentedActionContext, payload: number | null): Promise<void>;
    [ActionTypes.DELETE_CUSTOM_GAMES_CATEGORY]({ commit, dispatch }: AugmentedActionContext, payload: number): Promise<void>;
    [ActionTypes.EDIT_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, game: CustomGame; index: number}): Promise<void>;
    [ActionTypes.DELETE_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, index: number}): Promise<void>;
}
type ActionsInterfaceCorrect = IActions extends {[K in `${ActionTypes}`]: (context: AugmentedActionContext, payload: any) => Promise<void> | void } ? true : false; // eslint-disable-line @typescript-eslint/no-explicit-any
type Actions = ActionsInterfaceCorrect extends true ? IActions : null;

export const actions: ActionTree<State, State> & Actions = {
    async [ActionTypes.RESTORE_APP_STATE]({ commit, dispatch }: AugmentedActionContext) {
        const settingsStr: string = await invokeInMain('get-settings');
        const settings = JSON.parse(settingsStr) as Partial<State>;
        if (settings.gamesSettings) {
            for (const gameSettingsKey in settings.gamesSettings) {
                const gameName = gameSettingsKey as GameName;
                commit(MutationTypes.SET_GAME_SETTINGS, { gameName, ...settings.gamesSettings[gameName] });
            }
        }
        commit(MutationTypes.SET_AUTO_CLOSE, settings.autoClose || false);
        commit(MutationTypes.SET_MINIMIZE_TO_TRAY, settings.minimizeToTray || false);
        commit(MutationTypes.SET_SHOW_TRAY_ICON, settings.showTrayIcon || false);
        if (settings.randomGames) {
            for (const gameName of settings.randomGames) {
                commit(MutationTypes.SET_RANDOM_GAME, { gameName, enabled: true });
            }
        }
        if (settings.thcrapPath) {
            await dispatch(ActionTypes.TRY_LOAD_THCRAP, settings.thcrapPath);
        }
        if (settings.nekoProjectPath) {
            commit(MutationTypes.SET_NEKO_PROJECT_PATH, settings.nekoProjectPath);
            commit(MutationTypes.SET_NEKO_PROJECT_PATH_VALID, settings.nekoProjectPathValid || false);
        }
        if (settings.thcrapStartingRepository) {
            commit(MutationTypes.SET_THCRAP_STARTING_REPOSITORY, settings.thcrapStartingRepository);
            commit(MutationTypes.SET_THCRAP_STARTING_REPOSITORY_VALID, settings.thcrapStartingRepositoryValid || false);
        }
        for (const namedPathType of namedPathTypes) {
            if (settings.namedPaths && settings.namedPaths[namedPathType]) {
                commit(MutationTypes.SET_NAMED_PATHS, { type: namedPathType, values: settings.namedPaths[namedPathType].values });
                commit(MutationTypes.SET_DEFAULT_NAMED_PATH, { type: namedPathType, value: settings.namedPaths[namedPathType].default });
            } else {
                if (namedPathType === 'wineExec') {
                    const wineExecutables: NamedPath[] = await invokeInMain('look-for-wine');
                    commit(MutationTypes.SET_NAMED_PATHS, { type: 'wineExec', values: wineExecutables });
                }
            }
        }
        if (settings.commandBefore) {
            commit(MutationTypes.SET_COMMAND_BEFORE, settings.commandBefore);
        }
        if (settings.commandAfter) {
            commit(MutationTypes.SET_COMMAND_AFTER, settings.commandAfter);
        }
        if (settings.customGames) {
            commit(MutationTypes.SET_CUSTOM_GAMES, settings.customGames);
        }
    },
    async [ActionTypes.SET_GAME_SETTINGS]({ commit, dispatch, state: currentState }: AugmentedActionContext, payload: GameSettings & { gameName: GameName }) {
        if (payload.banner !== currentState.gamesSettings[payload.gameName].banner) {
            payload.bannerCorrect = await invokeInMain('check-banner', payload.banner);
        }
        if (payload.greyBanner !== currentState.gamesSettings[payload.gameName].greyBanner) {
            payload.greyBannerCorrect = await invokeInMain('check-banner', payload.greyBanner);
        }
        commit(MutationTypes.SET_GAME_SETTINGS, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SAVE_SETTINGS]({ state }: AugmentedActionContext) {
        await invokeInMain('set-settings', JSON.stringify(state, null, '    '));
    },
    async [ActionTypes.SET_RANDOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {gameName: GameName, enabled: boolean}) {
        commit(MutationTypes.SET_RANDOM_GAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_RANDOM_GAMES]({ commit, dispatch }: AugmentedActionContext, payload: {gameNames: GameName[], enabled: boolean}) {
        for (const gameName of payload.gameNames) {
            commit(MutationTypes.SET_RANDOM_GAME, { gameName, enabled: payload.enabled });
        }
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_AUTO_CLOSE]({ commit, dispatch }: AugmentedActionContext, payload: boolean) {
        commit(MutationTypes.SET_AUTO_CLOSE, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_THCRAP_PATH]({ dispatch }: AugmentedActionContext, payload: string) {
        await dispatch(ActionTypes.TRY_LOAD_THCRAP, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_MINIMIZE_TO_TRAY]({ commit, dispatch }: AugmentedActionContext, payload: boolean) {
        commit(MutationTypes.SET_MINIMIZE_TO_TRAY, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_SHOW_TRAY_ICON]({ commit, dispatch }: AugmentedActionContext, payload: boolean) {
        commit(MutationTypes.SET_SHOW_TRAY_ICON, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_NEKO_PROJECT_PATH]({ commit, dispatch }: AugmentedActionContext, payload: string) {
        commit(MutationTypes.SET_NEKO_PROJECT_PATH, payload);
        const pathValid: boolean = await invokeInMain('check-neko-project-path', payload);
        commit(MutationTypes.SET_NEKO_PROJECT_PATH_VALID, pathValid);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_THCRAP_STARTING_REPOSITORY]({ commit, dispatch }: AugmentedActionContext, payload: string) {
        commit(MutationTypes.SET_THCRAP_STARTING_REPOSITORY, payload);
        try {
            const repositoryResponse = await fetch(payload);
            if (repositoryResponse) {
                commit(MutationTypes.SET_THCRAP_STARTING_REPOSITORY_VALID, repositoryResponse.ok);
            } else {
                throw new Error();
            }
        } catch {
            commit(MutationTypes.SET_THCRAP_STARTING_REPOSITORY_VALID, false);
        }
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_DEFAULT_THCRAP_STARTING_REPOSITORY]({ dispatch }: AugmentedActionContext) {
        await dispatch(ActionTypes.SET_THCRAP_STARTING_REPOSITORY, defaultThcrapStartingRepository);
    },
    async [ActionTypes.CONFIGURE_GAMES_FOR_THCRAP]({ commit, dispatch, state }: AugmentedActionContext, payload: string) {
        (Object.entries(thcrapGameNames) as [GameName, string][]).forEach(([gameName, thcrapGameName]) => {
            if (state.thcrapConfig.games[thcrapGameName] || state.thcrapConfig.games[`${thcrapGameName}_custom`]) {
                const gameSettings = state.gamesSettings[gameName];
                gameSettings.thcrapProfile = payload;
                if (state.thcrapConfig.games[thcrapGameName]) {
                    gameSettings.thcrapGameProfile = thcrapGameName;
                    gameSettings.defaultExecutable = 'thcrap';
                }
                if (state.thcrapConfig.games[`${thcrapGameName}_custom`]) {
                    gameSettings.thcrapCustomExeProfile = `${thcrapGameName}_custom`;
                    gameSettings.defaultCustomExeExecutable = 'thcrap';
                }
                commit(MutationTypes.SET_GAME_SETTINGS, { ...gameSettings, gameName });
            }
        });
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_NAMED_PATH_NAME]({ commit, dispatch }: AugmentedActionContext, payload: {name: string, id: number, type: NamedPathType}) {
        commit(MutationTypes.SET_NAMED_PATH_NAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.ADD_NAMED_PATH]({ commit, dispatch }: AugmentedActionContext, payload: {type: NamedPathType, value: Omit<NamedPath, 'id'>}) {
        commit(MutationTypes.ADD_NAMED_PATH, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.DELETE_NAMED_PATHS]({ commit, dispatch }: AugmentedActionContext, payload: {type: NamedPathType, value: number[]}) {
        commit(MutationTypes.DELETE_NAMED_PATHS, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_DEFAULT_NAMED_PATH]({ commit, dispatch }: AugmentedActionContext, payload: {type: NamedPathType, value: number}) {
        commit(MutationTypes.SET_DEFAULT_NAMED_PATH, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.TRY_LOAD_THCRAP]({ commit }: Pick<AugmentedActionContext, 'commit'>, payload: string) {
        commit(MutationTypes.SET_THCRAP_PATH, payload);
        const thcrapConfig: ThcrapConfig | null = await invokeInMain('get-thcrap-config', payload);
        if (thcrapConfig) {
            commit(MutationTypes.SET_THCRAP_CONFIG, thcrapConfig);
            commit(MutationTypes.SET_THCRAP_FOUND, true);
        } else {
            commit(MutationTypes.SET_THCRAP_CONFIG, defaultThcrapConfig);
            commit(MutationTypes.SET_THCRAP_FOUND, false);
        }
    },
    async [ActionTypes.SET_COMMAND_BEFORE]({ commit, dispatch }: AugmentedActionContext, payload: string) {
        commit(MutationTypes.SET_COMMAND_BEFORE, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_COMMAND_AFTER]({ commit, dispatch }: AugmentedActionContext, payload: string) {
        commit(MutationTypes.SET_COMMAND_AFTER, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.SET_CUSTOM_GAMES_CATEGORY_NAME]({ commit, dispatch }: AugmentedActionContext, payload: {id: number, name: string}) {
        commit(MutationTypes.SET_CUSTOM_GAMES_CATEGORY_NAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.ADD_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, game: CustomGame}) {
        commit(MutationTypes.ADD_CUSTOM_GAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.ADD_CUSTOM_GAMES_CATEGORY]({ commit, dispatch }: AugmentedActionContext, payload: number | null) {
        commit(MutationTypes.ADD_CUSTOM_GAMES_CATEGORY, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.DELETE_CUSTOM_GAMES_CATEGORY]({ commit, dispatch }: AugmentedActionContext, payload: number) {
        commit(MutationTypes.DELETE_CUSTOM_GAMES_CATEGORY, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.EDIT_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, game: CustomGame; index: number}) {
        commit(MutationTypes.EDIT_CUSTOM_GAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    },
    async [ActionTypes.DELETE_CUSTOM_GAME]({ commit, dispatch }: AugmentedActionContext, payload: {parentId: number, index: number}) {
        commit(MutationTypes.DELETE_CUSTOM_GAME, payload);
        await dispatch(ActionTypes.SAVE_SETTINGS);
    }
};

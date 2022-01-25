import State from './state';
import { getters, Getters } from './getters';
import {
    createStore,
    Store as VuexStore,
    CommitOptions,
    DispatchOptions
} from 'vuex';
import { actions, IActions } from './actions';
import { mutations, TMutations } from './mutations';
import { defaultGamesSettings, defaultRandomGames, defaultThcrapConfig, defaultNamedPaths, defaultCustomGameRootCategory } from './defaults';

export type Store = Omit<
    VuexStore<State>,
    'commit' | 'getters' | 'dispatch'
> & {
    getters: {
        [K in keyof Getters]: ReturnType<Getters[K]>;
    },
    dispatch<K extends keyof IActions>(
        key: K,
        payload?: Parameters<IActions[K]>[1],
        options?: DispatchOptions
    ): ReturnType<IActions[K]>,
    commit<K extends keyof TMutations, P extends Parameters<TMutations[K]>[1]>(
        key: K,
        payload: P,
        options?: CommitOptions
    ): ReturnType<TMutations[K]>;
};

export const store: Store = createStore<State>({
    state() {
        return {
            gamesSettings: defaultGamesSettings,
            thcrapConfig: defaultThcrapConfig,
            randomGames: defaultRandomGames,
            autoClose: false,
            thcrapPath: '',
            thcrapFound: false,
            showTrayIcon: false,
            minimizeToTray: false,
            nekoProjectPath: '',
            nekoProjectPathValid: false,
            thcrapStartingRepository: '',
            thcrapStartingRepositoryValid: false,
            namedPaths: defaultNamedPaths,
            commandBefore: '',
            commandAfter: '',
            customGames: defaultCustomGameRootCategory,
            language: 'en'
        };
    },
    mutations,
    actions,
    getters
});

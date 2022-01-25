import { GameName, ThcrapConfig, GameSettings, NamedPaths, CustomGameCategory, gameNames } from '@/data-types';

export const defaultGamesSettings = gameNames.reduce((acc: Record<string, GameSettings>, key: string) => {
    acc[key] = {
        showBanner: true,
        showText: true,
        executables: {
            jp: {
                path: '',
                withAppLocale: false
            },
            en: {
                path: '',
                withAppLocale: false
            },
            custom: {
                path: '',
                withAppLocale: false
            }
        },
        thcrapGameProfile: '',
        thcrapProfile: '',
        thcrapWithAppLocale: false,
        defaultExecutable: 'jp',
        wineSettings: {
            wineExec: -1,
            winePrefix: -1
        },
        useCustomBanner: false,
        banner: '',
        greyBanner: '',
        textColor: '',
        useTextColor: false,
        greyBannerCorrect: false,
        bannerCorrect: false,
        defaultCustomExeExecutable: 'custom',
        thcrapCustomExeProfile: '',
        hdiPath: '',
        commandAfter: '',
        commandBefore: ''
    };
    return acc;
}, {}) as Record<GameName, GameSettings>;

export const defaultRandomGames = Array.from(gameNames);
export const defaultThcrapConfig : ThcrapConfig = {
    profiles: [],
    games: {}
};
export const defaultThcrapStartingRepository = 'https://mirrors.thpatch.net/nmlgc/';
export const defaultNamedPaths: NamedPaths = {
    wineExec: {
        default: -1,
        values: []
    },
    winePrefix: {
        default: -1,
        values: []
    }
};
export const defaultCustomGameRootCategory: CustomGameCategory = {
    id: 0,
    name: '',
    children: [],
    games: []
};

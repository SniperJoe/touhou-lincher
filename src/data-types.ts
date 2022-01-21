export const gameConfigurableExecutables = ['jp', 'en'] as const;
export const configurableExecutables = [...gameConfigurableExecutables, 'custom'] as const;
export const configurableFiles = [...configurableExecutables, 'pc98'] as const;
export const gameLaunchProfiles = [...gameConfigurableExecutables, 'thcrap'] as const;
export const customExeLaunchProfiles = ['custom', 'thcrap'] as const;
export const supportedLangs = ['en', 'jp', 'ru'] as const;
export const namedPathTypes = ['wineExec', 'winePrefix'] as const;

export type GameConfigurableExecutable = typeof gameConfigurableExecutables[number];
export type ConfigurableExecutable = typeof configurableExecutables[number];
export type ConfigurableFile = typeof configurableFiles[number];
export type GameLaunchProfile = typeof gameLaunchProfiles[number];
export type CustomExeLaunchProfile = typeof customExeLaunchProfiles[number];
export type SupportedLang = typeof supportedLangs[number];
export type NamedPathType = typeof namedPathTypes[number];

export type GameName = 'hrtp' | 'soew' | 'podd' | 'lls' | 'ms' | 'eosd' | 'pcb' | 'in' | 'pofv' | 'mof' | 'sa' | 'ufo' | 'td' | 'ddc' | 'lolk' | 'hsifs' | 'wbawc' | 'um' | 'iamp' | 'swr' | 'soku' | 'hm' | 'ulil' | 'aocf' | 'stb' | 'ds' | 'gfw' | 'isc' | 'vd';
export type ThcrapConfig = {
    profiles: string[];
    games: Record<string, string>;
}
export type ReturnTypeAsync<T> = T extends (...args: any) => Promise<infer R> ? R : any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type GameExecutableSettings = {path: string, withAppLocale: boolean};
export type GameExecutablesSettings = Record<ConfigurableExecutable, GameExecutableSettings>;
export type ExeSettings = {
    wineSettings: Record<NamedPathType, number>,
}
export type GameSettings = {
    showBanner: boolean,
    showText: boolean,
    executables: GameExecutablesSettings,
    thcrapWithAppLocale: boolean,
    thcrapGameProfile: string,
    thcrapCustomExeProfile: string,
    thcrapProfile: string,
    defaultExecutable: GameLaunchProfile,
    defaultCustomExeExecutable: CustomExeLaunchProfile,
    wineSettings: Record<NamedPathType, number>,
    useCustomBanner: boolean,
    banner: string,
    bannerCorrect: boolean,
    greyBanner: string,
    greyBannerCorrect: boolean,
    textColor: string,
    useTextColor: boolean,
    hdiPath: string,
    commandBefore: string,
    commandAfter: string
}
export type NamedPath = {name: string, path: string, id: number};
export type NamedPaths = Record<NamedPathType, { default: number, values: NamedPath[]}>;
export type RunExeParams = {
    gameSettings: ExeSettings,
    defaultWinePrefix: number,
    defaultWineExec: number,
    winePrefixes: NamedPath[],
    wineExecs: NamedPath[],
    commandsBefore: string[],
    commandsAfter: string[]
}
export type RunGameParams = RunExeParams & {
    gameSettings: GameSettings
}
export type RunCustomGameParams = RunExeParams & {
    withAppLocale: boolean,
    path: string
}
export type RunWindowsGameParams = RunGameParams & {
    thcrapPath: string,
    thcrapFound: boolean,
    isCustomExe: boolean
}
export type RunPC98GameParams = RunGameParams & {
    nekoProjectPath: string,
    nekoProjectPathValid: boolean
}
export type SelectOption<V> = {
    label: string,
    value: V
}
export type SelectOptions<V> = SelectOption<V>[];
export type ThcrapRepository = {
    contact: string,
    id: string,
    neighbors?: string[],
    patches: Record<string, string>,
    servers: string[],
    title: string
}
export type ThcrapPatchResponse = {
    dependencies?: string[],
    id: string,
    servers: string[],
    title: string
    fonts: Record<string, boolean>
}
export type ThcrapPatch = ThcrapPatchResponse & {
    idWithRepo: string,
    path: string
}
export type ThcrapProfileData = {
    console: boolean,
    dat_dump: boolean, // eslint-disable-line camelcase
    patches: Record<string, string>[]
}
export type LoadRemoteThcrapPatchParams = {
    servers: string[],
    patchId: string
}
export type CustomGame = {
    path: string,
    name: string,
    wineSettings: Record<NamedPathType, number>
}
export type CustomGameCategory = {
    id: number,
    name: string,
    children: CustomGameCategory[],
    games: CustomGame[]
}
export type CustomGamesViewType = 'list' | 'details' | 'large-icons' | 'small-icons' | 'tile';

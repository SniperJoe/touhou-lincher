import { GameName, ThcrapConfig, GameSettings, NamedPaths, CustomGameCategory as CustomGameRootCategory, SupportedLang } from "@/data-types";

export default interface State {
    gamesSettings: Record<GameName, GameSettings>,
    thcrapConfig: ThcrapConfig,
    thcrapPath: string,
    thcrapFound: boolean,
    randomGames: GameName[],
    autoClose: boolean,
    minimizeToTray: boolean,
    showTrayIcon: boolean,
    nekoProjectPath: string,
    nekoProjectPathValid: boolean,
    thcrapStartingRepository: string,
    thcrapStartingRepositoryValid: boolean,
    namedPaths: NamedPaths;
    commandBefore: string;
    commandAfter: string;
    customGames: CustomGameRootCategory,
    language: SupportedLang
}
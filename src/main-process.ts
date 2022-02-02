'use strict'

import { app, protocol, BrowserWindow, BrowserView, Tray, Menu, MenuItem, nativeImage, ipcMain, dialog, shell } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { promises as fs, existsSync, createWriteStream } from 'fs';
import path from 'path';
import { categoryNames, CustomExeLaunchProfile, customExeLaunchProfiles, CustomGameCategory, GameLaunchProfile, gameLaunchProfiles, GameName, gameNames, GameSettings, LoadRemoteThcrapPatchParams, NamedPath, RunCustomGameParams, RunExeParams, RunGameParams, RunPC98GameParams, RunWindowsGameParams, SupportedLang, ThcrapConfig, ThcrapPatchResponse, ThcrapRepository } from './data-types';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { MainProcessFunctions, MainProcessHandlers } from './main-process-functions';
import { ReadStream } from 'original-fs';
import { categories, categoryTitles, gameTitles, thcrapGameNames } from './constants';
import { RendererProcessFunctions } from './renderer-functions';
import { mainProcessTranslations } from './main-process-translations';

const isDevelopment = process.env.NODE_ENV !== 'production';
const __public = isDevelopment ? 'public/' : __dirname;
type ReturnTypeAsync<T> = T extends (...args: any) => Promise<infer R> ? R : any;
type a = ReturnTypeAsync<typeof dialog.showOpenDialog>;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])
let mainWindow: BrowserWindow;
let appIcon: Tray;
let lang: SupportedLang = 'en';
let settingsPath = '';
const debugMode = process.env.DEBUG === 'true'

function LogMain(...args: any[]) {
    if (debugMode) {
        console.log(...args);
    }
}

function LogRenderer(...args: any[]) {
    if (debugMode) {
        console.log('RendererProcess: ', ...args);
    }
}

function sendToRenderer<K extends keyof RendererProcessFunctions>(channel: K, ...args: Parameters<RendererProcessFunctions[K]>) {
    mainWindow.webContents.send(channel, ...args);
}
async function TryReadFile(file: string) : Promise<string | null> {
    try {
        return await fs.readFile(file, { encoding: 'utf-8' });
    }
    catch {
        return null;
    }
}
function TryParseJson<T>(json: string): T | null {
    try {
        return JSON.parse(json) as T;
    }
    catch {
        return null;
    }
}
async function readThcrapConfig(thcrapExePath: string): Promise<ThcrapConfig | null> {
    const thcrapConfigPath = path.resolve(path.dirname(thcrapExePath), 'config');
    try {
        const configFiles = await fs.readdir(thcrapConfigPath);
        const userConfigFiles = configFiles.filter(cf => /\.js$/.test(cf) && !/(config|games)\.js$/.test(cf));
        const gamesConfigStr = await TryReadFile(path.resolve(thcrapConfigPath, 'games.js'));
        let gamesConfig: Record<string, string> = {};
        if (gamesConfigStr) {
            gamesConfig = TryParseJson<Record<string, string>>(gamesConfigStr) || {};
        }
        return {
            games: gamesConfig,
            profiles: userConfigFiles
        }
    }
    catch {
        return null;
    }
}
async function getWineVersion(winePath: string) {
    const { stdout, stderr } = await TryExecAsync(`${winePath} --version`);
    if (stderr) {
        return '';
    }
    const versionMatch = stdout.match(/wine\-([\d\.]+)/);
    if (!versionMatch) {
        return '';
    }
    return versionMatch[1];
}
async function TryExecAsync(command: string): Promise<{ stdout: string; stderr: string; }> {
    const execAsync = promisify(exec);
    try {
        LogMain('executing: ', command);
        const execResult = await execAsync(command, {maxBuffer: 1024*1024});
        return execResult;
    }
    catch(e) {
        const stderr = (e as {toString: () => string}).toString();
        LogMain('exec error: ', stderr);
        return { stdout: '', stderr};
    }
}
function TrySpawnAsync(command: string, cwd: string, args: string[], env: Record<string, string>): Promise<{ stdout: string; stderr: string; code: number | null}> {
    let stdout = '';
    let stderr = '';
    LogMain('executing ', command, ', args: ', args.join(' '), ', cwd: ', cwd, ', env:', env);
    const child = spawn(command, args, {cwd, env: {...process.env, ...env}});
    child.stdout.on('data', (chunk) => {
        if (typeof chunk === 'string') {
            stdout += chunk;
            LogMain(chunk);
        }
    });
    child.stderr.on('data', (chunk) => {
        if (typeof chunk === 'string') {
            stderr += chunk;
            LogMain(chunk);
        }
    });
    return new Promise<{ stdout: string; stderr: string; code: number | null}>((resolve) => {
        child.on('close', code => {
            resolve({stderr, stdout, code});
        });
    });
}
function addIpcListeners() {
    const ipcListeners: MainProcessHandlers = {
        'get-settings':  async () => {
            try {
                return await fs.readFile(settingsPath, { encoding: 'utf-8' });
            }
            catch {
                LogMain('No settings found, using {}');
                return '{}';
            }
        },
        'get-thcrap-config':  async (_, thcrapPath: string) => {
            return await readThcrapConfig(thcrapPath);
        },
        'set-settings':  async (event, settings: string) => {
            await fs.writeFile(settingsPath, settings, {encoding: 'utf-8'});
        },
        'pick-exe':  async (_, allowLinuxExe) => {
            const config: Electron.OpenDialogOptions = { 
                properties: ['openFile'], 
                filters: [ 
                    { 
                        name: 'Windows Executable Files (*.exe, *.bat, *.lnk)',
                        extensions: ['exe', 'bat', 'lnk']
                    } 
                ] 
            };
            if (allowLinuxExe && config.filters) {
                config.filters.push({ 
                    name: 'Executable Files',
                    extensions: ['']
                })
            }
            return await pickFromFS(config);
        },
        'pick-hdi':  async () => {
            return await pickFromFS({ 
                properties: ['openFile'], 
                filters: [ 
                    { 
                        name: 'HDI Image (*.hdi)',
                        extensions: ['hdi']
                    } 
                ] 
            });
        },
        'check-neko-project-path':  async (_, pathToCheck: string) => {
            return checkExists(path.resolve(path.dirname(pathToCheck), 'np21nt.ini')) || checkExists(path.resolve(path.dirname(pathToCheck), 'xnp21kai'));
        },
        'configure-thcrap':  async(_, thcrapPath: string) => {
            const thcrapConfiguratorPath = path.resolve(path.dirname(thcrapPath), 'bin/thcrap_configure.exe');
            exec(`wine "${thcrapConfiguratorPath}"`);
        },
        'run-custom-game':  async (_, paramsStr: string) => {
            const params: RunCustomGameParams = JSON.parse(paramsStr);
            const {wineCommand, envVariables} = getWineParams(params);
            const workingDir = path.dirname(params.path);
            const wineArgs = [path.basename(params.path)];
            if (params.withAppLocale) {
                envVariables.LANG = 'ja_JP.UTF-8';
            }
            for (const cmd of params.commandsBefore.filter(c => !!c)) {
                await TryExecAsync(cmd);
            }
            await TrySpawnAsync(wineCommand, workingDir, wineArgs, envVariables);
            for (const cmd of params.commandsAfter.filter(c => !!c)) {
                await TryExecAsync(cmd);
            }
        },
        'pick-linux-exe':  async () => {
            return await pickFromFS({ 
                properties: ['openFile'], 
                filters: [ 
                    { 
                        name: 'Executable Files',
                        extensions: ['']
                    }
                ] 
            });
        },
        'pick-folder':  async () => {
            return await pickFromFS({ 
                properties: ['openDirectory']
            });
        },
        'pick-banner':  async () => {
            return await pickFromFS({ 
                properties: ['openFile'], 
                filters: [ 
                    { 
                        name: 'Web Image Files (*.png, *.jpg, *.jpeg)',
                        extensions: ['png', 'jpg', 'jpeg']
                    } 
                ]
            });
        },
        'get-wine-version':  async (_, winePath: string) => getWineVersion(winePath),
        'look-for-wine':  async() => {
            const wineExecutables: NamedPath[] = [];
            const { stdout: whereSearchResult } = await TryExecAsync(`whereis wine`);
            if (whereSearchResult) {
                const possibleWineExecutables = whereSearchResult.split(' ').filter(wsr => wsr.endsWith('wine'));
                for (const possibleWineExecutableIndex in possibleWineExecutables) {
                    if (!(await fs.lstat(possibleWineExecutables[possibleWineExecutableIndex])).isDirectory()) {
                        const version = await getWineVersion(possibleWineExecutables[possibleWineExecutableIndex]);
                        if (version) {
                            wineExecutables.push({name: `Wine ${version}`, path: possibleWineExecutables[possibleWineExecutableIndex], id: wineExecutables.length})
                        }
                    }
                };
            } else {
                const { stdout: whichSearchResult } = await TryExecAsync(`which wine`);
                if (whichSearchResult) {
                    const version = await getWineVersion(whichSearchResult.replace('\n', ''));
                    if (version) {
                        wineExecutables.push({name: `Wine ${version}`, path: whichSearchResult.replace('\n', ''), id: wineExecutables.length})
                    }
                }
            }
            let currentMaxId = 0;
            wineExecutables.forEach(we => { 
                if (we.id >= currentMaxId) {
                    currentMaxId = we.id;
                }
            });
            const homeFolder = await getHomeFolder();
            if (homeFolder) {
                const { stdout: protonsOut } = await TryExecAsync(`ls ${path.resolve(homeFolder, '.local', 'share', 'Steam', 'steamapps', 'common')} | grep Proton`);
                if (protonsOut) {
                    const protonPathes = protonsOut.split('\n').filter(s => !!s);
                    const protons : NamedPath[] = protonPathes.map((pp, index) => ({
                        id: currentMaxId + index + 1,
                        name: pp,
                        path: path.resolve(homeFolder, '.local', 'share', 'Steam', 'steamapps', 'common', pp, 'dist', 'bin', 'wine')
                    }));
                    return wineExecutables.concat(protons);
                }
            }
            return wineExecutables;
        },
        'run-game':  async (_, paramsStr: string) => {
            await RunGame(JSON.parse(paramsStr));
        },
        'check-banner':  async(_, bannerPath: string) => {
            return checkExists(bannerPath) && /jpe?g|png/.test(path.extname(bannerPath))
        },
        'load-img':  async (_, imgPath: string) => {
            const fileContent = await fs.readFile(imgPath, { encoding: 'base64' })
            return `data:image/${path.extname(imgPath) == 'png' ? 'png' : 'jpeg'};base64,${fileContent}`;
        },
        'try-load-local-thcrap-profile':  async (_, thcrapPath: string, name: string) => {
            const profilePath = path.resolve(path.dirname(thcrapPath), 'config', `${name}`);
            if (checkExists(profilePath)) {
                return await fs.readFile(profilePath, { encoding: 'utf-8' });
            }
            return '';
        },
        'load-local-thcrap-repositories':  async (_, thcrapPath: string) => {
            return await loadLocalThcrapRepos(thcrapPath);
        },
        'try-load-local-thcrap-patch':  async (_, thcrapPath: string, repoId: string, patchId: string) => {
            const patchPath = path.resolve(path.dirname(thcrapPath), repoId, patchId, 'patch.js');
            if (checkExists(patchPath)) {
                return await fs.readFile(patchPath, { encoding: 'utf-8' });
            }
            return '';
        },
        'try-load-remote-thcrap-patch':  async (_, paramsStr: string) => {
            const params: LoadRemoteThcrapPatchParams = JSON.parse(paramsStr);
            for (const server of params.servers) {
                try {
                    const resp = await axios.get<ThcrapPatchResponse>(`${params.patchId}/patch.js`, {baseURL: server});
                    if (resp.status == 200) {
                        return JSON.stringify(resp.data);
                    }
                }
                catch (e) {
                    if (axios.isAxiosError(e) && e.response) {
                        LogMain(`Request to ${e.response.config.baseURL}${e.response.config.url} failed: ${e.code}`);
                    }
                    continue;
                }
            }
            return '';
        },
        'load-thcrap-repository-by-url':  async (_, repositoryUrl: string) => {
            try {
                const resp = await axios.get<ThcrapRepository>(`repo.js`, {baseURL: repositoryUrl});
                if (resp.status == 200) {
                    return JSON.stringify(resp.data);
                }
            }
            catch (e) {
                if (axios.isAxiosError(e) && e.response) {
                    LogMain(`Request to ${e.response.config.baseURL}${e.response.config.url} failed: ${e.code}`);
                }
            }
            return '';
        },
        'run-pc98-game':  async (_, paramsStr: string) => {
            return await RunPC98Game(JSON.parse(paramsStr));
        },
        'save-thcrap-repository-file': async(_, thcrapPath: string, repositoryId: string, fileContents: string) => {
            await saveWithMkdir(path.dirname(thcrapPath), ['repos', repositoryId], 'repo.js', fileContents);
        },
        'save-thcrap-patch-file': async(_, thcrapPath: string, repositoryId: string, patchId: string, fileContents: string) => {
            await saveWithMkdir(path.dirname(thcrapPath), ['repos', repositoryId, patchId], 'patch.js', fileContents);
        },
        'save-thcrap-profile':async (_, thcrapPath: string, profileName: string, profile: string) => {
            const configsPath = path.resolve(path.dirname(thcrapPath), 'config');
            if (checkExists(configsPath)) {
                await fs.writeFile(path.resolve(configsPath, profileName), profile, { encoding: 'utf-8' });
            }
        },
        'load-thcrap-game-profiles': async(_, thcrapPath: string) => {
            const profilesPath = path.resolve(path.dirname(thcrapPath), 'config', 'games.js');
            if (checkExists(profilesPath)) {
                return await fs.readFile(profilesPath, { encoding: 'utf-8' });
            }
            return '';
        },
        'save-thcrap-game-profiles': async(_, thcrapPath: string, profiles: string) => {
            const configsPath = path.resolve(path.dirname(thcrapPath), 'config');
            if (checkExists(configsPath)) {
                await fs.writeFile(path.resolve(configsPath, 'games.js'), profiles, { encoding: 'utf-8' });
            }
        },
        'load-img-from-exe': async (_, exePath: string) => {
            return await loadDataUrlImgFromExe(exePath);
        },
        'open-folder': async (_, pathToOpen: string) => {
            try {
                shell.openPath(path.dirname(pathToOpen));
            }
            catch {
                LogMain(`Failed to open folder "${path.dirname(pathToOpen)}"`);
            }
        },
        'open-replays-repository': async (_, url: string, offsetTop: number) => {
            await openReplaysRepository(url, offsetTop);
        },
        'save-replay': async (_, url: string, gamePath: string, gameName: GameName) => {
            if (gamePath === '') {
                await browseAndSaveReplay(url);
            } else {
                if (checkExists(gamePath)) {
                    const fileName = gameName == 'mof' ? findFreeReplayFileNameForTH10(gamePath) || path.basename(url) : path.basename(url);
                    const filePath = path.resolve(gamePath, 'replay', fileName);
                    const clickedButton = dialog.showMessageBoxSync(mainWindow, { 
                        message: mainProcessTranslations['downloadPatch'][lang]
                            .replace('%url%', path.basename(url))
                            .replace('%path%', filePath),
                        buttons: ['OK', mainProcessTranslations['cancel'][lang], mainProcessTranslations['saveAs'][lang]],
                        type: 'question'
                    });
                    if (clickedButton === 0) {
                        await downloadToFile(url, filePath);
                    } else if (clickedButton === 2) {
                        await browseAndSaveReplay(url);
                    }
                }
            }
        },
        'close-replays-repository':async (_) => {
            const mainWindowChildren = mainWindow.getBrowserViews();
            if (mainWindowChildren.length) {
                (mainWindowChildren[0].webContents as any as { destroy: () => void }).destroy();
                mainWindow.setBrowserView(null);
            }
        },
        'search-windows-path': async (_, windowsPath: string, prefixes: string[]) => {
            const driveLetterMatch = windowsPath.match(/^([a-z]):[/\\]/i);
            if (driveLetterMatch) {
                const driveLetter = driveLetterMatch[1].toLowerCase();
                const windowsPathParts = windowsPath.replace(driveLetterMatch[0], '').split(/[\\/]/);
                LogMain('parts of windows path: ' + windowsPathParts.join(', '));
                for (const prefix of prefixes) {
                    const unixPath = path.resolve(prefix, 'dosdevices', `${driveLetter}:`, ...windowsPathParts);
                    LogMain('unix path: ' + unixPath);
                    if (checkExists(unixPath)) {
                        const { stdout: dosdevices_lsResult } = await TryExecAsync(`ls -l "${path.resolve(prefix, 'dosdevices', driveLetter + ':')}"`);
                        const drivePathMatch = dosdevices_lsResult.match(/(?<driveLetter>[a-z]): -> '?(?<drivePath>.+)'?\s*$/m);
                        if (drivePathMatch && drivePathMatch.groups) {
                            return path.resolve(drivePathMatch.groups.drivePath, ...windowsPathParts);
                        }
                    } else {
                        LogMain('unix path does not exist');
                    }
                }
            } else {
                LogMain('drive letter regexp failed for ' + windowsPath);
            }
            return '';
        },
        'edit-vpatch':async (_, gamePath: string) => {
            const vpatchIniPAth = path.resolve(path.dirname(gamePath), 'vpatch.ini');
            LogMain('vpatch.ini path: ' + vpatchIniPAth);
            await TryExecAsync(`xdg-open "${vpatchIniPAth}"`);
        },
        'set-tray-menu':async (_, games: GameName[], customGames: string) => {
            await createTray(games, JSON.parse(customGames));
        },
        'hide-tray-icon': async (_) => {
            hideTray();
        },
        'hide-from-taskbar': async (_) => {
            mainWindow.setSkipTaskbar(true);
        },
        'show-in-taskbar': async (_) => {
            mainWindow.setSkipTaskbar(false);
        },
        'set-lang': async (_, langToSet) => {
            lang = langToSet;
        },
        'open-link': async (_, link) => {
            shell.openExternal(link);
        },
        'log': async (_, ...args: any) => {
            LogRenderer(...args);
        }
    };
    for (const channel in ipcListeners) {
        if (isMainProcessFunctionName(channel, ipcListeners)) {
            ipcMain.handle(channel, ipcListeners[channel]);
        }
    }
}
function isMainProcessFunctionName(channel: string, ipcListeners: MainProcessHandlers): channel is keyof MainProcessFunctions {
    return typeof ipcListeners[channel as keyof MainProcessFunctions] === 'function';
}
async function loadDataUrlImgFromExe(exePath: string) {
    const output = await TryExecAsync(`wrestool -x -t 14 "${exePath}" | base64`);
    LogMain('exe img path: ' + path);
    if (output.stdout) {
        return `data:image/x-icon;base64,${output.stdout}`;
    }
    return '';
}
function findFreeReplayFileNameForTH10(th10Path: string): string | undefined {
    for (let i = 1; i < 26; i++) {
        const fileName = i >= 10 ? `th10_${i}.rpy` : `th10_0${i}.rpy`;
        if (!checkExists(path.resolve(th10Path, 'replay', fileName))) {
            return fileName;
        }
    }
}
async function downloadToFile(url: string, file: string) {
    const writer = createWriteStream(file);
    const response = await axios.get<ReadStream>(url, {
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
async function browseAndSaveReplay(url: string) {
    const dialogResult = await dialog.showSaveDialog(mainWindow, {
        properties: ['showHiddenFiles', 'showOverwriteConfirmation'],
        filters: [ 
            {
                name: 'Touhou replays (*.rpy)',
                extensions: ['rpy']
            } 
        ]
    });
    if (dialogResult.filePath) {
        const filePath = dialogResult.filePath.endsWith('.rpy') ? dialogResult.filePath : `${dialogResult.filePath}.rpy`;
        await downloadToFile(url, filePath);
    }
}
async function openReplaysRepository(url: string, offsetTop: number) {
    const mainWindowChildren = mainWindow.getBrowserViews();
    if (mainWindowChildren.length) {
        mainWindowChildren[0].webContents.loadURL(url);
    } else {
        const replaysView = new BrowserView();
        mainWindow.setBrowserView(replaysView);
        replaysView.setBounds({width: mainWindow.getBounds().width, height: mainWindow.getBounds().height - offsetTop, x: 0, y: offsetTop});
        replaysView.setAutoResize({width: true, height: true, horizontal: true, vertical: false});
        replaysView.webContents.loadURL(url);
        if (!process.env.IS_TEST && process.env.WEBPACK_DEV_SERVER_URL) {
            replaysView.webContents.openDevTools();
        }
        replaysView.webContents.on('will-navigate', (event, url) => {
            if (url.endsWith('.rpy')) {
                event.preventDefault();
                LogMain('Sending path search request to render process');
                sendToRenderer('get-replays-path', url);
            }
        })
    }
}
async function loadLocalThcrapRepos(thcrapPath: string) : Promise<string[]> {
    const reposFolder = path.resolve(path.dirname(thcrapPath), 'repos');
    const repoStrings : string[] = [];
    LogMain(`checking ${reposFolder} exists:`)
    if (checkExists(reposFolder)) {
        LogMain(`${reposFolder} exists`)
        const reposFolderEntries = await fs.readdir(reposFolder, {withFileTypes: true});
        LogMain(`${reposFolder} entries: `, reposFolderEntries.map(v => v.name).join(', '));
        for (const reposFolderEntry of reposFolderEntries) {
            if (reposFolderEntry.isDirectory()) {
                const reposJsPath = path.resolve(reposFolder, reposFolderEntry.name, 'repo.js');
                LogMain(`checking ${reposJsPath} exists:`)
                if (checkExists(reposJsPath)) {
                    LogMain(`${reposJsPath} exists, adding to list`);
                    repoStrings.push(await fs.readFile(reposJsPath, {encoding: 'utf-8'}));
                }
            }
        }
    } else {
        LogMain(`${reposFolder} does not exist`);
    }
    return repoStrings;
}
async function saveWithMkdir(rootFolder: string, subFolders: string[], fileName: string, fileContents: string) {
    if (checkExists(rootFolder)) {
        const subFolder = path.resolve(rootFolder, ...subFolders);
        if (!checkExists(subFolder)) {
            await fs.mkdir(subFolder, {recursive: true});
        }
        await fs.writeFile(path.resolve(subFolder, fileName), fileContents, {encoding: 'utf-8'});
    }
}
function checkExists(filePath: string) : boolean {
    try {
        return existsSync(filePath);
    }
    catch {
        return false;
    }
}
async function pickFromFS(options: Electron.OpenDialogOptions): Promise<string> {
    const res = await dialog.showOpenDialog(options);
    if (!res.canceled) {
        return res.filePaths[0];
    }
    return '';
}
async function getHomeFolder(): Promise<string> {
    const { stdout: homeFolderOut } = await TryExecAsync(`echo $HOME`);
    if (homeFolderOut) {
        return homeFolderOut.replace('\n', '');
    }
    return '';
}
function getWineParams({gameSettings, defaultWinePrefix, defaultWineExec, winePrefixes, wineExecs}: RunExeParams) : {envVariables: Record<string, string>, wineCommand: string} {
    let winePrefixId = gameSettings.wineSettings.winePrefix;
    if (winePrefixId < 0) {
        winePrefixId = defaultWinePrefix;
    }
    const configuredWinePrefix = winePrefixId >= 0 ? winePrefixes.find(wp => wp.id == winePrefixId) : undefined;
    const wineExecEnv: Record<string, string> = configuredWinePrefix ? {WINEPREFIX: configuredWinePrefix.path} : {};
    let wineExecId = gameSettings.wineSettings.wineExec;
    if (wineExecId < 0) {
        wineExecId = defaultWineExec;
    }
    const configuredWineExec = wineExecId >= 0 ? wineExecs.find(wp => wp.id == wineExecId) : undefined;
    const wineCommand = configuredWineExec ? configuredWineExec.path : 'wine';
    return {wineCommand, envVariables: wineExecEnv};
}
async function RunGame(runGameParams: RunWindowsGameParams) {
    const {gameSettings, defaultWinePrefix, defaultWineExec, winePrefixes, wineExecs, thcrapPath, thcrapFound, isCustomExe} = runGameParams;
    const {wineCommand, envVariables} = getWineParams(runGameParams);
    const launchProfile = findLaunchProfile(gameSettings, thcrapFound, isCustomExe);
    if(!launchProfile) {
        return;
    }
    if (launchProfile == 'thcrap') {
        const workingDir = path.dirname(thcrapPath);
        const executableThcrapProfile = isCustomExe ? gameSettings.thcrapCustomExeProfile : gameSettings.thcrapGameProfile;
        const wineArgs = [`./bin/thcrap_loader.exe`, gameSettings.thcrapProfile, executableThcrapProfile];
        if (gameSettings.thcrapWithAppLocale) {
            envVariables.LANG = 'ja_JP.UTF-8';
        }
        await runWithCommandsBeforeAndAfter(wineCommand, workingDir, wineArgs, envVariables, runGameParams.commandsBefore, runGameParams.commandsAfter, runGameParams.autoClose);
    } else {
        const workingDir = path.dirname(gameSettings.executables[launchProfile].path);
        const wineArgs = [path.basename(gameSettings.executables[launchProfile].path)];
        if (gameSettings.executables[launchProfile].withAppLocale) {
            envVariables.LANG = 'ja_JP.UTF-8';
        }
        await runWithCommandsBeforeAndAfter(wineCommand, workingDir, wineArgs, envVariables, runGameParams.commandsBefore, runGameParams.commandsAfter, runGameParams.autoClose);
    }
}
function findLaunchProfile(gameSettings: GameSettings, thcrapFound: boolean, isCustomExe: boolean) : GameLaunchProfile | CustomExeLaunchProfile | null {
    const defaultExecutable = isCustomExe ? gameSettings.defaultCustomExeExecutable : gameSettings.defaultExecutable;
    if (defaultExecutable && isLaunchProfileConfigured(gameSettings, defaultExecutable, thcrapFound, isCustomExe)) {
        return defaultExecutable;
    } else {
        const suitableLaunchProfiles = isCustomExe ? customExeLaunchProfiles : gameLaunchProfiles;
        for (const launchProfile of suitableLaunchProfiles) {
            if (isLaunchProfileConfigured(gameSettings, launchProfile, thcrapFound, isCustomExe)) {
                return launchProfile;
            }
        }
    }
    return null;
}
function isLaunchProfileConfigured(gameSettings: GameSettings, launchProfile: GameLaunchProfile | CustomExeLaunchProfile, thcrapFound: boolean, isCustomExe: boolean): boolean {
    if (launchProfile == 'thcrap') {
        const neededExecutableThcrapProfile = isCustomExe ? gameSettings.thcrapCustomExeProfile : gameSettings.thcrapGameProfile;
        return !!(gameSettings.thcrapProfile && neededExecutableThcrapProfile && thcrapFound);
    } else {
        return !!gameSettings.executables[launchProfile].path;
    }
}
async function RunPC98Game(runGameParams: RunPC98GameParams) : Promise<string> {
    const {gameSettings, nekoProjectPath, nekoProjectPathValid} = runGameParams;
    if (nekoProjectPathValid) {
        if (!checkExists(gameSettings.hdiPath)) {
            return 'hdiPath';
        }
        const nekoDirectory = path.dirname(nekoProjectPath)
        let nekoConfigPath = path.resolve(nekoDirectory, "np21nt.ini");
        if (checkExists(nekoConfigPath)) {
            const {wineCommand, envVariables} = getWineParams(runGameParams);
            const driveResult = await createWineDrive(path.dirname(gameSettings.hdiPath), envVariables.WINEPREFIX);
            if (!driveResult.success) {
                return 'winePrefix';
            }
            const gameWindowsPath = `${driveResult.letter.toUpperCase()}:\\${path.basename(gameSettings.hdiPath)}`;
            LogMain('neko config path: '+nekoConfigPath);
            const writeHdiPathToNekoConfigResult = await writeHdiPathToNekoConfig(nekoConfigPath, gameWindowsPath, 'utf16le');
            if (writeHdiPathToNekoConfigResult) {
                return writeHdiPathToNekoConfigResult;
            }
            await runWithCommandsBeforeAndAfter(wineCommand, nekoDirectory, [path.basename(nekoProjectPath)], envVariables, runGameParams.commandsBefore, runGameParams.commandsAfter, runGameParams.autoClose);
            return '';
        } else {
            const homeFolder = await getHomeFolder();
            if (homeFolder) {
                nekoConfigPath = path.resolve(homeFolder, '.config', 'xnp21kai', 'xnp21kairc');
                LogMain('neko config path: '+nekoConfigPath);
                const writeHdiPathToNekoConfigResult = await writeHdiPathToNekoConfig(nekoConfigPath, gameSettings.hdiPath, 'utf-8');
                if (writeHdiPathToNekoConfigResult) {
                    return writeHdiPathToNekoConfigResult;
                }
                await runWithCommandsBeforeAndAfter(`./xnp21kai`, nekoDirectory, [], {}, runGameParams.commandsBefore, runGameParams.commandsAfter, runGameParams.autoClose);
                return '';
            }
        }
    }
    return 'nekoPath';
}
async function runWithCommandsBeforeAndAfter(command: string, cwd: string, args: string[], env: Record<string, string>, commandsBefore: string[], commandsAfter: string[], autoClose: boolean) {
    for (const cmd of commandsBefore.filter(c => !!c)) {
        await TryExecAsync(cmd);
    }
    commandsAfter = commandsAfter.filter(c => !!c);
    if (commandsAfter.length) {
        if (autoClose) { 
            mainWindow.minimize();
        }
        await TrySpawnAsync(command, cwd, args, env);
        for (const cmd of commandsAfter.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
        if (autoClose) {
            mainWindow.close();
        }
    } else {
        if (autoClose) {
            TrySpawnAsync(command, cwd, args, env);
            mainWindow.close();
        } else {
            await TrySpawnAsync(command, cwd, args, env);
        }
    }
}
async function writeHdiPathToNekoConfig(nekoConfigPath: string, gameHdiPath: string, encoding: BufferEncoding) : Promise<string> {
    const config  = await fs.readFile(nekoConfigPath, {encoding});
    const configLines = config.split('\n');
    let hddFileStringMatch: RegExpMatchArray | null = null;
    for (let i = 0; i < config.length; i++) {
        if (hddFileStringMatch = configLines[i].match(/HDD1FILE ?= ?/)) {
            if (configLines[i].replace(hddFileStringMatch[0], '') != gameHdiPath) {
                try {
                    configLines[i] = hddFileStringMatch[0] + gameHdiPath;
                    await fs.writeFile(nekoConfigPath, configLines.join('\n'), {encoding});
                }
                catch {
                    return 'writeConfig';
                }
            }
            return '';
        }
    }
    return 'configIncorrect';
}
async function createWineDrive(pathToPoint: string, prefixPath?: string): Promise<{ success: true; letter: string; } | { success: false; }> {
    prefixPath = prefixPath || await getDefaultWinePrefix();
    LogMain('pathToPoint is '+pathToPoint);
    pathToPoint = pathToPoint.replace(/\/$/, '');
    const dosdevicesPath = path.resolve(prefixPath, 'dosdevices');
    if (checkExists(dosdevicesPath)) {
        const { stdout: dosdevices_lsResult } = await TryExecAsync(`ls -l "${dosdevicesPath}"`);
        if (dosdevices_lsResult) {
            const driveStrings = dosdevices_lsResult.matchAll(/(?<driveLetter>[a-z]): -> '?(?<drivePath>.+)'?\s*$/gm);
            let letters = 'cdefghijklmnopqrstuvwxyz';
            const diskDevices = dosdevices_lsResult.matchAll(/(?<diskDeviceLetter>[a-z]):: -> /gm);
            for (const diskDeviceString of diskDevices) {
                if (diskDeviceString.groups) {
                    letters = letters.replace(diskDeviceString.groups.diskDeviceLetter, '');
                }
            }
            for (const driveString of driveStrings) {
                if (driveString.groups) {
                    const drivePath = driveString.groups.drivePath.replace(/^'|\/?'?\s*$/g, '');
                    LogMain('handling path: '+drivePath);
                    if (drivePath == pathToPoint) {
                        LogMain('found fitting drive in '+dosdevicesPath);
                        LogMain(`${drivePath}=${pathToPoint}`);
                        return {success: true, letter: driveString.groups.driveLetter};
                    } else {
                        letters = letters.replace(driveString.groups.driveLetter, '');
                    }
                }
            }
            LogMain('letters left: '+letters);
            if (letters.length) {
                LogMain('executing ln: '+`ln -sv "${pathToPoint}" "${letters[0]}:"`);
                const { stdout: lnResult, stderr } = await TryExecAsync(`ln -sv "${pathToPoint}" "${dosdevicesPath}/${letters[0]}:"`);
                if (lnResult && lnResult.includes(pathToPoint)) {
                    LogMain('created new drive: '+lnResult);
                    return {success: true, letter: letters[0]};
                } else {
                    LogMain('error creating new drive: '+stderr);
                }
            }
        }
    } else {
        LogMain('checkExists returned false for '+dosdevicesPath);
    }
    return {success: false};
}
function tryGetGroup(str: string, regexp: RegExp, group: string) {
    const match = str.match(regexp);
    return match && match.groups ? match.groups[group] : '';
}
async function getDefaultWinePrefix() : Promise<string> {
    const homeFolder = await getHomeFolder();
    if (homeFolder) {
        return path.resolve(homeFolder, '.wine');
    }
    return '';
}
function buildGamesSubMenu(menuTemplate: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[], games: GameName[], categoryName: keyof typeof categories) {
    const categoryGames = games.filter(gn => categories[categoryName].includes(gn));
    if (categoryGames.length) {
        menuTemplate.push({
            label: categoryTitles[categoryName][lang],
            type: 'submenu',
            submenu: categoryGames.map(mg => ({
                label: gameTitles[lang][mg], 
                type: 'normal',
                click: () => sendToRenderer('run-game', mg),
                icon: assureExists(path.resolve(__public, 'tray-imgs', `Icon_${thcrapGameNames[mg]}.png`))
            }))
        });
    }
}
function assureExists(filePath: string): string | undefined {
    return checkExists(filePath) ? filePath : undefined;
}
async function TryCreateNativeImageFromExe(exePath: string): Promise<Electron.NativeImage | undefined> {
    const dataUrl = await loadDataUrlImgFromExe(exePath);
    return dataUrl ? nativeImage.createFromDataURL(dataUrl) : undefined;
}
function filterNullMenuItems(items: (Electron.MenuItem | Electron.MenuItemConstructorOptions | null)[]) : (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] {
    return items.filter(i => i !== null) as (Electron.MenuItem | Electron.MenuItemConstructorOptions)[];
}
async function buildCustomGamesMenuItem(customGamesCategory: CustomGameCategory): Promise<Electron.MenuItem | Electron.MenuItemConstructorOptions | null> {
    const gameImages = await Promise.all(customGamesCategory.games.map(g => TryCreateNativeImageFromExe(g.path)));

    const children = filterNullMenuItems(await Promise.all(customGamesCategory.children.map(c => buildCustomGamesMenuItem(c))))
        .concat(customGamesCategory.games.map((g, i) => ({ 
            label: g.name, 
            type: 'normal',
            click: () => sendToRenderer('run-custom-game', g),
            icon: gameImages[i]
        })));

    return children.length ? {
        label: customGamesCategory.name,
        type: 'submenu',
        submenu: children
    } as (Electron.MenuItem | Electron.MenuItemConstructorOptions) : null;
}
async function createTray(games: GameName[], customGames: CustomGameCategory) {
    try {
        if (!appIcon || appIcon.isDestroyed()) {
            appIcon = new Tray(path.resolve(__public, 'favicon-48x48.png'));
            appIcon.on('double-click', restoreMainWindow);
        }
        const menuTemplate: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [];
        for (const categoryName of categoryNames) {
            buildGamesSubMenu(menuTemplate, games, categoryName);
        }
        const customGamesSubmenu = await buildCustomGamesMenuItem(customGames);
        if (customGamesSubmenu) {
            customGamesSubmenu.label = mainProcessTranslations['customGames'][lang];
            menuTemplate.push(customGamesSubmenu);
        }
        const persistentItems: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
            {
                label: mainProcessTranslations['random'][lang],
                type: 'normal',
                click: () => sendToRenderer('run-random-game')
            },
            {
                type: 'separator'
            },
            {
                label: mainProcessTranslations['open'][lang],
                type: 'normal',
                click: restoreMainWindow
            },
            {
                label: mainProcessTranslations['exit'][lang],
                type: 'normal',
                click: () => mainWindow.close()
            }
        ];
        menuTemplate.push(...persistentItems);
        const contextMenu = Menu.buildFromTemplate(menuTemplate);
        appIcon.setContextMenu(contextMenu);

    } catch (e) {
        LogMain(e);
    }
}
function hideTray() {
    if (appIcon && !appIcon.isDestroyed()) {
        appIcon.destroy();
    }

}
function restoreMainWindow() {
    mainWindow.restore();
    sendToRenderer('open');
}
async function configSettingsPath() {
    let settingsDir = await getHomeFolder();
    if (settingsDir) {
        settingsDir = path.resolve(settingsDir, '.touhou-lincher');
        if (!checkExists(settingsDir)) {
            await fs.mkdir(settingsDir);
        }
        settingsPath = path.resolve(settingsDir, 'settings.json');
    } else {
        settingsPath = 'settings.json'
    }
}
async function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 940,
        height: 600,
        webPreferences: {

            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: new Boolean(process.env.ELECTRON_NODE_INTEGRATION).valueOf(),
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            preload: path.join(__dirname, 'preload.js'),
            
        },
        icon: path.resolve(__public, 'favicon-48x48.png'),
    });
    mainWindow.on('minimize', (event: Electron.Event) => {
        LogMain('window minmized');
        sendToRenderer('minimized');
    });
    mainWindow.menuBarVisible = false;

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol('app');
        // Load the index.html when not in development
        mainWindow.loadURL('app://./index.html');
    }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            // await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', (e as { toString(): string }).toString())
        }
    }
    await configSettingsPath();
    addIpcListeners();
    createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

'use strict'

import { app, protocol, BrowserWindow, BrowserView } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { ipcMain, dialog, shell } from 'electron';
import { promises as fs, existsSync, createWriteStream } from 'fs';
import path from 'path';
import { CustomExeLaunchProfile, customExeLaunchProfiles, GameLaunchProfile, gameLaunchProfiles, GameName, gameNames, GameSettings, LoadRemoteThcrapPatchParams, NamedPath, RunCustomGameParams, RunExeParams, RunGameParams, RunPC98GameParams, RunWindowsGameParams, ThcrapConfig, ThcrapPatchResponse, ThcrapRepository } from './data-types';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { Channel, channels } from './background-functions';
import { ReadStream } from 'original-fs';

const isDevelopment = process.env.NODE_ENV !== 'production'
type ReturnTypeAsync<T> = T extends (...args: any) => Promise<infer R> ? R : any;
type a = ReturnTypeAsync<typeof dialog.showOpenDialog>;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])
let mainWindow: BrowserWindow;

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
        return await execAsync(command);
    }
    catch(e) {
        return { stdout: '', stderr: (e as {toString: () => string}).toString()};
    }
}
function addIpcListeners() {
    const ipcListeners: Record<Channel, (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any> = {
        'get-settings':  async () => {
            try {
                return await fs.readFile('settings.json', { encoding: 'utf-8' });
            }
            catch {
                console.log('No settings found, using {}');
                return '{}';
            }
        },
        'get-thcrap-config':  async (_, thcrapPath: string) => {
            return await readThcrapConfig(thcrapPath);
        },
        'set-settings':  async (event, settings: string) => {
            await fs.writeFile('settings.json', settings, {encoding: 'utf-8'});
        },
        'pick-exe':  async (event, settings: string) => {
            return await pickFromFS({ 
                properties: ['openFile'], 
                filters: [ 
                    { 
                        name: 'Windows Executable Files (*.exe, *.bat, *.lnk)',
                        extensions: ['exe', 'bat', 'lnk']
                    } 
                ] 
            });
        },
        'pick-hdi':  async (event, settings: string) => {
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
            try {
                const nekoProjectDir = path.dirname(pathToCheck);
                await fs.readdir(nekoProjectDir);
                await fs.readFile(path.resolve(nekoProjectDir, 'np21nt.ini'), { encoding: 'utf-8' });
                return true;
            }
            catch {
                return false;
            }
        },
        'configure-thcrap':  async(_, thcrapPath: string) => {
            const thcrapConfiguratorPath = path.resolve(path.dirname(thcrapPath), 'bin/thcrap_configure.exe');
            exec(`wine "${thcrapConfiguratorPath}"`);
        },
        'run-custom-game':  async (_, paramsStr: string) => {
            const params: RunCustomGameParams = JSON.parse(paramsStr);
            const {wineCommand, winePrefixCommand} = getWineParams(params);
            const workingDir = path.dirname(params.path);
            const wineArgs = path.basename(params.path);
            const localeArgs = params.withAppLocale ? 'LANG=ja_JP.UTF-8 ' : '';
            const command = `cd "${workingDir}" && ${winePrefixCommand}${localeArgs}${wineCommand} ${wineArgs}`;
            for (const cmd of params.commandsBefore.filter(c => !!c)) {
                await TryExecAsync(cmd);
            }
            console.log(command);
            // await TryExecAsync(command);
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
            const userName = await getSystemUsername();
            if (userName) {
                const { stdout: protonsOut } = await TryExecAsync(`ls /home/${userName}/.local/share/Steam/steamapps/common/ | grep Proton`);
                if (protonsOut) {
                    const protonPathes = protonsOut.split('\n').filter(s => !!s);
                    const protons : NamedPath[] = protonPathes.map((pp, index) => ({
                        id: currentMaxId + index + 1,
                        name: pp,
                        path: `/home/${userName}/.local/share/Steam/steamapps/common/${pp}/dist/bin/wine`
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
                        console.log(`Request to ${e.response.config.baseURL}${e.response.config.url} failed: ${e.code}`);
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
                    console.log(`Request to ${e.response.config.baseURL}${e.response.config.url} failed: ${e.code}`);
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
        'load-img-from-exe': async (_, path: string) => {
            const output = await TryExecAsync(`wrestool -x -t 14 "${path}" | base64`);
            // console.log('exe img path: ' + path);
            // console.log('exe img result: ', output);
            if (output.stdout) {
                return `data:image/x-icon;base64,${output.stdout}`;
            }
            return '';
        },
        'open-folder': async (_, pathToOpen: string) => {
            try {
                shell.openPath(path.dirname(pathToOpen));
            }
            catch {
                // console.log(`Failed to open folder "${path.dirname(pathToOpen)}"`);
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
                    const clickedButton = dialog.showMessageBoxSync(mainWindow, { message: `Download ${path.basename(url)} to ${filePath}?`, buttons: ['OK', 'Cancel', 'Save as...'], type: 'question' });
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
                for (const prefix of prefixes) {
                    const windowsPathParts = windowsPath.replace(driveLetterMatch[0], '').split(/[\\/]/);
                    // console.log('parts of windows path: ' + windowsPathParts.join(', '));
                    const unixPath = path.resolve(prefix, 'dosdevices', `${driveLetter}:`, ...windowsPathParts);
                    // console.log('unix path: ' + unixPath);
                    if (checkExists(unixPath)) {
                        const { stdout: dosdevices_lsResult } = await TryExecAsync(`ls -l "${path.resolve(prefix, 'dosdevices', driveLetter + ':')}"`);
                        const drivePathMatch = dosdevices_lsResult.match(/(?<driveLetter>[a-z]): -> '?(?<drivePath>.+)'?\s*$/m);
                        if (drivePathMatch && drivePathMatch.groups) {
                            return path.resolve(drivePathMatch.groups.drivePath, ...windowsPathParts);
                        }
                    } else {
                        // console.log('unix path does not exist');
                    }
                }
            } else {
                // console.log('drive letter regexp failed for ' + windowsPath);
            }
            return '';
        }
    };
    for (const channel of channels) {
        ipcMain.handle(channel, ipcListeners[channel]);
    }
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
                console.log('Sending path search request to render process');
                mainWindow.webContents.send('get-replays-path', url);
            }
        })
    }
}
async function loadLocalThcrapRepos(thcrapPath: string) : Promise<string[]> {
    const reposFolder = path.resolve(path.dirname(thcrapPath), 'repos');
    const repoStrings : string[] = [];
    //console.log(`checking ${reposFolder} exists:`)
    if (checkExists(reposFolder)) {
        //console.log(`${reposFolder} exists`)
        const reposFolderEntries = await fs.readdir(reposFolder, {withFileTypes: true});
        //console.log(`${reposFolder} entries: `, reposFolderEntries.map(v => v.name).join(', '));
        for (const reposFolderEntry of reposFolderEntries) {
            if (reposFolderEntry.isDirectory()) {
                const reposJsPath = path.resolve(reposFolder, reposFolderEntry.name, 'repo.js');
                //console.log(`checking ${reposJsPath} exists:`)
                if (checkExists(reposJsPath)) {
                    //console.log(`${reposJsPath} exists, adding to list`);
                    repoStrings.push(await fs.readFile(reposJsPath, {encoding: 'utf-8'}));
                }
            }
        }
    } else {
        //console.log(`${reposFolder} does not exist`);
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
async function getSystemUsername(): Promise<string> {
    const { stdout: userNameOut } = await TryExecAsync(`echo $USER`);
    if (userNameOut) {
        return userNameOut.replace('\n', '');
    }
    return '';
}
function getWineParams({gameSettings, defaultWinePrefix, defaultWineExec, winePrefixes, wineExecs}: RunExeParams) : {winePrefixCommand: string, wineCommand: string} {
    let winePrefixId = gameSettings.wineSettings.winePrefix;
    if (winePrefixId < 0) {
        winePrefixId = defaultWinePrefix;
    }
    const configuredWinePrefix = winePrefixId >= 0 ? winePrefixes.find(wp => wp.id == winePrefixId) : undefined;
    const winePrefixCommand = configuredWinePrefix ? `WINEPREFIX="${configuredWinePrefix.path}" ` : '';
    let wineExecId = gameSettings.wineSettings.wineExec;
    if (wineExecId < 0) {
        wineExecId = defaultWineExec;
    }
    const configuredWineExec = wineExecId >= 0 ? wineExecs.find(wp => wp.id == wineExecId) : undefined;
    const wineCommand = configuredWineExec ? `"${configuredWineExec.path}"` : 'wine';
    return {wineCommand, winePrefixCommand};
}
async function RunGame(runGameParams: RunWindowsGameParams) {
    const {gameSettings, defaultWinePrefix, defaultWineExec, winePrefixes, wineExecs, thcrapPath, thcrapFound, isCustomExe} = runGameParams;
    const {wineCommand, winePrefixCommand} = getWineParams(runGameParams);
    const launchProfile = findLaunchProfile(gameSettings, thcrapFound, isCustomExe);
    if(!launchProfile) {
        return;
    }
    if (launchProfile == 'thcrap') {
        const workingDir = path.dirname(thcrapPath);
        const executableThcrapProfile = isCustomExe ? gameSettings.thcrapCustomExeProfile : gameSettings.thcrapGameProfile;
        const wineArgs = `./bin/thcrap_loader.exe "${gameSettings.thcrapProfile}" ${executableThcrapProfile}`;
        const localeArgs = gameSettings.thcrapWithAppLocale ? 'LANG=ja_JP.UTF-8 ' : '';
        const command = `cd "${workingDir}" && ${winePrefixCommand}${localeArgs}${wineCommand} ${wineArgs}`;
        console.log(command);
        for (const cmd of runGameParams.commandsBefore.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
        // await TryExecAsync(command);
        for (const cmd of runGameParams.commandsAfter.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
    } else {
        const workingDir = path.dirname(gameSettings.executables[launchProfile].path);
        const wineArgs = path.basename(gameSettings.executables[launchProfile].path);
        const localeArgs = gameSettings.executables[launchProfile].withAppLocale ? 'LANG=ja_JP.UTF-8 ' : '';
        const command = `cd "${workingDir}" && ${winePrefixCommand}${localeArgs}${wineCommand} ${wineArgs}`;
        for (const cmd of runGameParams.commandsBefore.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
        console.log(command);
        // await TryExecAsync(command);
        for (const cmd of runGameParams.commandsAfter.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
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
    const {gameSettings, defaultWinePrefix, defaultWineExec, winePrefixes, wineExecs, nekoProjectPath, nekoProjectPathValid} = runGameParams;
    if (nekoProjectPathValid) {
        const {wineCommand, winePrefixCommand} = getWineParams(runGameParams);
        if (!checkExists(gameSettings.hdiPath)) {
            return 'hdiPath';
        }
        const driveResult = await createWineDrive(path.dirname(gameSettings.hdiPath), winePrefixCommand);
        if (!driveResult.success) {
            return 'winePrefix';
        }
        const gameWindowsPath = `${driveResult.letter.toUpperCase()}:\\${path.basename(gameSettings.hdiPath)}`;
        const nekoDirectory = path.dirname(nekoProjectPath)
        const nekoConfigPath = path.resolve(nekoDirectory, "np21nt.ini");
        console.log('neko config path: '+nekoConfigPath);
        const writeHdiPathToNekoConfigResult = await writeHdiPathToNekoConfig(nekoConfigPath, gameWindowsPath);
        if (writeHdiPathToNekoConfigResult) {
            return writeHdiPathToNekoConfigResult;
        }
        const command = `cd "${nekoDirectory}" && ${winePrefixCommand}${wineCommand} ${path.basename(nekoProjectPath)}`;
        console.log(command);
        for (const cmd of runGameParams.commandsBefore.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
        await TryExecAsync(command);
        for (const cmd of runGameParams.commandsAfter.filter(c => !!c)) {
            await TryExecAsync(cmd);
        }
        return '';
    }
    return 'nekoPath';
}
async function writeHdiPathToNekoConfig(nekoConfigPath: string, gameWindowsPath: string) : Promise<string> {
    const config  = await fs.readFile(nekoConfigPath, {encoding: 'utf16le'});
    const configLines = config.split('\n');
    for (let i = 0; i < config.length; i++) {
        if (configLines[i].includes("HDD1FILE=")) {
            if (configLines[i] != "HDD1FILE=" + gameWindowsPath) {
                try {
                    configLines[i] = "HDD1FILE=" + gameWindowsPath;
                    await fs.writeFile(nekoConfigPath, configLines.join('\n'), {encoding: 'utf16le'});
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
async function createWineDrive(pathToPoint: string, prefixCommand: string): Promise<{ success: true; letter: string; } | { success: false; }> {
    const prefixPath = tryGetGroup(prefixCommand, /WINEPREFIX="(?<pfx>.+?)"? $/, 'pfx') || await getDefaultWinePrefix();
    console.log('pathToPoint is '+pathToPoint);
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
                    console.log('handling path: '+drivePath);
                    if (drivePath == pathToPoint) {
                        console.log('found fitting drive in '+dosdevicesPath);
                        console.log(`${drivePath}=${pathToPoint}`);
                        return {success: true, letter: driveString.groups.driveLetter};
                    } else {
                        letters = letters.replace(driveString.groups.driveLetter, '');
                    }
                }
            }
            console.log('letters left: '+letters);
            if (letters.length) {
                console.log('executing ln: '+`ln -sv "${pathToPoint}" "${letters[0]}:"`);
                const { stdout: lnResult, stderr } = await TryExecAsync(`ln -sv "${pathToPoint}" "${dosdevicesPath}/${letters[0]}:"`);
                if (lnResult && lnResult.includes(pathToPoint)) {
                    console.log('created new drive: '+lnResult);
                    return {success: true, letter: letters[0]};
                } else {
                    console.log('error creating new drive: '+stderr);
                }
            }
        }
    } else {
        console.log('checkExists returned false for '+dosdevicesPath);
    }
    return {success: false};
}
function tryGetGroup(str: string, regexp: RegExp, group: string) {
    const match = str.match(regexp);
    return match && match.groups ? match.groups[group] : '';
}
async function getDefaultWinePrefix() : Promise<string> {
    const userName = await getSystemUsername();
    if (userName) {
        return `/home/${userName}/.wine`;
    }
    return '';
}
async function createWindow() {
    addIpcListeners();
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 940,
        height: 600,
        webPreferences: {

            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: new Boolean(process.env.ELECTRON_NODE_INTEGRATION).valueOf(),
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        mainWindow.loadURL('app://./index.html')
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
            await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', (e as { toString(): string }).toString())
        }
    }
    createWindow()
})

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

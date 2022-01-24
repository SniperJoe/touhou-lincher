import { ipcRenderer } from 'electron';
import { MainProcessFunctions } from './background-functions';
import { RendererProcessFunctions } from './renderer-functions';
export {};

declare global { 
    var sendIpcMessage: typeof ipcRenderer.send;
    function onIpcMessage<K extends keyof RendererProcessFunctions>(channel: K, listener: (event: Electron.IpcRendererEvent, ...args: Parameters<RendererProcessFunctions[K]>) => ReturnType<RendererProcessFunctions[K]>): void;
    function invokeInMain<K extends keyof MainProcessFunctions>(channel: K, ...args: Parameters<MainProcessFunctions[K]>): Promise<ReturnType<MainProcessFunctions[K]>>;
}
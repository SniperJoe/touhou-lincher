import { ipcRenderer } from 'electron';
import { Channel } from './background-functions';
import { RendererChannel } from './renderer-functions';
export {};

declare global { 
    var sendIpcMessage: typeof ipcRenderer.send;
    var onIpcMessage: (channel: RendererChannel, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    var invokeInMain: (channel: Channel, ...args: any[]) => Promise<any>;
}
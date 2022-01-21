import { ipcRenderer } from 'electron';
import { Channel } from './background-functions';
export {};

declare global { 
    var sendIpcMessage: typeof ipcRenderer.send;
    var onIpcMessage: typeof ipcRenderer.on;
    var invokeInMain: (channel: Channel, ...args: any[]) => Promise<any>;
}
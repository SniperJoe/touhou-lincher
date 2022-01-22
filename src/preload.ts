import { ipcRenderer } from "electron";
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('sendIpcMessage', ipcRenderer.send);
contextBridge.exposeInMainWorld('onIpcMessage', (ch: string, cb: (event: Electron.IpcRendererEvent, ...args: any) => any) => ipcRenderer.on(ch, cb));
contextBridge.exposeInMainWorld('invokeInMain', ipcRenderer.invoke);
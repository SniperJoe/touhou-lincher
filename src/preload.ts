import { ipcRenderer } from "electron";
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('sendIpcMessage', ipcRenderer.send);
contextBridge.exposeInMainWorld('onIpcMessage', ipcRenderer.on);
contextBridge.exposeInMainWorld('invokeInMain', ipcRenderer.invoke);
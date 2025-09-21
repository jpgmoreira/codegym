// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import {
  allowedInvokeChannels,
  allowedOnChannels,
  allowedSendChannels,
  type ElectronAPI,
} from '@renderer/api/api';

// https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
contextBridge.exposeInMainWorld(
  'api',
  Object.freeze({
    send: (channel, ...data) => {
      if (allowedSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...data);
      }
    },
    invoke: (channel, ...data) => {
      if (allowedInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...data);
      }
    },
    on: (channel, func) => {
      if (allowedOnChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => func(...args));
      }
    },
  } as ElectronAPI)
);

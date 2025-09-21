import { ElectronAPI } from './api/api';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

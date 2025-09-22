import { Channels } from '@common/types/channels';

export const allowedSendChannels = Object.freeze([
  Channels.updateCurrOj,
  Channels.updateCurrPage,
  Channels.setCurrSnapshotSolvedDate,
  Channels.updateOjFilters,
  Channels.setCurrOjSnapshot,
] as const);
export const allowedInvokeChannels = Object.freeze([
  Channels.createProfile,
  Channels.updateOjCache,
  Channels.getOjProblem,
  Channels.login,
  Channels.fetchHistoryPage,
  Channels.renameCurrProfile,
] as const);
export const allowedOnChannels = Object.freeze([Channels.loadStartupData] as const);

export interface ElectronAPI {
  send: (channel: (typeof allowedSendChannels)[number], ...data: any[]) => void;
  invoke: <T = void>(channel: (typeof allowedInvokeChannels)[number], ...data: any[]) => Promise<T>;
  on: (channel: (typeof allowedOnChannels)[number], func: (...args: any[]) => void) => void;
}

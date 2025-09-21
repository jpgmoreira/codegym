import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { Channels } from '@common/types/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { ProfileManager } from '@main/data/managers/profileManager';
import { CacheManager } from '@main/data/managers/cacheManager';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjPoolManager } from '@main/data/managers/ojPoolManager';
import { StartupData } from '@common/schemas/startup';
import { loadStartupData } from '@main/data/startup';
import { OjProblem } from '@common/schemas/problems';
import { HistoryManager } from '@main/data/managers/historyManager';

ipcMain.handle(
  Channels.createProfile,
  (_, name: string): Promise<CreateProfileResponseDTO> =>
    ProfileManager.instance.createProfile(name)
);

ipcMain.handle(Channels.login, (_, profileId: string): Promise<StartupData> => {
  ProfileManager.instance.loadProfile(profileId);
  return loadStartupData();
});

ipcMain.handle(
  Channels.updateOjCache,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<OjMeta[T]> =>
    CacheManager.instance.updateOjCache(oj)
);

ipcMain.handle(
  Channels.getOjProblem,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<GetOjProblemResponseDTO<T>> =>
    OjPoolManager.instance.getOjProblem(oj)
);

ipcMain.handle(
  Channels.fetchHistoryPage,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T, page: number): Promise<OjProblem[T][]> =>
    HistoryManager.instance.fetchHistoryPage(oj, page)
);

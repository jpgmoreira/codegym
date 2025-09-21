import { Channels } from '@common/types/channels';
import { StartupData } from '@common/schemas/startup';
import { router } from '@renderer/router/router';
import { useProfileStore } from '@renderer/store/profile';
import { useOjMetaStore } from '@renderer/store/ojMeta';
import { useHistoryStore } from '@renderer/store/history';
import { useGraphStore } from '@renderer/store/graph';

window.api.on(Channels.loadStartupData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useOjMetaStore().initFromStartupData(data);
  useHistoryStore().initFromStartupData(data);
  useGraphStore().initFromStartupData(data);
  document.documentElement.classList.add('theme-dark');
  if (!data.currProfile) {
    document.title = 'codegym';
    if (data.profileRegistry.profileRecords.length === 0) {
      return router.replace('/signup');
    }
    return router.replace('/login');
  }
  document.title = `${data.currProfile.name}@codegym`;
  return router.replace(data.currProfile.page);
});

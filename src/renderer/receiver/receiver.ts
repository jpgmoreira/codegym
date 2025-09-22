import { Channels } from '@common/types/channels';
import { StartupData } from '@common/schemas/startup';
import { router } from '@renderer/router/router';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@renderer/events/events';

window.api.on(Channels.loadStartupData, (data: StartupData) => {
  EventEmitter.instance.emit(Events.loadInitialData, data);
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

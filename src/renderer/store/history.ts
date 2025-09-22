import { HISTORY_PAGE_SIZE } from '@common/constants';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { OjProblem } from '@common/schemas/problems';
import { getEmptyFirstHistoryPages, StartupData } from '@common/schemas/startup';
import { Oj } from '@common/types/oj';
import { Events } from '@renderer/events/events';
import { defineStore } from 'pinia';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useHistoryStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useHistoryStore().clear();
});

/**
 * Store for managing the first history page for each OJ.
 * This is used for faster loading time in the history page.
 */
export const useHistoryStore = defineStore('history', {
  state: () => ({
    firstHistoryPages: getEmptyFirstHistoryPages(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.firstHistoryPages = data.firstHistoryPages;
    },
    insertRecord<T extends Oj>(oj: T, snapshot: OjProblem[T]) {
      const page = this.firstHistoryPages[oj] as OjProblem[T][];
      page.unshift(snapshot);
      if (page.length > HISTORY_PAGE_SIZE) {
        page.pop();
      }
    },
    clear() {
      this.firstHistoryPages = getEmptyFirstHistoryPages();
    },
  },
});

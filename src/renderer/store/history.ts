import { HISTORY_PAGE_SIZE } from '@common/constants';
import { OjProblem } from '@common/schemas/problems';
import { getEmptyFirstHistoryPages, StartupData } from '@common/schemas/startup';
import { Oj } from '@common/types/oj';
import { defineStore } from 'pinia';

/**
 * Store for managing the first history page for each OJ.
 * This is used for faster loading time in the history page.
 */
export const useHistoryStore = defineStore('history', {
  state: getEmptyFirstHistoryPages,
  actions: {
    initFromStartupData(data: StartupData) {
      Object.assign(this, data.firstHistoryPages);
    },
    insertRecord<T extends Oj>(oj: T, snapshot: OjProblem[T]) {
      const page = this[oj] as OjProblem[T][];
      page.unshift(snapshot);
      if (page.length > HISTORY_PAGE_SIZE) {
        page.pop();
      }
    },
  },
});

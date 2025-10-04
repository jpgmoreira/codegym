import { EventEmitter } from '@common/helpers/eventEmitter';
import { Contest, getEmptyContestsTree } from '@common/schemas/contests';
import { StartupData } from '@common/schemas/startup';
import { Events } from '@renderer/events/events';
import { defineStore } from 'pinia';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useContestsStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useContestsStore().clear();
});

export const useContestsStore = defineStore('contests', {
  state: () => ({
    currContest: null as Contest | null,
    contestsTree: getEmptyContestsTree(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.currContest = data.currContest;
      this.contestsTree = data.contestsTree;
    },
    clear() {
      this.currContest = null;
      this.contestsTree = getEmptyContestsTree();
    },
  },
});

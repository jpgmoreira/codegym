import { EventEmitter } from '@common/helpers/eventEmitter';
import { GraphRecord } from '@common/schemas/graph';
import { StartupData } from '@common/schemas/startup';
import { Events } from '@renderer/events/events';
import { defineStore } from 'pinia';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useGraphStore().initFromStartupData(data);
});

export const useGraphStore = defineStore('graph', {
  state: () => ({
    graphData: [] as GraphRecord[],
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.graphData = data.graphData;
    },
    findGraphRecord(date: number): GraphRecord | null {
      let left = 0;
      let right = this.graphData.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midDate = this.graphData[mid].date;
        if (midDate === date) return this.graphData[mid];
        else if (midDate < date) left = mid + 1;
        else right = mid - 1;
      }
      return null;
    },
  },
});

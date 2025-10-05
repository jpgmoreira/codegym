import { EventEmitter } from '@common/helpers/eventEmitter';
import { Contest, ContestsTreeNode, getEmptyContestsTree } from '@common/schemas/contests';
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
    idToNode: new Map<string, ContestsTreeNode>(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.currContest = data.currContest;
      this.contestsTree = data.contestsTree;
      for (const node of data.contestsTree.data) {
        this.idToNode.set(node.id, node);
      }
    },
    clear() {
      this.currContest = null;
      this.contestsTree = getEmptyContestsTree();
      this.idToNode.clear();
    },
    createNode(node: ContestsTreeNode) {
      this.contestsTree.data.push(node);
      if (node.type === 'dir') this.contestsTree.counters.nextDir++;
      else this.contestsTree.counters.nextContest++;
    },
    setSelection(nodeIds: string[]) {
      const set = new Set(nodeIds);
      for (const node of this.contestsTree.data) {
        node.state.selected = set.has(node.id);
      }
    },
  },
});

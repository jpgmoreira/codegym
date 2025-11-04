import { GraphRecord } from '@common/schemas/graph';
import { GraphManager } from './managers/graphManager';
import { OjMetaManager } from './managers/ojMetaManager';
import { ProfileManager } from './managers/profileManager';
import { HistoryManager } from './managers/historyManager';
import { StartupData } from '@common/schemas/startup';
import { CacheManager } from './managers/cacheManager';
import { TreeManager } from './managers/treeManager';
import { ContestsManager } from './managers/contestsManager';

export async function loadStartupData(): Promise<StartupData> {
  CacheManager.instance; // Forces cache load at startup to avoid slow loading of the first problem.
  const ojMeta = OjMetaManager.instance.getAllMeta();
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let graphData: GraphRecord[] = [];
  if (currProfile) {
    ContestsManager.instance.loadProfile(currProfile.id);
    await GraphManager.instance.loadGraph(currProfile.id);
    graphData = await GraphManager.instance.getGraphData();
    HistoryManager.instance.loadHistory(currProfile.id);
    TreeManager.instance.loadTree(currProfile.id);
  }
  const result = {
    ojMeta,
    currProfile,
    profileRegistry,
    graphData,
  };
  return result;
}

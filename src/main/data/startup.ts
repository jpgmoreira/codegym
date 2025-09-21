import { GraphRecord } from '@common/schemas/graph';
import { GraphManager } from './managers/graphManager';
import { OjMetaManager } from './managers/ojMetaManager';
import { ProfileManager } from './managers/profileManager';
import { HistoryManager } from './managers/historyManager';
import { OjList } from '@common/types/oj';
import { getEmptyFirstHistoryPages, StartupData } from '@common/schemas/startup';
import { OjProblem } from '@common/schemas/problems';

export async function loadStartupData(): Promise<StartupData> {
  const ojMeta = OjMetaManager.instance.getAllMeta();
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let firstHistoryPages = getEmptyFirstHistoryPages();
  let graphData: GraphRecord[] = [];
  if (currProfile) {
    GraphManager.instance.loadGraph(currProfile.id);
    graphData = await GraphManager.instance.getGraphData();
    HistoryManager.instance.loadHistory(currProfile.id);
    for (const oj of OjList) {
      const page = await HistoryManager.instance.fetchHistoryPage(oj, 1);
      (firstHistoryPages[oj] as OjProblem[typeof oj][]) = page;
    }
  }
  const result = {
    ojMeta,
    currProfile,
    profileRegistry,
    firstHistoryPages,
    graphData,
  };
  return result;
}

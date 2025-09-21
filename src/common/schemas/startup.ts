import { Oj, OjList } from '@common/types/oj';
import { OjMeta } from './ojMeta';
import { Profile, ProfileRegistry } from './profile';
import { OjProblem } from './problems';
import { GraphRecord } from './graph';

export type FirstHistoryPages = { [K in Oj]: OjProblem[K][] };

export type StartupData = {
  ojMeta: OjMeta;
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  firstHistoryPages: FirstHistoryPages;
  graphData: GraphRecord[];
};

export function getEmptyFirstHistoryPages(): FirstHistoryPages {
  const result: Partial<FirstHistoryPages> = {};
  for (const oj of OjList) result[oj] = [];
  return result as FirstHistoryPages;
}

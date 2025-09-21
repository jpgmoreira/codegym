import { Oj } from '@common/types/oj';
import { OjProblem } from '@common/schemas/problems';
import { filterCfProblems } from './ojs/cf';
import { filterKattisProblems } from './ojs/kattis';
import { filterNepsProblems } from './ojs/neps';
import { filterUvaProblems } from './ojs/uva';
import { filterTimusProblems } from './ojs/timus';
import { filterLeetcodeProblems } from './ojs/leetcode';
import Datastore from '@seald-io/nedb';

const filterCacheFnMapping: {
  [K in Oj]: (db: Datastore<OjProblem[Oj]>) => Promise<OjProblem[K][]>;
} = {
  cf: filterCfProblems,
  kattis: filterKattisProblems,
  neps: filterNepsProblems,
  uva: filterUvaProblems,
  timus: filterTimusProblems,
  leetcode: filterLeetcodeProblems,
};

export async function filterOjProblems<T extends Oj>(
  oj: T,
  db: Datastore<OjProblem[Oj]>
): Promise<OjProblem[T][]> {
  return filterCacheFnMapping[oj](db);
}

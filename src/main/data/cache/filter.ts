import { Oj } from '@common/types/oj';
import { OjProblem } from '@common/schemas/problems';
import { filterCfProblems } from '../sql/cache/filter/cf';
import { filterKattisProblems } from '../sql/cache/filter/kattis';
import { filterNepsProblems } from './ojs/neps';
import { filterUvaProblems } from './ojs/uva';
import { filterTimusProblems } from './ojs/timus';
import { filterLeetcodeProblems } from '../sql/cache/filter/leetcode';
import { Database } from 'sqlite';

const filterCacheFnMapping: {
  [K in Oj]: (db: Database) => Promise<OjProblem[K][]>;
} = {
  cf: filterCfProblems,
  kattis: filterKattisProblems,
  neps: filterNepsProblems,
  uva: filterUvaProblems,
  timus: filterTimusProblems,
  leetcode: filterLeetcodeProblems,
};

export async function filterOjProblems<T extends Oj>(oj: T, db: Database): Promise<OjProblem[T][]> {
  return filterCacheFnMapping[oj](db);
}

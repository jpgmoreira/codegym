import { OjMeta } from '@common/schemas/ojMeta';
import { Oj } from '@common/types/oj';
import { updateCfCache } from './ojs/cf';
import { updateKattisCache } from './ojs/kattis';
import { updateNepsCache } from './ojs/neps';
import { updateUvaCache } from './ojs/uva';
import { updateTimusCache } from './ojs/timus';
import { updateLeetcodeCache } from './ojs/leetcode';
import Datastore from '@seald-io/nedb';
import { OjProblem } from '@common/schemas/problems';

const updateCacheFnMapping: { [K in Oj]: (db: Datastore<OjProblem[Oj]>) => Promise<OjMeta[K]> } = {
  cf: updateCfCache,
  kattis: updateKattisCache,
  neps: updateNepsCache,
  uva: updateUvaCache,
  timus: updateTimusCache,
  leetcode: updateLeetcodeCache,
};

export function updateOjCache<T extends Oj>(
  oj: T,
  db: Datastore<OjProblem[Oj]>
): Promise<OjMeta[T]> {
  return updateCacheFnMapping[oj](db);
}

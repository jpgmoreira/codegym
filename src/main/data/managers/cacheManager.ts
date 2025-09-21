import { DATA_DIR } from '../constants';
import Datastore from '@seald-io/nedb';
import path from 'path';
import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { updateOjCache } from '../cache/update';
import { filterOjProblems } from '../cache/filter';

/**
 * Singleton for managing cache.
 * Access via CacheManager.instance
 */
export class CacheManager {
  static #instance: CacheManager;

  private db: Datastore<OjProblem[Oj]> | null = null;

  private constructor() {
    this.db = new Datastore<OjProblem[Oj]>({
      filename: path.join(DATA_DIR, 'cache.nedb'),
      autoload: true,
    });
    this.db.ensureIndex({ fieldName: 'oj' });
  }

  public static get instance(): CacheManager {
    if (!this.#instance) {
      this.#instance = new CacheManager();
    }
    return this.#instance;
  }

  public updateOjCache<T extends Oj>(oj: T): Promise<OjMeta[T]> {
    return updateOjCache(oj, this.db!);
  }

  public filterOjProblems<T extends Oj>(oj: T): Promise<OjProblem[T][]> {
    return filterOjProblems(oj, this.db!);
  }
}

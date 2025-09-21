import { OjProblem } from '@common/schemas/problems';
import { DATA_DIR } from '../constants';
import { HISTORY_MAX_SIZE, HISTORY_PAGE_SIZE } from '@common/constants';
import { Oj } from '@common/types/oj';
import Datastore from '@seald-io/nedb';
import path from 'path';

/**
 * Singleton for managing history data.
 * Access via HistoryManager.instance
 */
export class HistoryManager {
  static #instance: HistoryManager;

  private db: Datastore<OjProblem[Oj]> | null = null;

  private constructor() {}

  public static get instance(): HistoryManager {
    if (!this.#instance) {
      this.#instance = new HistoryManager();
    }
    return this.#instance;
  }

  public loadHistory(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'history.nedb');
    this.db = new Datastore({ filename, autoload: true });
    this.db.ensureIndex({ fieldName: 'timestamp' });
    this.db.ensureIndex({ fieldName: ['oj', 'timestamp'] });
  }

  public async fetchHistoryPage<T extends Oj>(oj: T, page: number): Promise<OjProblem[T][]> {
    if (!this.db) return [];
    const skip = (page - 1) * HISTORY_PAGE_SIZE;
    const results = await this.db
      .findAsync<OjProblem[T]>({ oj }, { _id: 0 })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(HISTORY_PAGE_SIZE);
    return results;
  }

  public async insertIntoHistory(problem: OjProblem[Oj]) {
    if (!this.db) return;
    // Insert the problem:
    await this.db.insertAsync(problem);
    // Guarantee maximum history size:
    const count = await this.db.countAsync({});
    const toDelete = count - HISTORY_MAX_SIZE;
    if (toDelete > 0) {
      const docs = await this.db.findAsync({}, { _id: 1 }).sort({ timestamp: 1 }).limit(toDelete);
      // @ts-ignore
      const _ids = docs.map((doc) => doc._id);
      await this.db.removeAsync({ _id: { $in: _ids } }, { multi: true });
    }
  }

  public async replaceHistorySnapshot(snapshot: OjProblem[Oj]) {
    if (!this.db) return;
    await this.db.updateAsync({ id: snapshot.id }, snapshot);
  }
}

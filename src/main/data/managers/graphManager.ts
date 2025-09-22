import { getEmptyGraphRecord, GraphRecord } from '@common/schemas/graph';
import { DATA_DIR } from '../constants';
import Datastore from '@seald-io/nedb';
import path from 'path';
import { OjWithContests } from '@common/types/oj';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/events/events';

EventEmitter.instance.on(Events.clearProfileData, () => {
  GraphManager.instance.clear();
});

/**
 * Singleton for managing graph data.
 * Access via GraphManager.instance
 */
export class GraphManager {
  static #instance: GraphManager;

  private db: Datastore<GraphRecord> | null = null;

  private constructor() {}

  public static get instance(): GraphManager {
    if (!this.#instance) {
      this.#instance = new GraphManager();
    }
    return this.#instance;
  }

  public loadGraph(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'graph.nedb');
    this.db = new Datastore({ filename, autoload: true });
    this.db.ensureIndex({ fieldName: 'date', unique: true });
  }

  public async getGraphData(): Promise<GraphRecord[]> {
    if (!this.db) return [];
    return await this.db.findAsync({}).sort({ date: 1 });
  }

  public async updateGraph(source: OjWithContests, date: number, value: -1 | 1) {
    if (!this.db) return;
    let record: GraphRecord | null = await this.db.findOneAsync({ date });
    if (!record) {
      record = getEmptyGraphRecord(date);
    }
    record[source] += value;
    await this.db.updateAsync({ date }, record, { upsert: true });
  }

  public clear() {
    this.db = null;
  }
}

import { DATA_DIR } from '../constants';
import { Contest, getEmptyContest } from '@common/schemas/contests';
import { ensureDirExists } from '../utils';
import { FileProxy } from '../fileProxy';
import { buildId } from '@common/utils/utils';
import path from 'path';

/**
 * Singleton for managing contests.
 * Access via ContestsManager.instance
 */
export class ContestsManager {
  static #instance: ContestsManager;
  private proxy: FileProxy<Contest> | null = null;

  private profileId: string | null = null;

  private constructor() {}

  public static get instance(): ContestsManager {
    if (!this.#instance) {
      this.#instance = new ContestsManager();
    }
    return this.#instance;
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const contestsDir = path.join(DATA_DIR, 'profileData', profileId, 'contests');
    ensureDirExists(contestsDir);
  }

  public getContest(contestId: string): Contest | null {
    if (!this.profileId) return null;
    const contestPath = path.join(DATA_DIR, 'profileData', this.profileId, 'contests', contestId);
    this.proxy = new FileProxy(contestPath, getEmptyContest(contestId, '', 0));
    return this.proxy.target;
  }

  public createContest(name: string): string {
    name = name.trim();
    const now = Date.now();
    const id = buildId(name, now);
    const contest = getEmptyContest(id, name, now);
    const contestPath = path.join(DATA_DIR, 'profileData', this.profileId!, 'contests', id);
    new FileProxy(contestPath, contest);
    return id;
  }
}

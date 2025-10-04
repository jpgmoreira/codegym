import { FileProxy } from '../fileProxy';
import { DATA_DIR } from '../constants';
import path from 'path';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/events/events';
import {
  Contest,
  ContestsTree,
  getEmptyContest,
  getEmptyContestsTree,
} from '@common/schemas/contests';
import { Profile } from '@common/schemas/profile';

EventEmitter.instance.on(Events.clearProfileData, () => {
  ContestsManager.instance.clear();
});

/**
 * Singleton for managing contests data.
 * Access via GraphManager.instance
 */
export class ContestsManager {
  static #instance: ContestsManager;

  private contestProxy: FileProxy<Contest> | null = null;
  private treeProxy: FileProxy<ContestsTree> | null = null;

  private constructor() {}

  public static get instance(): ContestsManager {
    if (!this.#instance) {
      this.#instance = new ContestsManager();
    }
    return this.#instance;
  }

  public loadProfile(profile: Profile) {
    const treePath = path.join(DATA_DIR, 'profileData', profile.id, 'tree.json');
    this.treeProxy = new FileProxy(treePath, getEmptyContestsTree());
    if (profile.currContestId) {
      const contestPath = path.join(
        DATA_DIR,
        'profileData',
        profile.id,
        'contests',
        profile.currContestId
      );
      this.contestProxy = new FileProxy(contestPath, getEmptyContest(profile.currContestId));
    }
  }

  public getTree(): ContestsTree {
    return this.treeProxy!.target;
  }

  public getContest(): Contest {
    return this.contestProxy!.target;
  }

  public clear() {
    this.contestProxy = null;
    this.treeProxy = null;
  }
}

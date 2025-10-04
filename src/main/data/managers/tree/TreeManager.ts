/**
 * Manager for the treeview component.
 */
export class TreeManager {
  static #instance: TreeManager;

  private constructor() {}

  public static get instance(): TreeManager {
    if (!this.#instance) {
      this.#instance = new TreeManager();
    }
    return this.#instance;
  }
}

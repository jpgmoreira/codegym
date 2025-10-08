/**
 * Allowed communication channels between main and renderer processes to perform treeview operations.
 */
export enum TreeChannels {
  createNode = 'create-node',
  getState = 'get-state',
  toggleDirOpen = 'toggle-dir-open',
  renameNode = 'rename-node',
}

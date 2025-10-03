/**
 * Communication channels between main and renderer processes, to perform treeview operations.
 */
export enum TreeChannels {
  createNode = 'create-node',
  renameNode = 'rename-node',
  toggleDirOpen = 'toggle-dir-open',
  toggleFullSelection = 'toggle-full-selection',
  handleSelection = 'handle-selection',
  deleteNode = 'delete-node',
  deleteAllSelectedNodes = 'delete-all-selected-nodes',
}

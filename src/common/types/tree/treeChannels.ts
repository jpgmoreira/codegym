/**
 * Communication channels between main and renderer processes for performing treeview operations.
 */
export enum TreeChannels {
  createNode = 'create-node',
  renameNode = 'rename-node',
  toggleDirOpen = 'toggle-dir-open',
  selectAll = 'select-all',
  deselectAll = 'deselect-all',
  handleSelection = 'handle-selection',
  deleteNode = 'delete-node',
  deleteAllSelectedNodes = 'delete-all-selected-nodes',
}

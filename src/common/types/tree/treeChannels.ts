/**
 * Communication channels between main and renderer processes, to perform treeview operations.
 */
export enum TreeChannels {
  toggleFullSelection = 'toggle-full-selection',
  createNode = 'create-node',
  handleSelection = 'handle-selection',
  renameNode = 'rename-node',
  deleteNode = 'delete-node',
  deleteAllSelectedNodes = 'delete-all-selected-nodes',
}

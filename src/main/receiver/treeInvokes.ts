import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeManager } from '@main/data/managers/treeManager';
import { TreeChannels } from '@common/types/tree/treeChannels';
import { NodeType } from '@common/types/tree/treeTypes';

/**
 * Communication for handling operations in the TreeView component.
 */

ipcMain.handle(
  TreeChannels.renameNode,
  async (_: IpcMainInvokeEvent, nodeId: string, newName: string) => {
    TreeManager.instance.renameNode(nodeId, newName);
    return TreeManager.instance.buildResponse();
  }
);

ipcMain.handle(TreeChannels.toggleDirOpen, async (_: IpcMainInvokeEvent, nodeId: string) => {
  TreeManager.instance.toggleDirOpen(nodeId);
  return TreeManager.instance.buildResponse();
});

ipcMain.handle(
  TreeChannels.createNode,
  async (_: IpcMainInvokeEvent, type: NodeType, parentId: string | null) => {
    TreeManager.instance.createNode(type, parentId);
    return TreeManager.instance.buildResponse();
  }
);

ipcMain.handle(TreeChannels.toggleFullSelection, async () => {
  TreeManager.instance.toggleFullSelection();
  return TreeManager.instance.buildResponse();
});

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeChannels } from '@common/types/treeChannels';
import { TreeManager } from '@main/data/managers/treeManager';
import { NodeType } from '@common/types/tree';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';

ipcMain.handle(
  TreeChannels.createNode,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    parentId: string | null
  ): TreeOperationResponseDTO => {
    TreeManager.instance.createNode(type, prefix, parentId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.getState,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.toggleDirOpen,
  (_: IpcMainInvokeEvent, anchor: number, nodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.toggleDirOpen(nodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

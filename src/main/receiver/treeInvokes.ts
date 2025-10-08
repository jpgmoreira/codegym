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

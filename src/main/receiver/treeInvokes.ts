import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeChannels } from '@common/types/treeChannels';
import { TreeManager } from '@main/data/managers/treeManager';
import { ModifierKeys, NodeType } from '@common/types/tree';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';

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
  TreeChannels.createNodeAbove,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeOperationResponseDTO => {
    TreeManager.instance.createNodeAbove(type, prefix, baseNodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.createNodeBelow,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeOperationResponseDTO => {
    TreeManager.instance.createNodeBelow(type, prefix, baseNodeId);
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

ipcMain.handle(
  TreeChannels.renameNode,
  (_: IpcMainInvokeEvent, nodeId: string, newName: string): GenericResponseDTO => {
    return TreeManager.instance.renameNode(nodeId, newName);
  }
);

ipcMain.handle(
  TreeChannels.handleSelection,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    nodeId: string,
    keys: ModifierKeys
  ): TreeOperationResponseDTO => {
    TreeManager.instance.handleSelection(nodeId, keys);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.deleteNode,
  (_: IpcMainInvokeEvent, anchor: number, nodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.deleteNode(nodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.deleteSelectedNodes,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    TreeManager.instance.deleteSelectedNodes();
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.search,
  (_: IpcMainInvokeEvent, anchor: number, searchText: string): TreeOperationResponseDTO => {
    TreeManager.instance.search(searchText);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.collapseAll,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    TreeManager.instance.collapseAll();
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.clearSelection,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    TreeManager.instance.clearSelection();
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesAbove,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.moveSelectedFilesAbove(baseNodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesBelow,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.moveSelectedFilesBelow(baseNodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersAbove,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.moveSelectedFoldersAbove(baseNodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersBelow,
  (_: IpcMainInvokeEvent, anchor: number, nodeId: string): TreeOperationResponseDTO => {
    TreeManager.instance.moveSelectedFoldersBelow(nodeId);
    return TreeManager.instance.buildResult(anchor);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedNodesInto,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    destinationId: string | null
  ): TreeOperationResponseDTO => {
    TreeManager.instance.moveSelectedNodesInto(destinationId);
    return TreeManager.instance.buildResult(anchor);
  }
);

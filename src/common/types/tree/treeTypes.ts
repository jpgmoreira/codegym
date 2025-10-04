/**
 * Common types for the treeview component.
 * The treeview has logic implemented in both the main and renderer processes.
 */

type BaseNode = {
  id: number;
  txt: string;
  sel: boolean;
  par: number;
};

export type FileNode = BaseNode & {
  type: 'file';
};

export type DirNode = BaseNode & {
  type: 'dir';
  // Will not exist only in the disk:
  nDesc?: number;
  nSelDesc?: number;
};

export type Node = FileNode | DirNode;

export type NodeType = Node['type'];

export type TreeState = {
  visibleNodes: Node[];
  nSelectedNodes: number;
  nTotalNodes: number;
};

export type ModifierKeys = {
  ctrl: boolean;
  shift: boolean;
};

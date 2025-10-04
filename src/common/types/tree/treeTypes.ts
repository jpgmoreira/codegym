/**
 * Common types for the treeview component.
 * The treeview has logic spread in both the main and renderer processes.
 */

type BaseNode = {
  id: string;
  text: string;
  depth: number;
  selected: boolean;
  deleted: boolean;
  parentId: string | null;
  // Siblings of the same type in the chain:
  nextSiblingId: string | null;
  prevSiblingId: string | null;
  // Next and previous in the flattened tree:
  nextFlattenId: string | null;
  prevFlattenId: string | null;
};

export type DirNode = BaseNode & {
  type: 'dir';
  nDesc: number;
  nDescSel: number;
  subDirs: ListPointers;
  subFiles: ListPointers;
  open: boolean;
};

export type FileNode = BaseNode & {
  type: 'file';
};

export type Node = DirNode | FileNode;

export type NodeType = Node['type'];

export type ListPointers = {
  headId: string | null;
  tailId: string | null;
};

export type Controller = {
  subDirs: ListPointers;
  subFiles: ListPointers;
};

export type TreeState = {
  visibleNodes: Node[];
  nSelectedNodes: number;
  nTotalNodes: number;
};

export type ModifierKeys = {
  ctrl: boolean;
  shift: boolean;
};

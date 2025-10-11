export type NodeType = 'dir' | 'file';

export type HeadAndTail = {
  headId: string | null;
  tailId: string | null;
};

export type NodeController = {
  dirs: HeadAndTail;
  files: HeadAndTail;
};

export type BaseNode = {
  id: string;
  text: string;
  depth: number;
  selected: boolean;
  hidden: boolean;
  parentId: string | null;
  nextId: string | null;
  prevId: string | null;
};

export type DirNode = BaseNode &
  NodeController & {
    type: 'dir';
    open: boolean;
    nDesc: number; // Total number of descendants, not including the node.
    nSelDesc: number; // Total number of selected descendants.
  };

export type FileNode = BaseNode & {
  type: 'file';
};

export type Node = DirNode | FileNode;

export type ModifierKeys = {
  ctrl: boolean;
};

export type NodeType = 'dir' | 'file';

// First and last node IDs in a doubly linked list of siblings.
export type HeadAndTail = {
  headId: string | null;
  tailId: string | null;
};

// Stores the linked lists of dir and file direct children.
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
  nextId: string | null; // Next sibling ID, in the same doubly linked list.
  prevId: string | null; // Previous sibling ID, in the same doubly linked list.
  // Application specific:
  nProblems: number;
  nSolved: number;
  nTodo: number;
  nFavorite: number;
};

// Dir nodes store their children as a linked list (NodeController).
export type DirNode = BaseNode &
  NodeController & {
    type: 'dir';
    open: boolean;
    nDesc: number; // Total number of descendants, dir or file, not including the node.
    nSelDesc: number; // Total number of selected descendants.
    nFileDesc: number; // Total number of file descendants.
  };

export type FileNode = BaseNode & {
  type: 'file';
  // -- Custom fields:
  contestId: string;
  active: boolean;
};

export type Node = DirNode | FileNode;

export type ModifierKeys = {
  ctrl: boolean;
};

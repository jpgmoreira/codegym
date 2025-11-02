export type NodeType = 'dir' | 'file';

/**
 * Optional properties will be absent **ONLY** in the "tree.json" file, to save space.
 */

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
  depth?: number;
  selected: boolean;
  hidden: boolean; // Used to hide nodes when searching by file text.
  parentId: string | null;
  nextId: string | null; // Next sibling ID, in the same doubly linked list.
  prevId: string | null; // Previous sibling ID, in the same doubly linked list.
};

// Dir nodes store their children as a doubly linked list (NodeController).
export type DirNode = BaseNode &
  NodeController & {
    type: 'dir';
    open: boolean;
    nDesc?: number; // Total number of descendants, dir or file, not including the node.
    nSelDesc?: number; // Total number of selected descendants.
    nFileDesc?: number; // Total number of file descendants.
  };

export type FileNode = BaseNode & {
  type: 'file';
  // -- Application-specific:
  contestId: string;
  active: boolean;
};

export type Node = DirNode | FileNode;

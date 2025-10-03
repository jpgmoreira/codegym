/**
 * Common types for the treeview component.
 * The treeview has logic spread in both the main and renderer processes.
 */
export type Node =
  | {
      id: string;
      type: 'dir';
      text: string;
      depth: number;
      selected: boolean;
      deleted: boolean;
      nDesc: number; // Total number of descendants, not including the node.
      nDescSel: number; // Total number of selected descendants.
      parentId: string | null;
      nextId: string | null;
      prevId: string | null;
      subDirs: ControllerList;
      subFiles: ControllerList;
      open: boolean;
    }
  | {
      id: string;
      type: 'file';
      text: string;
      depth: number;
      selected: boolean;
      deleted: boolean;
      parentId: string | null;
      nextId: string | null;
      prevId: string | null;
    };

export type NodeType = Node['type'];

export type ControllerList = {
  headId: string | null;
  tailId: string | null;
};

export type Controller = {
  subDirs: ControllerList;
  subFiles: ControllerList;
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

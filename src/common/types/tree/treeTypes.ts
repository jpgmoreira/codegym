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
      // Next and previous siblings from the same parent:
      nextSiblingId: string | null;
      prevSiblingId: string | null;
      // Next and previous nodes in the flattened tree:
      nextFlattenId: string | null;
      prevFlattenId: string | null;
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
      nextSiblingId: string | null;
      prevSiblingId: string | null;
      nextFlattenId: string | null;
      prevFlattenId: string | null;
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

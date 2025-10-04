/**
 * Common types for the treeview component.
 * The treeview has logic implemented in both the main and renderer processes.
 */

type Node = {
  id: number;
  txt: string;
  sel: boolean;
  par: number;
  opn: boolean;
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

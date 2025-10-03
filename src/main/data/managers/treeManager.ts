import { randomId } from '@common/utils/utils';
import {
  NodeType,
  ControllerList,
  Node,
  Controller,
  ModifierKeys,
  TreeState,
} from '@common/types/tree/treeTypes';

/**
 * Manager for the treeview component.
 */
export class TreeManager {
  static #instance: TreeManager;

  private constructor() {}

  public static get instance(): TreeManager {
    if (!this.#instance) {
      this.#instance = new TreeManager();
    }
    return this.#instance;
  }

  // --- Structures: ---

  private readonly rootController = {
    nextFile: 1,
    nextDir: 1,
    subDirs: { headId: null, tailId: null } as ControllerList,
    subFiles: { headId: null, tailId: null } as ControllerList,
  };

  private readonly selectedNodes = new Set<Node>();

  private readonly idToNode: Record<string, Node> = {};

  private shiftSelectionAnchorNode: Node | null = null;

  private nTotalNodes = 0;

  // --- Helpers: ---

  private getParent(node: Node): Node | null {
    return node.parentId ? this.idToNode[node.parentId] : null;
  }

  private getNext(node: Node): Node | null {
    return node.nextId ? this.idToNode[node.nextId] : null;
  }

  private getPrev(node: Node): Node | null {
    return node.prevId ? this.idToNode[node.prevId] : null;
  }

  private getSiblings(node: Node) {
    return {
      next: this.getNext(node),
      prev: this.getPrev(node),
    };
  }

  private extractControllerHead(control: Controller) {
    const dirHeadId = control.subDirs.headId;
    const fileHeadId = control.subFiles.headId;
    const dirHead = dirHeadId ? this.idToNode[dirHeadId] : null;
    const fileHead = fileHeadId ? this.idToNode[fileHeadId] : null;
    return { dirHead, fileHead };
  }

  // --- Node creation: ---

  private createDirNode(parent: Node | null): Node {
    /**
     * O(1)
     */
    const node = {
      id: randomId(),
      type: 'dir',
      text: `Folder ${this.rootController.nextDir}`,
      depth: parent ? parent.depth + 1 : 0,
      selected: false,
      deleted: false,
      nDesc: 0,
      nDescSel: 0,
      parentId: parent ? parent.id : null,
      nextId: null,
      prevId: null,
      subDirs: { headId: null, tailId: null },
      subFiles: { headId: null, tailId: null },
      open: false,
    } as const;
    this.rootController.nextDir++;
    return node;
  }

  private createFileNode(parent: Node | null): Node {
    /**
     * O(1)
     */
    const node = {
      id: randomId(),
      type: 'file',
      text: `File ${this.rootController.nextFile}`,
      depth: parent ? parent.depth + 1 : 0,
      selected: false,
      deleted: false,
      parentId: parent ? parent.id : null,
      nextId: null,
      prevId: null,
    } as const;
    this.rootController.nextFile++;
    return node;
  }

  private updateNewNodeSelectionAndAncestors(node: Node, parent: Node | null) {
    /**
     * O(depth of node)
     */
    // Creation of a node in a selected parent:
    if (parent && parent.selected) {
      this.markNodeAsSelected(node);
    }
    // Update ancestors:
    let curr: Node | null = parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDesc++;
      curr.nDescSel += Number(node.selected);
      curr = this.getParent(curr);
    }
  }

  private appendNode(node: Node, control: Controller) {
    /**
     * O(1)
     */
    const sub = node.type === 'dir' ? control.subDirs : control.subFiles;
    if (!sub.headId || !sub.tailId) {
      sub.headId = node.id;
      sub.tailId = node.id;
    } else {
      const tail = this.idToNode[sub.tailId];
      tail.nextId = node.id;
      node.prevId = tail.id;
      sub.tailId = node.id;
    }
  }

  public createNode(type: NodeType, parentId: string | null) {
    /**
     * O(depth of node)
     */
    const parent = parentId ? this.idToNode[parentId] : null;
    if (parent && parent.type !== 'dir') return;
    const newNode = type === 'dir' ? this.createDirNode(parent) : this.createFileNode(parent);
    this.idToNode[newNode.id] = newNode;
    const control = parent || this.rootController;
    if (parent) parent.open = true;
    this.appendNode(newNode, control);
    this.updateNewNodeSelectionAndAncestors(newNode, parent);
    this.nTotalNodes++;
  }

  // --- Node renaming: ---

  public renameNode(nodeId: string, newName: string) {
    /**
     * O(1)
     */
    const node = this.idToNode[nodeId];
    if (!node) return;
    newName = newName.trim();
    if (newName && node.text !== newName) {
      node.text = newName;
    }
  }

  // --- Selection: ---

  private markNodeAsSelected(node: Node) {
    /**
     * O(1)
     */
    if (!node) return;
    node.selected = true;
    this.selectedNodes.add(node);
  }

  private unmarkNodeAsSelected(node: Node) {
    /**
     * O(1)
     */
    if (!node) return;
    node.selected = false;
    this.selectedNodes.delete(node);
  }

  private clearSelection() {
    /**
     * O(number of nodes in the tree induced by selected nodes)
     */
    for (const node of this.selectedNodes) {
      node.selected = false;
      let curr = this.getParent(node);
      while (curr) {
        if (curr.type !== 'dir') break;
        if (curr.nDescSel === 0) break;
        curr.nDescSel = 0;
        curr = this.getParent(curr);
      }
    }
    this.selectedNodes.clear();
  }

  private selectFileViaClickPressingCtrlIgnoreShift(node: Node) {
    /**
     * O(depth of node)
     */
    if (node.selected) return;
    this.markNodeAsSelected(node);
    let delta = 1;
    let curr = this.getParent(node);
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += delta;
      if (curr.nDesc === curr.nDescSel) {
        this.markNodeAsSelected(curr);
        delta++;
      }
      curr = this.getParent(curr);
    }
  }

  private deselectFileViaClickPressingCtrlIgnoreShift(node: Node) {
    /**
     * O(depth of node)
     */
    if (!node.selected) return;
    this.unmarkNodeAsSelected(node);
    let curr = this.getParent(node);
    let delta = 1;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel -= delta;
      if (curr.selected) {
        this.unmarkNodeAsSelected(curr);
        delta++;
      }
      curr = this.getParent(curr);
    }
  }

  private selectFileViaClickNoCtrlNoShift(node: Node) {
    /**
     * O(
     *  (number of nodes in the tree induced by selected nodes) +
     *  (depth of node)
     * )
     */
    if (node.selected) return;
    this.clearSelection();
    this.selectFileViaClickPressingCtrlIgnoreShift(node);
  }

  private deselectFileViaClickNoCtrlNoShift(node: Node) {
    /**
     * O(number of nodes in the tree induced by selected nodes)
     */
    if (!node.selected) return;
    this.clearSelection();
  }

  private markSubtreeAsSelected(head: Node | null) {
    /**
     * O(number of nodes in the subtree)
     */
    if (!head) return;
    let curr: Node | null = head;
    while (curr) {
      this.markNodeAsSelected(curr);
      if (curr.type === 'dir') {
        curr.nDescSel = curr.nDesc;
        const { dirHead, fileHead } = this.extractControllerHead(curr);
        this.markSubtreeAsSelected(dirHead);
        this.markSubtreeAsSelected(fileHead);
      }
      curr = this.getNext(curr);
    }
  }

  private unmarkSubtreeAsSelected(head: Node | null) {
    /**
     * O(number of nodes in the subtree)
     */
    if (!head) return;
    let curr: Node | null = head;
    while (curr) {
      this.unmarkNodeAsSelected(curr);
      if (curr.type === 'dir') {
        curr.nDescSel = 0;
        const { dirHead, fileHead } = this.extractControllerHead(curr);
        this.unmarkSubtreeAsSelected(dirHead);
        this.unmarkSubtreeAsSelected(fileHead);
      }
      curr = this.getNext(curr);
    }
  }

  private selectDirViaClickPressingCtrlIgnoreShift(node: Node) {
    /**
     * O(
     *  (number of nodes in the subtree) +
     *  (depth of node)
     * )
     */
    if (node.selected) return;
    if (node.type !== 'dir') return;
    this.markNodeAsSelected(node);
    const { dirHead, fileHead } = this.extractControllerHead(node);
    this.markSubtreeAsSelected(dirHead);
    this.markSubtreeAsSelected(fileHead);
    let delta = node.nDesc - node.nDescSel + 1;
    node.nDescSel = node.nDesc;
    let curr = this.getParent(node);
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += delta;
      if (curr.nDesc === curr.nDescSel) {
        this.markNodeAsSelected(curr);
        delta++;
      }
      curr = this.getParent(curr);
    }
  }

  private deselectDirViaClickPressingCtrlIgnoreShift(node: Node) {
    /**
     * O(
     *  (number of nodes in the subtree) +
     *  (depth of node)
     * )
     */
    if (!node.selected) return;
    if (node.type !== 'dir') return;
    this.unmarkNodeAsSelected(node);
    node.nDescSel = 0;
    const { dirHead, fileHead } = this.extractControllerHead(node);
    this.unmarkSubtreeAsSelected(dirHead);
    this.unmarkSubtreeAsSelected(fileHead);
    let delta = node.nDesc + 1;
    let curr = this.getParent(node);
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel -= delta;
      if (curr.selected) {
        this.unmarkNodeAsSelected(curr);
        delta++;
      }
      curr = this.getParent(curr);
    }
  }

  private selectDirViaClickNoCtrlNoShift(node: Node) {
    /**
     * O(
     *  (number of nodes in the tree induced by selected nodes) +
     *  (number of nodes in the subtree) +
     *  (depth of node)
     * )
     */
    if (node.selected) return;
    if (node.type !== 'dir') return;
    this.clearSelection();
    this.selectDirViaClickPressingCtrlIgnoreShift(node);
  }

  private deselectDirViaClickNoCtrlNoShift(node: Node) {
    /**
     * O(number of nodes in the tree induced by selected nodes)
     */
    if (!node.selected) return;
    this.clearSelection();
  }

  private shiftSelectRange(orig: Node, dest: Node) {
    /**
     * COULD BE OPTIMIZED TO ITERATE OVER JUST THE NODES BETWEEN orig AND dest WITHOUT FINDING THE LCA.
     */

    /**
     * O(
     *  (total number of nodes to be selected) * depth
     * )
     */

    // Orig !== dest.
    // - Find lowest common ancestor:
    let lca: Node | null = null;
    const seen = new Set<Node>();
    let curr = this.getParent(orig);
    while (curr) {
      seen.add(curr);
      curr = this.getParent(curr);
    }
    curr = this.getParent(dest);
    while (curr) {
      if (seen.has(curr)) {
        lca = curr;
        break;
      }
      curr = this.getParent(curr);
    }
    if (lca && lca.type !== 'dir') return; // Make TS happy.
    let control = lca || this.rootController;
    const { dirHead, fileHead } = this.extractControllerHead(control);
    const flattened = [...this.flatten(dirHead, true), ...this.flatten(fileHead, true)];
    let aux = 0;
    for (const node of flattened) {
      if (node === orig || node === dest) {
        aux++;
        if (node.type === 'file') this.selectFileViaClickPressingCtrlIgnoreShift(node);
        else this.selectDirViaClickPressingCtrlIgnoreShift(node);
        continue;
      }
      if (aux === 2) break;
      if (aux) {
        const mustSelect = node.type === 'file' || (node.type === 'dir' && node.nDesc === 0);
        if (mustSelect) {
          if (node.type === 'file') this.selectFileViaClickPressingCtrlIgnoreShift(node);
          else this.selectDirViaClickPressingCtrlIgnoreShift(node);
        }
      }
    }
  }

  private handleSelection(node: Node, checkbox: boolean, keys: ModifierKeys) {
    // In checkbox mode, all selections happen as if the user had CTRL pressed.
    if (!node.selected && node.type === 'file' && !keys.ctrl && !keys.shift) {
      // Select a file node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) this.selectFileViaClickNoCtrlNoShift(node);
      else this.selectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'file' && !keys.ctrl && !keys.shift) {
      // Deselect a file node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) this.deselectFileViaClickNoCtrlNoShift(node);
      else this.deselectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'dir' && !keys.ctrl && !keys.shift) {
      // Select a dir node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) this.selectDirViaClickNoCtrlNoShift(node);
      else this.selectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'dir' && !keys.ctrl && !keys.shift) {
      // Deselect a dir node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) this.deselectDirViaClickNoCtrlNoShift(node);
      else this.deselectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'file' && keys.ctrl) {
      // Select a file node via click, pressing CTRL, SHIFT doesn't matter.
      this.selectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'file' && keys.ctrl) {
      // Deselect a file node via click, pressing CTRL, SHIFT doesn't matter.
      this.deselectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'dir' && keys.ctrl) {
      // Select a dir node via click, pressing CTRL, SHIFT doesn't matter.
      this.selectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'dir' && keys.ctrl) {
      // Deselect a dir node via click, pressing CTRL, SHIFT doesn't matter.
      this.deselectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (keys.shift) {
      const anchor = this.shiftSelectionAnchorNode;
      if (node.type === 'file' && (!anchor || anchor === node)) {
        // Clicking a file node, pressing SHIFT, without an anchor.
        this.selectFileViaClickPressingCtrlIgnoreShift(node);
      } else if (node.type === 'dir' && (!anchor || anchor === node)) {
        // Clicking a dir node, pressing SHIFT, without an anchor.
        this.selectDirViaClickPressingCtrlIgnoreShift(node);
      } else if (anchor && anchor !== node) {
        // Clicking a file or dir node, pressing SHIFT, with an anchor.
        this.shiftSelectRange(node, anchor);
      }
    }
    this.shiftSelectionAnchorNode = node;
  }

  private toggleFullSelection() {
    /**
     * O(number of nodes in the tree)
     */
    if (this.nTotalNodes === 0) return;
    if (this.allNodesSelected()) {
      this.clearSelection();
    } else {
      const { dirHead, fileHead } = this.extractControllerHead(this.rootController);
      this.markSubtreeAsSelected(dirHead);
      this.markSubtreeAsSelected(fileHead);
    }
  }

  private allNodesSelected() {
    return this.nTotalNodes > 0 && this.selectedNodes.size === this.nTotalNodes;
  }

  // --- Deletion: ---

  private removeNodeFromTree(node: Node) {
    /**
     * O(1)
     */
    const parent = this.getParent(node);
    if (parent && parent.type !== 'dir') return; // Make TS happy.
    const control = parent || this.rootController;
    const sub = node.type === 'dir' ? control.subDirs : control.subFiles;
    const { next, prev } = this.getSiblings(node);
    if (node.id === sub.headId) sub.headId = next ? next.id : null;
    if (node.id === sub.tailId) sub.tailId = prev ? prev.id : null;
    if (prev && next) {
      prev.nextId = next.id;
      next.prevId = prev.id;
    } else if (prev) {
      prev.nextId = null;
    } else if (next) {
      next.prevId = null;
    }
  }

  private deleteFile(node: Node) {
    /**
     * O(depth of node)
     */
    const wasSelected = node.selected;
    if (wasSelected) this.unmarkNodeAsSelected(node);
    let curr = this.getParent(node);
    let ancestorSelDelta = 0;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += ancestorSelDelta;
      curr.nDesc--;
      if (wasSelected) curr.nDescSel--;
      if (!curr.selected && curr.nDesc > 0 && curr.nDesc === curr.nDescSel) {
        this.markNodeAsSelected(curr);
        ancestorSelDelta++;
      }
      curr = this.getParent(curr);
    }
    this.shiftSelectionAnchorNode = null;
    this.nTotalNodes--;
    delete this.idToNode[node.id];
    this.removeNodeFromTree(node);
  }

  private deleteDir(node: Node) {
    /**
     * O(
     *  (number of nodes in the subtree) +
     *  (depth of node)
     * )
     */
    if (node.type !== 'dir') return;
    const { dirHead, fileHead } = this.extractControllerHead(node);
    const subtree = [...this.flatten(dirHead, true), ...this.flatten(fileHead, true)];
    for (const sub of subtree) {
      if (sub.selected) this.unmarkNodeAsSelected(sub);
      sub.deleted = true;
    }
    const nDescDec = node.nDesc + 1;
    let ancestorSelDelta = -(node.nDescSel + Number(node.selected));
    this.unmarkNodeAsSelected(node);
    node.deleted = true;
    let curr = this.getParent(node);
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDesc -= nDescDec;
      curr.nDescSel += ancestorSelDelta;
      if (!curr.selected && curr.nDesc > 0 && curr.nDesc === curr.nDescSel) {
        this.markNodeAsSelected(curr);
        ancestorSelDelta++;
      }
      curr = this.getParent(curr);
    }
    this.shiftSelectionAnchorNode = null;
    this.nTotalNodes -= nDescDec;
    delete this.idToNode[node.id];
    this.removeNodeFromTree(node);
  }

  private deleteAllSelectedNodes() {
    /**
     * O(
     *  (total number of selected nodes) * depth
     * )
     */
    // Delete dirs first, since it potentially increases overall deletion efficiency.
    const snapshot = Array.from(this.selectedNodes);
    for (const node of snapshot) {
      if (node.type === 'dir' && !node.deleted) this.deleteDir(node);
    }
    for (const node of snapshot) {
      if (node.type === 'file' && !node.deleted) this.deleteFile(node);
    }
  }

  // --- Tree flattening: ---

  private flatten(head: Node | null, includeClosed: boolean): Node[] {
    /**
     * O(subtree)
     */
    const result: Node[] = [];
    let curr: Node | null = head;
    while (curr) {
      result.push(curr);
      if (curr.type === 'dir' && (curr.open || includeClosed)) {
        const { dirHead, fileHead } = this.extractControllerHead(curr);
        result.push(
          ...this.flatten(dirHead, includeClosed),
          ...this.flatten(fileHead, includeClosed)
        );
      }
      curr = this.getNext(curr);
    }
    return result;
  }

  // --- Build response to send to the Renderer Process: ---

  public buildResponse(): TreeState {
    /**
     * COULD BE IMPROVED TO NOT CALL FLATTEN.
     */
    const result = {} as TreeState;
    const { dirHead, fileHead } = this.extractControllerHead(this.rootController);
    result.nSelectedNodes = this.selectedNodes.size;
    result.nTotalNodes = this.nTotalNodes;
    result.visibleNodes = [...this.flatten(dirHead, false), ...this.flatten(fileHead, false)];
    return result;
  }
}

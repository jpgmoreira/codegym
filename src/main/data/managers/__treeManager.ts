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

  private getNextSibling(node: Node): Node | null {
    return node.nextSiblingId ? this.idToNode[node.nextSiblingId] : null;
  }

  private getPrevSibling(node: Node): Node | null {
    return node.prevSiblingId ? this.idToNode[node.prevSiblingId] : null;
  }

  private getNextFlatten(node: Node): Node | null {
    return node.nextFlattenId ? this.idToNode[node.nextFlattenId] : null;
  }

  private getPrevFlatten(node: Node): Node | null {
    return node.prevFlattenId ? this.idToNode[node.prevFlattenId] : null;
  }

  private getFamily(node: Node) {
    return {
      parent: this.getParent(node),
      nextSibling: this.getNextSibling(node),
      prevSibling: this.getPrevSibling(node),
      nextFlatten: this.getNextFlatten(node),
      prevFlatten: this.getPrevFlatten(node),
    };
  }

  private extractControllerReferences(control: Controller) {
    // head:
    const dirHeadId = control.subDirs.headId;
    const fileHeadId = control.subFiles.headId;
    const dirHead = dirHeadId ? this.idToNode[dirHeadId] : null;
    const fileHead = fileHeadId ? this.idToNode[fileHeadId] : null;
    // tail:
    const dirTailId = control.subDirs.tailId;
    const fileTailId = control.subFiles.tailId;
    const dirTail = dirTailId ? this.idToNode[dirTailId] : null;
    const fileTail = fileTailId ? this.idToNode[fileTailId] : null;
    return { dirHead, fileHead, dirTail, fileTail };
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
      nextSiblingId: null,
      prevSiblingId: null,
      nextFlattenId: null,
      prevFlattenId: null,
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
      nextSiblingId: null,
      prevSiblingId: null,
      nextFlattenId: null,
      prevFlattenId: null,
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

  private appendNode(node: Node, parent: Node | null) {
    /**
     * O(1)
     */
    if (parent && parent.type !== 'dir') return; // Make TS happy!!! :D
    const control = parent || this.rootController;
    const { dirHead, fileHead, dirTail, fileTail } = this.extractControllerReferences(control);
    const parentFamily = parent ? this.getFamily(parent) : null;

    if (!parent) {
      // Creation of node in the root.
      if (node.type === 'dir') {
        // Create dir in the root.
        if (!dirHead || !dirTail) {
          // First dir in the root.
          control.subDirs.headId = node.id;
          control.subDirs.tailId = node.id;
          if (fileHead) {
            node.nextFlattenId = fileHead.id;
            node.nextSiblingId = fileHead.id;
            fileHead.prevFlattenId = node.id;
            fileHead.prevSiblingId = node.id;
          }
        } else {
          // Not first dir in the root.
          node.prevSiblingId = dirTail.id;
          node.prevFlattenId = dirTail.id;
          dirTail.nextSiblingId = node.id;
          dirTail.nextFlattenId = node.id;
          if (fileHead) {
            node.nextSiblingId = fileHead.id;
            node.nextFlattenId = fileHead.id;
            fileHead.prevSiblingId = node.id;
            fileHead.prevFlattenId = node.id;
          }
          control.subDirs.tailId = node.id;
        }
      } else {
        // Create file in the root.
        if (!fileHead || !fileTail) {
          // First file in the root.
          control.subFiles.headId = node.id;
          control.subFiles.tailId = node.id;
          if (dirTail) {
            node.prevSiblingId = dirTail.id;
            node.prevFlattenId = dirTail.id;
            dirTail.nextSiblingId = node.id;
            dirTail.nextFlattenId = node.id;
          }
        } else {
          // Not first file in the root.
          node.prevSiblingId = fileTail.id;
          node.prevFlattenId = fileTail.id;
          fileTail.nextSiblingId = node.id;
          fileTail.nextFlattenId = node.id;
          control.subFiles.tailId = node.id;
        }
      }
    } else {
      // Creation of a node inside of a dir.
      if (node.type === 'dir') {
        // Creation of a dir inside of a dir.
        if (!dirHead || !dirTail) {
          // First dir inside of this dir.
          control.subDirs.headId = node.id;
          control.subDirs.tailId = node.id;
          if (fileHead) {
            node.nextSiblingId = fileHead.id;
            node.nextFlattenId = fileHead.id;
            fileHead.prevSiblingId = node.id;
            fileHead.prevFlattenId = node.id;
          } else {
            node.nextFlattenId = parent.nextFlattenId;
            if (parentFamily?.nextFlatten) {
              parentFamily.nextFlatten.prevFlattenId = node.id;
            }
          }
          node.prevFlattenId = parent.id;
          parent.nextFlattenId = node.id;
        } else {
          // Not first dir inside of this dir.
          dirTail.nextSiblingId = node.id;
          node.prevSiblingId = dirTail.id;
          if (fileHead) {
            node.nextSiblingId = fileHead.id;
            node.nextFlattenId = fileHead.id;
            fileHead.prevSiblingId = node.id;
            fileHead.prevFlattenId = node.id;
          } else {
            node.nextFlattenId = dirTail.nextFlattenId;
            if (dirTail.nextFlattenId) {
              const nextFlatten = this.idToNode[dirTail.nextFlattenId];
              if (nextFlatten) {
                nextFlatten.prevFlattenId = node.id;
              }
            }
          }
          dirTail.nextFlattenId = node.id;
          node.prevFlattenId = dirTail.id;
          control.subDirs.tailId = node.id;
        }
      } else {
        // Creation of a file inside of a dir.
        if (!fileHead || !fileTail) {
          // First file inside of this dir.
          control.subFiles.headId = node.id;
          control.subFiles.tailId = node.id;
          if (dirTail) {
            node.prevFlattenId = dirTail.id;
            node.prevSiblingId = dirTail.id;
            dirTail.nextSiblingId = node.id;
            if (dirTail.nextFlattenId) {
              const nextFlatten = this.idToNode[dirTail.nextFlattenId];
              if (nextFlatten) {
                nextFlatten.prevFlattenId = node.id;
                node.nextFlattenId = nextFlatten.id;
              }
            }
            dirTail.nextFlattenId = node.id;
          } else {
            node.prevFlattenId = parent.id;
            if (parentFamily?.nextFlatten) {
              node.nextFlattenId = parentFamily.nextFlatten.id;
              parentFamily.nextFlatten.prevFlattenId = node.id;
            }
            parent.nextFlattenId = node.id;
          }
        } else {
          // Not first file inside of this dir.
          control.subFiles.tailId = node.id;
          node.prevSiblingId = fileTail.id;
          node.prevFlattenId = fileTail.id;
          fileTail.nextSiblingId = node.id;
          if (fileTail.nextFlattenId) {
            const nextFlatten = this.idToNode[fileTail.nextFlattenId];
            if (nextFlatten) {
              nextFlatten.prevFlattenId = node.id;
              node.nextFlattenId = nextFlatten.id;
            }
          }
          fileTail.nextFlattenId = node.id;
        }
      }
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
    if (parent) parent.open = true;
    this.appendNode(newNode, parent);
    this.updateNewNodeSelectionAndAncestors(newNode, parent);
    this.nTotalNodes++;
  }

  // --- Opening and closing: ---

  public toggleDirOpen(nodeId: string) {
    /**
     * O(1)
     */
    const node = this.idToNode[nodeId];
    if (!node || node.type !== 'dir') return;
    node.open = !node.open;
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
        const { dirHead, fileHead } = this.extractControllerReferences(curr);
        this.markSubtreeAsSelected(dirHead);
        this.markSubtreeAsSelected(fileHead);
      }
      curr = this.getNextSibling(curr);
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
        const { dirHead, fileHead } = this.extractControllerReferences(curr);
        this.unmarkSubtreeAsSelected(dirHead);
        this.unmarkSubtreeAsSelected(fileHead);
      }
      curr = this.getNextSibling(curr);
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
    const { dirHead, fileHead } = this.extractControllerReferences(node);
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
    const { dirHead, fileHead } = this.extractControllerReferences(node);
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

  /**
   * REDO
   */
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
    const { dirHead, fileHead } = this.extractControllerReferences(control);
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

  public handleSelection(nodeId: string, checkbox: boolean, keys: ModifierKeys) {
    const node = this.idToNode[nodeId];
    if (!node) return;
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

  public toggleFullSelection() {
    /**
     * O(number of nodes in the tree)
     */
    if (this.nTotalNodes === 0) return;
    if (this.allNodesSelected()) {
      this.clearSelection();
    } else {
      const { dirHead, fileHead } = this.extractControllerReferences(this.rootController);
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
    const { next, prev } = this.getSiblings(node, false);
    if (node.id === sub.headId) {
      sub.headId = next && next.parentId === node.parentId ? next.id : null;
    }
    if (node.id === sub.tailId) {
      sub.tailId = prev && prev.parentId === node.parentId ? prev.id : null;
    }
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
    const { dirHead, fileHead } = this.extractControllerReferences(node);
    let curr = dirHead || fileHead;
    while (curr && curr.depth > node.depth) {
      if (curr.selected) this.unmarkNodeAsSelected(curr);
      curr.deleted = true;
      curr = this.getNextFlatten(curr);
    }
    const nDescDec = node.nDesc + 1;
    let ancestorSelDelta = -(node.nDescSel + Number(node.selected));
    this.unmarkNodeAsSelected(node);
    node.deleted = true;
    curr = this.getParent(node);
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

  public deleteNode(nodeId: string) {
    /**
     * O(
     *  (number of nodes in the subtree) +
     *  (depth of node)
     * )
     */
    const node = this.idToNode[nodeId];
    if (!node) return;
    if (node.type === 'dir') this.deleteDir(node);
    else this.deleteFile(node);
  }

  public deleteAllSelectedNodes() {
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

  // --- Build response to send to the Renderer Process: ---

  public buildResponse(): TreeState {
    /**
     * O(number of nodes in the visible nodes window)
     */
    const result = {} as TreeState;
    const { dirHead, fileHead } = this.extractControllerReferences(this.rootController);
    result.nSelectedNodes = this.selectedNodes.size;
    result.nTotalNodes = this.nTotalNodes;
    result.visibleNodes = [];
    let curr = dirHead || fileHead;
    while (curr) {
      result.visibleNodes.push(curr);
      if (curr.type === 'dir' && !curr.open) {
        const { dirTail, fileTail } = this.extractControllerReferences(curr);
        if (fileTail) curr = this.getNextFlatten(fileTail);
        else if (dirTail) curr = this.getNextFlatten(dirTail);
        else curr = this.getNextFlatten(curr);
      } else {
        curr = this.getNextFlatten(curr);
      }
    }
    return result;
  }
}

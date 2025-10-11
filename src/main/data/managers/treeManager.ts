import { randomId } from '@common/utils/utils';
import { DATA_DIR } from '../constants';
import { FileProxy } from '../fileProxy';
import {
  NodeController,
  Node,
  FileNode,
  DirNode,
  NodeType,
  ModifierKeys,
  HeadAndTail,
} from '@common/types/tree';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import path from 'path';

type RootController = NodeController & {
  nextDir: number;
  nextFile: number;
};

type TreeData = {
  rootController: RootController;
  idToNode: Record<string, Node>;
};

/**
 * Singleton for managing the treeview component operations.
 * Access via TreeManager.instance
 */
export class TreeManager {
  // -- Class configuration: ---

  static #instance: TreeManager;
  private _proxy: FileProxy<TreeData> | null = null;

  private constructor() {}

  public static get instance(): TreeManager {
    if (!this.#instance) {
      this.#instance = new TreeManager();
    }
    return this.#instance;
  }

  private get proxy() {
    return this._proxy!.proxy;
  }
  private get target() {
    return this._proxy!.target;
  }

  // --- Variables and structures: ---

  private nSelectedNodes = 0;
  private nSelectedFiles = 0;
  private expandedFlat: Node[] = [];

  // --- Setup methods: ---

  private getEmptyTreeData(): TreeData {
    return {
      rootController: {
        nextDir: 1,
        nextFile: 1,
        dirs: { headId: null, tailId: null },
        files: { headId: null, tailId: null },
      },
      idToNode: {},
    };
  }

  public loadTree(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'tree.json');
    this._proxy = new FileProxy(filePath, this.getEmptyTreeData());
    this.refresh();
  }

  // --- Result and flattening: ---

  private flatten(node: Node | null, depth: number, array: Node[]) {
    let curr = node;
    let nSub = 0,
      nSubSel = 0;
    while (curr) {
      array.push(curr);
      if (curr.type === 'dir') {
        const dirHead = this.getHead(curr.dirs, false);
        const fileHead = this.getHead(curr.files, false);
        const dirResult = this.flatten(dirHead, depth + 1, array);
        const fileResult = this.flatten(fileHead, depth + 1, array);
        curr.nDesc = dirResult[0] + fileResult[0];
        curr.nSelDesc = dirResult[1] + fileResult[1];
        nSub += curr.nDesc;
        nSubSel += curr.nSelDesc;
        if (curr.nDesc) {
          curr.selected = !!curr.nDesc && curr.nDesc === curr.nSelDesc;
        }
      }
      curr.depth = depth;
      const sel = curr.selected ? 1 : 0;
      nSub++;
      nSubSel += sel;
      this.nSelectedNodes += sel;
      this.nSelectedFiles += curr.type === 'file' ? sel : 0;
      curr = this.getNext(curr, false);
    }
    return [nSub, nSubSel];
  }

  public buildResult(anchor: number): TreeOperationResponseDTO {
    const visibleNodes: Node[] = [];
    for (let i = 0, j = 0; j < 100 && i < this.expandedFlat.length; j++) {
      const node = this.expandedFlat[i];
      visibleNodes.push(node);
      if (node.type === 'dir' && !node.open) i += node.nDesc;
      i++;
    }
    return {
      nSelectedNodes: this.nSelectedNodes,
      nSelectedFiles: this.nSelectedFiles,
      nTotalNodes: this.expandedFlat.length,
      visibleNodes,
    };
  }

  /**
   * Refreshes:
   *  - this.expandedFlat;
   *  - this.nSelectedNodes;
   *  - this.nSelectedFiles;
   * For every node, updates:
   *  - depth;
   *  - nDesc;
   *  - nSelDesc;
   */
  private refresh() {
    const dirHead = this.getHead(this.target.rootController.dirs, false);
    const fileHead = this.getHead(this.target.rootController.files, false);
    this.expandedFlat = [];
    this.nSelectedNodes = 0;
    this.nSelectedFiles = 0;
    this.flatten(dirHead, 0, this.expandedFlat);
    this.flatten(fileHead, 0, this.expandedFlat);
    this._proxy!.queueWrite();
  }

  // --- Helpers: ---

  private getHead(headAndTail: HeadAndTail, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = headAndTail.headId;
    return id ? source.idToNode[id] : null;
  }

  private getTail(headAndTail: HeadAndTail, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = headAndTail.tailId;
    return id ? source.idToNode[id] : null;
  }

  private getNext(node: Node, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = node.nextId;
    return id ? source.idToNode[id] : null;
  }

  private getParent(node: Node, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = node.parentId;
    return id ? (source.idToNode[id] as DirNode) : null;
  }

  // --- Creation: ---

  private createDirNode(prefix: string, parentId: string | null): DirNode {
    return {
      id: randomId(),
      type: 'dir',
      text: `${prefix} ${this.target.rootController.nextDir}`,
      depth: 0,
      open: false,
      selected: false,
      parentId,
      nextId: null,
      prevId: null,
      dirs: {
        headId: null,
        tailId: null,
      },
      files: {
        headId: null,
        tailId: null,
      },
      nDesc: 0,
      nSelDesc: 0,
    } as const;
  }

  private createFileNode(prefix: string, parentId: string | null): FileNode {
    return {
      id: randomId(),
      type: 'file',
      text: `${prefix} ${this.target.rootController.nextFile}`,
      depth: 0,
      selected: false,
      parentId,
      nextId: null,
      prevId: null,
    } as const;
  }

  private appendNode(node: Node, control: NodeController) {
    const sub = node.type === 'dir' ? control.dirs : control.files;
    if (!sub.headId) {
      sub.headId = node.id;
      sub.tailId = node.id;
    } else {
      const tail = this.getTail(sub, true)!;
      const next = this.getNext(tail, true);
      node.nextId = tail.nextId;
      tail.nextId = node.id;
      node.prevId = tail.id;
      if (next) next.prevId = node.id;
      sub.tailId = node.id;
    }
  }

  public createNode(type: NodeType, prefix: string, parentId: string | null) {
    let newNode: Node;
    if (type === 'dir') {
      newNode = this.createDirNode(prefix, parentId);
      this.proxy.rootController.nextDir++;
    } else {
      newNode = this.createFileNode(prefix, parentId);
      this.proxy.rootController.nextFile++;
    }
    this.proxy.idToNode[newNode.id] = newNode;
    const parent = this.getParent(newNode, true);
    if (parent) {
      newNode.selected = parent.selected;
      parent.open = true;
      this.appendNode(newNode, parent);
    } else {
      this.appendNode(newNode, this.proxy.rootController);
    }
    this.refresh();
  }

  // --- Toggle directory open: ---

  public toggleDirOpen(nodeId: string) {
    const node = this.proxy.idToNode[nodeId] as DirNode;
    node.open = !node.open;
  }

  // --- Rename node: ---

  public renameNode(nodeId: string, newName: string): GenericResponseDTO {
    newName = newName.trim();
    if (!newName) {
      return {
        status: 'error',
        errorMsg: 'Name cannot be empty!',
      };
    }
    const node = this.proxy.idToNode[nodeId];
    const control = this.getParent(node, false) || this.target.rootController;
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    for (const head of [dirHead, fileHead]) {
      let curr = head;
      while (curr) {
        if (curr.text === newName) {
          return {
            status: 'error',
            errorMsg: 'Name already exists in this folder.',
          };
        }
        curr = this.getNext(curr, false);
      }
    }
    node.text = newName;
    return { status: 'success' };
  }

  // --- Selection handling: ---

  private clearSelection() {
    for (const node of this.expandedFlat) node.selected = false;
    this.nSelectedFiles = 0;
    this.nSelectedNodes = 0;
  }

  private setSubtreeSelection(control: NodeController, state: boolean) {
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    let curr: Node | null = dirHead;
    while (curr) {
      curr.selected = state;
      this.setSubtreeSelection(curr as DirNode, state);
      curr = this.getNext(curr, false);
    }
    curr = fileHead;
    while (curr) {
      curr.selected = state;
      curr = this.getNext(curr, false);
    }
  }

  public handleSelection(nodeId: string, keys: ModifierKeys) {
    const node = this.target.idToNode[nodeId];
    const nextState = !node.selected;
    if (!keys.ctrl) {
      this.clearSelection();
      this._proxy!.queueWrite();
      if (!nextState) return;
    }
    node.selected = nextState;
    const before = Date.now();
    if (node.type === 'dir') {
      this.setSubtreeSelection(node, nextState);
    }
    const after = Date.now();
    console.log(after - before);
    this.refresh();
  }
}

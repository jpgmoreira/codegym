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
        const dirHead = curr.dirs.headId ? this.target.idToNode[curr.dirs.headId] : null;
        const fileHead = curr.files.headId ? this.target.idToNode[curr.files.headId] : null;
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
      curr = curr.nextId ? this.target.idToNode[curr.nextId] : null;
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
    const before = Date.now();
    const { dirHead, fileHead } = this.extractController(this.target.rootController, false);
    this.expandedFlat = [];
    this.nSelectedNodes = 0;
    this.nSelectedFiles = 0;
    this.flatten(dirHead, 0, this.expandedFlat);
    this.flatten(fileHead, 0, this.expandedFlat);
    const after = Date.now();
    console.log('-- refresh time:', after - before);
  }

  // --- Helpers: ---

  private getFamily(node: Node, asProxy = true) {
    const source = asProxy ? this.proxy : this.target;
    const result = {
      parent: node.parentId ? (source.idToNode[node.parentId] as DirNode) : null,
      next: node.nextId ? source.idToNode[node.nextId] : null,
      prev: node.prevId ? source.idToNode[node.prevId] : null,
      dirHead: null as DirNode | null,
      dirTail: null as DirNode | null,
      fileHead: null as FileNode | null,
      fileTail: null as FileNode | null,
    };
    if (node.type === 'dir') {
      const pointers = this.extractController(node, asProxy);
      Object.assign(result, pointers);
    }
    return result;
  }

  private extractController(control: NodeController, asProxy = true) {
    const source = asProxy ? this.proxy : this.target;
    const result = {
      dirHead: null as DirNode | null,
      dirTail: null as DirNode | null,
      fileHead: null as FileNode | null,
      fileTail: null as FileNode | null,
    };
    const { dirs, files } = control;
    if (dirs.headId) result.dirHead = source.idToNode[dirs.headId] as DirNode;
    if (dirs.tailId) result.dirTail = source.idToNode[dirs.tailId] as DirNode;
    if (files.headId) result.fileHead = source.idToNode[files.headId] as FileNode;
    if (files.tailId) result.fileTail = source.idToNode[files.tailId] as FileNode;
    return result;
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
      const tail = this.target.idToNode[sub.tailId!];
      const { next } = this.getFamily(tail);
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
    const { parent } = this.getFamily(newNode);
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
    const control = this.getFamily(node, false).parent || this.target.rootController;
    const { dirHead, fileHead } = this.extractController(control, false);
    for (const head of [dirHead, fileHead]) {
      let curr = head;
      while (curr) {
        if (curr.text === newName) {
          return {
            status: 'error',
            errorMsg: 'Name already exists in this folder.',
          };
        }
        curr = this.getFamily(curr, false).next;
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
    const { dirHead, fileHead } = this.extractController(control, false);
    let curr: Node | null = dirHead;
    while (curr) {
      curr.selected = state;
      this.setSubtreeSelection(curr as DirNode, state);
      curr = this.getFamily(curr).next;
    }
    curr = fileHead;
    while (curr) {
      curr.selected = state;
      curr = this.getFamily(curr).next;
    }
  }

  public handleSelection(nodeId: string, keys: ModifierKeys) {
    const node = this.target.idToNode[nodeId];
    const nextState = !node.selected;
    if (!keys.ctrl) {
      this.clearSelection();
      if (!nextState) return;
    }
    node.selected = nextState;
    if (node.type === 'dir') {
      this.setSubtreeSelection(node, nextState);
    }
    this.refresh();
  }
}

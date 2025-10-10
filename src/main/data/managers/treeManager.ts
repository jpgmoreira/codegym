import { randomId } from '@common/utils/utils';
import { DATA_DIR } from '../constants';
import { FileProxy } from '../fileProxy';
import { NodeController, Node, FileNode, DirNode, NodeType } from '@common/types/tree';
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
  private proxy: FileProxy<TreeData> | null = null;

  private constructor() {}

  public static get instance(): TreeManager {
    if (!this.#instance) {
      this.#instance = new TreeManager();
    }
    return this.#instance;
  }

  private get px() {
    return this.proxy!.proxy;
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
    this.proxy = new FileProxy(filePath, this.getEmptyTreeData());
    this.refresh();
  }

  // --- Result and flattening: ---

  private flatten(node: Node | null, depth: number, array: Node[]) {
    let curr = node;
    const target = this.proxy!.target;
    const result = {
      nSub: 0,
      nSubSel: 0,
    };
    while (curr) {
      array.push(curr);
      curr.depth = depth;
      result.nSub++;
      result.nSubSel += Number(curr.selected);
      this.nSelectedNodes += Number(curr.selected);
      this.nSelectedFiles += curr.type === 'file' ? Number(curr.selected) : 0;
      if (curr.type === 'dir') {
        const dirHead = curr.dirs.headId ? target.idToNode[curr.dirs.headId] : null;
        const fileHead = curr.files.headId ? target.idToNode[curr.files.headId] : null;
        const dirResult = this.flatten(dirHead, depth + 1, array);
        const fileResult = this.flatten(fileHead, depth + 1, array);
        curr.nDesc = dirResult.nSub + fileResult.nSub;
        curr.nSelDesc = dirResult.nSubSel + fileResult.nSubSel;
        result.nSub += curr.nDesc;
        result.nSubSel += curr.nSelDesc;
      }
      curr = curr.nextId ? target.idToNode[curr.nextId] : null;
    }
    return result;
  }

  public buildResult(anchor: number): TreeOperationResponseDTO {
    const visibleNodes: Node[] = [];
    for (let i = 0; i < Math.min(100, this.expandedFlat.length); ) {
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
    const { dirHead, fileHead } = this.extractController(this.px.rootController, false);
    this.expandedFlat = [];
    this.nSelectedNodes = 0;
    this.nSelectedFiles = 0;
    this.flatten(dirHead, 0, this.expandedFlat);
    this.flatten(fileHead, 0, this.expandedFlat);
  }

  // --- Helpers: ---

  private getFamily(node: Node, asProxy = true) {
    const source = asProxy ? this.px : this.proxy!.target;
    const result = {
      parent: node.parentId ? (source.idToNode[node.parentId] as DirNode) : null,
      next: node.nextId ? source.idToNode[node.nextId] : null,
      prev: node.prevId ? source.idToNode[node.prevId] : null,
      dirHead: null as Node | null,
      dirTail: null as Node | null,
      fileHead: null as Node | null,
      fileTail: null as Node | null,
    };
    if (node.type === 'dir') {
      const pointers = this.extractController(node, asProxy);
      Object.assign(result, pointers);
    }
    return result;
  }

  private extractController(control: NodeController, asProxy = true) {
    const source = asProxy ? this.px : this.proxy!.target;
    const result = {
      dirHead: null as Node | null,
      dirTail: null as Node | null,
      fileHead: null as Node | null,
      fileTail: null as Node | null,
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
      text: `${prefix} ${this.px.rootController.nextDir}`,
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
      text: `${prefix} ${this.px.rootController.nextFile}`,
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
      const tail = this.px.idToNode[sub.tailId!];
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
      this.px.rootController.nextDir++;
    } else {
      newNode = this.createFileNode(prefix, parentId);
      this.px.rootController.nextFile++;
    }
    this.px.idToNode[newNode.id] = newNode;
    const { parent } = this.getFamily(newNode);
    if (parent) {
      newNode.selected = parent.selected;
      parent.open = true;
      this.appendNode(newNode, parent);
    } else {
      this.appendNode(newNode, this.px.rootController);
    }
    this.refresh();
  }

  // --- Toggle directory open: ---

  public toggleDirOpen(nodeId: string) {
    const node = this.px.idToNode[nodeId] as DirNode;
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
    const node = this.px.idToNode[nodeId];
    const control = this.getFamily(node).parent || this.px.rootController;
    const { dirHead, fileHead } = this.extractController(control);
    for (const head of [dirHead, fileHead]) {
      let curr = head;
      while (curr) {
        if (curr.text === newName) {
          return {
            status: 'error',
            errorMsg: 'Name already exists in this folder.',
          };
        }
        curr = this.getFamily(curr).next;
      }
    }
    node.text = newName;
    return { status: 'success' };
  }
}

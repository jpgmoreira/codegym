import { randomId } from '@common/utils/utils';
import { DATA_DIR } from '../constants';
import { FileProxy } from '../fileProxy';
import path from 'path';
import { NodeController, Node, FileNode, DirNode, NodeType } from '@common/types/tree';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';

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

  // --- Result and flattening: ---

  private flatten(node: Node | null, expandClosed: boolean): Node[] {
    const result: Node[] = [];
    let curr = node;
    while (curr) {
      const { dirHead, fileHead, next } = this.getFamily(curr, false);
      result.push(curr);
      if (curr.type === 'dir' && (curr.open || expandClosed)) {
        result.push(
          ...this.flatten(dirHead, expandClosed),
          ...this.flatten(fileHead, expandClosed)
        );
      }
      curr = next;
    }
    return result;
  }

  public buildResult(anchor: number): TreeOperationResponseDTO {
    const { dirHead, fileHead } = this.extractController(this.px.rootController, false);
    const flattened = [...this.flatten(dirHead, false), ...this.flatten(fileHead, false)];
    return {
      nSelectedFiles: 0,
      nTotalNodes: flattened.length,
      visibleNodes: flattened,
    };
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
      newNode.depth = parent.depth + 1;
      newNode.selected = parent.selected;
      parent.open = true;
      this.appendNode(newNode, parent);
    } else {
      this.appendNode(newNode, this.px.rootController);
    }
    let curr = parent;
    while (curr) {
      curr.nDesc++;
      curr.nSelDesc += Number(newNode.selected);
      curr = this.getFamily(curr).parent;
    }
  }

  // --- Toggle directory open: ---

  public toggleDirOpen(nodeId: string) {
    const node = this.px.idToNode[nodeId] as DirNode;
    node.open = !node.open;
  }

  // --- Rename node: ---

  public renameNode(nodeId: string, newName: string): GenericResponseDTO {
    newName = newName.trim();
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

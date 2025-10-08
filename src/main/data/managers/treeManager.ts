import { randomId } from '@common/utils/utils';
import { DATA_DIR } from '../constants';
import { FileProxy } from '../fileProxy';
import path from 'path';
import { NodeController, Node, FileNode, DirNode, NodeType } from '@common/types/tree';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';

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

  private getFamily(node: Node) {
    const result = {
      parent: node.parentId ? (this.px.idToNode[node.parentId] as DirNode) : null,
      next: node.nextId ? this.px.idToNode[node.nextId] : null,
      prev: node.prevId ? this.px.idToNode[node.prevId] : null,
      dirHead: null as Node | null,
      dirTail: null as Node | null,
      fileHead: null as Node | null,
      fileTail: null as Node | null,
    };
    if (node.type === 'dir') {
      const { dirs, files } = node;
      if (dirs.headId) result.dirHead = this.px.idToNode[dirs.headId] as DirNode;
      if (dirs.tailId) result.dirTail = this.px.idToNode[dirs.tailId] as DirNode;
      if (files.headId) result.fileHead = this.px.idToNode[files.headId] as FileNode;
      if (files.tailId) result.fileTail = this.px.idToNode[files.tailId] as FileNode;
    }
    return result;
  }

  // --- Result and flattening: ---

  private flatten(node: Node | null): Node[] {
    const result: Node[] = [];
    let curr = node;
    while (curr) {
      const { dirHead, fileHead, next } = this.getFamily(curr);
      result.push(curr);
      if (curr.type === 'dir') {
        result.push(...this.flatten(dirHead), ...this.flatten(fileHead));
      }
      curr = next;
    }
    return result;
  }

  public buildResult(anchor: number): TreeOperationResponseDTO {
    const dirHeadId = this.px.rootController.dirs.headId;
    const fileHeadId = this.px.rootController.files.headId;
    const dirHead = dirHeadId ? (this.proxy!.target.idToNode[dirHeadId] as DirNode) : null;
    const fileHead = fileHeadId ? (this.proxy!.target.idToNode[fileHeadId] as FileNode) : null;
    const flattened = [...this.flatten(dirHead), ...this.flatten(fileHead)];
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
}

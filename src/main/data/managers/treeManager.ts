import { randomId } from '@common/utils/utils';
import { DATA_DIR } from '../constants';
import { FileProxy } from '../fileProxy';
import path from 'path';

type NodeController = {
  dirs: {
    headId: string | null;
    tailId: string | null;
  };
  files: {
    headId: string | null;
    tailId: string | null;
  };
};

type RootController = NodeController & {
  nextDir: number;
  nextFile: number;
};

type NodeType = 'dir' | 'file';

type BaseNode = {
  id: string;
  text: string;
  depth: number;
  selected: boolean;
  parentId: string | null;
  nextId: string | null;
  prevId: string | null;
};

type DirNode = BaseNode &
  NodeController & {
    type: 'dir';
    open: boolean;
    nDesc: number; // Total number of descendants, not including the node.
    nSelDesc: number; // Total number of selected descendants.
  };

type FileNode = BaseNode & {
  type: 'file';
};

type Node = DirNode | FileNode;

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

  // --- Structures: ---

  private rootController: RootController = {
    nextDir: 1,
    nextFile: 1,
    dirs: { headId: null, tailId: null },
    files: { headId: null, tailId: null },
  };

  private idToNode: Record<string, Node> = {};

  // --- Helpers: ---

  private getFamily(node: Node) {
    const result = {
      parent: node.parentId ? (this.idToNode[node.parentId] as DirNode) : null,
      next: node.nextId ? this.idToNode[node.nextId] : null,
      prev: node.prevId ? this.idToNode[node.prevId] : null,
      dirHead: null as Node | null,
      dirTail: null as Node | null,
      fileHead: null as Node | null,
      fileTail: null as Node | null,
    };
    if (node.type === 'dir') {
      const { dirs, files } = node;
      if (dirs.headId) result.dirHead = this.idToNode[dirs.headId] as DirNode;
      if (dirs.tailId) result.dirTail = this.idToNode[dirs.tailId] as DirNode;
      if (files.headId) result.fileHead = this.idToNode[files.headId] as FileNode;
      if (files.tailId) result.fileTail = this.idToNode[files.tailId] as FileNode;
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

  // --- Creation: ---

  private createDirNode(prefix: string, parentId: string | null): DirNode {
    return {
      id: randomId(),
      type: 'dir',
      text: `${prefix} ${this.rootController.nextDir}`,
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
      text: `${prefix} ${this.rootController.nextFile}`,
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
      const tail = this.idToNode[sub.tailId!];
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
      this.rootController.nextDir++;
    } else {
      newNode = this.createFileNode(prefix, parentId);
      this.rootController.nextFile++;
    }
    this.idToNode[newNode.id] = newNode;
    const { parent } = this.getFamily(newNode);
    if (parent) {
      newNode.depth = parent.depth + 1;
      newNode.selected = parent.selected;
      this.appendNode(newNode, parent);
    } else {
      this.appendNode(newNode, this.rootController);
    }
    let curr = parent;
    while (curr) {
      curr.nDesc++;
      curr.nSelDesc += Number(newNode.selected);
      curr = this.getFamily(curr).parent;
    }
  }
}

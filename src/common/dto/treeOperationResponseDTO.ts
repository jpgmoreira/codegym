import { Node } from '@common/types/tree';

export type TreeOperationResponseDTO = {
  nTotalNodes: number;
  nSelectedNodes: number;
  nSelectedFiles: number;
  visibleNodes: Node[];
};

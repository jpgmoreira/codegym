import { Node } from '@common/types/tree';

export type TreeOperationResponseDTO = {
  nTotalNodes: number;
  nSelectedFiles: number;
  visibleNodes: Node[];
};

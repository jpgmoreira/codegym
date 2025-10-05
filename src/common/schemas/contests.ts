export type ContestProblem = {
  id: string;
  title: string;
  accepted: string;
  notes: string;
  solved: boolean;
  todo: boolean;
  favorite: boolean;
};

export type Contest = {
  id: string;
  notes: string;
  problems: ContestProblem[];
};

export type ContestNodeType = 'contest' | 'dir';

export type ContestsTreeNode = {
  id: string;
  type: ContestNodeType;
  parent: string;
  text: string;
  state: {
    opened?: boolean;
    selected: boolean;
  };
};

export type ContestsTree = {
  counters: {
    nextContest: number;
    nextDir: number;
  };
  data: ContestsTreeNode[];
};

export function getEmptyContestsTree(): ContestsTree {
  return {
    counters: {
      nextContest: 1,
      nextDir: 1,
    },
    data: [],
  };
}

export function getEmptyContest(id: string): Contest {
  return {
    id,
    notes: '',
    problems: [],
  };
}

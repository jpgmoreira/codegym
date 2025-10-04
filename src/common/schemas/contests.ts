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

export type ContestsTreeNode = {
  id: string;
  parent: string;
  text: string;
  state: {
    opened: boolean;
    selected: boolean;
  };
};

export type ContestsTree = {
  data: ContestsTreeNode[];
};

export function getEmptyContestsTree(): ContestsTree {
  return { data: [] };
}

export function getEmptyContest(id: string): Contest {
  return {
    id,
    notes: '',
    problems: [],
  };
}

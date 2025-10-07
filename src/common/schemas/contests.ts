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

export function getEmptyContest(id: string): Contest {
  return {
    id,
    notes: '',
    problems: [],
  };
}

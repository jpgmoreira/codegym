import { randomId } from '@common/utils/utils';

export type ContestProblemFlag = 'todo' | 'favorite' | 'solved';

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
  name: string;
  createdAt: number;
  notes: string;
  nSolved: number;
  nTodo: number;
  problems: ContestProblem[];
};

export function getEmptyContest(id: string, name: string, createdAt: number): Contest {
  name = name.trim();
  return {
    id,
    name,
    createdAt,
    notes: '',
    nSolved: 0,
    nTodo: 0,
    problems: [],
  };
}

export function getEmptyContestProblem() {
  const id = randomId();
  return {
    id,
    title: '',
    accepted: '',
    notes: '',
    solved: false,
    todo: false,
    favorite: false,
  };
}

/**
 * Properties "id", "timestamp" and "solvedDate" will be absent *** ONLY *** in the cache's file, to save space.
 * "solvedDate" is a number in the format YYYYMMDD. It is calculated based on the user's local time.
 */

type BaseProblem = {
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
};

export type CfProblem = BaseProblem & {
  oj: 'cf';
  info: {
    solved: number;
    rating: number | null;
    popularity: number;
    tags: string[];
  };
};

export type KattisProblem = BaseProblem & {
  oj: 'kattis';
  info: {
    solved: number;
    submissions: number;
    textDifficulty: string;
    difficulty: number | null;
    popularity: number;
    starred: boolean;
  };
};

export type NepsProblem = BaseProblem & {
  oj: 'neps';
  info: {
    score: number;
    solved: number;
    popularity: number;
  };
};

export type LeetcodeProblem = BaseProblem & {
  oj: 'leetcode';
  info: {
    accepted: number;
    difficulty: number;
    premium: boolean;
    popularity: number;
    submissions: number;
  };
};

export type TimusProblem = BaseProblem & {
  oj: 'timus';
  info: {
    solved: number;
    source: string | null;
    difficulty: number;
    popularity: number;
  };
};

export type UvaProblem = BaseProblem & {
  oj: 'uva';
  info: {
    dacu: number;
    popularity: number;
    starred: boolean;
  };
};

export type OjProblem = {
  cf: CfProblem;
  kattis: KattisProblem;
  neps: NepsProblem;
  leetcode: LeetcodeProblem;
  timus: TimusProblem;
  uva: UvaProblem;
};
